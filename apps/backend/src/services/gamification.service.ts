import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "MILESTONE" | "STREAK" | "PERFORMANCE" | "SPECIAL";
  points: number;
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: Date | null;
  totalDays: number;
  streakBonus: number;
}

interface GamificationProfile {
  userId: string;
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;
  streak: StreakData;
  achievements: Achievement[];
  leaderboardRank: number;
  badges: string[];
}

/**
 * Gamification Service - Streaks, Achievements, Levels
 * Increases engagement and retention through game mechanics
 */
export class GamificationService {
  // Level thresholds (exponential growth)
  private static readonly LEVEL_THRESHOLDS = [
    0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000
  ];

  // Achievement definitions
  private static readonly ACHIEVEMENTS = [
    // Milestone achievements
    {
      id: "first_shift",
      name: "First Shift",
      description: "Complete your first shift",
      icon: "🎯",
      category: "MILESTONE" as const,
      points: 50,
      requirement: 1
    },
    {
      id: "ten_shifts",
      name: "Getting Started",
      description: "Complete 10 shifts",
      icon: "⭐",
      category: "MILESTONE" as const,
      points: 100,
      requirement: 10
    },
    {
      id: "fifty_shifts",
      name: "Experienced",
      description: "Complete 50 shifts",
      icon: "🏆",
      category: "MILESTONE" as const,
      points: 250,
      requirement: 50
    },
    {
      id: "hundred_shifts",
      name: "Professional",
      description: "Complete 100 shifts",
      icon: "💎",
      category: "MILESTONE" as const,
      points: 500,
      requirement: 100
    },
    
    // Streak achievements
    {
      id: "week_streak",
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      category: "STREAK" as const,
      points: 100,
      requirement: 7
    },
    {
      id: "month_streak",
      name: "Monthly Master",
      description: "Maintain a 30-day streak",
      icon: "🌟",
      category: "STREAK" as const,
      points: 300,
      requirement: 30
    },
    {
      id: "quarter_streak",
      name: "Consistency King",
      description: "Maintain a 90-day streak",
      icon: "👑",
      category: "STREAK" as const,
      points: 1000,
      requirement: 90
    },
    
    // Performance achievements
    {
      id: "perfect_rating",
      name: "Five Star",
      description: "Maintain 5.0 rating with 10+ reviews",
      icon: "⭐⭐⭐⭐⭐",
      category: "PERFORMANCE" as const,
      points: 200,
      requirement: 10
    },
    {
      id: "speed_demon",
      name: "Speed Demon",
      description: "Complete 5 shifts in one day",
      icon: "⚡",
      category: "PERFORMANCE" as const,
      points: 150,
      requirement: 5
    },
    {
      id: "early_bird",
      name: "Early Bird",
      description: "Complete 20 morning shifts",
      icon: "🌅",
      category: "PERFORMANCE" as const,
      points: 100,
      requirement: 20
    },
    {
      id: "night_owl",
      name: "Night Owl",
      description: "Complete 20 evening shifts",
      icon: "🦉",
      category: "PERFORMANCE" as const,
      points: 100,
      requirement: 20
    },
    
    // Special achievements
    {
      id: "referral_master",
      name: "Referral Master",
      description: "Refer 5 friends who complete shifts",
      icon: "🤝",
      category: "SPECIAL" as const,
      points: 250,
      requirement: 5
    },
    {
      id: "urgent_hero",
      name: "Urgent Hero",
      description: "Accept 10 urgent shifts",
      icon: "🚨",
      category: "SPECIAL" as const,
      points: 200,
      requirement: 10
    }
  ];

