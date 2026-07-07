import { prisma } from "../config/prisma.js";
import { notifyBadgeUnlock } from "./push.service.js";
import { emitToUser } from "../realtime/socket.js";

/**
 * Badge Service
 * 
 * Manages badge milestones for students based on completed shifts per category.
 * Badges: Trusted (10 shifts), Pro (25 shifts), Expert (50 shifts)
 */

interface BadgeMilestone {
  name: string;
  threshold: number;
}

const BADGE_MILESTONES: BadgeMilestone[] = [
  { name: "Trusted", threshold: 10 },
  { name: "Pro", threshold: 25 },
  { name: "Expert", threshold: 50 }
];

interface BadgeEvaluation {
  studentId: string;
  category: string;
  matchId?: string;
}

export class BadgeService {
  /**
   * Evaluate and award badges after a shift is completed
   * Called from checkout confirmation flow
   * Only counts shifts with value >= ₹500 to prevent gaming
   */
  static async evaluateBadges(evaluation: BadgeEvaluation): Promise<string[]> {
    const { studentId, category, matchId } = evaluation;

    // Count completed shifts in this category with minimum value of ₹500
    // This prevents gaming the system with low-value shifts
    const MIN_SHIFT_VALUE = 500;
    
    const completedShifts = await prisma.match.count({
      where: {
        studentId,
        status: "COMPLETED",
        listing: {
          skills: {
            has: category
          },
          // Minimum shift value: hourlyRate * totalHours >= 500
          // We'll use a raw query for this complex condition
        }
      }
    });

    // Get all completed matches to filter by value
    const matches = await prisma.match.findMany({
      where: {
        studentId,
        status: "COMPLETED",
        listing: {
          skills: {
            has: category
          }
        }
      },
      include: {
        listing: {
          select: {
            hourlyRate: true,
            totalHours: true
          }
        }
      }
    });

    // Filter matches by minimum shift value
    const qualifyingShifts = matches.filter(match => {
      const shiftValue = parseFloat(match.listing.hourlyRate.toString()) * match.listing.totalHours;
      return shiftValue >= MIN_SHIFT_VALUE;
    });

    const qualifyingShiftCount = qualifyingShifts.length;

    const newBadges: string[] = [];

    // Check each milestone
    for (const milestone of BADGE_MILESTONES) {
      // Check if student just crossed this threshold
      if (qualifyingShiftCount === milestone.threshold) {
        // Check if badge already exists
        const existingBadge = await prisma.badge.findUnique({
          where: {
            userId_name_category: {
              userId: studentId,
              name: milestone.name,
              category
            }
          }
        });

        if (!existingBadge) {
          // Award the badge
          await prisma.badge.create({
            data: {
              userId: studentId,
              name: milestone.name,
              category
            }
          });

          newBadges.push(`${milestone.name} - ${category}`);

          // Emit real-time notification with push
          await notifyBadgeUnlock(studentId, {
            badgeName: milestone.name,
            category,
            matchId: matchId || ""
          });
        }
      }
    }

    return newBadges;
  }

  /**
   * Get all badges for a student
   */
  static async getStudentBadges(studentId: string) {
    return prisma.badge.findMany({
      where: { userId: studentId },
      orderBy: [
        { category: "asc" },
        { earnedAt: "desc" }
      ]
    });
  }

  /**
   * Get badge progress for a student in a specific category
   */
  static async getBadgeProgress(studentId: string, category: string) {
    // Count completed shifts in this category
    const completedShifts = await prisma.match.count({
      where: {
        studentId,
        status: "COMPLETED",
        listing: {
          skills: {
            has: category
          }
        }
      }
    });

    // Get earned badges in this category
    const earnedBadges = await prisma.badge.findMany({
      where: {
        userId: studentId,
        category
      },
      select: {
        name: true,
        earnedAt: true
      }
    });

    // Calculate progress to next milestone
    const nextMilestone = BADGE_MILESTONES.find(
      (m) => m.threshold > completedShifts
    );

    return {
      category,
      completedShifts,
      earnedBadges,
      nextMilestone: nextMilestone
        ? {
            name: nextMilestone.name,
            threshold: nextMilestone.threshold,
            remaining: nextMilestone.threshold - completedShifts
          }
        : null
    };
  }

  /**
   * Get badge summary for all categories
   */
  static async getBadgeSummary(studentId: string) {
    // Get all unique categories from completed matches
    const categories = await prisma.match.findMany({
      where: {
        studentId,
        status: "COMPLETED"
      },
      select: {
        listing: {
          select: {
            skills: true
          }
        }
      },
      distinct: ["listingId"]
    });

    // Flatten and deduplicate categories
    const uniqueCategories = Array.from(
      new Set(
        categories.flatMap((m) => m.listing.skills)
      )
    );

    // Get progress for each category
    const summary = await Promise.all(
      uniqueCategories.map((category) =>
        this.getBadgeProgress(studentId, category)
      )
    );

    // Get total badge count
    const totalBadges = await prisma.badge.count({
      where: { userId: studentId }
    });

    return {
      totalBadges,
      categories: summary
    };
  }

  /**
   * Check if student has a specific badge
   */
  static async hasBadge(
    studentId: string,
    badgeName: string,
    category: string
  ): Promise<boolean> {
    const badge = await prisma.badge.findUnique({
      where: {
        userId_name_category: {
          userId: studentId,
          name: badgeName,
          category
        }
      }
    });

    return badge !== null;
  }

  /**
   * Get badge statistics across all students
   * Useful for admin dashboard
   */
  static async getBadgeStatistics() {
    const stats = await prisma.badge.groupBy({
      by: ["name", "category"],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: "desc"
        }
      }
    });

    return stats.map((stat) => ({
      badge: `${stat.name} - ${stat.category}`,
      count: stat._count.id
    }));
  }

  /**
   * Revoke a badge (admin only)
   * Used in case of fraud or policy violations
   */
  static async revokeBadge(
    studentId: string,
    badgeName: string,
    category: string
  ): Promise<boolean> {
    const result = await prisma.badge.deleteMany({
      where: {
        userId: studentId,
        name: badgeName,
        category
      }
    });

    if (result.count > 0) {
      // Emit notification
      emitToUser(studentId, "hustl:badge:revoked", {
        badge: {
          name: badgeName,
          category
        }
      });

      return true;
    }

    return false;
  }
}

export async function awardMilestoneBadges(studentId: string, skillCategories: string[]) {
  const earned: any[] = [];
  for (const category of skillCategories) {
    const newlyEarned = await BadgeService.evaluateBadges({ studentId, category });
    if (newlyEarned.length > 0) {
      earned.push(...newlyEarned);
    }
  }
  return earned;
}
