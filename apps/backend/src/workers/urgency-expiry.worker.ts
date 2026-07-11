import { Worker, Job } from "bullmq";
import { prisma } from "../config/prisma.js";
import { queueConnection } from "../lib/bullmq.js";
import { emitToUser } from "../realtime/socket.js";

/**
 * Urgency Expiry Worker
 * 
 * Processes urgent listings that have expired their pooling window.
 * Changes status from POOLING back to OPEN if no matches were made.
 * 
 * Job Data: { listingId: string }
 */

interface UrgencyExpiryJobData {
  listingId: string;
}

export const urgencyExpiryWorker = new Worker<UrgencyExpiryJobData>(
  "urgency-expiry",
  async (job: Job<UrgencyExpiryJobData>) => {
    const { listingId } = job.data;

    console.log(`[UrgencyExpiry] Processing job for listing ${listingId}`);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        business: true,
        matches: {
          where: {
            status: {
              in: ["PENDING", "ACCEPTED"],
            },
          },
        },
      },
    });

    if (!listing) {
      console.log(`[UrgencyExpiry] Listing ${listingId} not found, skipping`);
      return { success: false, reason: "Listing not found" };
    }

    // Only process if still in POOLING status
    if (listing.status !== "POOLING") {
      console.log(
        `[UrgencyExpiry] Listing ${listingId} status is ${listing.status}, not POOLING. Skipping.`
      );
      return { success: false, reason: `Status is ${listing.status}` };
    }

    // Check if any matches were made
    if (listing.matches.length > 0) {
      console.log(
        `[UrgencyExpiry] Listing ${listingId} has ${listing.matches.length} matches, keeping POOLING status`
      );
      return {
        success: true,
        reason: "Has matches",
        matchCount: listing.matches.length,
      };
    }

    // No matches - revert to OPEN status
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        status: "OPEN",
        isUrgent: false, // Remove urgent flag
      },
    });

    // Notify business
    emitToUser(listing.businessId, "hustl:listing:urgency_expired", {
      listingId,
      title: listing.title,
      message: "Urgent hire window expired with no applicants. Listing is now open for regular applications.",
    });

    console.log(
      `[UrgencyExpiry] Listing ${listingId} reverted to OPEN (no matches during urgent window)`
    );

    return {
      success: true,
      listingId,
      previousStatus: "POOLING",
      newStatus: "OPEN",
    };
  },
  {
    connection: queueConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

// Error handling
urgencyExpiryWorker.on("failed", (job, err) => {
  console.error(`[UrgencyExpiry] Job ${job?.id} failed:`, err.message);
});

urgencyExpiryWorker.on("completed", (job, result) => {
  console.log(`[UrgencyExpiry] Job ${job.id} completed:`, result);
});

console.log("[UrgencyExpiry] Worker started and listening for jobs");
