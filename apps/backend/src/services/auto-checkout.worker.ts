import { Worker } from "bullmq";
import { prisma } from "../config/prisma.js";
import { queueConnection } from "../lib/bullmq.js";
import { emitToUser } from "../realtime/socket.js";
import { redis } from "../config/redis.js";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Auto-Checkout worker
 * Runs at shift end time + 2 hours. If a match status is still CHECKED_IN,
 * it auto-completes the shift and increments warnings for the student.
 */
export const autoCheckoutWorker = new Worker(
  "auto-checkout",
  async (job) => {
    const { matchId } = job.data as { matchId: string };
    console.log(`Processing auto-checkout job for match: ${matchId}`);

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        listing: true,
        student: {
          include: {
            studentProfile: true,
          },
        },
      },
    });

    if (!match || match.status !== "CHECKED_IN") {
      return; // Already checked out, cancelled, or completed
    }

    const totalHours = match.listing.totalHours;
    const confirmedMinutes = Math.round(totalHours * 60);

    // Update match status to AUTO_CHECKED_OUT
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "AUTO_CHECKED_OUT",
        checkOutTime: new Date(),
        completedAt: new Date(),
      },
    });

    // Update check-in record status
    await prisma.shiftCheckIn.update({
      where: { matchId },
      data: {
        status: "CHECKED_OUT",
        confirmedMinutes,
      },
    });

    // Increment completed shifts and warnings on StudentProfile
    const currentWarnings = match.student.studentProfile?.autoCheckoutWarnings ?? 0;
    const updatedProfile = await prisma.studentProfile.update({
      where: { userId: match.studentId },
      data: {
        completedShifts: { increment: 1 },
        autoCheckoutWarnings: { increment: 1 },
      },
    });

    // Calculate earnings and credit student wallet
    const hourlyRate = parseFloat(match.listing.hourlyRate.toString());
    const grossEarnings = (hourlyRate * confirmedMinutes) / 60;
    const platformFee = grossEarnings * 0.08; // 8% platform fee
    const netEarnings = grossEarnings - platformFee;

    // Credit student wallet with proper transaction structure
    await prisma.walletTransaction.create({
      data: {
        walletUserId: match.studentId,
        type: "SHIFT_EARNING",
        status: "POSTED",
        grossAmount: new Decimal(grossEarnings),
        platformFee: new Decimal(platformFee),
        netAmount: new Decimal(netEarnings),
        amount: new Decimal(netEarnings),
        matchId: matchId,
        idempotencyKey: `earning-auto-${matchId}-${Date.now()}`,
        postedAt: new Date(),
      },
    });

    // Platform fee transaction
    await prisma.walletTransaction.create({
      data: {
        walletUserId: match.studentId,
        type: "PLATFORM_FEE",
        status: "POSTED",
        grossAmount: new Decimal(0),
        platformFee: new Decimal(platformFee),
        netAmount: new Decimal(-platformFee),
        amount: new Decimal(-platformFee),
        matchId: matchId,
        idempotencyKey: `fee-auto-${matchId}-${Date.now()}`,
        postedAt: new Date(),
      },
    });

    // Update wallet balance
    await prisma.wallet.upsert({
      where: { userId: match.studentId },
      update: {
        availableBalance: { increment: new Decimal(netEarnings) },
      },
      create: {
        userId: match.studentId,
        availableBalance: new Decimal(netEarnings),
        pendingBalance: new Decimal(0),
        currency: "INR",
      },
    });

    // Emit Socket.io notifications
    emitToUser(match.studentId, "hustl:checkout:auto", {
      matchId,
      warnings: updatedProfile.autoCheckoutWarnings,
    });
    emitToUser(match.listing.businessId, "hustl:checkout:auto", {
      matchId,
      studentId: match.studentId,
      studentName: match.student.name,
    });

    // If warnings > 2, flag account in Redis
    if (updatedProfile.autoCheckoutWarnings > 2) {
      console.warn(
        `Student ${match.studentId} has exceeded 2 auto-checkout warnings! Flagging account.`
      );
      await redis.set(`hustl:flagged:${match.studentId}`, "true");

      // Log audit log event via Redis
      await redis.lpush(
        "hustl:auditlogs",
        JSON.stringify({
          userId: match.studentId,
          action: "AUTO_CHECKOUT_WARNINGS_EXCEEDED",
          details: `Student profile warnings: ${updatedProfile.autoCheckoutWarnings}`,
          timestamp: new Date().toISOString(),
        })
      );
    }
  },
  { connection: queueConnection }
);

autoCheckoutWorker.on("failed", (job, err) => {
  console.error(`Auto-checkout job ${job?.id} failed:`, err.message);
});
