import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { BadgeService } from "../services/badge.service.js";

export const badgesRouter = Router();

const userIdSchema = z.object({
  userId: z.string().uuid()
});

const categorySchema = z.object({
  category: z.string().min(1)
});

// Get all badges for a user
badgesRouter.get(
  "/:userId",
  requireAuth,
  validate(userIdSchema, "params"),
  asyncHandler(async (request, response) => {
    const { userId } = userIdSchema.parse(request.params);
    const badges = await BadgeService.getStudentBadges(userId);
    response.json({ badges });
  })
);

// Get badge progress for a specific category
badgesRouter.get(
  "/:userId/progress/:category",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = request.params.userId as string;
    const category = request.params.category as string;

    const progress = await BadgeService.getBadgeProgress(userId, category);
    response.json(progress);
  })
);

// Get badge summary for all categories
badgesRouter.get(
  "/:userId/summary",
  requireAuth,
  validate(userIdSchema, "params"),
  asyncHandler(async (request, response) => {
    const { userId } = userIdSchema.parse(request.params);
    const summary = await BadgeService.getBadgeSummary(userId);
    response.json(summary);
  })
);

// Get badge statistics (admin only)
badgesRouter.get(
  "/admin/statistics",
  requireAuth,
  asyncHandler(async (request, response) => {
    // TODO: Add admin role check middleware
    const stats = await BadgeService.getBadgeStatistics();
    response.json({ statistics: stats });
  })
);
