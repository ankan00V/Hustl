import { prisma } from "../config/prisma.js";
import { createOrder } from "../lib/razorpay.js";
import { AppError } from "../utils/app-error.js";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Escrow Service
 * Handles payment holds and releases for shift completion using Payment model
 *
 * Security Features:
 * - Idempotency checks to prevent duplicate operations
 * - Transaction isolation for financial operations
 * - Audit logging for compliance
 * - Proper error handling and rollback
 */

/**
 * Check if an operation has already been performed (idempotency check)
 */
async function checkIdempotency(key: string): Promise<boolean> {
  const existing = await prisma.walletTransaction.findUnique({
    where: { idempotencyKey: key },
  });
  return !!existing;
}

export interface EscrowHoldParams {
  matchId: string;
  amount: number; // in rupees
  studentId: string;
  businessId: string;
  listingId: string;
}

/**
 * Create escrow hold when business accepts match
 * Creates Razorpay order and stores in Payment table
 */
export async function createEscrowHold(params: EscrowHoldParams) {
  const { matchId, amount, studentId, businessId, listingId } = params;

  // Convert to paise (Razorpay uses smallest currency unit)
  const amountInPaise = Math.round(amount * 100);

  // Create Razorpay order
  const order = await createOrder({
    amount: amountInPaise,
    currency: "INR",
    receipt: `match_${matchId}`,
    notes: {
      matchId,
      studentId,
      businessId,
      listingId,
      type: "escrow_hold",
    },
  });

  // Store in Payment table
  const payment = await prisma.payment.create({
    data: {
      matchId,
      razorpayOrderId: order.id,
      amount: new Decimal(amount),
      status: "PENDING",
    },
  });

  return {
    payment,
    razorpayOrder: order,
  };
}

/**
 * Release escrow to student wallet after checkout confirmed
 * Applies 8% platform fee
 *
 * @param matchId - The match ID to release escrow for
 * @returns Payment details including net amount and platform fee
 * @throws {AppError} 404 if payment not found
 * @throws {AppError} 400 if payment already released
 */
export async function releaseEscrow(matchId: string) {
  // Check idempotency first
  const idempotencyKey = `escrow-release-${matchId}`;
  if (await checkIdempotency(idempotencyKey)) {
    throw new AppError(400, "Escrow already released for this match", "ALREADY_RELEASED");
  }

  // Get payment with match details
  const payment = await prisma.payment.findUnique({
    where: { matchId },
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  if (payment.status === "RELEASED") {
    throw new AppError(400, "Payment already released");
  }

  // Get match details separately
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      student: {
        include: {
          studentProfile: true,
        },
      },
      listing: {
        include: {
          business: true,
        },
      },
    },
  });

  if (!match) {
    throw new AppError(404, "Match not found");
  }

  const amount = parseFloat(payment.amount.toString());
  const platformFee = amount * 0.08; // 8% platform fee
  const netAmount = amount - platformFee;

  // Get or create student wallet
  let wallet = await prisma.wallet.findUnique({
    where: { userId: match.studentId },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: match.studentId,
        availableBalance: new Decimal(0),
        pendingBalance: new Decimal(0),
      },
    });
  }

  // Execute in transaction with proper isolation level
  const result = await prisma.$transaction(async (tx: any) => {
    // Update payment status
    const updatedPayment = await tx.payment.update({
      where: { matchId },
      data: {
        status: "RELEASED",
        paidAt: new Date(),
      },
    });

    // Credit student wallet
    const currentBalance = parseFloat(wallet!.availableBalance.toString());
    const newBalance = currentBalance + netAmount;
    
    await tx.wallet.update({
      where: { userId: match.studentId },
      data: {
        availableBalance: new Decimal(newBalance.toFixed(2)),
      },
    });

    // Create earning transaction
    await tx.walletTransaction.create({
      data: {
        walletUserId: match.studentId,
        matchId,
        type: "SHIFT_EARNING",
        status: "POSTED",
        grossAmount: new Decimal(amount),
        platformFee: new Decimal(platformFee),
        netAmount: new Decimal(netAmount),
        amount: new Decimal(netAmount),
        idempotencyKey: idempotencyKey,
        postedAt: new Date(),
      },
    });

    // Create platform fee transaction
    await tx.walletTransaction.create({
      data: {
        walletUserId: match.studentId,
        matchId,
        type: "PLATFORM_FEE",
        status: "POSTED",
        grossAmount: new Decimal(0),
        platformFee: new Decimal(platformFee),
        netAmount: new Decimal(-platformFee),
        amount: new Decimal(-platformFee),
        idempotencyKey: `platform-fee-${matchId}`,
        postedAt: new Date(),
      },
    });

    return updatedPayment;
  }, {
    maxWait: 5000, // Maximum time to wait for a transaction slot
    timeout: 10000, // Maximum time for transaction to complete
    isolationLevel: 'Serializable', // Highest isolation level for financial operations
  });

  return {
    payment: result,
    netAmount,
    platformFee,
  };
}

