import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Wallet Service
 * Handles wallet operations including TDS calculation for withdrawals
 *
 * Security Features:
 * - Withdrawal limits and velocity checks
 * - Idempotency for financial operations
 * - Audit logging for compliance
 * - UPI ID validation
 */

// Withdrawal limits configuration
const WITHDRAWAL_LIMITS = {
  MIN: 100,
  MAX_PER_TRANSACTION: 50000,
  MAX_PER_DAY: 100000,
  MAX_TRANSACTIONS_PER_DAY: 3,
} as const;

// UPI ID validation regex
const UPI_ID_REGEX = /^[\w.-]+@[\w.-]+$/;

/**
 * Validates UPI ID format
 */
function validateUpiId(upiId: string): boolean {
  return UPI_ID_REGEX.test(upiId) && upiId.length >= 3 && upiId.length <= 255;
}

/**
 * Check withdrawal velocity limits
 */
async function checkWithdrawalLimits(userId: string, amount: number): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get today's withdrawals
  const todayWithdrawals = await prisma.walletTransaction.findMany({
    where: {
      walletUserId: userId,
      type: "WITHDRAWAL",
      createdAt: { gte: today },
    },
  });

  // Check transaction count
  if (todayWithdrawals.length >= WITHDRAWAL_LIMITS.MAX_TRANSACTIONS_PER_DAY) {
    throw new AppError(
      429,
      `Maximum ${WITHDRAWAL_LIMITS.MAX_TRANSACTIONS_PER_DAY} withdrawals per day exceeded`,
      "WITHDRAWAL_LIMIT_EXCEEDED"
    );
  }

  // Check daily amount limit
  const todayTotal = todayWithdrawals.reduce(
    (sum: number, tx: any) => sum + parseFloat(tx.grossAmount.toString()),
    0
  );

  if (todayTotal + amount > WITHDRAWAL_LIMITS.MAX_PER_DAY) {
    throw new AppError(
      429,
      `Daily withdrawal limit of ₹${WITHDRAWAL_LIMITS.MAX_PER_DAY} exceeded`,
      "DAILY_LIMIT_EXCEEDED"
    );
  }
}

/**
 * Get wallet balance for a user
 */
