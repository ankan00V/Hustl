import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";

interface AnalyticsSummary {
  overview: {
    totalListings: number;
    activeListings: number;
    totalMatches: number;
    completedShifts: number;
    totalRevenue: number;
    averageRating: number;
  };
  performance: {
    applicationRate: number;
    acceptanceRate: number;
    completionRate: number;
    noShowRate: number;
    averageTimeToFill: number; // in hours
  };
  trends: {
    period: string;
    applications: number[];
    completions: number[];
    revenue: number[];
    labels: string[];
  };
  topPerformers: {
    students: Array<{
      id: string;
      name: string;
      completedShifts: number;
      rating: number;
      earnings: number;
    }>;
    listings: Array<{
      id: string;
      title: string;
      applications: number;
      completions: number;
      rating: number;
    }>;
  };
  demographics: {
    skillDistribution: Record<string, number>;
    collegeDistribution: Record<string, number>;
    timeSlotPreferences: Record<string, number>;
  };
  insights: {
    bestPerformingSkills: string[];
    optimalPricing: { min: number; max: number; average: number };
    peakApplicationTimes: string[];
    recommendations: string[];
  };
}

/**
 * Enhanced Analytics Service for Business Intelligence
 * Provides comprehensive insights for PRO+ businesses
 */
export class AnalyticsEnhancedService {
  /**
   * Get comprehensive analytics dashboard for a business
   */
  static async getBusinessDashboard(
    businessId: string,
    period: "7d" | "30d" | "90d" = "30d"
  ): Promise<AnalyticsSummary> {
    const cacheKey = `analytics:business:${businessId}:${period}`;
    
    // Check cache first (5 min TTL)
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const daysAgo = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Parallel queries for performance
    const [
      listings,
      matches,
      completedMatches,
      reviews,
      revenueData,
    ] = await Promise.all([
      // All listings
      prisma.listing.findMany({
        where: { businessId },
        include: {
          matches: {
            include: {
              student: {
                include: { studentProfile: true }
              }
            }
          }
        }
      }),
      // All matches in period
      prisma.match.findMany({
        where: {
          listing: { businessId },
          createdAt: { gte: startDate }
        },
        include: {
          listing: true,
          student: {
            include: { studentProfile: true }
          }
        }
      }),
      // Completed matches
      prisma.match.findMany({
        where: {
          listing: { businessId },
          status: "COMPLETED",
          completedAt: { gte: startDate }
        },
        include: {
          listing: true,
          student: {
            include: {
              studentProfile: true
            }
          }
        }
      }),
      // Reviews
      prisma.review.findMany({
        where: {
          match: { listing: { businessId } },
          createdAt: { gte: startDate }
        }
      }),
      // Revenue data
      prisma.walletTransaction.findMany({
        where: {
          wallet: {
            user: {
              businessProfile: { userId: businessId }
            }
          },
          type: "WITHDRAWAL",
          createdAt: { gte: startDate }
        }
      })
    ]);

    // Calculate overview metrics
    const activeListings = listings.filter(l => l.status === "OPEN").length;
    const totalMatches = matches.length;
    const completedShifts = completedMatches.length;
    const totalRevenue = revenueData.reduce((sum, t) => sum + Number(t.amount), 0);
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Calculate performance metrics
    const applicationRate = listings.length > 0
      ? (totalMatches / listings.length) * 100
      : 0;
    
    const acceptedMatches = matches.filter(m => m.status !== "PENDING").length;
    const acceptanceRate = totalMatches > 0
      ? (acceptedMatches / totalMatches) * 100
      : 0;
    
    const completionRate = acceptedMatches > 0
      ? (completedShifts / acceptedMatches) * 100
      : 0;
    
    const noShowMatches = matches.filter(m => m.status === "NO_SHOW").length;
    const noShowRate = acceptedMatches > 0
      ? (noShowMatches / acceptedMatches) * 100
      : 0;

    // Calculate average time to fill
    const filledListings = listings.filter((l: any) => 
      l.matches.some((m: any) => m.status === "ACCEPTED")
    );
    const avgTimeToFill = filledListings.length > 0
      ? filledListings.reduce((sum, l) => {
          const firstAccepted = l.matches.find((m: any) => m.acceptedAt);
          if (firstAccepted?.acceptedAt) {
            const hours = (firstAccepted.acceptedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0) / filledListings.length
      : 0;

    // Generate trends data
    const trends = this.generateTrends(matches, completedMatches, revenueData, daysAgo);

    // Top performers
    const topStudents = this.getTopStudents(completedMatches);
    const topListings = this.getTopListings(listings);

    // Demographics
    const demographics = this.analyzeDemographics(matches);

    // AI-powered insights
    const insights = this.generateInsights(
      listings,
      matches,
      completedMatches,
      reviews
    );

    const result: AnalyticsSummary = {
      overview: {
        totalListings: listings.length,
        activeListings,
        totalMatches,
        completedShifts,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageRating: Math.round(averageRating * 10) / 10
      },
      performance: {
        applicationRate: Math.round(applicationRate * 10) / 10,
        acceptanceRate: Math.round(acceptanceRate * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        noShowRate: Math.round(noShowRate * 10) / 10,
        averageTimeToFill: Math.round(avgTimeToFill * 10) / 10
      },
      trends,
      topPerformers: {
        students: topStudents,
        listings: topListings
      },
      demographics,
      insights
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  /**
   * Generate trend data for charts
   */
  private static generateTrends(
    matches: any[],
    completedMatches: any[],
    revenueData: any[],
    days: number
  ) {
    const labels: string[] = [];
    const applications: number[] = [];
    const completions: number[] = [];
    const revenue: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      applications.push(
        matches.filter(m => 
          m.createdAt.toISOString().split('T')[0] === dateStr
        ).length
      );
      
      completions.push(
        completedMatches.filter(m => 
          m.completedAt?.toISOString().split('T')[0] === dateStr
        ).length
      );
      
      revenue.push(
        revenueData
          .filter(t => t.createdAt.toISOString().split('T')[0] === dateStr)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      );
    }

    return {
      period: `${days}d`,
      applications,
      completions,
      revenue,
      labels
    };
  }

  /**
   * Get top performing students
   */
  private static getTopStudents(completedMatches: any[]) {
    const studentMap = new Map<string, any>();

    for (const match of completedMatches) {
      const studentId = match.studentId;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          id: studentId,
          name: match.student.user.name,
          completedShifts: 0,
          totalRating: 0,
          ratingCount: 0,
          earnings: 0
        });
      }

      const student = studentMap.get(studentId);
      student.completedShifts++;
      
      if (match.listing.hourlyRate) {
        student.earnings += parseFloat(match.listing.hourlyRate) * match.listing.totalHours;
      }
    }

    return Array.from(studentMap.values())
      .sort((a, b) => b.completedShifts - a.completedShifts)
      .slice(0, 10)
      .map(s => ({
        id: s.id,
        name: s.name,
        completedShifts: s.completedShifts,
        rating: s.ratingCount > 0 ? Math.round((s.totalRating / s.ratingCount) * 10) / 10 : 0,
        earnings: Math.round(s.earnings * 100) / 100
      }));
  }

  /**
   * Get top performing listings
   */
  private static getTopListings(listings: any[]) {
    return listings
      .map(l => ({
        id: l.id,
        title: l.title,
        applications: l.matches.length,
        completions: l.matches.filter((m: any) => m.status === "COMPLETED").length,
        rating: 0 // TODO: Calculate from reviews
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10);
  }

  /**
   * Analyze demographics of applicants
   */
  private static analyzeDemographics(matches: any[]) {
    const skillDist: Record<string, number> = {};
    const collegeDist: Record<string, number> = {};
    const timeDist: Record<string, number> = {};

    for (const match of matches) {
      // Skills
      for (const skill of match.student.studentProfile.skills) {
        skillDist[skill] = (skillDist[skill] || 0) + 1;
      }

      // College
      const college = match.student.studentProfile.collegeName;
      if (college) {
        collegeDist[college] = (collegeDist[college] || 0) + 1;
      }

      // Time slots
      for (const slot of match.student.studentProfile.availabilitySlots) {
        timeDist[slot] = (timeDist[slot] || 0) + 1;
      }
    }

    return {
      skillDistribution: skillDist,
      collegeDistribution: collegeDist,
      timeSlotPreferences: timeDist
    };
  }

  /**
   * Generate AI-powered insights and recommendations
   */
  private static generateInsights(
    listings: any[],
    matches: any[],
    completedMatches: any[],
    reviews: any[]
  ) {
    const recommendations: string[] = [];

    // Analyze completion rate
    const completionRate = matches.length > 0
      ? (completedMatches.length / matches.length) * 100
      : 0;

    if (completionRate < 70) {
      recommendations.push("Consider improving job descriptions and requirements to attract more reliable candidates");
    }

    // Analyze pricing
    const prices = listings.map(l => Number(l.hourlyRate));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const marketAvg = 150; // TODO: Calculate from market data

    if (avgPrice < marketAvg * 0.8) {
      recommendations.push(`Your average rate (₹${avgPrice.toFixed(0)}/hr) is below market average. Consider increasing rates to attract top talent`);
    }

    // Analyze response time
    const avgTimeToFill = listings
      .filter(l => l.matches.some((m: any) => m.acceptedAt))
      .reduce((sum, l) => {
        const firstAccepted = l.matches.find((m: any) => m.acceptedAt);
        if (firstAccepted?.acceptedAt) {
          return sum + (firstAccepted.acceptedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60);
        }
        return sum;
      }, 0) / listings.length;

    if (avgTimeToFill > 24) {
      recommendations.push("Listings are taking longer than average to fill. Try using the Urgent feature or boosting visibility");
    }

    // Best performing skills
    const skillPerformance = new Map<string, number>();
    for (const match of completedMatches) {
      for (const skill of match.listing.skills) {
        skillPerformance.set(skill, (skillPerformance.get(skill) || 0) + 1);
      }
    }

    const bestSkills = Array.from(skillPerformance.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);

    return {
      bestPerformingSkills: bestSkills,
      optimalPricing: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: Math.round(avgPrice * 100) / 100
      },
      peakApplicationTimes: ["9:00 AM - 11:00 AM", "2:00 PM - 4:00 PM"], // TODO: Calculate from data
      recommendations
    };
  }
}

// Made with Bob
