import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const checkInRouter = Router();

// ── Student: Self check-in with geolocation ─────────────────────
checkInRouter.post(
  "/:matchId/arrive",
  requireAuth,
  asyncHandler(async (request, response) => {
    const matchId = request.params.matchId as string;
    const { lat, lng } = request.body as { lat: number; lng: number };
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

    // Geofence check using PostGIS: check within 500m
    const distanceResult = await prisma.$queryRaw<{ distance: number }[]>`
      SELECT ST_Distance(
        coords,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) as distance
      FROM "Listing"
      WHERE id = ${match.listingId}
    `;
    
    const distance = distanceResult[0]?.distance ?? 0;
    
    if (distance > 500) {
      throw AppError.badRequest(`You're ${Math.round(distance)}m from the venue. Get within 500m to check in.`, "GEO_TOO_FAR");
    }

    // Create or update check-in record
    const checkIn = await prisma.shiftCheckIn.upsert({
      where: { matchId },
      update: {
        studentCheckInAt: new Date(),
        studentCheckInDistanceM: distance ? Math.round(distance) : null,
        geoVerified: true,
        status: "GEO_VERIFIED",
      },
      create: {
        matchId,
        studentCheckInAt: new Date(),
        studentCheckInDistanceM: distance ? Math.round(distance) : null,
        geoVerified: true,
        status: "GEO_VERIFIED",
      },
    });

    // Update match status
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "CHECKED_IN" },
    });

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

// ── Student: Check out ──────────────────────────────────────────
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

    const checkIn = await prisma.shiftCheckIn.findUnique({ where: { matchId } });
    if (!checkIn) {
      throw AppError.badRequest("No check-in record found", "NO_CHECKIN");
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
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    // Increment student's completed shifts
    await prisma.studentProfile.update({
      where: { userId: match.studentId },
      data: { completedShifts: { increment: 1 } },
    });

    // Calculate and credit earnings to wallet
    const hourlyRate = match.listing.hourlyRate.toNumber();
    const grossEarnings = (hourlyRate * actualMinutes) / 60;
    const platformFee = grossEarnings * 0.08; // 8% platform fee
    const netEarnings = grossEarnings - platformFee;

    // Credit student wallet
    await prisma.walletTransaction.create({
      data: {
        walletUserId: match.studentId,
        type: "SHIFT_EARNING",
        amount: netEarnings,
        matchId: matchId,
        externalRef: `${match.listing.title} (${Math.round((actualMinutes / 60) * 10) / 10}h)`,
        idempotencyKey: `earning-${matchId}-${Date.now()}`,
      },
    });

    // Platform fee transaction
    await prisma.walletTransaction.create({
      data: {
        walletUserId: match.studentId,
        type: "PLATFORM_FEE",
        amount: -platformFee,
        matchId: matchId,
        externalRef: `8% platform fee`,
        idempotencyKey: `fee-${matchId}-${Date.now()}`,
      },
    });

    // Update wallet balance
    await prisma.wallet.upsert({
      where: { userId: match.studentId },
      update: {
        availableBalance: { increment: netEarnings },
      },
      create: {
        userId: match.studentId,
        availableBalance: netEarnings,
        pendingBalance: 0,
        currency: "INR",
      },
    });

    response.json({
      checkIn: updatedCheckIn,
      earnings: {
        gross: grossEarnings.toFixed(2),
        platformFee: platformFee.toFixed(2),
        net: netEarnings.toFixed(2),
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