  /**
   * Get complete gamification profile for a user
   */
  static async getProfile(userId: string): Promise<GamificationProfile> {
    const cacheKey = `gamification:profile:${userId}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [user, completedShifts, streak, achievements, rank] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: true,
          badges: true
        }
      }),
      prisma.match.count({
        where: { studentId: userId, status: "COMPLETED" }
      }),
      this.getStreak(userId),
      this.getAchievements(userId),
      this.getLeaderboardRank(userId)
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    // Calculate total points from achievements and streak
    const achievementPoints = achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);
    
    const streakPoints = streak.currentStreak * 10; // 10 points per day
    const totalPoints = achievementPoints + streakPoints + (completedShifts * 20);

    // Calculate level
    const level = this.calculateLevel(totalPoints);
    const nextLevelThreshold = this.LEVEL_THRESHOLDS[level + 1] || this.LEVEL_THRESHOLDS[this.LEVEL_THRESHOLDS.length - 1] || 15000;
    const pointsToNextLevel = nextLevelThreshold - totalPoints;

    const profile: GamificationProfile = {
      userId,
      level,
      totalPoints,
      pointsToNextLevel,
      streak,
      achievements,
      leaderboardRank: rank,
      badges: user.badges.map(b => b.name)
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(profile));

    return profile;
  }

  /**
   * Update streak when user completes a shift
   */
  static async updateStreak(userId: string): Promise<StreakData> {
    const key = `streak:${userId}`;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get current streak data
    const data = await redis.get(key);
    let streak: StreakData = data ? JSON.parse(data) : {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckIn: null,
      totalDays: 0,
      streakBonus: 0
    };

    // Check if already checked in today
    if (streak.lastCheckIn) {
      const lastDate = new Date(streak.lastCheckIn).toISOString().split('T')[0];
      if (lastDate === today) {
        return streak; // Already checked in today
      }

      // Check if streak continues (yesterday)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        // Streak continues
        streak.currentStreak++;
      } else {
        // Streak broken
        streak.currentStreak = 1;
      }
    } else {
      // First check-in
      streak.currentStreak = 1;
    }

    // Update longest streak
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastCheckIn = now;
    streak.totalDays++;
    
    // Calculate streak bonus (1% per day, max 30%)
    streak.streakBonus = Math.min(30, streak.currentStreak);

    // Save to Redis
    await redis.set(key, JSON.stringify(streak));

    // Check for streak achievements
    await this.checkStreakAchievements(userId, streak.currentStreak);

    // Invalidate profile cache
    await redis.del(`gamification:profile:${userId}`);

    return streak;
  }

  /**
   * Get current streak data
   */
  static async getStreak(userId: string): Promise<StreakData> {
    const key = `streak:${userId}`;
    const data = await redis.get(key);
    
    if (!data) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastCheckIn: null,
        totalDays: 0,
        streakBonus: 0
      };
    }

    return JSON.parse(data);
  }

  /**
   * Get all achievements with progress
   */
  static async getAchievements(userId: string): Promise<Achievement[]> {
    const [completedShifts, reviews, urgentShifts, referrals] = await Promise.all([
      prisma.match.count({
        where: { studentId: userId, status: "COMPLETED" }
      }),
      prisma.review.findMany({
        where: {
          match: { studentId: userId }
        }
      }),
      prisma.match.count({
        where: {
          studentId: userId,
          status: "COMPLETED",
          listing: { isUrgent: true }
        }
      }),
      // Count referrals (simplified - just count all)
      prisma.referral.count({
        where: {
          referrerId: userId
        }
      })
    ]);

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Get unlocked achievements from DB
    const unlockedAchievements = await prisma.badge.findMany({
      where: {
        userId,
        category: "ACHIEVEMENT"
      }
    });

    const unlockedIds = new Set(unlockedAchievements.map(a => a.name));

    return this.ACHIEVEMENTS.map(achievement => {
      let progress = 0;

      // Calculate progress based on achievement type
      switch (achievement.id) {
        case "first_shift":
        case "ten_shifts":
        case "fifty_shifts":
        case "hundred_shifts":
          progress = completedShifts;
          break;
        case "perfect_rating":
          progress = avgRating >= 5.0 ? reviews.length : 0;
          break;
        case "urgent_hero":
          progress = urgentShifts;
          break;
        case "referral_master":
          progress = referrals;
          break;
        default:
          progress = 0;
      }

      const unlocked = unlockedIds.has(achievement.id) || progress >= achievement.requirement;

      return {
        ...achievement,
        progress,
        unlocked,
        unlockedAt: unlocked ? unlockedAchievements.find(a => a.name === achievement.id)?.earnedAt : undefined
      };
    });
  }

  /**
   * Check and unlock streak achievements
   */
  private static async checkStreakAchievements(userId: string, currentStreak: number) {
    const streakMilestones = [
      { days: 7, id: "week_streak" },
      { days: 30, id: "month_streak" },
      { days: 90, id: "quarter_streak" }
    ];

    for (const milestone of streakMilestones) {
      if (currentStreak >= milestone.days) {
        await this.unlockAchievement(userId, milestone.id);
      }
    }
  }

  /**
   * Unlock an achievement
   */
  static async unlockAchievement(userId: string, achievementId: string) {
    const achievement = this.ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;

    // Check if already unlocked
    const existing = await prisma.badge.findFirst({
      where: {
        userId,
        name: achievementId,
        category: "ACHIEVEMENT"
      }
    });

    if (existing) return;

    // Create badge
    await prisma.badge.create({
      data: {
        userId,
        name: achievementId,
        category: "ACHIEVEMENT",
        earnedAt: new Date()
      }
    });

    // Invalidate cache
    await redis.del(`gamification:profile:${userId}`);

    // TODO: Send push notification about achievement
  }

  /**
   * Calculate level from total points
   */
  private static calculateLevel(points: number): number {
    for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      const threshold = this.LEVEL_THRESHOLDS[i];
      if (threshold !== undefined && points >= threshold) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Get leaderboard rank for user
   */
  private static async getLeaderboardRank(userId: string): Promise<number> {
    // Get all users with their points
    const users = await prisma.user.findMany({
      where: {
        role: "STUDENT"
      },
      select: {
        id: true,
        reputationScore: true,
        studentProfile: {
          select: {
            completedShifts: true
          }
        }
      }
    });

    // Calculate points for each user (simplified)
    const userPoints = users.map(u => ({
      id: u.id,
      points: (u.studentProfile?.completedShifts || 0) * 20 + u.reputationScore * 100
    }));

    // Sort by points descending
    userPoints.sort((a, b) => b.points - a.points);

    // Find user's rank
    const rank = userPoints.findIndex(u => u.id === userId) + 1;
    return rank || 999;
  }

  /**
   * Get global leaderboard
   */
  static async getLeaderboard(limit = 100): Promise<Array<{
    rank: number;
    userId: string;
    name: string;
    points: number;
    level: number;
    completedShifts: number;
  }>> {
    const cacheKey = `leaderboard:global:${limit}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const users = await prisma.user.findMany({
      where: {
        role: "STUDENT"
      },
      include: {
        studentProfile: true,
        badges: true
      },
      take: limit
    });

    const leaderboard = users.map(user => {
      const completedShifts = user.studentProfile?.completedShifts || 0;
      const achievementPoints = user.badges.filter(b => b.category === "ACHIEVEMENT").length * 100;
      const points = completedShifts * 20 + achievementPoints;

      return {
        userId: user.id,
        name: user.name,
        points,
        level: this.calculateLevel(points),
        completedShifts
      };
    });

    // Sort by points
    leaderboard.sort((a, b) => b.points - a.points);

    // Add ranks
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(rankedLeaderboard));

    return rankedLeaderboard;
  }
}

// Made with Bob
