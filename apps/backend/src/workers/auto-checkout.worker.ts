import { Worker, Job } from "bullmq";
import { prisma } from "../config/prisma.js";
import { queueConnection } from "../lib/bullmq.js";
import { notifyMatchStatus } from "../services/push.service.js";
import { emitToUser } from "../realtime/socket.js";
import { Decimal } from "@prisma/client/runtime/library";
import { logger, logWorkerJob, logFinancialTransaction } from "../utils/logger.js";

/**
 * Auto-Checkout Worker
 * 
 * Processes auto-checkout jobs for matches that are still CHECKED_IN
 * after endTime + 2 hours. This ensures students don't forget to check out
 * and businesses get automatic completion.
 * 
 * Job Data: { matchId: string }
 * 
 * Behavior:
 * 1. Check if match is still CHECKED_IN
 * 2. Auto-complete with agreed hours
 * 3. Update status to AUTO_CHECKED_OUT
 * 4. Increment autoCheckoutWarnings on student profile
 * 5. Notify both parties
 * 6. Flag to admin if warnings > 2
 */

interface AutoCheckoutJobData {
  matchId: string;
}

export const autoCheckoutWorker = new Worker<AutoCheckoutJobData>(
  "auto-checkout",
  async (job: Job<AutoCheckoutJobData>) => {
    const { matchId } = job.data;

    logWorkerJob('auto-checkout', {
      jobId: job.id || 'unknown',
      status: 'started',
      matchId
    });

    // Get match with full details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        listing: {
          include: {
            business: true,
          },
        },
        student: {
          include: {
            studentProfile: true,
          },
        },
      },
    });

    if (!match) {
      logger.warn('Auto-checkout match not found', { matchId });
      return { success: false, reason: "Match not found" };
    }

    // Only auto-checkout if still CHECKED_IN
    if (match.status !== "CHECKED_IN") {
      logger.info('Auto-checkout skipped - invalid status', {
        matchId,
        currentStatus: match.status
      });
      return { success: false, reason: `Status is ${match.status}` };
    }

    // Calculate earnings (8% platform fee)
    const agreedHours = match.listing.totalHours;
    const hourlyRate = parseFloat(match.listing.hourlyRate.toString());
    const grossEarnings = agreedHours * hourlyRate;
    const platformFee = grossEarnings * 0.08;
    const netEarnings = grossEarnings - platformFee;

    // Update match to AUTO_CHECKED_OUT
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "AUTO_CHECKED_OUT",
        completedAt: new Date(),
        checkOutTime: new Date(),
      },
    });

    // Update shift check-in record
    await prisma.shiftCheckIn.update({
      where: { matchId },
      data: {
        status: "CHECKED_OUT",
        confirmedMinutes: Math.round(agreedHours * 60),
      },
    });

    // Increment auto-checkout warnings on student profile
    const currentWarnings =
      match.student.studentProfile?.autoCheckoutWarnings ?? 0;
    const newWarnings = currentWarnings + 1;

    await prisma.studentProfile.update({
      where: { userId: match.studentId },
      data: {
        autoCheckoutWarnings: newWarnings,
        completedShifts: {
          increment: 1,
        },
      },
    });

    // Create wallet transaction for student
    await prisma.walletTransaction.create({
      data: {
        walletUserId: match.studentId,
        type: "SHIFT_EARNING",
        status: "POSTED",
        grossAmount: new Decimal(grossEarnings),
        platformFee: new Decimal(platformFee),
        netAmount: new Decimal(netEarnings),
        amount: new Decimal(netEarnings),
        matchId: match.id,
        idempotencyKey: `auto-earning-${matchId}-${Date.now()}`,
        postedAt: new Date(),
      },
    });

    // Create platform fee transaction
    await prisma.walletTransaction.create({
      data: {
        walletUserId: match.studentId,
        type: "PLATFORM_FEE",
        status: "POSTED",
        grossAmount: new Decimal(0),
        platformFee: new Decimal(platformFee),
        netAmount: new Decimal(-platformFee),
        amount: new Decimal(-platformFee),
        matchId: match.id,
        idempotencyKey: `auto-fee-${matchId}-${Date.now()}`,
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

    // Notify student
    await notifyMatchStatus(match.studentId, {
      matchId,
      status: "AUTO_CHECKED_OUT",
    });

    // Notify business via socket
    emitToUser(match.listing.businessId, "hustl:match:status_changed", {
      matchId,
      status: "AUTO_CHECKED_OUT",
      studentId: match.studentId,
    });

    // Flag to admin if warnings > 2
    if (newWarnings > 2) {
      logger.warn('Auto-checkout warning threshold exceeded', {
        studentId: match.studentId,
        warnings: newWarnings,
        matchId
      });

      // Create reputation event for tracking
      await prisma.reputationEvent.create({
        data: {
          userId: match.studentId,
          type: "ADMIN_ADJUSTMENT",
          delta: -0.5,
          reason: `Auto-checkout warning threshold exceeded (${newWarnings} warnings)`,
          matchId,
        },
      });
    }

    logFinancialTransaction('auto-checkout-earning', {
      userId: match.studentId,
      amount: netEarnings,
      matchId,
      status: 'completed'
    });

    logWorkerJob('auto-checkout', {
      jobId: job.id || 'unknown',
      status: 'completed',
      matchId,
      earnings: netEarnings
    });

    return {
      success: true,
      matchId,
      earnings: netEarnings,
      warnings: newWarnings,
    };
  },
  {
    connection: queueConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

// Error handling with structured logging
autoCheckoutWorker.on("failed", (job, err) => {
  logWorkerJob('auto-checkout', {
    jobId: job?.id || 'unknown',
    status: 'failed',
    error: err.message,
    matchId: job?.data?.matchId
  });
});

autoCheckoutWorker.on("completed", (job, result) => {
  logWorkerJob('auto-checkout', {
    jobId: job.id || 'unknown',
    status: 'completed',
    result
  });
});

logger.info('Auto-checkout worker started and listening for jobs');
