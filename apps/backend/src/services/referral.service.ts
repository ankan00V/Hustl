import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";
import { AppError } from "../utils/app-error.js";
import { queuePushNotification } from "../jobs/notification.job.js";

interface ReferralReward {
  referrerId: string;
  refereeId: string;
  type: "SIGNUP" | "FIRST_SHIFT" | "MILESTONE";
  amount: number;
  milestone?: number;
}

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  conversionRate: number;
  topReferrers: Array<{
    userId: string;
    name: string;
    referralCount: number;
    earnings: number;
  }>;
}

/**
 * Referral System with Viral Loops
 * Incentivizes users to invite friends with tiered rewards
 */
export class ReferralService {
  // Reward structure
  private static readonly REWARDS = {
    SIGNUP: 50, // ₹50 when referee signs up
    FIRST_SHIFT: 100, // ₹100 when referee completes first shift
    MILESTONES: {
      5: 250, // ₹250 bonus at 5 successful referrals
      10: 500, // ₹500 bonus at 10 successful referrals
      25: 1500, // ₹1500 bonus at 25 successful referrals
      50: 3000, // ₹3000 bonus at 50 successful referrals
      100: 7500, // ₹7500 bonus at 100 successful referrals
    },
  };

  /**
   * Generate unique referral code for user
   */
  static async generateReferralCode(userId: string): Promise<string> {
    // Check if user already has a code
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (existing?.referralCode) {
      return existing.referralCode;
    }

    // Generate unique 8-character code
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = this.generateCode();
      const exists = await prisma.user.findUnique({
        where: { referralCode: code },
      });
      isUnique = !exists;
    }

