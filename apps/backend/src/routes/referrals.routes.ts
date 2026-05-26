import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const prisma = new PrismaClient();
export const referralsRouter = Router();

// Get referral code and stats
referralsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (request, response) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id }
    });
    
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerId: request.user!.id }
    });

    response.json({
      code: user.referralCode,
      totalReferrals: referrals.length,
      rewardedReferrals: referrals.filter(r => r.status === "REWARDED").length,
      referrals
    });
  })
);

// Apply a referral code
referralsRouter.post(
  "/apply",
  requireAuth,
  asyncHandler(async (request, response) => {
    const { code } = request.body;

    const referrer = await prisma.user.findUnique({
      where: { referralCode: code }
    });

    if (!referrer) {
      return response.status(400).json({ error: "Invalid referral code" });
    }

    if (referrer.id === request.user!.id) {
      return response.status(400).json({ error: "Cannot use your own code" });
    }

    // Check if already applied
    const existing = await prisma.referral.findFirst({
      where: { refereeId: request.user!.id }
    });

    if (existing) {
      return response.status(400).json({ error: "Referral code already applied" });
    }

    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: request.user!.id,
        code,
        status: "SIGNED_UP"
      }
    });

    response.json({ success: true, referral });
  })
);
