import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { Decimal } from '@prisma/client/runtime/library';

interface SwipeRateResult {
  listingId: string;
  title: string;
  totalImpressions: number;
  rightSwipes: number;
  swipeRate: number;
}

interface ApplicantScoreResult {
  listingId: string;
  title: string;
  applicantCount: number;
  avgReputationScore: number;
}

interface BestPostTimeResult {
  hour: number;
  matchCount: number;
}

interface SkillDemandResult {
  skill: string;
  matchCount: number;
}

/**
 * Analytics Service
 * Provides business intelligence for PRO+ members
 */
export class AnalyticsService {
  /**
   * Calculate swipe rate per listing
   * Right swipes / total impressions
   */
  async getSwipeRate(businessId: string): Promise<SwipeRateResult[]> {
    // Get all listings for this business
    const listings = await prisma.listing.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            swipes: true,
          },
        },
      },
    });

    const results: SwipeRateResult[] = [];

    for (const listing of listings) {
      // Get right swipes count
      const rightSwipes = await prisma.swipe.count({
        where: {
          listingId: listing.id,
          direction: 'RIGHT',
        },
      });

      const totalImpressions = listing._count.swipes;
      const swipeRate = totalImpressions > 0 ? (rightSwipes / totalImpressions) * 100 : 0;

      results.push({
        listingId: listing.id,
        title: listing.title,
        totalImpressions,
        rightSwipes,
        swipeRate: Math.round(swipeRate * 100) / 100, // Round to 2 decimals
      });
    }

    return results.sort((a, b) => b.swipeRate - a.swipeRate);
  }

  /**
   * Calculate average reputation score of applicants per listing
   * Optimized to avoid N+1 queries by fetching all data in a single query
   */
  async getApplicantScore(businessId: string): Promise<ApplicantScoreResult[]> {
    // Get all listings with their matches in a single query
    const listings = await prisma.listing.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        matches: {
          select: {
            student: {
              select: {
                reputationScore: true,
              },
            },
          },
        },
      },
    });

    // Calculate results from the fetched data
    const results: ApplicantScoreResult[] = listings.map((listing: any) => {
      const applicantCount = listing.matches.length;
      
      if (applicantCount === 0) {
        return {
          listingId: listing.id,
          title: listing.title,
          applicantCount: 0,
          avgReputationScore: 0,
        };
      }

      // Calculate average reputation
      const totalReputation = listing.matches.reduce((sum: number, match: any) => {
        const score = match.student.reputationScore || 0;
        return sum + score;
      }, 0);

      const avgReputationScore = totalReputation / applicantCount;

      return {
        listingId: listing.id,
        title: listing.title,
        applicantCount,
        avgReputationScore: Math.round(avgReputationScore * 100) / 100,
      };
    });

    return results.sort((a, b) => b.avgReputationScore - a.avgReputationScore);
  }

  /**
   * Get best posting times based on match acceptance patterns
   * Returns histogram of match acceptance times by hour of day
   */
  async getBestPostTime(businessId: string): Promise<BestPostTimeResult[]> {
    // Get all accepted matches for this business in last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const matches = await prisma.match.findMany({
      where: {
        listing: {
          businessId,
        },
        status: 'ACCEPTED',
        createdAt: {
          gte: ninetyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by hour of day
    const hourCounts: { [hour: number]: number } = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }

    matches.forEach((match: any) => {
      const hour = match.createdAt.getHours();
      if (hourCounts[hour] !== undefined) {
        hourCounts[hour]++;
      }
    });

    // Convert to array and sort by count
    const results: BestPostTimeResult[] = Object.entries(hourCounts).map(([hour, count]) => ({
      hour: parseInt(hour),
      matchCount: count,
    }));

    return results.sort((a, b) => b.matchCount - a.matchCount);
  }

  /**
   * Get most in-demand skills in the business's city over last 30 days
   */
  async getSkillDemand(businessId: string): Promise<SkillDemandResult[]> {
    // Get business profile to find city
    const business = await prisma.businessProfile.findUnique({
      where: { userId: businessId },
      select: {
        userId: true,
      },
    });

    if (!business) {
      throw new AppError(404, 'Business profile not found');
    }

    // Get all listings for this business to find citySlug
    const businessListings = await prisma.listing.findMany({
      where: { businessId },
      select: { citySlug: true },
      take: 1,
    });

    if (businessListings.length === 0) {
      return []; // No listings, no skill demand data
    }

    const citySlug = businessListings[0]?.citySlug;
    
    if (!citySlug) {
      return []; // No city data available
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all matches in this city in last 30 days
    const matches = await prisma.match.findMany({
      where: {
        listing: {
          citySlug,
        },
        status: {
          in: ['ACCEPTED', 'CHECKED_IN', 'COMPLETED'],
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        listing: {
          select: {
            skills: true,
          },
        },
      },
    });

    // Count skill occurrences
    const skillCounts: { [skill: string]: number } = {};

    matches.forEach((match: any) => {
      const skills = match.listing.skills as string[];
      skills.forEach((skill: string) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    // Convert to array and sort by count
    const results: SkillDemandResult[] = Object.entries(skillCounts).map(([skill, count]) => ({
      skill,
      matchCount: count,
    }));

    return results.sort((a, b) => b.matchCount - a.matchCount).slice(0, 20); // Top 20 skills
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  async getDashboardAnalytics(businessId: string) {
    const [swipeRate, applicantScore, bestPostTime, skillDemand] = await Promise.all([
      this.getSwipeRate(businessId),
      this.getApplicantScore(businessId),
      this.getBestPostTime(businessId),
      this.getSkillDemand(businessId),
    ]);

    return {
      swipeRate,
      applicantScore,
      bestPostTime,
      skillDemand,
    };
  }
}

export const analyticsService = new AnalyticsService();
