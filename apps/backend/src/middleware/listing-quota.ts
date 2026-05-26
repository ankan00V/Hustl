import type { NextFunction, Request, Response } from "express";
import { MEMBERSHIP_LIMITS } from "@hustl/shared";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";

export async function checkListingQuota(request: Request, _response: Response, next: NextFunction) {
  const businessId = request.user?.id;
  if (!businessId) {
    next(new AppError(401, "Authentication required", "AUTH_REQUIRED"));
    return;
  }

  const profile = await prisma.businessProfile.findUnique({ where: { userId: businessId } });
  if (!profile) {
    next(new AppError(404, "Business profile not found", "BUSINESS_PROFILE_REQUIRED"));
    return;
  }

  const limit = MEMBERSHIP_LIMITS[profile.currentTier];
  const activeCount = await prisma.listing.count({
    where: { businessId, status: { in: ["OPEN", "MATCHED"] } }
  });

  if (activeCount >= limit.listingQuota) {
    next(new AppError(402, "Listing quota reached. Upgrade to PRO for unlimited listings.", "LISTING_QUOTA_REACHED"));
    return;
  }

  if (request.body.isUrgent && !limit.urgentEnabled) {
    next(new AppError(402, "Urgent hire mode requires PRO or ELITE.", "URGENT_REQUIRES_PRO"));
    return;
  }

  next();
}
