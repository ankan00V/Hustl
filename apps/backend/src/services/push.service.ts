import { emitToUser, emitUrgentListingNearby } from "../realtime/socket.js";
import { prisma } from "../config/prisma.js";
import { queuePushNotification, queueMulticastPushNotification } from "../jobs/notification.job.js";

interface UrgentListingData {
  id: string;
  title: string;
  description: string;
  businessId: string;
  businessName: string;
  hourlyRate: unknown;
  startTime: Date;
  endTime: Date;
  skills: string[];
  distance?: number;
}

/**
 * Notifies nearby students about an urgent listing
 * Queries students within 5km radius who have opted in for urgent notifications
 */
export async function notifyUrgentListingNearby(listing: UrgentListingData) {
  // Query students within 5km radius with urgent opt-in enabled
  const nearbyStudents = await prisma.$queryRaw<Array<{ userId: string }>>`
    SELECT DISTINCT sp."userId"
    FROM "StudentProfile" sp
    JOIN "User" u ON u.id = sp."userId"
    WHERE sp."urgentOptIn" = true
      AND u."reputationScore" >= 3.5
      AND u."urgentSuspendedUntil" IS NULL OR u."urgentSuspendedUntil" < NOW()
  `;

  const studentIds = nearbyStudents.map((s: any) => s.userId);

  if (studentIds.length > 0) {
    emitUrgentListingNearby(studentIds, {
      listingId: listing.id,
      title: listing.title,
      description: listing.description,
      businessName: listing.businessName,
      hourlyRate: listing.hourlyRate,
      startTime: listing.startTime,
      endTime: listing.endTime,
      skills: listing.skills,
      distance: listing.distance
    });
  }

  // Queue push notifications for nearby students
  if (studentIds.length > 0) {
    await queueMulticastPushNotification(
      studentIds,
      {
        title: "🔥 Urgent Gig Nearby!",
        body: `${listing.businessName} needs help: ${listing.title} - ₹${listing.hourlyRate}/hr`
      },
      {
        type: "urgent_listing",
        listingId: listing.id,
        businessId: listing.businessId
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
        skills: listing.skills
      }
    );
  }
}

/**
 * Notifies business when a student shows interest in their listing
 */
export async function notifyBusinessOfStudentInterest(
  businessId: string,
  payload: {
    matchId: string;
    listingId: string;
    student: {
      id?: string;
      name?: string;
      bio?: string | null;
      skills?: string[];
      portfolioUrls?: string[];
      reputationScore?: number;
    };
  }
) {
  emitToUser(businessId, "hustl:match:new_applicant", payload);

  // Queue push notification
  await queuePushNotification(
    businessId,
    {
      title: "New Applicant! 🎉",
      body: `${payload.student.name} is interested in your listing`
    },
    {
      type: "new_applicant",
      matchId: payload.matchId,
      listingId: payload.listingId,
      studentId: payload.student.id || ""
    },
    "hustl:match:new_applicant",
    payload
  );
}

/**
 * Notifies student about match status changes
 */
export async function notifyMatchStatus(
  studentId: string,
  payload: {
    matchId: string;
    status: string;
  }
) {
  emitToUser(studentId, "hustl:match:status_changed", payload);

  // Queue push notification based on status
  let title = "Match Update";
  let body = `Your match status changed to ${payload.status}`;

  if (payload.status === "ACCEPTED") {
    title = "Match Accepted! ✅";
    body = "Your application was accepted! Get ready for your shift.";
  } else if (payload.status === "COMPLETED") {
    title = "Shift Completed! 🎉";
    body = "Great job! Your earnings have been added to your wallet.";
  } else if (payload.status === "CANCELLED") {
    title = "Match Cancelled";
    body = "This match has been cancelled.";
  }

  await queuePushNotification(
    studentId,
    { title, body },
    {
      type: "match_status",
      matchId: payload.matchId,
      status: payload.status
    },
    "hustl:match:status_changed",
    payload
  );
}

/**
 * Notifies both parties about check-in confirmation
 */
export async function notifyCheckIn(matchId: string, studentId: string, businessId: string) {
  const payload = { matchId, status: "CHECKED_IN" };
  emitToUser(studentId, "hustl:checkin:confirmed", payload);
  emitToUser(businessId, "hustl:checkin:confirmed", payload);

  // Queue push notifications
  await Promise.all([
    queuePushNotification(
      studentId,
      {
        title: "Check-in Confirmed ✅",
        body: "You're checked in! Have a great shift."
      },
      {
        type: "checkin",
        matchId
      },
      "hustl:checkin:confirmed",
      payload
    ),
    queuePushNotification(
      businessId,
      {
        title: "Student Checked In ✅",
        body: "Your student has arrived and checked in."
      },
      {
        type: "checkin",
        matchId
      },
      "hustl:checkin:confirmed",
      payload
    )
  ]);
}

/**
 * Notifies both parties about checkout confirmation
 */
export async function notifyCheckOut(matchId: string, studentId: string, businessId: string) {
  const payload = { matchId, status: "COMPLETED" };
  emitToUser(studentId, "hustl:checkout:confirmed", payload);
  emitToUser(businessId, "hustl:checkout:confirmed", payload);

  // Queue push notifications
  await Promise.all([
    queuePushNotification(
      studentId,
      {
        title: "Shift Complete! 🎉",
        body: "Great work! Your earnings have been added to your wallet."
      },
      {
        type: "checkout",
        matchId
      },
      "hustl:checkout:confirmed",
      payload
    ),
    queuePushNotification(
      businessId,
      {
        title: "Shift Complete ✅",
        body: "The shift has been completed successfully."
      },
      {
        type: "checkout",
        matchId
      },
      "hustl:checkout:confirmed",
      payload
    )
  ]);
}

/**
 * Notifies student about badge unlock
 */
export async function notifyBadgeUnlock(
  studentId: string,
  payload: {
    badgeName: string;
    category: string;
    matchId: string;
  }
) {
  emitToUser(studentId, "hustl:badge:unlocked", payload);

  // Queue push notification
  await queuePushNotification(
    studentId,
    {
      title: "🏆 Badge Unlocked!",
      body: `You earned the ${payload.badgeName} badge in ${payload.category}!`
    },
    {
      type: "badge_unlock",
      badgeName: payload.badgeName,
      category: payload.category,
      matchId: payload.matchId
    },
    "hustl:badge:unlocked",
    payload
  );
}

/**
 * Notifies both parties to leave a review
 */
export async function notifyReviewPrompt(
  userId: string,
  payload: {
    matchId: string;
    otherPartyName: string;
  }
) {
  await queuePushNotification(
    userId,
    {
      title: "Leave a Review ⭐",
      body: `How was your experience with ${payload.otherPartyName}?`
    },
    {
      type: "review_prompt",
      matchId: payload.matchId
    }
  );
}

/**
 * Notifies user about new chat message (when app is backgrounded)
 */
export async function notifyChatMessage(
  userId: string,
  payload: {
    matchId: string;
    senderName: string;
    message: string;
  }
) {
  await queuePushNotification(
    userId,
    {
      title: payload.senderName,
      body: payload.message
    },
    {
      type: "chat_message",
      matchId: payload.matchId
    }
  );
}
