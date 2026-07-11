import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";

interface PricingSuggestion {
  suggestedRate: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string[];
  marketData: {
    averageRate: number;
    minRate: number;
    maxRate: number;
    sampleSize: number;
  };
  factors: {
    timeOfDay: { impact: number; description: string };
    dayOfWeek: { impact: number; description: string };
    urgency: { impact: number; description: string };
    skillDemand: { impact: number; description: string };
    seasonality: { impact: number; description: string };
  };
  competitiveAnalysis: {
    yourPosition: "BELOW_MARKET" | "AT_MARKET" | "ABOVE_MARKET";
    percentile: number;
  };
}

interface PricingRequest {
  category: string;
  skills: string[];
  startTime: Date;
  endTime: Date;
  isUrgent: boolean;
  citySlug?: string;
}

/**
 * Smart Pricing Service
 * AI-powered pricing suggestions based on market data, demand, and timing
 */
export class SmartPricingService {
  /**
   * Get pricing suggestion for a new listing
   */
  static async getSuggestion(request: PricingRequest): Promise<PricingSuggestion> {
    const { category, skills, startTime, endTime, isUrgent, citySlug } = request;

    // Get market data
    const marketData = await this.getMarketData(category, skills, citySlug);

    // Calculate base rate from market data
    let suggestedRate = marketData.averageRate;

    // Apply time-based adjustments
    const timeFactors = this.calculateTimeFactors(startTime, endTime);
    const urgencyFactor = this.calculateUrgencyFactor(isUrgent, startTime);
    const skillFactor = await this.calculateSkillDemandFactor(skills, category);
    const seasonalityFactor = this.calculateSeasonalityFactor(startTime);

    // Combine all factors
    const totalMultiplier =
      1 +
      timeFactors.dayOfWeek.impact +
      timeFactors.timeOfDay.impact +
      urgencyFactor.impact +
      skillFactor.impact +
      seasonalityFactor.impact;

    suggestedRate = Math.round(suggestedRate * totalMultiplier);

    // Ensure rate is within reasonable bounds
    suggestedRate = Math.max(
      marketData.minRate * 0.9,
      Math.min(suggestedRate, marketData.maxRate * 1.2)
    );

    // Round to nearest 10
    suggestedRate = Math.round(suggestedRate / 10) * 10;

    // Determine confidence level
    const confidence = this.calculateConfidence(marketData.sampleSize, totalMultiplier);

    // Build reasoning
    const reasoning = this.buildReasoning({
      baseRate: marketData.averageRate,
      suggestedRate,
      timeFactors,
      urgencyFactor,
      skillFactor,
      seasonalityFactor,
      marketData,
    });

    // Competitive analysis
    const competitiveAnalysis = this.analyzeCompetitivePosition(
      suggestedRate,
      marketData
    );

    return {
      suggestedRate,
      confidence,
      reasoning,
      marketData,
      factors: {
        timeOfDay: timeFactors.timeOfDay,
        dayOfWeek: timeFactors.dayOfWeek,
        urgency: urgencyFactor,
        skillDemand: skillFactor,
        seasonality: seasonalityFactor,
      },
      competitiveAnalysis,
    };
  }

