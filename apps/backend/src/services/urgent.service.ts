import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";
import { emitUrgentListingNearby } from "../realtime/socket.js";
import { queueMulticastPushNotification } from "../jobs/notification.job.js";

/**
 * Urgent Listing Service
 * Handles urgent listing broadcasts and applicant pool management
 */

interface UrgentListingData {
  id: string;
  title: string;
  description: string;
  businessId: string;
  businessName: string;
  hourlyRate: number;
  startTime: Date;
  endTime: Date;
  skills: string[];
  coords?: { lat: number; lng: number };
}

/**
 * Broadcast urgent listing to nearby students
 * Queries students within 5km radius who have opted in for urgent notifications
 */
export async function broadcastUrgentListing(listing: UrgentListingData) {
  console.log(`[UrgentBroadcast] Broadcasting listing ${listing.id}`);

  // Query students within 5km radius with urgent opt-in enabled
  // Using raw SQL for PostGIS distance calculation
  const nearbyStudents = await prisma.$queryRaw<Array<{ userId: string; distance: number }>>`
    SELECT 
      sp."userId",
      ST_Distance(
        bp.coords,
        sp_coords.coords
      ) as distance
    FROM "StudentProfile" sp
    JOIN "User" u ON u.id = sp."userId"
    LEFT JOIN "BusinessProfile" bp ON bp."userId" = ${listing.businessId}
    LEFT JOIN (
      SELECT sp2."userId", bp2.coords
      FROM "StudentProfile" sp2
      CROSS JOIN "BusinessProfile" bp2
      WHERE bp2."userId" = ${listing.businessId}
    ) sp_coords ON sp_coords."userId" = sp."userId"
    WHERE sp."urgentOptIn" = true
      AND u."reputationScore" >= 3.5
      AND (u."urgentSuspendedUntil" IS NULL OR u."urgentSuspendedUntil" < NOW())
      AND ST_DWithin(bp.coords, sp_coords.coords, 5000)
    ORDER BY distance ASC
    LIMIT 100
  `;

  const studentIds = nearbyStudents.map((s) => s.userId);

  if (studentIds.length === 0) {
    console.log(`[UrgentBroadcast] No nearby students found for listing ${listing.id}`);
    return { studentCount: 0 };
  }

  // Emit Socket.io event to nearby students
  emitUrgentListingNearby(studentIds, {
    listingId: listing.id,
    title: listing.title,
    description: listing.description,
    businessName: listing.businessName,
    hourlyRate: listing.hourlyRate,
    startTime: listing.startTime,
    endTime: listing.endTime,
    skills: listing.skills,
  });

  // Queue push notifications
  await queueMulticastPushNotification(
    studentIds,
    {
      title: "🔥 Urgent Gig Nearby!",
      body: `${listing.businessName} needs help: ${listing.title} - ₹${listing.hourlyRate}/hr`,
    },
    {
      type: "urgent_listing",
      listingId: listing.id,
      businessId: listing.businessId,
    },
    "hustl:listing:urgent",
    {
      listingId: listing.id,
      title: listing.title,
      description: listing.description,
      businessName: listing.businessName,
      hourlyRate: listing.hourlyRate,
      startTime: listing.startTime,
      endTime: listing.endTime,
      skills: listing.skills,
    }
  );

  console.log(`[UrgentBroadcast] Notified ${studentIds.length} students for listing ${listing.id}`);

  return {
    studentCount: studentIds.length,
    students: nearbyStudents.map((s) => ({
      userId: s.userId,
      distance: Math.round(s.distance),
    })),
  };
}

/**
 * Add student to urgent applicant pool (Redis sorted set)
 * Score = (distance * 0.3) + ((5 - reputation) * 0.7)
 * Lower score = better candidate
 */
export async function addToUrgentPool(params: {
  listingId: string;
  studentId: string;
  distance: number;
  reputation: number;
}) {
  const { listingId, studentId, distance, reputation } = params;

  // Calculate score (lower is better)
  // Distance weight: 30%, Reputation weight: 70%
  const distanceScore = (distance / 5000) * 0.3; // Normalize to 0-0.3
  const reputationScore = ((5 - reputation) / 5) * 0.7; // Normalize to 0-0.7
  const totalScore = distanceScore + reputationScore;

  const poolKey = `hustl:urgent:pool:${listingId}`;

  // Add to sorted set with score
  await redis.zadd(poolKey, totalScore, studentId);

  // Set TTL to 2 hours (urgent window)
  await redis.expire(poolKey, 2 * 60 * 60);

  console.log(
    `[UrgentPool] Added student ${studentId} to pool ${listingId} with score ${totalScore.toFixed(3)}`
  );

  return { score: totalScore, poolKey };
}

/**
 * Get top candidates from urgent applicant pool
 */
export async function getTopUrgentCandidates(listingId: string, limit = 10) {
  const poolKey = `hustl:urgent:pool:${listingId}`;

  // Get top candidates (lowest scores first)
  const candidates = await redis.zrange(poolKey, 0, limit - 1, "WITHSCORES");

  // Parse results (Redis returns [member1, score1, member2, score2, ...])
  const results: Array<{ studentId: string; score: number }> = [];
  for (let i = 0; i < candidates.length; i += 2) {
    const studentId = candidates[i];
    const scoreStr = candidates[i + 1];
    if (studentId && scoreStr) {
      results.push({
        studentId,
        score: parseFloat(scoreStr),
      });
    }
  }

  return results;
}

/**
 * Remove student from urgent pool (after they apply or listing is filled)
 */
export async function removeFromUrgentPool(listingId: string, studentId: string) {
  const poolKey = `hustl:urgent:pool:${listingId}`;
  await redis.zrem(poolKey, studentId);
}

/**
 * Clear entire urgent pool (when listing is filled or cancelled)
 */
export async function clearUrgentPool(listingId: string) {
  const poolKey = `hustl:urgent:pool:${listingId}`;
  await redis.del(poolKey);
}

/**
 * Get pool size
 */
export async function getUrgentPoolSize(listingId: string): Promise<number> {
  const poolKey = `hustl:urgent:pool:${listingId}`;
  return await redis.zcard(poolKey);
}
