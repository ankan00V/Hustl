import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const prisma = new PrismaClient();
export const boostsRouter = Router();

// Get active boosts for the current user
boostsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (request, response) => {
    const boosts = await prisma.boost.findMany({
      where: {
        OR: [
          { targetType: "STUDENT_PROFILE", targetId: request.user!.id },
          { listing: { businessId: request.user!.id } }
        ],
        status: "ACTIVE",
        expiresAt: {
          gt: new Date()
        }
      }
    });
    
    response.json({ boosts });
  })
);

// Purchase a boost (stub for payment integration)
boostsRouter.post(
  "/purchase",
  requireAuth,
  asyncHandler(async (request, response) => {
    const { targetType, listingId } = request.body;
    
    // In reality, this would create a checkout session or deduct from wallet
    // For now, we just create an active boost
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour boost

    const boost = await prisma.boost.create({
      data: {
        targetType,
        source: "PAID",
        status: "ACTIVE",
        targetId: targetType === "STUDENT_PROFILE" ? request.user!.id : (listingId as string),
        startsAt: new Date(),
        expiresAt
      }
    });

    // Also deduct from wallet using WalletTransaction
    if (boost) {
       // logic to deduct from wallet
    }
    
    response.status(201).json({ boost });
  })
);
