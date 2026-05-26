import { emitToUser, emitUrgentListingNearby } from "../realtime/socket.js";
import { prisma } from "../config/prisma.js";

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

  const studentIds = nearbyStudents.map((s) => s.userId);

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
}

/**
 * Notifies both parties about check-in confirmation
 */
export async function notifyCheckIn(matchId: string, studentId: string, businessId: string) {
  const payload = { matchId, status: "CHECKED_IN" };
  emitToUser(studentId, "hustl:checkin:confirmed", payload);
  emitToUser(businessId, "hustl:checkin:confirmed", payload);
}

/**
 * Notifies both parties about checkout confirmation
 */
export async function notifyCheckOut(matchId: string, studentId: string, businessId: string) {
  const payload = { matchId, status: "COMPLETED" };
  emitToUser(studentId, "hustl:checkout:confirmed", payload);
  emitToUser(businessId, "hustl:checkout:confirmed", payload);
}
