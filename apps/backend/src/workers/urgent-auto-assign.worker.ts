import { Worker, Job } from "bullmq";
import { prisma } from "../config/prisma.js";
import { queueConnection } from "../lib/bullmq.js";
import { getTopUrgentCandidates, clearUrgentPool } from "../services/urgent.service.js";
import { emitToUser } from "../realtime/socket.js";
import { queuePushNotification } from "../jobs/notification.job.js";

/**
 * Urgent Auto-Assign Worker
 * 
 * Runs after urgent pooling window expires.
 * Auto-assigns the listing to the top-scored candidate from the pool.
 * 
 * Job Data: { listingId: string }
 */

interface UrgentAutoAssignJobData {
  listingId: string;
}

export const urgentAutoAssignWorker = new Worker<UrgentAutoAssignJobData>(
  "urgent-auto-assign",
  async (job: Job<UrgentAutoAssignJobData>) => {
    const { listingId } = job.data;

    console.log(`[UrgentAutoAssign] Processing job for listing ${listingId}`);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        business: true,
        matches: {
          where: {
            status: {
              in: ["PENDING", "APPLIED"],
            },
          },
        },
      },
    });

    if (!listing) {
      console.log(`[UrgentAutoAssign] Listing ${listingId} not found, skipping`);
      return { success: false, reason: "Listing not found" };
    }

    // Only process if still in POOLING status
    if (listing.status !== "POOLING") {
      console.log(
        `[UrgentAutoAssign] Listing ${listingId} status is ${listing.status}, not POOLING. Skipping.`
      );
      return { success: false, reason: `Status is ${listing.status}` };
    }

    // Get top candidates from Redis pool
    const candidates = await getTopUrgentCandidates(listingId, 10);

    if (candidates.length === 0) {
      console.log(`[UrgentAutoAssign] No candidates in pool for listing ${listingId}`);
      
      // Revert to OPEN status
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: "OPEN",
          isUrgent: false,
        },
      });

      // Notify business
      emitToUser(listing.businessId, "hustl:listing:urgency_expired", {
        listingId,
        title: listing.title,
        message: "No applicants during urgent window. Listing is now open for regular applications.",
      });

      // Clear pool
      await clearUrgentPool(listingId);

      return {
        success: true,
        reason: "No candidates",
        action: "reverted_to_open",
      };
    }

    // Find first candidate who hasn't already applied
    let selectedCandidate = null;
    for (const candidate of candidates) {
      const existingMatch = listing.matches.find(
        (m) => m.studentId === candidate.studentId
      );
      if (!existingMatch) {
        selectedCandidate = candidate;
        break;
      }
    }

    if (!selectedCandidate) {
      console.log(
        `[UrgentAutoAssign] All candidates already applied for listing ${listingId}`
      );
      return {
        success: true,
        reason: "All candidates already applied",
        candidateCount: candidates.length,
      };
    }

    // Get student details
    const student = await prisma.user.findUnique({
      where: { id: selectedCandidate.studentId },
      include: {
        studentProfile: true,
      },
    });

    if (!student) {
      console.log(
        `[UrgentAutoAssign] Student ${selectedCandidate.studentId} not found`
      );
      return { success: false, reason: "Student not found" };
    }

    // Create match and update listing status
    const match = await prisma.$transaction(async (tx) => {
      // Create match
      const newMatch = await tx.match.create({
        data: {
          listingId,
          studentId: selectedCandidate.studentId,
          status: "PENDING",
          appliedAt: new Date(),
        },
      });

      // Update listing status to MATCHED
      await tx.listing.update({
        where: { id: listingId },
        data: {
          status: "MATCHED",
        },
      });

      return newMatch;
    });

    // Clear urgent pool
    await clearUrgentPool(listingId);

    // Notify student
    emitToUser(selectedCandidate.studentId, "hustl:match:urgent_assigned", {
      matchId: match.id,
      listingId,
      title: listing.title,
      businessName: listing.business.businessName,
    });

    await queuePushNotification(
      selectedCandidate.studentId,
      {
        title: "🎯 Urgent Gig Assigned!",
        body: `You've been auto-matched with ${listing.business.businessName} for ${listing.title}`,
      },
      {
        type: "urgent_assigned",
        matchId: match.id,
        listingId,
      }
    );

    // Notify business
    emitToUser(listing.businessId, "hustl:match:urgent_assigned", {
      matchId: match.id,
      listingId,
      studentId: selectedCandidate.studentId,
      studentName: student.name,
    });

    await queuePushNotification(
      listing.businessId,
      {
        title: "✅ Urgent Hire Matched!",
        body: `${student.name} has been auto-assigned to ${listing.title}`,
      },
      {
        type: "urgent_assigned",
        matchId: match.id,
        listingId,
      }
    );

    console.log(
      `[UrgentAutoAssign] Successfully assigned listing ${listingId} to student ${selectedCandidate.studentId} (score: ${selectedCandidate.score.toFixed(3)})`
    );

    return {
      success: true,
      matchId: match.id,
      studentId: selectedCandidate.studentId,
      studentName: student.name,
      score: selectedCandidate.score,
      candidateCount: candidates.length,
    };
  },
  {
    connection: queueConnection,
    concurrency: 3,
    limiter: {
      max: 5,
      duration: 1000,
    },
  }
);

// Error handling
urgentAutoAssignWorker.on("failed", (job, err) => {
  console.error(`[UrgentAutoAssign] Job ${job?.id} failed:`, err.message);
});

urgentAutoAssignWorker.on("completed", (job, result) => {
  console.log(`[UrgentAutoAssign] Job ${job.id} completed:`, result);
});

console.log("[UrgentAutoAssign] Worker started and listening for jobs");
