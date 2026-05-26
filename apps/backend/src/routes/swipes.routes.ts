import { Router } from "express";
import { swipeSchema } from "@hustl/shared";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { notifyBusinessOfStudentInterest } from "../services/push.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const swipesRouter = Router();

swipesRouter.post(
  "/",
  requireAuth,
  requireRole("STUDENT"),
  validate(swipeSchema),
  asyncHandler(async (request, response) => {
    const input = swipeSchema.parse(request.body);
    const listing = await prisma.listing.findUnique({
      where: { id: input.listingId },
      include: { business: { include: { user: true } } }
    });

    if (!listing || listing.status !== "OPEN") {
      throw new AppError(404, "Open listing not found", "LISTING_NOT_FOUND");
    }

    const student = await prisma.user.findUnique({
      where: { id: request.user!.id },
      include: { studentProfile: true, badges: true }
    });

    if (listing.isUrgent && student && student.reputationScore < 3.5) {
      throw new AppError(403, "Urgent listings require reputation score of 3.5 or higher", "URGENT_REPUTATION_REQUIRED");
    }

    if (listing.verifiedBadgeOnly && !student?.badges.some((badge) => badge.name.includes("Verified"))) {
      throw new AppError(403, "This listing requires a verified student badge", "VERIFIED_BADGE_REQUIRED");
    }

    const swipe = await prisma.swipe.upsert({
      where: { studentId_listingId: { studentId: request.user!.id, listingId: input.listingId } },
      create: { studentId: request.user!.id, listingId: input.listingId, direction: input.direction },
      update: { direction: input.direction }
    });

    const match =
      input.direction === "RIGHT"
        ? await prisma.match.upsert({
            where: { listingId_studentId: { listingId: input.listingId, studentId: request.user!.id } },
            create: { listingId: input.listingId, studentId: request.user!.id },
            update: {}
          })
        : null;

    if (match) {
      await notifyBusinessOfStudentInterest(listing.businessId, {
        matchId: match.id,
        listingId: listing.id,
        student: {
          id: student?.id,
          name: student?.name,
          bio: student?.bio,
          skills: student?.studentProfile?.skills,
          portfolioUrls: student?.studentProfile?.portfolioUrls,
          reputationScore: student?.reputationScore
        }
      });
    }

    response.status(201).json({ swipe, match });
  })
);