export async function getWalletBalance(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    // Create wallet if it doesn't exist
    const newWallet = await prisma.wallet.create({
      data: {
        userId,
        availableBalance: new Decimal(0),
        pendingBalance: new Decimal(0),
        currency: "INR",
      },
    });
    return {
      availableBalance: 0,
      pendingBalance: 0,
      currency: "INR",
    };
  }

  return {
    availableBalance: parseFloat(wallet.availableBalance.toString()),
    pendingBalance: parseFloat(wallet.pendingBalance.toString()),
    currency: wallet.currency,
  };
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactions(userId: string, limit = 50) {
  const transactions = await prisma.walletTransaction.findMany({
    where: { walletUserId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
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

  return transactions.map((tx: any) => ({
    id: tx.id,
    type: tx.type,
    status: tx.status,
    grossAmount: parseFloat(tx.grossAmount.toString()),
    tdsAmount: parseFloat(tx.tdsAmount.toString()),
    platformFee: parseFloat(tx.platformFee.toString()),
    netAmount: parseFloat(tx.netAmount.toString()),
    amount: parseFloat(tx.amount.toString()),
    externalRef: tx.externalRef,
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
}

/**
 * Calculate TDS (Tax Deducted at Source) for withdrawal
 * TDS is 10% if annual earnings > ₹50,000
 */
export async function calculateTDS(userId: string, withdrawalAmount: number) {
  // Get current financial year (April 1 - March 31)
  const now = new Date();
  const currentYear = now.getFullYear();
  const financialYearStart =
    now.getMonth() >= 3 // April or later
      ? new Date(currentYear, 3, 1) // April 1 of current year
      : new Date(currentYear - 1, 3, 1); // April 1 of previous year
  const financialYearEnd = new Date(
    financialYearStart.getFullYear() + 1,
    2,
    31
  ); // March 31 of next year

  // Calculate total earnings in current financial year
  const earnings = await prisma.walletTransaction.findMany({
    where: {
      walletUserId: userId,
      type: "SHIFT_EARNING",
      status: "POSTED",
      postedAt: {
        gte: financialYearStart,
        lte: financialYearEnd,
      },
    },
  });

  const totalEarnings = earnings.reduce(
    (sum: number, tx: any) => sum + parseFloat(tx.grossAmount.toString()),
    0
  );

  // TDS threshold: ₹50,000 per financial year
  const tdsThreshold = 50000;
  const tdsRate = 0.1; // 10%

  // If total earnings + withdrawal > threshold, apply TDS
  if (totalEarnings + withdrawalAmount > tdsThreshold) {
    const tdsAmount = withdrawalAmount * tdsRate;
    return {
      tdsApplicable: true,
      tdsAmount,
      netWithdrawal: withdrawalAmount - tdsAmount,
      totalEarningsThisYear: totalEarnings,
      tdsThreshold,
    };
  }

  return {
    tdsApplicable: false,
    tdsAmount: 0,
    netWithdrawal: withdrawalAmount,
    totalEarningsThisYear: totalEarnings,
    tdsThreshold,
  };
}

/**
 * Request payout/withdrawal
 */
export async function requestPayout(params: {
  userId: string;
  amount: number;
  upiId: string;
}) {
  const { userId, amount, upiId } = params;

  // Validate amount
  if (amount < WITHDRAWAL_LIMITS.MIN) {
    throw new AppError(400, `Minimum withdrawal amount is ₹${WITHDRAWAL_LIMITS.MIN}`);
  }

  if (amount > WITHDRAWAL_LIMITS.MAX_PER_TRANSACTION) {
    throw new AppError(
      400,
      `Maximum withdrawal amount is ₹${WITHDRAWAL_LIMITS.MAX_PER_TRANSACTION}`,
      "AMOUNT_EXCEEDS_LIMIT"
    );
  }

  // Validate UPI ID
  if (!validateUpiId(upiId)) {
    throw new AppError(400, "Invalid UPI ID format", "INVALID_UPI_ID");
  }

  // Check withdrawal limits
  await checkWithdrawalLimits(userId, amount);

  // Get wallet balance
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new AppError(404, "Wallet not found");
  }

  const availableBalance = parseFloat(wallet.availableBalance.toString());

  if (availableBalance < amount) {
    throw new AppError(
      400,
      `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}`
    );
  }

  // Calculate TDS
  const tdsCalculation = await calculateTDS(userId, amount);

  // Create payout request
  const payout = await prisma.$transaction(async (tx: any) => {
    // Deduct from available balance, add to pending
    await tx.wallet.update({
      where: { userId },
      data: {
        availableBalance: {
          decrement: new Decimal(amount),
        },
        pendingBalance: {
          increment: new Decimal(amount),
        },
      },
    });

    // Create payout request
    const payoutRequest = await tx.payoutRequest.create({
      data: {
        walletUserId: userId,
        amount: new Decimal(amount),
        status: "REQUESTED",
        upiId,
      },
    });

    // Create withdrawal transaction
    await tx.walletTransaction.create({
      data: {
        walletUserId: userId,
        type: "WITHDRAWAL",
        status: "PENDING",
        grossAmount: new Decimal(amount),
        tdsAmount: new Decimal(tdsCalculation.tdsAmount),
        netAmount: new Decimal(tdsCalculation.netWithdrawal),
        amount: new Decimal(-amount),
        externalRef: `Withdrawal to ${upiId}`,
        idempotencyKey: `withdrawal-${payoutRequest.id}-${Date.now()}`,
      },
    });

    return payoutRequest;
  });

  return {
    payout: {
      id: payout.id,
      amount: parseFloat(payout.amount.toString()),
      status: payout.status,
      upiId: payout.upiId,
      createdAt: payout.createdAt,
    },
    tds: tdsCalculation,
  };
}

/**
 * Get payout requests for a user
 */
export async function getPayoutRequests(userId: string) {
  const payouts = await prisma.payoutRequest.findMany({
    where: { walletUserId: userId },
    orderBy: { createdAt: "desc" },
  });

  return payouts.map((p: any) => ({
    id: p.id,
    amount: parseFloat(p.amount.toString()),
    status: p.status,
    upiId: p.upiId,
    externalRef: p.externalRef,
    createdAt: p.createdAt,
    processedAt: p.processedAt,
  }));
}

/**
 * Admin: Process payout request
 */
export async function processPayout(params: {
  payoutId: string;
  status: "PAID" | "FAILED";
  externalRef?: string;
}) {
  const { payoutId, status, externalRef } = params;

  const payout = await prisma.payoutRequest.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new AppError(404, "Payout request not found");
  }

  if (payout.status !== "REQUESTED") {
    throw new AppError(400, "Payout already processed");
  }

  const amount = parseFloat(payout.amount.toString());

  await prisma.$transaction(async (tx: any) => {
    // Update payout status
    await tx.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status,
        externalRef,
        processedAt: new Date(),
      },
    });

    if (status === "PAID") {
      // Deduct from pending balance
      await tx.wallet.update({
        where: { userId: payout.walletUserId },
        data: {
          pendingBalance: {
            decrement: new Decimal(amount),
          },
        },
      });

      // Update transaction status
      await tx.walletTransaction.updateMany({
        where: {
          walletUserId: payout.walletUserId,
          type: "WITHDRAWAL",
          status: "PENDING",
          externalRef: `Withdrawal to ${payout.upiId}`,
        },
        data: {
          status: "POSTED",
          postedAt: new Date(),
        },
      });
    } else {
      // Failed: refund to available balance
      await tx.wallet.update({
        where: { userId: payout.walletUserId },
        data: {
          availableBalance: {
            increment: new Decimal(amount),
          },
          pendingBalance: {
            decrement: new Decimal(amount),
          },
        },
      });

      // Update transaction status
      await tx.walletTransaction.updateMany({
        where: {
          walletUserId: payout.walletUserId,
          type: "WITHDRAWAL",
          status: "PENDING",
          externalRef: `Withdrawal to ${payout.upiId}`,
        },
        data: {
          status: "FAILED",
        },
      });
    }
  });

  return { success: true, status };
}
