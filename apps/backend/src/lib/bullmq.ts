import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../config/env.js";

// Dedicated Redis connection for BullMQ with maxRetriesPerRequest: null
export const queueConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

queueConnection.on("error", (error: Error) => {
  console.warn("BullMQ Redis connection issue:", error.message);
});

// Define BullMQ Queues
export const autoCheckoutQueue = new Queue("auto-checkout", { connection: queueConnection });
export const badgeMilestoneQueue = new Queue("badge-milestone-eval", { connection: queueConnection });
export const tdsCalculationQueue = new Queue("tds-calculation", { connection: queueConnection });
export const pairInteractionQueue = new Queue("pair-interaction-update", { connection: queueConnection });

/**
 * Schedule an auto-checkout job for a match
 * @param matchId - The ID of the match
 * @param delayMs - Delay in milliseconds until endTime + 2 hours
 */
export async function scheduleAutoCheckout(matchId: string, delayMs: number) {
  // If a job already exists for this match, it will be replaced or overwritten by setting the same jobId
  await autoCheckoutQueue.add(
    "auto-checkout-job",
    { matchId },
    {
      delay: delayMs,
      jobId: `autocheckout-${matchId}`,
      removeOnComplete: true,
      removeOnFail: true
    }
  );
}

/**
 * Cancel a scheduled auto-checkout job
 * @param matchId - The ID of the match
 */
export async function cancelAutoCheckout(matchId: string) {
  const job = await autoCheckoutQueue.getJob(`autocheckout-${matchId}`);
  if (job) {
    await job.remove();
  }
}
