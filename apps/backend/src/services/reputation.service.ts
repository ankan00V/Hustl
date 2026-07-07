import { prisma } from "../config/prisma.js";
import type { ReputationEventType } from "@prisma/client";

/**
 * Reputation Service
 * 
 * Manages user reputation scores based on reviews, no-shows, cancellations, and admin adjustments.
 * Uses weighted rolling average of last 20 reviews for accurate reputation tracking.
 */

interface ReputationUpdate {
  userId: string;
  type: ReputationEventType;
  delta: number;
  reason?: string;
  matchId?: string;
}

export class ReputationService {
  /**
   * Calculate weighted rolling average of last 20 reviews
   * More recent reviews have slightly higher weight
   */
  private static async calculateReputationScore(userId: string): Promise<number> {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        rating: true,
        createdAt: true
      }
    });

    if (reviews.length === 0) {
      return 5.0; // Default score for new users
    }

    // Calculate weighted average (more recent reviews have slightly higher weight)
    let totalWeight = 0;
    let weightedSum = 0;

    reviews.forEach((review, index) => {
      // Weight decreases linearly from 1.0 to 0.5 for older reviews
      const weight = 1.0 - (index / reviews.length) * 0.5;
      weightedSum += review.rating * weight;
      totalWeight += weight;
    });

    const score = weightedSum / totalWeight;
    return Math.round(score * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Update reputation score after a new review
   */
  static async updateAfterReview(userId: string, matchId: string): Promise<number> {
    const newScore = await this.calculateReputationScore(userId);

    // Update user's reputation score
    await prisma.user.update({
      where: { id: userId },
      data: { reputationScore: newScore }
    });

    // Create reputation event for audit trail
    await prisma.reputationEvent.create({
      data: {
        userId,
        matchId,
        type: "REVIEW",
        delta: 0, // Delta is implicit in the review rating
        reason: "Review received"
      }
    });

    return newScore;
  }

  /**
   * Apply no-show penalty
   * Deducts 0.8 from reputation score and suspends from urgent listings for 24 hours
   */
  static async applyNoShowPenalty(update: ReputationUpdate): Promise<number> {
    const { userId, matchId, reason } = update;

    // Get current score
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reputationScore: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const newScore = Math.max(1.0, user.reputationScore - 0.8);

    // Update user's reputation score and set urgent suspension
    const urgentSuspendedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: userId },
      data: {
        reputationScore: newScore,
        urgentSuspendedUntil
      }
    });

    // Create reputation event
    await prisma.reputationEvent.create({
      data: {
        userId,
        matchId,
        type: "NO_SHOW",
        delta: -0.8,
        reason: reason || "No-show penalty applied"
      }
    });

    return newScore;
  }

  /**
   * Apply late cancellation penalty
   * Deducts 0.3 from reputation score
   */
  static async applyLateCancellationPenalty(update: ReputationUpdate): Promise<number> {
    const { userId, matchId, reason } = update;

    // Get current score
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reputationScore: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const newScore = Math.max(1.0, user.reputationScore - 0.3);

    // Update user's reputation score
    await prisma.user.update({
      where: { id: userId },
      data: { reputationScore: newScore }
    });

    // Create reputation event
    await prisma.reputationEvent.create({
      data: {
        userId,
        matchId,
        type: "LATE_CANCELLATION",
        delta: -0.3,
        reason: reason || "Late cancellation penalty applied"
      }
    });

    return newScore;
  }

  /**
   * Apply completed shift bonus
   * Small positive adjustment for completing shifts successfully
   */
  static async applyCompletedShiftBonus(update: ReputationUpdate): Promise<number> {
    const { userId, matchId } = update;

    // Get current score
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reputationScore: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Small bonus for completing shifts (max 5.0)
    const newScore = Math.min(5.0, user.reputationScore + 0.05);

    // Update user's reputation score
    await prisma.user.update({
      where: { id: userId },
      data: { reputationScore: newScore }
    });

    // Create reputation event
    await prisma.reputationEvent.create({
      data: {
        userId,
        matchId,
        type: "COMPLETED_SHIFT",
        delta: 0.05,
        reason: "Shift completed successfully"
      }
    });

    return newScore;
  }

  /**
   * Apply admin adjustment
   * Allows admins to manually adjust reputation scores
   */
  static async applyAdminAdjustment(update: ReputationUpdate): Promise<number> {
    const { userId, delta, reason, matchId } = update;

    // Get current score
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reputationScore: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Apply delta and clamp between 1.0 and 5.0
    const newScore = Math.max(1.0, Math.min(5.0, user.reputationScore + delta));

    // Update user's reputation score
    await prisma.user.update({
      where: { id: userId },
      data: { reputationScore: newScore }
    });

    // Create reputation event
    await prisma.reputationEvent.create({
      data: {
        userId,
        matchId,
        type: "ADMIN_ADJUSTMENT",
        delta,
        reason: reason || "Admin adjustment"
      }
    });

    return newScore;
  }

  /**
   * Get reputation history for a user
   */
  static async getReputationHistory(userId: string, limit = 50) {
    return prisma.reputationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  /**
   * Check if user is eligible for urgent listings
   * Students with reputation < 3.5 or currently suspended are not eligible
   */
  static async isEligibleForUrgentListings(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        reputationScore: true,
        urgentSuspendedUntil: true
      }
    });

    if (!user) {
      return false;
    }

    // Check reputation threshold
    if (user.reputationScore < 3.5) {
      return false;
    }

    // Check if currently suspended
    if (user.urgentSuspendedUntil && user.urgentSuspendedUntil > new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Check if business is eligible to appear in student decks
   * Businesses with reputation < 3.8 are filtered out
   */
  static async isBusinessEligibleForDeck(businessId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: businessId },
      select: { reputationScore: true }
    });

    if (!user) {
      return false;
    }

    return user.reputationScore >= 3.8;
  }
}

export async function recalculateReputation(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { revieweeId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { rating: true, createdAt: true }
  });

  if (reviews.length === 0) {
    return 5;
  }

  const weighted = reviews.reduce(
    (acc, review, index) => {
      const weight = Math.max(1, 20 - index);
      return {
        score: acc.score + review.rating * weight,
        weight: acc.weight + weight
      };
    },
    { score: 0, weight: 0 }
  );

  const reputationScore = Number((weighted.score / weighted.weight).toFixed(2));
  await prisma.user.update({ where: { id: userId }, data: { reputationScore } });
  return reputationScore;
}
