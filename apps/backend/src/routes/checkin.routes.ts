import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { verifyStudentLocation } from "../services/geo-verify.service.js";
import { scheduleAutoCheckout, cancelAutoCheckout, badgeMilestoneQueue, pairInteractionQueue } from "../lib/bullmq.js";
import { emitToUser } from "../realtime/socket.js";
import { redis } from "../config/redis.js";
import { releaseEscrow } from "../services/escrow.service.js";
import { Decimal } from "@prisma/client/runtime/library";

export const checkInRouter = Router();

// ── Student: Self check-in with geolocation and mock check ──
checkInRouter.post(
  "/:matchId/arrive",
  requireAuth,
  asyncHandler(async (request, response) => {
    const matchId = request.params.matchId as string;
    const { lat, lng, isMock } = request.body as { lat: number; lng: number; isMock?: boolean };
    const userId = request.user!.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { listing: true },
    });

    if (!match || match.studentId !== userId) {
      throw AppError.notFound("Match not found");
    }

    if (match.status !== "ACCEPTED") {
      throw AppError.badRequest("Match must be accepted before check-in", "INVALID_STATUS");
    }

    // Mock Location check
    if (isMock) {
      const attemptsKey = `hustl:mockattempts:${userId}`;
      const attempts = await redis.incr(attemptsKey);
      await redis.expire(attemptsKey, 30 * 24 * 60 * 60); // 30 days TTL

      // Log audit log via Redis list
      await redis.lpush(
        "hustl:auditlogs",
        JSON.stringify({
          userId,
          action: "MOCK_LOCATION_CHECKIN_ATTEMPT",
          details: `Attempt number: ${attempts} on match ${matchId}`,
          timestamp: new Date().toISOString()
        })
      );

      if (attempts >= 3) {
        await redis.set(`hustl:flagged:${userId}`, "true");
        console.warn(`Student ${userId} flagged for 3 mock location attempts in 30 days.`);
      }

      throw AppError.badRequest("Check-in rejected: mock location detected.", "MOCK_LOCATION_DETECTED");
    }

    // Geofence check using PostGIS (strict 200m radius)
    const isWithin200m = await verifyStudentLocation({ lat, lng }, match.listingId);
    if (!isWithin200m) {
      const distanceResult = await prisma.$queryRaw<{ distance: number }[]>`
        SELECT ST_Distance(
          coords,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) as distance
        FROM "Listing"
        WHERE id = ${match.listingId}
      `;
      const distance = distanceResult[0]?.distance ?? 0;
      throw AppError.badRequest(
        `You're ${Math.round(distance)}m from the venue. Get within 200m to check in.`,
        "GEO_TOO_FAR"
      );
    }

    // Create or update check-in record
    const checkIn = await prisma.shiftCheckIn.upsert({
      where: { matchId },
      update: {
        studentCheckInAt: new Date(),
        studentCheckInDistanceM: null,
        geoVerified: true,
        status: "GEO_VERIFIED",
      },
      create: {
        matchId,
        studentCheckInAt: new Date(),
        studentCheckInDistanceM: null,
        geoVerified: true,
        status: "GEO_VERIFIED",
      },
    });

    // Update match status to CHECKED_IN
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "CHECKED_IN", checkInTime: new Date() },
    });

    // Schedule auto-checkout BullMQ job at shift endTime + 2 hours
    const endTime = new Date(match.listing.endTime);
    const autoCheckoutTime = endTime.getTime() + 2 * 60 * 60 * 1000;
    const delayMs = Math.max(0, autoCheckoutTime - Date.now());

    await scheduleAutoCheckout(matchId, delayMs);

    // Emit Socket.io notifications
    emitToUser(match.studentId, "hustl:checkin:confirmed", { matchId });
    emitToUser(match.listing.businessId, "hustl:checkin:confirmed", { matchId });

    response.json({ checkIn });
  })
);

// ── Business: Confirm student arrival ───────────────────────────
checkInRouter.post(
  "/:matchId/confirm",
  requireAuth,
  asyncHandler(async (request, response) => {
    const matchId = request.params.matchId as string;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { listing: true },
    });

    if (!match || match.listing.businessId !== request.user!.id) {
      throw AppError.notFound("Match not found");
    }

    const checkIn = await prisma.shiftCheckIn.update({
      where: { matchId },
      data: {
        businessConfirmedAt: new Date(),
        status: "BUSINESS_CONFIRMED",
      },
    });

    response.json({ checkIn });
  })
);

