import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const walletRouter = Router();

// ── Get wallet balance ──────────────────────────────────────────
walletRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;

    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          availableBalance: 0,
          pendingBalance: 0,
          currency: "INR",
        },
      });
    }

    response.json({ wallet });
  })
);

// ── Get transaction history ─────────────────────────────────────
walletRouter.get(
  "/transactions",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;
    const page = Math.max(1, parseInt(request.query.page as string) || 1);
    const limit = Math.min(50, parseInt(request.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletUserId: userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: { walletUserId: userId } }),
    ]);

    response.json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  })
);

// ── Request payout (UPI) ────────────────────────────────────────
walletRouter.post(
  "/payout",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;
    const { amount, upiId } = request.body as { amount: number; upiId: string };

    if (!amount || amount < 500) {
      throw new AppError(400, "Minimum payout is ₹500", "MIN_PAYOUT");
    }

    if (!upiId || !upiId.includes("@")) {
      throw new AppError(400, "Invalid UPI ID", "INVALID_UPI");
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.availableBalance.toNumber() < amount) {
      throw new AppError(400, "Insufficient balance", "INSUFFICIENT_BALANCE");
    }

    // Deduct from available, add to pending
    await prisma.wallet.update({
      where: { userId },
      data: {
        availableBalance: { decrement: amount },
        pendingBalance: { increment: amount },
      },
    });

    // Create withdrawal transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        walletUserId: userId,
        type: "WITHDRAWAL",
        amount: -amount,
        status: "PENDING",
        idempotencyKey: `withdrawal-${userId}-${Date.now()}`,
      },
    });

    // Create payout record
    const payout = await prisma.payoutRequest.create({
      data: {
        walletUserId: userId,
        amount,
        upiId,
        status: "REQUESTED",
        externalRef: transaction.id,
      },
    });

    response.json({ payout });
  })
);
