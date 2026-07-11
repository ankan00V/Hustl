import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";
import { AppError } from "../utils/app-error.js";
import { queuePushNotification } from "../jobs/notification.job.js";

interface InstantBookingRequest {
  listingId: string;
  studentId: string;
}

interface InstantBookingResult {
  matchId: string;
  listing: {
    id: string;
    title: string;
    businessName: string;
    startTime: Date;
    hourlyRate: number;
  };
  autoAccepted: boolean;
  estimatedEarnings: number;
}

/**
 * Instant Booking Service for Urgent Shifts
 * Allows students to instantly book urgent shifts without waiting for business approval
 */
export class InstantBookingService {
  /**
   * Instantly book an urgent shift
   */
  static async instantBook(request: InstantBookingRequest): Promise<InstantBookingResult> {
    const { listingId, studentId } = request;

    // Validate listing is urgent and available
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        business: {
          select: {
            businessName: true,
            userId: true,
          },
        },
      },
    });

    if (!listing) {
      throw new AppError(404, "Listing not found", "LISTING_NOT_FOUND");
    }

    if (!listing.isUrgent) {
      throw new AppError(400, "Only urgent shifts can be instantly booked", "NOT_URGENT");
    }

    if (listing.status !== "OPEN") {
      throw new AppError(400, "Listing is no longer available", "LISTING_UNAVAILABLE");
    }

    // Check if shift starts within next 4 hours
    const now = new Date();
    const hoursUntilStart = (listing.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart > 4) {
      throw new AppError(
        400,
        "Instant booking only available for shifts starting within 4 hours",
        "TOO_FAR_IN_FUTURE"
      );
    }

    if (hoursUntilStart < 0) {
      throw new AppError(400, "Shift has already started", "SHIFT_STARTED");
    }

    // Validate student eligibility
    await this.validateStudentEligibility(studentId, listing);

    // Check for existing match
    const existingMatch = await prisma.match.findUnique({
      where: {
        listingId_studentId: {
          listingId,
          studentId,
        },
      },
    });

    if (existingMatch) {
      throw new AppError(400, "You have already applied to this shift", "ALREADY_APPLIED");
    }

    // Create instant match with auto-acceptance
    const match = await prisma.$transaction(async (tx) => {
      // Create match with ACCEPTED status
      const newMatch = await tx.match.create({
        data: {
          listingId,
          studentId,
          status: "ACCEPTED",
          appliedAt: new Date(),
          acceptedAt: new Date(),
        },
      });

      // Update listing status to MATCHED
      await tx.listing.update({
        where: { id: listingId },
        data: { status: "MATCHED" },
      });

      return newMatch;
    });

    // Calculate estimated earnings
    const estimatedEarnings = Number(listing.hourlyRate) * listing.totalHours;

    // Send notifications
    await this.sendNotifications(match.id, studentId, listing.business.userId, {
      listingTitle: listing.title,
      businessName: listing.business.businessName,
      startTime: listing.startTime,
      hourlyRate: Number(listing.hourlyRate),
    });

    // Invalidate caches
    await Promise.all([
      redis.del(`listing:${listingId}`),
      redis.del(`student:${studentId}:matches`),
      redis.del(`business:${listing.business.userId}:matches`),
    ]);

    return {
      matchId: match.id,
      listing: {
        id: listing.id,
        title: listing.title,
        businessName: listing.business.businessName,
        startTime: listing.startTime,
        hourlyRate: Number(listing.hourlyRate),
      },
      autoAccepted: true,
      estimatedEarnings,
    };
  }

  /**
   * Validate student eligibility for instant booking
   */
  private static async validateStudentEligibility(
    studentId: string,
    listing: any
  ): Promise<void> {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true,
      },
    });

    if (!student || !student.studentProfile) {
      throw new AppError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }

    // Check reputation score (must be >= 4.0 for instant booking)
    if (student.reputationScore < 4.0) {
      throw new AppError(
        403,
        "Instant booking requires a reputation score of 4.0 or higher",
        "LOW_REPUTATION"
      );
    }

    // Check if student is suspended from urgent shifts
    if (student.urgentSuspendedUntil && student.urgentSuspendedUntil > new Date()) {
      throw new AppError(
        403,
        "You are temporarily suspended from urgent shifts",
        "URGENT_SUSPENDED"
      );
    }

    // Check if student has opted in for urgent notifications
    if (!student.studentProfile.urgentOptIn) {
      throw new AppError(
        403,
        "You must opt-in for urgent notifications to use instant booking",
        "URGENT_OPT_IN_REQUIRED"
      );
    }

    // Check for verified badge requirement
    if (listing.verifiedBadgeOnly && !student.isVerified) {
      throw new AppError(
        403,
        "This shift requires a verified badge",
        "VERIFICATION_REQUIRED"
      );
    }

    // Check for skill match (at least one skill must match)
    const studentSkills = student.studentProfile.skills.map((s) => s.toLowerCase());
    const listingSkills = listing.skills.map((s: string) => s.toLowerCase());
    const hasSkillMatch = listingSkills.some((skill: string) =>
      studentSkills.includes(skill)
    );

    if (!hasSkillMatch) {
      throw new AppError(
        403,
        "You don't have the required skills for this shift",
        "SKILL_MISMATCH"
      );
    }

    // Check for concurrent bookings (can't have overlapping shifts)
    const overlappingMatches = await prisma.match.findMany({
      where: {
        studentId,
        status: {
          in: ["ACCEPTED", "CHECKED_IN"],
        },
        listing: {
          OR: [
            {
              AND: [
                { startTime: { lte: listing.startTime } },
                { endTime: { gt: listing.startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: listing.endTime } },
                { endTime: { gte: listing.endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: listing.startTime } },
                { endTime: { lte: listing.endTime } },
              ],
            },
          ],
        },
      },
    });

    if (overlappingMatches.length > 0) {
      throw new AppError(
        409,
        "You have an overlapping shift at this time",
        "SCHEDULE_CONFLICT"
      );
    }
  }

  /**
   * Send notifications for instant booking
   */
  private static async sendNotifications(
    matchId: string,
    studentId: string,
    businessId: string,
    details: {
      listingTitle: string;
      businessName: string;
      startTime: Date;
      hourlyRate: number;
    }
  ): Promise<void> {
    const hoursUntilStart = Math.round(
      (details.startTime.getTime() - Date.now()) / (1000 * 60 * 60)
    );

    // Notify student
    await queuePushNotification(
      studentId,
      {
        title: "🎉 Instant Booking Confirmed!",
        body: `You're booked for ${details.listingTitle} at ${details.businessName} in ${hoursUntilStart}h`,
      },
      {
        type: "instant_booking_confirmed",
        matchId,
      }
    );

    // Notify business
    await queuePushNotification(
      businessId,
      {
        title: "✅ Urgent Shift Filled!",
        body: `A student instantly booked your urgent shift: ${details.listingTitle}`,
      },
      {
        type: "urgent_shift_filled",
        matchId,
      }
    );
  }

  /**
   * Get instant booking eligibility for a student
   */
  static async checkEligibility(studentId: string): Promise<{
    eligible: boolean;
    reason?: string;
    reputationScore: number;
    requiredScore: number;
  }> {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true,
      },
    });

    if (!student || !student.studentProfile) {
      return {
        eligible: false,
        reason: "Student profile not found",
        reputationScore: 0,
        requiredScore: 4.0,
      };
    }

    // Check reputation
    if (student.reputationScore < 4.0) {
      return {
        eligible: false,
        reason: `Reputation score too low (${student.reputationScore.toFixed(1)}/5.0)`,
        reputationScore: student.reputationScore,
        requiredScore: 4.0,
      };
    }

    // Check suspension
    if (student.urgentSuspendedUntil && student.urgentSuspendedUntil > new Date()) {
      return {
        eligible: false,
        reason: "Temporarily suspended from urgent shifts",
        reputationScore: student.reputationScore,
        requiredScore: 4.0,
      };
    }

    // Check opt-in
    if (!student.studentProfile.urgentOptIn) {
      return {
        eligible: false,
        reason: "Must opt-in for urgent notifications",
        reputationScore: student.reputationScore,
        requiredScore: 4.0,
      };
    }

    return {
      eligible: true,
      reputationScore: student.reputationScore,
      requiredScore: 4.0,
    };
  }

  /**
   * Get available instant booking opportunities for a student
   */
  static async getAvailableUrgentShifts(
    studentId: string,
    limit = 10
  ): Promise<
    Array<{
      id: string;
      title: string;
      description: string;
      businessName: string;
      hourlyRate: number;
      startTime: Date;
      endTime: Date;
      totalHours: number;
      skills: string[];
      distance?: number;
      estimatedEarnings: number;
      hoursUntilStart: number;
      instantBookable: boolean;
    }>
  > {
    // Check eligibility first
    const eligibility = await this.checkEligibility(studentId);
    if (!eligibility.eligible) {
      return [];
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true,
      },
    });

    if (!student || !student.studentProfile) {
      return [];
    }

    // Get urgent listings starting within next 4 hours
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const listings = await prisma.listing.findMany({
      where: {
        isUrgent: true,
        status: "OPEN",
        startTime: {
          gte: now,
          lte: fourHoursFromNow,
        },
        // Exclude if student already applied
        matches: {
          none: {
            studentId,
          },
        },
      },
      include: {
        business: {
          select: {
            businessName: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: limit,
    });

    // Filter and format results
    const opportunities = listings
      .filter((listing) => {
        // Check skill match
        const studentSkills = student.studentProfile!.skills.map((s) => s.toLowerCase());
        const listingSkills = listing.skills.map((s) => s.toLowerCase());
        const hasSkillMatch = listingSkills.some((skill) => studentSkills.includes(skill));

        // Check verification requirement
        const meetsVerification = !listing.verifiedBadgeOnly || student.isVerified;

        return hasSkillMatch && meetsVerification;
      })
      .map((listing) => {
        const hoursUntilStart =
          (listing.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        const estimatedEarnings = Number(listing.hourlyRate) * listing.totalHours;

        return {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          businessName: listing.business.businessName,
          hourlyRate: Number(listing.hourlyRate),
          startTime: listing.startTime,
          endTime: listing.endTime,
          totalHours: listing.totalHours,
          skills: listing.skills,
          estimatedEarnings,
          hoursUntilStart: Math.round(hoursUntilStart * 10) / 10,
          instantBookable: true,
        };
      });

    return opportunities;
  }

  /**
   * Cancel an instant booking (with penalties if too late)
   */
  static async cancelInstantBooking(
    matchId: string,
    studentId: string,
    reason?: string
  ): Promise<{
    cancelled: boolean;
    penalty?: number;
    penaltyReason?: string;
  }> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        listing: {
          include: {
            business: true,
          },
        },
      },
    });

    if (!match) {
      throw new AppError(404, "Match not found", "MATCH_NOT_FOUND");
    }

    if (match.studentId !== studentId) {
      throw new AppError(403, "Not authorized to cancel this booking", "UNAUTHORIZED");
    }

    if (match.status !== "ACCEPTED") {
      throw new AppError(400, "Can only cancel accepted bookings", "INVALID_STATUS");
    }

    const now = new Date();
    const hoursUntilStart =
      (match.listing.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Determine penalty based on cancellation timing
    let penalty = 0;
    let penaltyReason: string | undefined;

    if (hoursUntilStart < 1) {
      // Less than 1 hour: 50% of estimated earnings + reputation hit
      penalty = (Number(match.listing.hourlyRate) * match.listing.totalHours) * 0.5;
      penaltyReason = "Cancelled less than 1 hour before shift";
    } else if (hoursUntilStart < 2) {
      // 1-2 hours: 25% penalty
      penalty = (Number(match.listing.hourlyRate) * match.listing.totalHours) * 0.25;
      penaltyReason = "Cancelled less than 2 hours before shift";
    }

    // Cancel the match
    await prisma.$transaction(async (tx) => {
      // Update match status
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: "CANCELLED_LATE",
          cancelledAt: now,
          cancellationReason: reason || "Student cancelled instant booking",
        },
      });

      // Reopen listing
      await tx.listing.update({
        where: { id: match.listingId },
        data: { status: "OPEN" },
      });

      // Apply penalty if applicable
      if (penalty > 0) {
        const wallet = await tx.wallet.findUnique({
          where: { userId: studentId },
        });

        if (wallet) {
          await tx.wallet.update({
            where: { userId: studentId },
            data: {
              availableBalance: { decrement: penalty },
            },
          });

          await tx.walletTransaction.create({
            data: {
              walletUserId: studentId,
              matchId,
              type: "CANCELLATION_PENALTY",
              amount: penalty,
              netAmount: -penalty,
              grossAmount: -penalty,
              status: "POSTED",
              idempotencyKey: `cancel-penalty-${matchId}-${Date.now()}`,
              postedAt: now,
            },
          });
        }

        // Reputation penalty
        await tx.reputationEvent.create({
          data: {
            userId: studentId,
            matchId,
            type: "LATE_CANCELLATION",
            delta: -0.5,
            reason: penaltyReason,
          },
        });

        await tx.user.update({
          where: { id: studentId },
          data: {
            reputationScore: { decrement: 0.5 },
          },
        });
      }
    });

    // Notify business
    await queuePushNotification(
      match.listing.business.userId,
      {
        title: "⚠️ Booking Cancelled",
        body: `Student cancelled instant booking for ${match.listing.title}`,
      },
      {
        type: "instant_booking_cancelled",
        matchId,
      }
    );

    // Invalidate caches
    await Promise.all([
      redis.del(`listing:${match.listingId}`),
      redis.del(`student:${studentId}:matches`),
      redis.del(`business:${match.listing.business.userId}:matches`),
    ]);

    return {
      cancelled: true,
      penalty: penalty > 0 ? penalty : undefined,
      penaltyReason: penalty > 0 ? penaltyReason : undefined,
    };
  }
}

// Made with Bob
