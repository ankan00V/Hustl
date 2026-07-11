import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const companionRouter = Router();

/**
 * Helper to ensure req.user exists and returns user ID.
 */
function getAuthenticatedUserId(request: any): string {
  const userId = request.user?.id;
  if (!userId) {
    throw AppError.unauthorized("Authentication required", "AUTH_REQUIRED");
  }
  return userId;
}

// ── Applied Gigs / Matches ──────────────────────────────────────────
// Fetch matches where studentId === request.user.id, including listing and business profile
const getAppliedMatches = asyncHandler(async (request, response) => {
  const userId = getAuthenticatedUserId(request);

  const matches = await prisma.match.findMany({
    where: {
      studentId: userId,
    },
    include: {
      listing: {
        include: {
          business: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  response.json({ matches });
});

companionRouter.get("/applied", requireAuth, getAppliedMatches);
companionRouter.get("/applied-gigs", requireAuth, getAppliedMatches);


// ── Saved Gigs / Listings ───────────────────────────────────────────
// Fetch saved listings where userId === request.user.id, including listing and business profile
const getSavedListings = asyncHandler(async (request, response) => {
  const userId = getAuthenticatedUserId(request);

  const saved = await prisma.savedListing.findMany({
    where: {
      userId,
    },
    include: {
      listing: {
        include: {
          business: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const listings = saved.map((s) => ({
    ...s.listing,
    savedAt: s.createdAt,
  }));

  response.json({
    saved,
    savedListings: saved,
    listings,
  });
});

companionRouter.get("/saved", requireAuth, getSavedListings);
companionRouter.get("/saved-gigs", requireAuth, getSavedListings);


// ── Active Gigs / Matches ───────────────────────────────────────────
// Fetch matches where studentId === request.user.id and status is ACCEPTED or CHECKED_IN
const getActiveMatches = asyncHandler(async (request, response) => {
  const userId = getAuthenticatedUserId(request);

  const matches = await prisma.match.findMany({
    where: {
      studentId: userId,
      status: {
        in: ["ACCEPTED", "CHECKED_IN"],
      },
    },
    include: {
      listing: {
        include: {
          business: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  response.json({ matches });
});

companionRouter.get("/active", requireAuth, getActiveMatches);
companionRouter.get("/active-gigs", requireAuth, getActiveMatches);


// ── Earnings ────────────────────────────────────────────────────────
// Compute total/net earnings from WalletTransaction where type is SHIFT_EARNING and status is POSTED,
// fetch wallet balance (availableBalance and pendingBalance), and return recent shift earnings.
companionRouter.get(
  "/earnings",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = getAuthenticatedUserId(request);

    // 1. Calculate total/net earnings
    const earningsAggregate = await prisma.walletTransaction.aggregate({
      where: {
        walletUserId: userId,
        type: "SHIFT_EARNING",
        status: "POSTED",
      },
      _sum: {
        grossAmount: true,
        netAmount: true,
      },
    });

    const totalGrossEarnings = parseFloat(earningsAggregate._sum.grossAmount?.toString() || "0");
    const totalNetEarnings = parseFloat(earningsAggregate._sum.netAmount?.toString() || "0");

    // 2. Fetch wallet balance
    let availableBalance = 0;
    let pendingBalance = 0;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (wallet) {
      availableBalance = parseFloat(wallet.availableBalance.toString());
      pendingBalance = parseFloat(wallet.pendingBalance.toString());
    } else {
      // Auto-create wallet if it does not exist, for absolute consistency with wallet service
      const newWallet = await prisma.wallet.create({
        data: {
          userId,
          availableBalance: 0,
          pendingBalance: 0,
        },
      });
      availableBalance = parseFloat(newWallet.availableBalance.toString());
      pendingBalance = parseFloat(newWallet.pendingBalance.toString());
    }

    // 3. Fetch recent shift earning transactions
    const recentTransactions = await prisma.walletTransaction.findMany({
      where: {
        walletUserId: userId,
        type: "SHIFT_EARNING",
        status: "POSTED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      include: {
        match: {
          select: {
            id: true,
            listing: {
              select: {
                title: true,
                business: {
                  select: {
                    businessName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const transactions = recentTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      status: tx.status,
      grossAmount: parseFloat(tx.grossAmount.toString()),
      tdsAmount: parseFloat(tx.tdsAmount.toString()),
      netAmount: parseFloat(tx.netAmount.toString()),
      amount: parseFloat(tx.amount.toString()),
      createdAt: tx.createdAt,
      postedAt: tx.postedAt,
      match: tx.match
        ? {
            id: tx.match.id,
            listingTitle: tx.match.listing.title,
            businessName: tx.match.listing.business.businessName,
          }
        : null,
    }));

    response.json({
      totalEarnings: totalNetEarnings, // Default representation (net earnings)
      totalGrossEarnings,
      totalNetEarnings,
      availableBalance,
      pendingBalance,
      transactions,
      recentTransactions: transactions,
    });
  })
);