// ── Student: Check out (two-step checkout initiation) ──────────
checkInRouter.post(
  "/:matchId/checkout",
  requireAuth,
  asyncHandler(async (request, response) => {
    const matchId = request.params.matchId as string;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match || match.studentId !== request.user!.id) {
      throw AppError.notFound("Match not found");
    }

    if (match.status !== "CHECKED_IN") {
      throw AppError.badRequest("Match must be checked in before checkout", "INVALID_STATUS");
    }

    const checkIn = await prisma.shiftCheckIn.update({
      where: { matchId },
      data: {
        studentCheckOutAt: new Date(),
      },
    });

    response.json({ checkIn });
  })
);

// ── Business: Complete shift and confirm hours ──────────────────
checkInRouter.post(
  "/:matchId/complete",
  requireAuth,
  asyncHandler(async (request, response) => {
    const matchId = request.params.matchId as string;
    const { confirmedMinutes } = request.body as { confirmedMinutes?: number };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { listing: true },
    });

    if (!match || match.listing.businessId !== request.user!.id) {
      throw AppError.notFound("Match not found");
    }

    if (match.status !== "CHECKED_IN") {
      throw AppError.badRequest("Match is not in checked-in status", "INVALID_STATUS");
    }

    const checkIn = await prisma.shiftCheckIn.findUnique({ where: { matchId } });
    if (!checkIn) {
      throw AppError.badRequest("No check-in record found", "NO_CHECKIN");
    }

    // Two-step checkout verification: student must initiate first
    if (!checkIn.studentCheckOutAt) {
      throw AppError.badRequest("Student has not initiated checkout yet", "STUDENT_NOT_CHECKED_OUT");
    }

    // Calculate actual minutes worked
    const arrivedAt = checkIn.businessConfirmedAt ?? checkIn.studentCheckInAt ?? new Date();
    const leftAt = checkIn.studentCheckOutAt ?? new Date();
    const actualMinutes = confirmedMinutes ?? Math.round((leftAt.getTime() - arrivedAt.getTime()) / 60000);

    const updatedCheckIn = await prisma.shiftCheckIn.update({
      where: { matchId },
      data: {
        status: "CHECKED_OUT",
        confirmedMinutes: actualMinutes,
      },
    });

    // Mark match as completed
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        checkOutTime: new Date(),
        completedAt: new Date()
      },
    });

    // Increment student's completed shifts
    const studentProfile = await prisma.studentProfile.update({
      where: { userId: match.studentId },
      data: { completedShifts: { increment: 1 } },
    });

    // Referral logic: First completed shift grants 48hr boost
    if (studentProfile.completedShifts === 1) {
      const referral = await prisma.referral.findFirst({
        where: { refereeId: match.studentId, status: "SIGNED_UP" }
      });

      if (referral) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours

        await prisma.$transaction([
          prisma.boost.create({
            data: {
              targetType: "STUDENT_PROFILE",
              targetId: referral.referrerId,
              source: "REFERRAL_REWARD",
              status: "ACTIVE",
              startsAt: now,
              expiresAt
            }
          }),
          prisma.boost.create({
            data: {
              targetType: "STUDENT_PROFILE",
              targetId: match.studentId,
              source: "REFERRAL_REWARD",
              status: "ACTIVE",
              startsAt: now,
              expiresAt
            }
          }),
          prisma.referral.update({
            where: { id: referral.id },
            data: { status: "REWARDED", redeemedAt: now, rewardType: "48H_BOOST" }
          })
        ]);
      }
    }

    // Release escrow and credit earnings to wallet
    const escrowRelease = await releaseEscrow(matchId);

    // Cancel the scheduled autoCheckout BullMQ job
    await cancelAutoCheckout(matchId);

    // Trigger downstream evaluation queues
    await badgeMilestoneQueue.add("badge-eval", {
      studentId: match.studentId,
      category: match.listing.skills[0] || "General",
      matchId
    });
    await pairInteractionQueue.add("pair-update", {
      studentId: match.studentId,
      businessId: match.listing.businessId,
      matchId
    });

    // Emit Socket.io notifications
    emitToUser(match.studentId, "hustl:checkout:confirmed", { matchId });
    emitToUser(match.listing.businessId, "hustl:checkout:confirmed", { matchId });

    response.json({
      checkIn: updatedCheckIn,
      earnings: {
        gross: escrowRelease.netAmount + escrowRelease.platformFee,
        platformFee: escrowRelease.platformFee,
        net: escrowRelease.netAmount,
        minutesWorked: actualMinutes,
      },
    });
  })
);

// ── Get check-in status ─────────────────────────────────────────
checkInRouter.get(
  "/:matchId",
  requireAuth,
  asyncHandler(async (request, response) => {
    const matchId = request.params.matchId as string;

    const checkIn = await prisma.shiftCheckIn.findUnique({
      where: { matchId },
    });

    if (!checkIn) {
      throw AppError.notFound("No check-in record found");
    }

    response.json({ checkIn });
  })
);