    // Update user with referral code
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code! },
    });

    return code!;
  }

  /**
   * Generate random 8-character alphanumeric code
   */
  private static generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar chars
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Apply referral code during signup
   */
  static async applyReferralCode(
    refereeId: string,
    referralCode: string
  ): Promise<void> {
    // Find referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true, name: true },
    });

    if (!referrer) {
      throw AppError.badRequest("Invalid referral code", "INVALID_REFERRAL_CODE");
    }

    if (referrer.id === refereeId) {
      throw AppError.badRequest("Cannot use your own referral code", "SELF_REFERRAL");
    }

    // Check if referee already used a referral code
    const existingReferral = await prisma.referral.findFirst({
      where: { refereeId },
    });

    if (existingReferral) {
      throw AppError.badRequest("Referral code already applied", "REFERRAL_ALREADY_USED");
    }

    // Create referral record
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId,
        code: referralCode,
        status: "SIGNED_UP",
        rewardType: "SIGNUP_BONUS",
        rewardValue: this.REWARDS.SIGNUP.toString(),
      },
    });

    // Award signup bonus to referrer
    await this.awardReferralReward({
      referrerId: referrer.id,
      refereeId,
      type: "SIGNUP",
      amount: this.REWARDS.SIGNUP,
    });

    // Send notification to referrer
    await queuePushNotification(
      referrer.id,
      {
        title: "🎉 New Referral!",
        body: `Someone signed up using your referral code! You earned ₹${this.REWARDS.SIGNUP}`,
      },
      {
        type: "referral_signup",
        refereeId,
      }
    );

    // Cache referral relationship
    await redis.setex(
      `referral:${refereeId}`,
      86400 * 30, // 30 days
      referrer.id
    );
  }

  /**
   * Track when referee completes first shift
   */
  static async trackFirstShiftComplete(userId: string): Promise<void> {
    // Check if this is their first shift
    const completedShifts = await prisma.match.count({
      where: {
        studentId: userId,
        status: "COMPLETED",
      },
    });

    if (completedShifts !== 1) return; // Not first shift

    // Get referral record
    const referral = await prisma.referral.findFirst({
      where: { refereeId: userId },
    });

    if (!referral) return; // No referrer

    // Update referral status
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: "REWARDED",
        redeemedAt: new Date(),
        rewardType: "FIRST_SHIFT_BONUS",
        rewardValue: this.REWARDS.FIRST_SHIFT.toString(),
      },
    });

    // Award first shift bonus to referrer
    await this.awardReferralReward({
      referrerId: referral.referrerId,
      refereeId: userId,
      type: "FIRST_SHIFT",
      amount: this.REWARDS.FIRST_SHIFT,
    });

    // Check for milestone bonuses
    await this.checkMilestones(referral.referrerId);

    // Send notification to referrer
    await queuePushNotification(
      referral.referrerId,
      {
        title: "💰 Referral Bonus!",
        body: `Your referral completed their first shift! You earned ₹${this.REWARDS.FIRST_SHIFT}`,
      },
      {
        type: "referral_first_shift",
        refereeId: userId,
      }
    );
  }

  /**
   * Award referral reward to user's wallet
   */
  private static async awardReferralReward(reward: ReferralReward): Promise<void> {
    const { referrerId, amount, type, milestone } = reward;

    await prisma.$transaction(async (tx) => {
      // Credit wallet
      await tx.wallet.update({
        where: { userId: referrerId },
        data: {
          availableBalance: { increment: amount },
        },
      });

      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          walletUserId: referrerId,
          type: "REFERRAL_REWARD",
          amount,
          netAmount: amount,
          grossAmount: amount,
          status: "POSTED",
          idempotencyKey: `referral-${referrerId}-${type}-${Date.now()}`,
          postedAt: new Date(),
        },
      });
    });

    // Invalidate wallet cache
    await redis.del(`wallet:${referrerId}`);
  }

  /**
   * Check and award milestone bonuses
   */
  private static async checkMilestones(referrerId: string): Promise<void> {
    // Count successful referrals
    const successfulCount = await prisma.referral.count({
      where: {
        referrerId,
        status: "REWARDED",
      },
    });

    // Check if user hit a milestone
    const milestones = Object.keys(this.REWARDS.MILESTONES).map(Number);
    const milestone = milestones.find((m) => m === successfulCount);

    if (!milestone) return; // No milestone hit

    const bonusAmount = this.REWARDS.MILESTONES[milestone as keyof typeof this.REWARDS.MILESTONES];

    // Award milestone bonus
    await this.awardReferralReward({
      referrerId,
      refereeId: "", // Not applicable for milestones
      type: "MILESTONE",
      amount: bonusAmount,
      milestone,
    });

    // Send celebration notification
    await queuePushNotification(
      referrerId,
      {
        title: "🏆 Milestone Achieved!",
        body: `You've referred ${milestone} people! Here's ₹${bonusAmount} bonus!`,
      },
      {
        type: "referral_milestone",
        milestone: milestone.toString(),
        bonus: bonusAmount.toString(),
      }
    );
  }

  /**
   * Get referral stats for a user
   */
  static async getUserReferralStats(userId: string): Promise<{
    referralCode: string;
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    totalEarnings: number;
    nextMilestone: { count: number; bonus: number } | null;
    recentReferrals: Array<{
      id: string;
      status: string;
      createdAt: Date;
      redeemedAt: Date | null;
    }>;
  }> {
    // Get or generate referral code
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    let referralCode = user?.referralCode;
    if (!referralCode) {
      referralCode = await this.generateReferralCode(userId);
    }

    // Get referral stats
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const totalReferrals = referrals.length;
    const successfulReferrals = referrals.filter((r) => r.status === "REWARDED").length;
    const pendingReferrals = referrals.filter((r) => r.status === "SIGNED_UP").length;

    // Calculate total earnings from referrals
    const transactions = await prisma.walletTransaction.findMany({
      where: {
        walletUserId: userId,
        type: "REFERRAL_REWARD",
      },
    });

    const totalEarnings = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Find next milestone
    const milestones = Object.keys(this.REWARDS.MILESTONES).map(Number);
    const nextMilestone = milestones.find((m) => m > successfulReferrals);

    return {
      referralCode,
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      totalEarnings,
      nextMilestone: nextMilestone
        ? {
            count: nextMilestone,
            bonus: this.REWARDS.MILESTONES[nextMilestone as keyof typeof this.REWARDS.MILESTONES],
          }
        : null,
      recentReferrals: referrals.map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt,
        redeemedAt: r.redeemedAt,
      })),
    };
  }

  /**
   * Get global referral leaderboard
   */
  static async getLeaderboard(limit = 10): Promise<ReferralStats["topReferrers"]> {
    const cacheKey = `referral:leaderboard:${limit}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query top referrers
    const topReferrers = await prisma.$queryRaw<
      Array<{
        referrerId: string;
        name: string;
        referralCount: bigint;
      }>
    >`
      SELECT 
        r."referrerId",
        u.name,
        COUNT(*) as "referralCount"
      FROM "Referral" r
      JOIN "User" u ON u.id = r."referrerId"
      WHERE r.status = 'REWARDED'
      GROUP BY r."referrerId", u.name
      ORDER BY "referralCount" DESC
      LIMIT ${limit}
    `;

    // Calculate earnings for each
    const leaderboard = await Promise.all(
      topReferrers.map(async (ref) => {
        const transactions = await prisma.walletTransaction.findMany({
          where: {
            walletUserId: ref.referrerId,
            type: "REFERRAL_REWARD",
          },
        });

        const earnings = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          userId: ref.referrerId,
          name: ref.name,
          referralCount: Number(ref.referralCount),
          earnings,
        };
      })
    );

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(leaderboard));

    return leaderboard;
  }

  /**
   * Generate shareable referral link
   */
  static async getReferralLink(userId: string): Promise<{
    code: string;
    link: string;
    shareText: string;
  }> {
    const code = await this.generateReferralCode(userId);
    const link = `https://hustl.app/signup?ref=${code}`;
    const shareText = `Join Hustl and earn money with flexible gigs! Use my code ${code} and we both get ₹${this.REWARDS.SIGNUP}! ${link}`;

    return { code, link, shareText };
  }

  /**
   * Validate referral code
   */
  static async validateCode(code: string): Promise<{
    valid: boolean;
    referrerName?: string;
    bonus?: number;
  }> {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, name: true },
    });

    if (!referrer) {
      return { valid: false };
    }

    return {
      valid: true,
      referrerName: referrer.name,
      bonus: this.REWARDS.SIGNUP,
    };
  }

  /**
   * Get platform-wide referral statistics
   */
  static async getPlatformStats(): Promise<ReferralStats> {
    const cacheKey = "referral:platform:stats";

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [totalReferrals, successfulReferrals, pendingReferrals] = await Promise.all([
      prisma.referral.count(),
      prisma.referral.count({ where: { status: "REWARDED" } }),
      prisma.referral.count({ where: { status: "SIGNED_UP" } }),
    ]);

    // Calculate total earnings distributed
    const transactions = await prisma.walletTransaction.findMany({
      where: {
        type: "REFERRAL_REWARD",
      },
    });

    const totalEarnings = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    const conversionRate =
      totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;

    const topReferrers = await this.getLeaderboard(10);

    const stats: ReferralStats = {
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      totalEarnings,
      conversionRate: Math.round(conversionRate * 10) / 10,
      topReferrers,
    };

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(stats));

    return stats;
  }
}

// Made with Bob
