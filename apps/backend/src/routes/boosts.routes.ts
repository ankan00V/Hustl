import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { Decimal } from "@prisma/client/runtime/library";

export const boostsRouter = Router();

// Boost pricing (in rupees)
const BOOST_PRICES = {
  STUDENT_PROFILE: 49, // ₹49 for 24h profile boost
  BUSINESS_LISTING: 99, // ₹99 for 24h listing boost
};

// Get active boosts for the current user
boostsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (request, response) => {
    const boosts = await prisma.boost.findMany({
      where: {
        OR: [
          { targetType: "STUDENT_PROFILE", targetId: request.user!.id },
          { listing: { businessId: request.user!.id } },
        ],
        status: "ACTIVE",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    response.json({ boosts });
  })
);

// Purchase a boost for student profile
boostsRouter.post(
  "/profile",
  requireAuth,
  requireRole("STUDENT"),
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;
    const price = BOOST_PRICES.STUDENT_PROFILE;

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new AppError(404, "Wallet not found");
    }

    const availableBalance = parseFloat(wallet.availableBalance.toString());
    if (availableBalance < price) {
      throw new AppError(
        400,
        `Insufficient balance. Need ₹${price}, have ₹${availableBalance.toFixed(2)}`
      );
    }

    // Create boost and deduct from wallet in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { userId },
        data: {
          availableBalance: {
            decrement: new Decimal(price),
          },
        },
      });

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletUserId: userId,
          type: "BOOST_PURCHASE",
          status: "POSTED",
          grossAmount: new Decimal(price),
          netAmount: new Decimal(-price),
          amount: new Decimal(-price),
          idempotencyKey: `boost-profile-${userId}-${Date.now()}`,
          postedAt: new Date(),
        },
      });

      // Create boost
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour boost

      const boost = await tx.boost.create({
        data: {
          targetType: "STUDENT_PROFILE",
          targetId: userId,
          source: "PAID",
          status: "ACTIVE",
          startsAt: new Date(),
          expiresAt,
        },
      });

      return boost;
    });

    response.status(201).json({ boost: result });
  })
);

// Purchase a boost for business listing
boostsRouter.post(
  "/listing/:listingId",
  requireAuth,
  requireRole("BUSINESS"),
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;
    const { listingId } = request.params;
    
    if (!listingId || typeof listingId !== "string") {
      throw new AppError(400, "Valid listing ID is required");
    }
    
    const price = BOOST_PRICES.BUSINESS_LISTING;

    // Verify listing ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.businessId !== userId) {
      throw new AppError(404, "Listing not found or not owned by you");
    }

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new AppError(404, "Wallet not found");
    }

    const availableBalance = parseFloat(wallet.availableBalance.toString());
    if (availableBalance < price) {
      throw new AppError(
        400,
        `Insufficient balance. Need ₹${price}, have ₹${availableBalance.toFixed(2)}`
      );
    }

    // Create boost and deduct from wallet in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { userId },
        data: {
          availableBalance: {
            decrement: new Decimal(price),
          },
        },
      });

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletUserId: userId,
          type: "BOOST_PURCHASE",
          status: "POSTED",
          grossAmount: new Decimal(price),
          netAmount: new Decimal(-price),
          amount: new Decimal(-price),
          idempotencyKey: `boost-listing-${listingId}-${Date.now()}`,
          postedAt: new Date(),
        },
      });

      // Create boost
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour boost

      const boost = await tx.boost.create({
        data: {
          targetType: "BUSINESS_LISTING",
          targetId: listingId,
          source: "PAID",
          status: "ACTIVE",
          startsAt: new Date(),
          expiresAt,
        },
      });

      // Update listing boostedUntil field
      await tx.listing.update({
        where: { id: listingId },
        data: {
          boostedUntil: expiresAt,
        },
      });

      return boost;
    });

    response.status(201).json({ boost: result });
  })
);

// Cancel/expire a boost (admin only)
boostsRouter.post(
  "/:boostId/cancel",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (request, response) => {
    const { boostId } = request.params;
    
    if (!boostId || typeof boostId !== "string") {
      throw new AppError(400, "Valid boost ID is required");
    }

    const boost = await prisma.boost.update({
      where: { id: boostId },
      data: {
        status: "CANCELLED",
      },
    });

    response.json({ boost });
  })
);