  /**
   * Get market data for similar listings
   */
  private static async getMarketData(
    category: string,
    skills: string[],
    citySlug?: string
  ): Promise<{
    averageRate: number;
    minRate: number;
    maxRate: number;
    sampleSize: number;
  }> {
    const cacheKey = `pricing:market:${category}:${citySlug || "all"}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query recent listings in same category
    const whereClause: any = {
      status: { in: ["FILLED", "COMPLETED"] },
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    };

    // Add category filter through business profile
    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: {
        business: {
          select: {
            category: true,
          },
        },
      },
      take: 100,
    });

    // Filter by category
    const categoryListings = listings.filter(
      (l: any) => l.business.category.toLowerCase() === category.toLowerCase()
    );

    if (categoryListings.length === 0) {
      // Fallback to default rates by category
      return this.getDefaultRates(category);
    }

    const rates = categoryListings.map((l: any) => Number(l.hourlyRate));

    const averageRate = rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length;
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);

    const marketData = {
      averageRate: Math.round(averageRate),
      minRate: Math.round(minRate),
      maxRate: Math.round(maxRate),
      sampleSize: categoryListings.length,
    };

    // Cache for 6 hours
    await redis.setex(cacheKey, 21600, JSON.stringify(marketData));

    return marketData;
  }

  /**
   * Get default rates by category
   */
  private static getDefaultRates(category: string): {
    averageRate: number;
    minRate: number;
    maxRate: number;
    sampleSize: number;
  } {
    const defaults: Record<string, { avg: number; min: number; max: number }> = {
      "food & beverage": { avg: 150, min: 100, max: 250 },
      retail: { avg: 120, min: 80, max: 200 },
      hospitality: { avg: 140, min: 100, max: 220 },
      events: { avg: 180, min: 120, max: 300 },
      delivery: { avg: 100, min: 70, max: 150 },
      tutoring: { avg: 250, min: 150, max: 500 },
      "tech support": { avg: 300, min: 200, max: 600 },
      marketing: { avg: 280, min: 180, max: 500 },
      design: { avg: 320, min: 200, max: 600 },
      default: { avg: 150, min: 100, max: 250 },
    };

    const categoryKey = category.toLowerCase();
    const rates = defaults[categoryKey] || defaults.default;
    const fallback = { avg: 150, min: 100, max: 250 };

    return {
      averageRate: rates?.avg || fallback.avg,
      minRate: rates?.min || fallback.min,
      maxRate: rates?.max || fallback.max,
      sampleSize: 0,
    };
  }

  /**
   * Calculate time-based factors
   */
  private static calculateTimeFactors(startTime: Date, endTime: Date): {
    timeOfDay: { impact: number; description: string };
    dayOfWeek: { impact: number; description: string };
  } {
    const hour = startTime.getHours();
    const day = startTime.getDay(); // 0 = Sunday, 6 = Saturday

    // Time of day impact
    let timeImpact = 0;
    let timeDesc = "";

    if (hour >= 22 || hour < 6) {
      // Late night/early morning
      timeImpact = 0.25;
      timeDesc = "Late night/early morning shift (+25%)";
    } else if (hour >= 18) {
      // Evening
      timeImpact = 0.15;
      timeDesc = "Evening shift (+15%)";
    } else if (hour >= 12) {
      // Afternoon
      timeImpact = 0.05;
      timeDesc = "Afternoon shift (+5%)";
    } else {
      // Morning
      timeImpact = 0;
      timeDesc = "Standard daytime hours";
    }

    // Day of week impact
    let dayImpact = 0;
    let dayDesc = "";

    if (day === 0 || day === 6) {
      // Weekend
      dayImpact = 0.2;
      dayDesc = "Weekend shift (+20%)";
    } else if (day === 5) {
      // Friday
      dayImpact = 0.1;
      dayDesc = "Friday shift (+10%)";
    } else {
      dayImpact = 0;
      dayDesc = "Weekday shift";
    }

    return {
      timeOfDay: { impact: timeImpact, description: timeDesc },
      dayOfWeek: { impact: dayImpact, description: dayDesc },
    };
  }

  /**
   * Calculate urgency factor
   */
  private static calculateUrgencyFactor(
    isUrgent: boolean,
    startTime: Date
  ): { impact: number; description: string } {
    if (!isUrgent) {
      return { impact: 0, description: "Standard listing" };
    }

    const hoursUntilStart = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilStart < 2) {
      return {
        impact: 0.4,
        description: "Urgent - starts in less than 2 hours (+40%)",
      };
    } else if (hoursUntilStart < 4) {
      return {
        impact: 0.3,
        description: "Urgent - starts in less than 4 hours (+30%)",
      };
    } else if (hoursUntilStart < 8) {
      return {
        impact: 0.2,
        description: "Urgent - starts in less than 8 hours (+20%)",
      };
    } else {
      return {
        impact: 0.1,
        description: "Urgent listing (+10%)",
      };
    }
  }

  /**
   * Calculate skill demand factor
   */
  private static async calculateSkillDemandFactor(
    skills: string[],
    category: string
  ): Promise<{ impact: number; description: string }> {
    // High-demand skills by category
    const highDemandSkills: Record<string, string[]> = {
      "food & beverage": ["barista", "chef", "sommelier"],
      retail: ["sales", "inventory management", "customer service"],
      hospitality: ["concierge", "event planning", "multilingual"],
      events: ["event coordination", "av tech", "stage management"],
      tutoring: ["stem", "test prep", "special education"],
      "tech support": ["coding", "networking", "cybersecurity"],
      marketing: ["seo", "social media", "content creation"],
      design: ["ui/ux", "3d modeling", "video editing"],
    };

    const categoryKey = category.toLowerCase();
    const demandSkills = highDemandSkills[categoryKey] || [];

    const hasHighDemandSkill = skills.some((skill) =>
      demandSkills.some((ds) => skill.toLowerCase().includes(ds.toLowerCase()))
    );

    if (hasHighDemandSkill) {
      return {
        impact: 0.15,
        description: "High-demand skills (+15%)",
      };
    }

    return {
      impact: 0,
      description: "Standard skills",
    };
  }

  /**
   * Calculate seasonality factor
   */
  private static calculateSeasonalityFactor(startTime: Date): {
    impact: number;
    description: string;
  } {
    const month = startTime.getMonth(); // 0-11

    // Peak seasons
    if ([11, 0].includes(month)) {
      // December, January - Holiday season
      return {
        impact: 0.15,
        description: "Holiday season peak demand (+15%)",
      };
    } else if ([5, 6, 7].includes(month)) {
      // June, July, August - Summer season
      return {
        impact: 0.1,
        description: "Summer season increased demand (+10%)",
      };
    } else if ([3, 4].includes(month)) {
      // April, May - Spring events
      return {
        impact: 0.05,
        description: "Spring event season (+5%)",
      };
    }

    return {
      impact: 0,
      description: "Standard season",
    };
  }

  /**
   * Calculate confidence level
   */
  private static calculateConfidence(
    sampleSize: number,
    totalMultiplier: number
  ): "LOW" | "MEDIUM" | "HIGH" {
    // High confidence: good sample size and moderate adjustments
    if (sampleSize >= 20 && Math.abs(totalMultiplier - 1) < 0.5) {
      return "HIGH";
    }

    // Medium confidence: decent sample or moderate adjustments
    if (sampleSize >= 10 || Math.abs(totalMultiplier - 1) < 0.3) {
      return "MEDIUM";
    }

    // Low confidence: small sample and large adjustments
    return "LOW";
  }

  /**
   * Build reasoning array
   */
  private static buildReasoning(data: any): string[] {
    const reasoning: string[] = [];

    reasoning.push(
      `Base market rate: ₹${data.baseRate}/hr (based on ${data.marketData.sampleSize} similar listings)`
    );

    if (data.timeFactors.timeOfDay.impact > 0) {
      reasoning.push(data.timeFactors.timeOfDay.description);
    }

    if (data.timeFactors.dayOfWeek.impact > 0) {
      reasoning.push(data.timeFactors.dayOfWeek.description);
    }

    if (data.urgencyFactor.impact > 0) {
      reasoning.push(data.urgencyFactor.description);
    }

    if (data.skillFactor.impact > 0) {
      reasoning.push(data.skillFactor.description);
    }

    if (data.seasonalityFactor.impact > 0) {
      reasoning.push(data.seasonalityFactor.description);
    }

    const totalAdjustment = Math.round(
      ((data.suggestedRate - data.baseRate) / data.baseRate) * 100
    );

    if (totalAdjustment !== 0) {
      reasoning.push(
        `Total adjustment: ${totalAdjustment > 0 ? "+" : ""}${totalAdjustment}%`
      );
    }

    reasoning.push(`Suggested rate: ₹${data.suggestedRate}/hr`);

    return reasoning;
  }

  /**
   * Analyze competitive position
   */
  private static analyzeCompetitivePosition(
    suggestedRate: number,
    marketData: any
  ): {
    yourPosition: "BELOW_MARKET" | "AT_MARKET" | "ABOVE_MARKET";
    percentile: number;
  } {
    const { averageRate, minRate, maxRate } = marketData;

    let position: "BELOW_MARKET" | "AT_MARKET" | "ABOVE_MARKET";

    if (suggestedRate < averageRate * 0.9) {
      position = "BELOW_MARKET";
    } else if (suggestedRate > averageRate * 1.1) {
      position = "ABOVE_MARKET";
    } else {
      position = "AT_MARKET";
    }

    // Calculate percentile (simplified)
    const range = maxRate - minRate;
    const percentile = range > 0 ? ((suggestedRate - minRate) / range) * 100 : 50;

    return {
      yourPosition: position,
      percentile: Math.round(percentile),
    };
  }

  /**
   * Get pricing history for a business
   */
  static async getPricingHistory(
    businessId: string,
    limit = 10
  ): Promise<
    Array<{
      listingId: string;
      title: string;
      hourlyRate: number;
      suggestedRate: number;
      actualApplications: number;
      avgApplicationTime: number; // hours
      filled: boolean;
    }>
  > {
    const listings = await prisma.listing.findMany({
      where: {
        businessId,
        status: { in: ["FILLED", "COMPLETED", "CLOSED"] },
      },
      include: {
        matches: {
          select: {
            appliedAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return listings.map((listing: any) => {
      const applications = listing.matches.length;
      const filled = listing.matches.some((m: any) => m.status === "ACCEPTED");

      // Calculate average time to first application
      const firstApplication = listing.matches[0];
      const avgApplicationTime = firstApplication
        ? (firstApplication.appliedAt.getTime() - listing.createdAt.getTime()) /
          (1000 * 60 * 60)
        : 0;

      return {
        listingId: listing.id,
        title: listing.title,
        hourlyRate: Number(listing.hourlyRate),
        suggestedRate: Number(listing.hourlyRate), // Would need to store historical suggestions
        actualApplications: applications,
        avgApplicationTime: Math.round(avgApplicationTime * 10) / 10,
        filled,
      };
    });
  }

  /**
   * Get pricing optimization tips
   */
  static async getOptimizationTips(businessId: string): Promise<string[]> {
    const tips: string[] = [];

    // Get recent listings
    const recentListings = await prisma.listing.findMany({
      where: {
        businessId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        matches: true,
      },
    });

    if (recentListings.length === 0) {
      return ["Post more listings to get personalized pricing tips"];
    }

    // Analyze fill rate
    const filledCount = recentListings.filter((l: any) => l.status === "FILLED").length;
    const fillRate = filledCount / recentListings.length;

    if (fillRate < 0.5) {
      tips.push(
        "Your fill rate is below 50%. Consider lowering rates or making shifts more urgent."
      );
    } else if (fillRate > 0.9) {
      tips.push(
        "Your fill rate is excellent! You may be able to increase rates slightly."
      );
    }

    // Analyze application speed
    const avgApplicationTimes = recentListings
      .filter((l: any) => l.matches.length > 0)
      .map((l: any) => {
        const firstMatch = l.matches[0];
        if (!firstMatch) return 0;
        return (firstMatch.appliedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60);
      })
      .filter((time: number) => time > 0);

    if (avgApplicationTimes.length > 0) {
      const avgTime =
        avgApplicationTimes.reduce((sum: number, t: number) => sum + t, 0) / avgApplicationTimes.length;

      if (avgTime < 2) {
        tips.push(
          "Your listings get applications very quickly. Consider testing higher rates."
        );
      } else if (avgTime > 24) {
        tips.push(
          "Applications are coming in slowly. Try lowering rates or adding urgency."
        );
      }
    }

    // Analyze urgent vs non-urgent
    const urgentListings = recentListings.filter((l: any) => l.isUrgent);
    const nonUrgentListings = recentListings.filter((l: any) => !l.isUrgent);

    if (urgentListings.length > 0 && nonUrgentListings.length > 0) {
      const urgentFillRate =
        urgentListings.filter((l: any) => l.status === "FILLED").length / urgentListings.length;
      const nonUrgentFillRate =
        nonUrgentListings.filter((l: any) => l.status === "FILLED").length /
        nonUrgentListings.length;

      if (urgentFillRate > nonUrgentFillRate + 0.2) {
        tips.push("Urgent listings perform much better. Consider using urgency more often.");
      }
    }

    if (tips.length === 0) {
      tips.push("Your pricing strategy looks good! Keep monitoring performance.");
    }

    return tips;
  }
}

// Made with Bob
