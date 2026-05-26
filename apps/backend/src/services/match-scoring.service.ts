import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";

interface MatchScoreFactors {
  skillScore: number;
  distanceScore: number;
  reputationScore: number;
  categoryScore: number;
  totalScore: number;
}

export class MatchScoringService {
  /**
   * Calculates the match score between a student and a listing based on multiple factors:
   * - Skill overlap (40%)
   * - Distance (25%)
   * - Category completion rate (20%)
   * - Reputation score (15%)
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

    // 1. Skill Overlap (Weight: 40%)
    const studentSkills = new Set(student.studentProfile.skills.map((s) => s.toLowerCase()));
    const listingSkills = listing.skills.map((s) => s.toLowerCase());

    let matchingSkills = 0;
    for (const skill of listingSkills) {
      if (studentSkills.has(skill)) {
        matchingSkills++;
      }
    }

    const skillScore =
      listingSkills.length > 0 ? (matchingSkills / listingSkills.length) * 40 : 40;

    totalScore += skillScore;

    // 2. Distance (Weight: 25%) - Using PostGIS ST_Distance
    let distanceScore = 0;

    if (studentLat !== undefined && studentLng !== undefined) {
      // Query distance using PostGIS
      const result = await prisma.$queryRaw<Array<{ distance: number }>>`
        SELECT ST_Distance(
          l.coords,
          ST_SetSRID(ST_MakePoint(${studentLng}, ${studentLat}), 4326)::geography
        ) AS distance
        FROM "Listing" l
        WHERE l.id = ${listingId}
      `;

      if (result[0]) {
        const distanceMeters = result[0].distance;
        // Score inversely proportional to distance
        // 0m = 25 points, 5000m = 0 points
        distanceScore = Math.max(0, 25 * (1 - distanceMeters / 5000));
      }
    } else {
      // No coordinates available, give neutral score
      distanceScore = 12.5;
    }

    totalScore += distanceScore;

    // 3. Category Completion Rate (Weight: 20%)
    // Calculate how many gigs in this category the student has completed
    const categoryMatches = await prisma.match.count({
      where: {
        studentId,
        status: "COMPLETED",
        listing: {
          skills: {
            hasSome: listing.skills
          }
        }
      }
    });

    // More completions = higher score (capped at 20)
    const categoryScore = Math.min(20, categoryMatches * 2);
    totalScore += categoryScore;

    // 4. Reputation Score (Weight: 15%)
    // Base is 5.0, scale to 15 points
    const reputationScore = (student.reputationScore / 5.0) * 15;
    totalScore += reputationScore;

    return {
      skillScore,
      distanceScore,
      reputationScore,
      categoryScore,
      totalScore
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
