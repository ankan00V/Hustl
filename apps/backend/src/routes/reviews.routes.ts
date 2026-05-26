import { Router } from "express";
import { reviewSchema } from "@hustl/shared";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { recalculateReputation } from "../services/reputation.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const reviewsRouter = Router();

reviewsRouter.post(
  "/",
  requireAuth,
  validate(reviewSchema),
  asyncHandler(async (request, response) => {
    const input = reviewSchema.parse(request.body);
    const match = await prisma.match.findUnique({
      where: { id: input.matchId },
      include: { listing: true }
    });
    if (!match || match.status !== "COMPLETED") {
      throw new AppError(400, "Only completed matches can be reviewed", "MATCH_NOT_COMPLETED");
    }

    const participants = new Set([match.studentId, match.listing.businessId]);
    if (!participants.has(request.user!.id) || !participants.has(input.revieweeId) || input.revieweeId === request.user!.id) {
      throw new AppError(403, "Reviewer and reviewee must be match participants", "REVIEW_FORBIDDEN");
    }

    const review = await prisma.review.create({
      data: {
        matchId: input.matchId,
        reviewerId: request.user!.id,
        revieweeId: input.revieweeId,
        rating: input.rating,
        comment: input.comment
      }
    });
    const reputationScore = await recalculateReputation(input.revieweeId);
    response.status(201).json({ review, reputationScore });
  })
);
