import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface MatchScoreFactors {
  aiSemanticScore: number;
  skillScore: number;
  distanceScore: number;
  reputationScore: number;
  reliabilityScore: number;
  categoryScore: number;
  timePreferenceScore: number;
  urgencyBonus: number;
  badgeBonus: number;
  activityBonus: number;
  totalScore: number;
  breakdown: {
    aiSemantic: { score: number; cached: boolean };
    skills: { matched: number; total: number; percentage: number };
    distance: { meters: number; score: number };
    reputation: { score: number; normalized: number };
    reliability: { noShows: number; score: number; penaltyApplied: boolean };
    category: { completedInCategory: number; score: number };
    timePreference: { matchesPreference: boolean; score: number };
    urgency: { isUrgent: boolean; bonus: number };
    badges: { count: number; bonus: number };
    activity: { recentGigs: number; bonus: number };
  };
}

export class MatchScoringService {
  /**
   * Retrieves or computes an AI semantic match score using Gemini.
   */
  private static async getAiSemanticScore(
    studentId: string,
    listingId: string,
    studentBio: string,
    listingDesc: string
  ): Promise<{ score: number; cached: boolean }> {
    const cacheKey = `hustl:ai_match:${studentId}:${listingId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return { score: parseInt(cached, 10), cached: true };
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        return { score: 10, cached: false }; // Fallback
      }

      const prompt = `
        Evaluate the fit between a student and a gig.
        Return ONLY a number between 1 and 20 representing how well they match.
        
        Student Bio: ${studentBio || "No bio provided"}
        Gig Description: ${listingDesc || "No description provided"}
        
        Score (1-20):`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || "10";
      const score = Math.max(1, Math.min(20, parseInt(text.trim(), 10) || 10));

      await redis.set(cacheKey, score, "EX", 86400 * 7); // Cache for 7 days
      return { score, cached: false };
    } catch (e) {
      console.error("AI Scoring Error:", e);
      return { score: 10, cached: false }; // Default fallback on error
    }
  }

  /**
   * Enhanced AI-Powered Match Scoring Algorithm
   *
   * Calculates match score with weighted factors (100 base points):
   * - AI Semantic Match (20%)
   * - Skill overlap (20%)
   * - Distance (15%)
   * - Reputation (15%)
   * - Reliability/No-Shows (10%)
   * - Category experience (10%)
   * - Time preference (10%)
   *
   * Bonus factors:
   * - Urgency bonus (+15)
   * - Badge bonus (+5)
   * - Activity bonus (+5)
   */
  static async calculateScore(
    studentId: string,
    listingId: string,
    studentLat?: number,
    studentLng?: number
  ): Promise<MatchScoreFactors> {
    const [student, listing] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        include: {
          studentProfile: true,
          badges: true
        }
      }),
      prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          business: {
            include: {
              user: true
            }
          }
        }
      })
    ]);

    if (!student?.studentProfile || !listing) {
      throw new Error("Student or Listing not found");
    }

    let totalScore = 0;

    // 1. AI Semantic Match (Weight: 20%)
    const { score: aiSemanticScore, cached: aiCached } = await this.getAiSemanticScore(
      studentId,
      listingId,
      student.bio || "",
      listing.description
    );
    totalScore += aiSemanticScore;

    // 2. Skill Overlap (Weight: 20%)
    const studentSkills = new Set(student.studentProfile.skills.map((s) => s.toLowerCase()));
    const listingSkills = listing.skills.map((s) => s.toLowerCase());
    let matchingSkills = 0;
    let partialMatches = 0;

    for (const listingSkill of listingSkills) {
      if (studentSkills.has(listingSkill)) {
        matchingSkills++;
      } else {
        for (const studentSkill of studentSkills) {
          if (listingSkill.includes(studentSkill) || studentSkill.includes(listingSkill)) {
            partialMatches += 0.5;
            break;
          }
        }
      }
    }
    const totalSkillMatches = matchingSkills + partialMatches;
    const skillPercentage = listingSkills.length > 0 ? totalSkillMatches / listingSkills.length : 1;
    const skillScore = skillPercentage * 20; // Changed to 20%
    totalScore += skillScore;

    // 3. Distance (Weight: 15%)
    let distanceScore = 0;
    let distanceMeters = 0;
    if (studentLat !== undefined && studentLng !== undefined) {
      const result = await prisma.$queryRaw<Array<{ distance: number }>>`
        SELECT ST_Distance(
          l.coords,
          ST_SetSRID(ST_MakePoint(${studentLng}, ${studentLat}), 4326)::geography
        ) AS distance
        FROM "Listing" l
        WHERE l.id = ${listingId}
      `;
      if (result[0]) {
        distanceMeters = result[0].distance;
        if (distanceMeters <= 1000) distanceScore = 15;
        else if (distanceMeters <= 3000) distanceScore = 15 - ((distanceMeters - 1000) / 2000) * 7.5;
        else if (distanceMeters <= 5000) distanceScore = 7.5 - ((distanceMeters - 3000) / 2000) * 7.5;
      }
    } else {
      distanceScore = 7.5;
    }
    totalScore += distanceScore;

    // 4. Reputation Score (Weight: 15%)
    const reputationScore = (student.reputationScore / 5.0) * 15;
    totalScore += reputationScore;

    // 5. Reliability & No-Show Rate (Weight: 10%)
    const noShowCount = await prisma.match.count({
      where: { studentId, status: "NO_SHOW" }
    });
    const completedCount = await prisma.match.count({
      where: { studentId, status: "COMPLETED" }
    });
    
    let reliabilityScore = 10;
    let penaltyApplied = false;
    if (noShowCount > 0) {
      const totalDecided = completedCount + noShowCount;
      const noShowRate = noShowCount / totalDecided;
      reliabilityScore = Math.max(0, 10 - (noShowRate * 20)); // Scales down fast
      
      // Heavy penalty for severe unreliability (e.g. > 20% no-shows)
      if (noShowRate > 0.2) {
        reliabilityScore = -50; 
        penaltyApplied = true;
      }
    }
    totalScore += reliabilityScore;

    // 6. Category Experience (Weight: 10%)
    const categoryMatches = await prisma.match.count({
      where: {
        studentId,
        status: "COMPLETED",
        listing: { skills: { hasSome: listing.skills } }
      }
    });
    const categoryScore = Math.min(10, Math.log(categoryMatches + 1) * 3.33);
    totalScore += categoryScore;

    // 7. Time Preference Score (Weight: 10%)
    let timePreferenceScore = 5;
    const listingStartHour = new Date(listing.startTime).getHours();
    if (student.studentProfile.availabilitySlots && student.studentProfile.availabilitySlots.length > 0) {
      const slots = student.studentProfile.availabilitySlots;
      const matchesPreference =
        (slots.includes("MORNING") && listingStartHour >= 6 && listingStartHour < 12) ||
        (slots.includes("AFTERNOON") && listingStartHour >= 12 && listingStartHour < 18) ||
        (slots.includes("EVENING") && listingStartHour >= 18 && listingStartHour < 24) ||
        (slots.includes("NIGHT") && (listingStartHour >= 0 && listingStartHour < 6));
      
      timePreferenceScore = matchesPreference ? 10 : 2;
    }
    totalScore += timePreferenceScore;

    // 8. Urgency Bonus (+15 points)
    const urgencyBonus = listing.isUrgent ? 15 : 0;
    totalScore += urgencyBonus;

    // 9. Badge Bonus (+5 points)
    const verifiedBadges = student.badges.filter(
      (b) => b.category === "VERIFICATION" || b.category === "ACHIEVEMENT"
    );
    const badgeBonus = Math.min(5, verifiedBadges.length * 1);
    totalScore += badgeBonus;

    // 10. Activity / Freshness Bonus (+5 points)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = await prisma.match.count({
      where: {
        studentId,
        createdAt: { gte: sevenDaysAgo }
      }
    });
    const activityBonus = recentActivity > 0 ? 5 : 0;
    totalScore += activityBonus;

    return {
      aiSemanticScore,
      skillScore,
      distanceScore,
      reputationScore,
      reliabilityScore,
      categoryScore,
      timePreferenceScore,
      urgencyBonus,
      badgeBonus,
      activityBonus,
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        aiSemantic: { score: aiSemanticScore, cached: aiCached },
        skills: { matched: matchingSkills, total: listingSkills.length, percentage: Math.round(skillPercentage * 100) },
        distance: { meters: Math.round(distanceMeters), score: Math.round(distanceScore * 100) / 100 },
        reputation: { score: student.reputationScore, normalized: Math.round(reputationScore * 100) / 100 },
        reliability: { noShows: noShowCount, score: Math.round(reliabilityScore * 100) / 100, penaltyApplied },
        category: { completedInCategory: categoryMatches, score: Math.round(categoryScore * 100) / 100 },
        timePreference: { matchesPreference: timePreferenceScore === 10, score: timePreferenceScore },
        urgency: { isUrgent: listing.isUrgent, bonus: urgencyBonus },
        badges: { count: verifiedBadges.length, bonus: badgeBonus },
        activity: { recentGigs: recentActivity, bonus: activityBonus }
      }
    };
  }

  /**
   * Recomputes the deck for a student in a specific city
   * Stores results in Redis sorted set with TTL
   */
  static async recomputeDeck(studentId: string, citySlug: string, lat: number, lng: number): Promise<void> {
    // Get all OPEN listings in the city
    const listings = await prisma.listing.findMany({
      where: {
        status: "OPEN",
        citySlug
      },
      select: {
        id: true
      }
    });

    // Calculate scores for each listing
    const scores: Array<{ listingId: string; score: number }> = [];

    for (const listing of listings) {
      const { totalScore } = await this.calculateScore(studentId, listing.id, lat, lng);
      scores.push({ listingId: listing.id, score: totalScore });
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Store in Redis sorted set
    const key = `hustl:deck:${studentId}:${citySlug}`;
    const pipeline = redis.pipeline();

    // Clear existing deck
    pipeline.del(key);

    // Add listings with scores
    for (const { listingId, score } of scores) {
      pipeline.zadd(key, score, listingId);
    }

    // Set TTL to 5 minutes
    pipeline.expire(key, 300);

    await pipeline.exec();
  }

  /**
   * Gets the top N listings from a student's deck
   */
  static async getDeck(studentId: string, citySlug: string, limit = 20): Promise<string[]> {
    const key = `hustl:deck:${studentId}:${citySlug}`;

    // Get top listings by score (descending)
    const listingIds = await redis.zrevrange(key, 0, limit - 1);

    return listingIds;
  }

  /**
   * Removes a listing from all student decks (when listing is closed/matched)
   */
  static async removeListingFromDecks(listingId: string): Promise<void> {
    // Get all deck keys
    const keys = await redis.keys("hustl:deck:*");

    if (keys.length === 0) return;

    const pipeline = redis.pipeline();

    for (const key of keys) {
      pipeline.zrem(key, listingId);
    }

    await pipeline.exec();
  }
}
