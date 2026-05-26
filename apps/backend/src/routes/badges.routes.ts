import { Router } from "express";
import { routeParams } from "@hustl/shared";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";

export const badgesRouter = Router();

badgesRouter.get(
  "/:userId",
  requireAuth,
  validate(routeParams.userId, "params"),
  asyncHandler(async (request, response) => {
    const { userId } = routeParams.userId.parse(request.params);
    const badges = await prisma.badge.findMany({
      where: { userId },
      orderBy: [{ category: "asc" }, { earnedAt: "desc" }]
    });
    response.json({ badges });
  })
);
