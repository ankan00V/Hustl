import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import {
  getWalletBalance,
  getWalletTransactions,
  requestPayout,
  getPayoutRequests,
  processPayout,
} from "../services/wallet.service.js";

export const walletRouter = Router();

// ── Get wallet balance ──────────────────────────────────────────
walletRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;
    const balance = await getWalletBalance(userId);
    response.json({ wallet: balance });
  })
);

// ── Get transaction history ─────────────────────────────────────
walletRouter.get(
  "/transactions",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;
    const limit = Math.min(50, parseInt(request.query.limit as string) || 20);
    const transactions = await getWalletTransactions(userId, limit);
    
    response.json({
      transactions,
      total: transactions.length,
    });
  })
);

// ── Request withdrawal/payout ───────────────────────────────────
walletRouter.post(
  "/withdraw",
  requireAuth,
  requireRole("STUDENT"),
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;
    const { amount, upiId } = request.body as { amount: number; upiId: string };

    if (!amount || !upiId) {
      throw new AppError(400, "Amount and UPI ID are required");
    }

    if (!upiId.includes("@")) {
      throw new AppError(400, "Invalid UPI ID format");
    }

    const result = await requestPayout({ userId, amount, upiId });
    response.json(result);
  })
);

// ── Get payout requests ─────────────────────────────────────────
walletRouter.get(
  "/payouts",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;
    const payouts = await getPayoutRequests(userId);
    response.json({ payouts });
  })
);

// ── Admin: Process payout ───────────────────────────────────────
walletRouter.post(
  "/payouts/:id/process",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (request, response) => {
    const { id } = request.params;
    const { status, externalRef } = request.body as {
      status: "PAID" | "FAILED";
      externalRef?: string;
    };

    if (!id || typeof id !== "string") {
      throw new AppError(400, "Valid payout ID is required");
    }

    if (!status || !["PAID", "FAILED"].includes(status)) {
      throw new AppError(400, "Valid status (PAID or FAILED) is required");
    }

    const result = await processPayout({ payoutId: id, status, externalRef });
    response.json(result);
  })
);

// ── Legacy payout endpoint (kept for backward compatibility) ────
walletRouter.post(
  "/payout",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;
    const { amount, upiId } = request.body as { amount: number; upiId: string };

    if (!amount || !upiId) {
      throw new AppError(400, "Amount and UPI ID are required");
    }

    if (!upiId.includes("@")) {
      throw new AppError(400, "Invalid UPI ID format");
    }

    const result = await requestPayout({ userId, amount, upiId });
    response.json(result);
  })
);
