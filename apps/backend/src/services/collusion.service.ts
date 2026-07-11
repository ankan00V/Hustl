import { redis } from "../config/redis.js";
import { prisma } from "../config/prisma.js";

/**
 * Collusion Detection Service
 * 
 * Tracks student-business pair interactions to detect suspicious patterns.
 * Flags accounts if they have >5 matches in 30 days (potential collusion).
 */

const COLLUSION_THRESHOLD = 5; // matches
const COLLUSION_WINDOW_DAYS = 30;

/**
 * Update pair interaction counter
 * Called when a match is completed
 */
export async function updatePairInteraction(params: {
  studentId: string;
  businessId: string;
  matchId: string;
}) {
  const { studentId, businessId, matchId } = params;

  const pairKey = `hustl:pair:${studentId}:${businessId}`;
  const ttl = COLLUSION_WINDOW_DAYS * 24 * 60 * 60; // 30 days in seconds

  // Increment counter
  const count = await redis.incr(pairKey);

  // Set TTL on first interaction
  if (count === 1) {
    await redis.expire(pairKey, ttl);
  }

  console.log(
    `[CollusionDetection] Pair ${studentId}-${businessId} now has ${count} interactions in ${COLLUSION_WINDOW_DAYS} days`
  );

  // Check if threshold exceeded
  if (count > COLLUSION_THRESHOLD) {
    await flagCollusionSuspicion({
      studentId,
      businessId,
      interactionCount: count,
      matchId,
    });
  }

  return { count, threshold: COLLUSION_THRESHOLD };
}

/**
 * Flag accounts for potential collusion
 */
async function flagCollusionSuspicion(params: {
  studentId: string;
  businessId: string;
  interactionCount: number;
  matchId: string;
}) {
  const { studentId, businessId, interactionCount, matchId } = params;

  console.warn(
    `[CollusionDetection] ALERT: Pair ${studentId}-${businessId} has ${interactionCount} interactions (threshold: ${COLLUSION_THRESHOLD})`
  );

  // Flag both accounts in Redis
  await redis.set(`hustl:flagged:collusion:${studentId}`, "true", "EX", 30 * 24 * 60 * 60);
  await redis.set(`hustl:flagged:collusion:${businessId}`, "true", "EX", 30 * 24 * 60 * 60);

  // Log to audit trail
  await redis.lpush(
    "hustl:auditlogs",
    JSON.stringify({
      type: "COLLUSION_SUSPICION",
      studentId,
      businessId,
      interactionCount,
      matchId,
      threshold: COLLUSION_THRESHOLD,
      timestamp: new Date().toISOString(),
    })
  );

  // Create reputation events for both parties
  await prisma.reputationEvent.create({
    data: {
      userId: studentId,
      type: "ADMIN_ADJUSTMENT",
      delta: -1.0,
      reason: `Potential collusion detected: ${interactionCount} matches with same business in ${COLLUSION_WINDOW_DAYS} days`,
      matchId,
    },
  });

  await prisma.reputationEvent.create({
    data: {
      userId: businessId,
      type: "ADMIN_ADJUSTMENT",
      delta: -1.0,
      reason: `Potential collusion detected: ${interactionCount} matches with same student in ${COLLUSION_WINDOW_DAYS} days`,
      matchId,
    },
  });

  // Update reputation scores
  await prisma.user.update({
    where: { id: studentId },
    data: {
      reputationScore: {
        decrement: 1.0,
      },
    },
  });

  await prisma.user.update({
    where: { id: businessId },
    data: {
      reputationScore: {
        decrement: 1.0,
      },
    },
  });
}

/**
 * Get pair interaction count
 */
export async function getPairInteractionCount(
  studentId: string,
  businessId: string
): Promise<number> {
  const pairKey = `hustl:pair:${studentId}:${businessId}`;
  const count = await redis.get(pairKey);
  return count ? parseInt(count, 10) : 0;
}

/**
 * Check if account is flagged for collusion
 */
export async function isCollusionFlagged(userId: string): Promise<boolean> {
  const flagKey = `hustl:flagged:collusion:${userId}`;
  const flagged = await redis.get(flagKey);
  return flagged === "true";
}

/**
 * Clear collusion flag (admin action)
 */
export async function clearCollusionFlag(userId: string) {
  const flagKey = `hustl:flagged:collusion:${userId}`;
  await redis.del(flagKey);
  
  console.log(`[CollusionDetection] Cleared collusion flag for user ${userId}`);
}

/**
 * Get all flagged pairs (for admin review)
 */
export async function getFlaggedPairs(): Promise<
  Array<{ studentId: string; businessId: string; count: number }>
> {
  const keys = await redis.keys("hustl:pair:*");
  const flaggedPairs: Array<{ studentId: string; businessId: string; count: number }> = [];

  for (const key of keys) {
    const count = await redis.get(key);
    if (count && parseInt(count, 10) > COLLUSION_THRESHOLD) {
      // Parse key: hustl:pair:studentId:businessId
      const parts = key.split(":");
      if (parts.length === 4 && parts[2] && parts[3]) {
        flaggedPairs.push({
          studentId: parts[2],
          businessId: parts[3],
          count: parseInt(count, 10),
        });
      }
    }
  }

  return flaggedPairs;
}