/**
 * Refund escrow on cancellation
 * Applies penalty if cancelled within 1 hour of shift start
 */
export async function refundEscrow(params: {
  matchId: string;
  reason: string;
  cancelledBy: "STUDENT" | "BUSINESS";
}) {
  const { matchId, reason, cancelledBy } = params;

  const payment = await prisma.payment.findUnique({
    where: { matchId },
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  if (payment.status === "REFUNDED") {
    throw new AppError(400, "Payment already refunded");
  }

  // Get match and listing details
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      listing: true,
      student: true,
    },
  });

  if (!match) {
    throw new AppError(404, "Match not found");
  }

  const amount = parseFloat(payment.amount.toString());
  const listing = match.listing;
  const shiftStartTime = new Date(listing.startTime);
  const now = new Date();
  const hoursUntilStart = (shiftStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  let penaltyAmount = 0;
  let refundAmount = amount;

  // Apply penalty if business cancels within 1 hour of shift start
  if (cancelledBy === "BUSINESS" && hoursUntilStart < 1 && hoursUntilStart > 0) {
    const hourlyRate = parseFloat(listing.hourlyRate.toString());
    penaltyAmount = hourlyRate; // 1 hour pay as penalty
    refundAmount = amount - penaltyAmount;

    // Credit penalty to student wallet
    const studentWallet = await prisma.wallet.findUnique({
      where: { userId: match.studentId },
    });

    if (studentWallet) {
      await prisma.$transaction(async (tx: any) => {
        // Credit penalty to student
        const currentBalance = parseFloat(studentWallet.availableBalance.toString());
        const newBalance = currentBalance + penaltyAmount;
        
        await tx.wallet.update({
          where: { userId: match.studentId },
          data: {
            availableBalance: new Decimal(newBalance.toFixed(2)),
          },
        });

        // Create penalty transaction
        await tx.walletTransaction.create({
          data: {
            walletUserId: match.studentId,
            matchId,
            type: "CANCELLATION_PENALTY",
            status: "POSTED",
            grossAmount: new Decimal(penaltyAmount),
            netAmount: new Decimal(penaltyAmount),
            amount: new Decimal(penaltyAmount),
            idempotencyKey: `penalty_${matchId}_${Date.now()}`,
            postedAt: new Date(),
          },
        });
      });
    }
  }

  // Update payment status
  await prisma.payment.update({
    where: { matchId },
    data: {
      status: "REFUNDED",
    },
  });

  return {
    refundAmount,
    penaltyAmount,
    cancelledBy,
  };
}

/**
 * Get escrow/payment status
 */
export async function getEscrowStatus(matchId: string) {
  const payment = await prisma.payment.findUnique({
    where: { matchId },
  });

  if (!payment) {
    return null;
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      listing: {
        select: {
          title: true,
          hourlyRate: true,
          totalHours: true,
        },
      },
    },
  });

  return {
    status: payment.status,
    amount: parseFloat(payment.amount.toString()),
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    createdAt: payment.createdAt,
    paidAt: payment.paidAt,
    listing: match?.listing,
  };
}
