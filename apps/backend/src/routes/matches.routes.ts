import { Router } from "express";
import { matchStatusSchema, routeParams } from "@hustl/shared";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { awardMilestoneBadges } from "../services/badge.service.js";
import { notifyMatchStatus } from "../services/push.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { recalculateReputation } from "../services/reputation.service.js";
import { createEscrowHold, refundEscrow } from "../services/escrow.service.js";

export const matchesRouter = Router();

// ── STUDENT: List my matches ────────────────────────────────────
matchesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;
    const role = request.user!.role;

    const where =
      role === "STUDENT"
        ? { studentId: userId }
        : { listing: { businessId: userId } };

    const matches = await prisma.match.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            hourlyRate: true,
            startTime: true,
            endTime: true,
            totalHours: true,
            isUrgent: true,
            skills: true,
            business: {
              select: {
                userId: true,
                businessName: true,
                user: {
                  select: {
                    avatarUrl: true,
                    reputationScore: true,
                  }
                }
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            reputationScore: true,
            studentProfile: {
              select: { skills: true, completedShifts: true },
            },
            badges: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    response.json({ matches });
  })
);

// ── BUSINESS: Update match status ───────────────────────────────
matchesRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("BUSINESS"),
  validate(routeParams.id, "params"),
  validate(matchStatusSchema),
  asyncHandler(async (request, response) => {
    const { id } = routeParams.id.parse(request.params);
    const { status } = matchStatusSchema.parse(request.body);
    const match = await prisma.match.findUnique({
      where: { id },
      include: { listing: true }
    });

    if (!match || match.listing.businessId !== request.user!.id) {
      throw new AppError(404, "Match not found", "MATCH_NOT_FOUND");
    }

    // Create escrow hold when accepting match
    let escrowData = null;
    if (status === "ACCEPTED") {
      const amount = parseFloat(match.listing.hourlyRate.toString()) * match.listing.totalHours;
      escrowData = await createEscrowHold({
        matchId: id,
        amount,
        studentId: match.studentId,
        businessId: match.listing.businessId,
        listingId: match.listingId,
      });
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        status,
        acceptedAt: status === "ACCEPTED" ? new Date() : match.acceptedAt,
      }
    });

    if (status === "COMPLETED") {
      await prisma.studentProfile.update({
        where: { userId: match.studentId },
        data: { completedShifts: { increment: 1 } }
      });
      await awardMilestoneBadges(match.studentId, match.listing.skills);
    }

    await notifyMatchStatus(match.studentId, { matchId: id, status });
    response.json({
      match: updated,
      escrow: escrowData ? {
        orderId: escrowData.razorpayOrder.id,
        amount: escrowData.razorpayOrder.amount,
        currency: escrowData.razorpayOrder.currency,
      } : null,
    });
  })
);

// ── Cancel match (student or business) ──────────────────────────
matchesRouter.post(
  "/:id/cancel",
  requireAuth,
  validate(routeParams.id, "params"),
  asyncHandler(async (request, response) => {
    const { id } = routeParams.id.parse(request.params);
    const { reason } = request.body as { reason?: string };
    const userId = request.user!.id;

    const match = await prisma.match.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!match) throw new AppError(404, "Match not found", "MATCH_NOT_FOUND");

    const isBusiness = match.listing.businessId === userId;
    const isStudent = match.studentId === userId;
    if (!isBusiness && !isStudent) {
      throw new AppError(403, "Not authorized to cancel this match", "FORBIDDEN");
    }

    if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(match.status)) {
      throw new AppError(400, "Match already finalized", "MATCH_FINALIZED");
    }

    // Late cancellation: within 30 minutes of shift start → reputation penalty
    const shiftStart = new Date(match.listing.startTime);
    const now = new Date();
    const minutesBefore = (shiftStart.getTime() - now.getTime()) / 60000;
    const isLateCancellation = minutesBefore < 30 && minutesBefore > 0;

    // Refund escrow if match was accepted
    let refundData = null;
    if (match.status === "ACCEPTED") {
      refundData = await refundEscrow({
        matchId: id,
        reason: reason ?? "Match cancelled",
        cancelledBy: isBusiness ? "BUSINESS" : "STUDENT",
      });
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        status: isLateCancellation ? "CANCELLED_LATE" : "CANCELLED",
        cancelledAt: now,
        cancellationReason: reason ?? null,
      },
    });

    // Reputation penalty for late cancellation
    if (isLateCancellation) {
      const cancellerId = isStudent ? match.studentId : match.listing.businessId;
      // Create a synthetic 1-star review for late cancellation
      await prisma.review.create({
        data: {
          matchId: match.id,
          reviewerId: "SYSTEM",
          revieweeId: cancellerId,
          rating: 1,
          comment: `Late cancellation (${Math.round(minutesBefore)} min before shift)`,
        },
      });
      await recalculateReputation(cancellerId);
    }

    // Notify the other party
    const notifyUserId = isStudent ? match.listing.businessId : match.studentId;
    await notifyMatchStatus(notifyUserId, { matchId: id, status: "CANCELLED" });

    response.json({
      match: updated,
      lateCancellation: isLateCancellation,
      refund: refundData,
    });
  })
);

// ── No-show report (business only) ─────────────────────────────
matchesRouter.post(
  "/:id/no-show",
  requireAuth,
  requireRole("BUSINESS"),
  validate(routeParams.id, "params"),
  asyncHandler(async (request, response) => {
    const { id } = routeParams.id.parse(request.params);
    const { reason } = request.body as { reason?: string };

    const match = await prisma.match.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!match || match.listing.businessId !== request.user!.id) {
      throw new AppError(404, "Match not found", "MATCH_NOT_FOUND");
    }

    if (match.status !== "ACCEPTED") {
      throw new AppError(400, "Only accepted matches can be marked as no-show", "INVALID_STATUS");
    }

    const updated = await prisma.match.update({
      where: { id },
      data: { status: "NO_SHOW" },
    });

    // Heavy reputation hit for no-show
    await prisma.review.create({
      data: {
        matchId: match.id,
        reviewerId: request.user!.id,
        revieweeId: match.studentId,
        rating: 1,
        comment: reason ?? "No-show: student did not arrive for the shift",
      },
    });
    await recalculateReputation(match.studentId);

    await notifyMatchStatus(match.studentId, { matchId: id, status: "NO_SHOW" });
    response.json({ match: updated });
  })
);
