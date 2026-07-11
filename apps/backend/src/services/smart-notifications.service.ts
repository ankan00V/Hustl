import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";
import { queuePushNotification } from "../jobs/notification.job.js";

interface NotificationPreferences {
  userId: string;
  optimalTimes: string[]; // ["09:00", "14:00", "18:00"]
  preferredDays: string[]; // ["MONDAY", "WEDNESDAY", "FRIDAY"]
  engagementScore: number; // 0-100
  lastEngagement: Date | null;
  timezone: string;
}

interface NotificationContext {
  type: "NEW_MATCH" | "SHIFT_REMINDER" | "PAYMENT_RECEIVED" | "ACHIEVEMENT" | "URGENT_SHIFT" | "REVIEW_REQUEST";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  userId: string;
  data: any;
}

/**
 * Smart Notifications Service with ML-based timing
 * Learns user behavior to send notifications at optimal times
 */
export class SmartNotificationsService {
  /**
   * Send a smart notification with ML-based timing
   */
  static async sendSmart(context: NotificationContext): Promise<void> {
    const { type, priority, userId, data } = context;

    // Get user preferences
    const prefs = await this.getUserPreferences(userId);

    // Determine if we should send immediately or schedule
    const shouldSendNow = this.shouldSendImmediately(priority, prefs);

    if (shouldSendNow) {
      await this.sendImmediately(context);
    } else {
      await this.scheduleOptimal(context, prefs);
    }

    // Update engagement tracking
    await this.trackNotificationSent(userId, type);
  }

  /**
   * Determine if notification should be sent immediately
   */
  private static shouldSendImmediately(
    priority: NotificationContext["priority"],
    prefs: NotificationPreferences
  ): boolean {
    // Always send urgent notifications immediately
    if (priority === "URGENT") return true;

    // Send high priority if user is likely active
    if (priority === "HIGH") {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

      // Check if current time is in optimal times
      const isOptimalTime = prefs.optimalTimes.some(time => {
        const parts = time.split(':');
        const hour = parts[0] ? parseInt(parts[0]) : 0;
        return Math.abs(currentHour - hour) <= 1; // Within 1 hour
      });

      // Check if current day is preferred
      const isPreferredDay = prefs.preferredDays.includes(currentDay);

      return isOptimalTime && isPreferredDay;
    }

    // For medium/low priority, check engagement score
    return prefs.engagementScore > 70;
  }

  /**
   * Send notification immediately
   */
  private static async sendImmediately(context: NotificationContext): Promise<void> {
    const { type, userId, data } = context;

    const notification = this.buildNotification(type, data);
    
    await queuePushNotification(
      userId,
      {
        title: notification.title,
        body: notification.body
      },
      notification.data
    );
  }

  /**
   * Schedule notification for optimal time
   */
  private static async scheduleOptimal(
    context: NotificationContext,
    prefs: NotificationPreferences
  ): Promise<void> {
    const optimalTime = this.calculateOptimalTime(prefs);
    
    // Store in Redis for scheduled delivery
    const key = `scheduled:notification:${context.userId}:${Date.now()}`;
    await redis.setex(
      key,
      86400, // 24 hours TTL
      JSON.stringify({
        ...context,
        scheduledFor: optimalTime
      })
    );

    // TODO: Implement background job to process scheduled notifications
  }

  /**
   * Calculate optimal time to send notification
   */
  private static calculateOptimalTime(prefs: NotificationPreferences): Date {
    const now = new Date();
    const optimal = new Date(now);

    // Find next optimal time slot
    const currentHour = now.getHours();
    const optimalHours = prefs.optimalTimes.map(t => {
      const parts = t.split(':');
      return parts[0] ? parseInt(parts[0]) : 9;
    });

    // Find next optimal hour
    let nextHour = optimalHours.find(h => h > currentHour);
    
    if (!nextHour) {
      // Use first optimal time tomorrow
      nextHour = optimalHours[0] || 9;
      optimal.setDate(optimal.getDate() + 1);
    }

    optimal.setHours(nextHour, 0, 0, 0);
    return optimal;
  }

  /**
   * Get or create user notification preferences
   */
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const cacheKey = `notif:prefs:${userId}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate preferences from user behavior
    const prefs = await this.calculatePreferences(userId);

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(prefs));

    return prefs;
  }

  /**
   * Calculate user preferences using ML-like analysis
   */
  private static async calculatePreferences(userId: string): Promise<NotificationPreferences> {
    // Get user's notification interaction history
    const interactions = await prisma.$queryRaw<Array<{
      created_at: Date;
      opened: boolean;
    }>>`
      SELECT created_at, opened
      FROM "Notification"
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    // Analyze engagement patterns
    const hourCounts = new Map<number, { sent: number; opened: number }>();
    const dayCounts = new Map<string, { sent: number; opened: number }>();

    for (const interaction of interactions) {
      const date = new Date(interaction.created_at);
      const hour = date.getHours();
      const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

      // Track by hour
      if (!hourCounts.has(hour)) {
        hourCounts.set(hour, { sent: 0, opened: 0 });
      }
      const hourData = hourCounts.get(hour)!;
      hourData.sent++;
      if (interaction.opened) hourData.opened++;

      // Track by day
      if (!dayCounts.has(day)) {
        dayCounts.set(day, { sent: 0, opened: 0 });
      }
      const dayData = dayCounts.get(day)!;
      dayData.sent++;
      if (interaction.opened) dayData.opened++;
    }

    // Find optimal times (top 3 hours with highest open rate)
    const optimalHours = Array.from(hourCounts.entries())
      .map(([hour, data]) => ({
        hour,
        openRate: data.sent > 0 ? data.opened / data.sent : 0
      }))
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 3)
      .map(({ hour }) => `${hour.toString().padStart(2, '0')}:00`);

    // Find preferred days (top 3 days with highest open rate)
    const preferredDays = Array.from(dayCounts.entries())
      .map(([day, data]) => ({
        day,
        openRate: data.sent > 0 ? data.opened / data.sent : 0
      }))
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 3)
      .map(({ day }) => day);

    // Calculate overall engagement score
    const totalSent = interactions.length;
    const totalOpened = interactions.filter(i => i.opened).length;
    const engagementScore = totalSent > 0 ? (totalOpened / totalSent) * 100 : 50;

    // Get last engagement
    const lastEngagement = interactions.find(i => i.opened)?.created_at || null;

    return {
      userId,
      optimalTimes: optimalHours.length > 0 ? optimalHours : ["09:00", "14:00", "18:00"],
      preferredDays: preferredDays.length > 0 ? preferredDays : ["MONDAY", "WEDNESDAY", "FRIDAY"],
      engagementScore: Math.round(engagementScore),
      lastEngagement,
      timezone: "Asia/Kolkata" // TODO: Get from user profile
    };
  }

  /**
   * Build notification content based on type
   */
  private static buildNotification(
    type: NotificationContext["type"],
    data: any
  ): { title: string; body: string; data: any } {
    switch (type) {
      case "NEW_MATCH":
        return {
          title: "🎉 New Match!",
          body: `You matched with ${data.businessName} for ${data.listingTitle}`,
          data: { type: "match", matchId: data.matchId }
        };

      case "SHIFT_REMINDER":
        return {
          title: "⏰ Shift Reminder",
          body: `Your shift at ${data.businessName} starts in ${data.hoursUntil} hours`,
          data: { type: "reminder", matchId: data.matchId }
        };

      case "PAYMENT_RECEIVED":
        return {
          title: "💰 Payment Received",
          body: `₹${data.amount} has been credited to your wallet`,
          data: { type: "payment", transactionId: data.transactionId }
        };

      case "ACHIEVEMENT":
        return {
          title: "🏆 Achievement Unlocked!",
          body: `You earned "${data.achievementName}"`,
          data: { type: "achievement", achievementId: data.achievementId }
        };

      case "URGENT_SHIFT":
        return {
          title: "🚨 Urgent Shift Available",
          body: `${data.businessName} needs someone ASAP - ${data.hourlyRate}/hr`,
          data: { type: "urgent", listingId: data.listingId }
        };

      case "REVIEW_REQUEST":
        return {
          title: "⭐ How was your shift?",
          body: `Rate your experience at ${data.businessName}`,
          data: { type: "review", matchId: data.matchId }
        };

      default:
        return {
          title: "Hustl",
          body: "You have a new notification",
          data: {}
        };
    }
  }

  /**
   * Track notification sent for ML learning
   */
  private static async trackNotificationSent(
    userId: string,
    type: NotificationContext["type"]
  ): Promise<void> {
    // Store in time-series for analysis
    const key = `notif:sent:${userId}`;
    const timestamp = Date.now();
    
    await redis.zadd(key, timestamp, JSON.stringify({
      type,
      timestamp,
      opened: false // Will be updated when user opens
    }));

    // Keep only last 100 notifications
    await redis.zremrangebyrank(key, 0, -101);

    // Invalidate preferences cache
    await redis.del(`notif:prefs:${userId}`);
  }

  /**
   * Track notification opened (for ML learning)
   */
  static async trackNotificationOpened(
    userId: string,
    notificationId: string
  ): Promise<void> {
    // Store in Redis for tracking (since we don't have a Notification model in Prisma)
    const key = `notif:opened:${userId}:${notificationId}`;
    await redis.set(key, Date.now().toString());

    // Invalidate preferences cache to recalculate
    await redis.del(`notif:prefs:${userId}`);
  }

  /**
   * Batch send notifications with rate limiting
   */
  static async sendBatch(
    contexts: NotificationContext[],
    rateLimit = 100 // per minute
  ): Promise<void> {
    const batchSize = Math.ceil(rateLimit / 60); // per second
    
    for (let i = 0; i < contexts.length; i += batchSize) {
      const batch = contexts.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(context => this.sendSmart(context))
      );

      // Wait 1 second between batches
      if (i + batchSize < contexts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Get notification analytics for a user
   */
  static async getAnalytics(userId: string): Promise<{
    totalSent: number;
    totalOpened: number;
    openRate: number;
    optimalTimes: string[];
    preferredDays: string[];
    engagementTrend: "INCREASING" | "STABLE" | "DECREASING";
  }> {
    const prefs = await this.getUserPreferences(userId);
    
    // Get notification history from Redis
    const key = `notif:sent:${userId}`;
    const notifications = await redis.zrange(key, 0, -1);
    
    interface NotificationRecord {
      type: string;
      timestamp: number;
      opened: boolean;
    }

    const parsedNotifications: NotificationRecord[] = notifications
      .map(n => {
        try {
          return JSON.parse(n) as NotificationRecord;
        } catch {
          return null;
        }
      })
      .filter((n): n is NotificationRecord => n !== null);

    const totalSent = parsedNotifications.length;
    const totalOpened = parsedNotifications.filter((n: NotificationRecord) => n.opened).length;
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

    // Calculate trend (compare last 30 vs previous 30)
    const last30 = parsedNotifications.slice(0, 30);
    const prev30 = parsedNotifications.slice(30, 60);
    
    const last30Rate = last30.length > 0
      ? (last30.filter((n: NotificationRecord) => n.opened).length / last30.length) * 100
      : 0;
    
    const prev30Rate = prev30.length > 0
      ? (prev30.filter((n: NotificationRecord) => n.opened).length / prev30.length) * 100
      : 0;

    let engagementTrend: "INCREASING" | "STABLE" | "DECREASING" = "STABLE";
    if (last30Rate > prev30Rate + 5) engagementTrend = "INCREASING";
    else if (last30Rate < prev30Rate - 5) engagementTrend = "DECREASING";

    return {
      totalSent,
      totalOpened,
      openRate: Math.round(openRate * 10) / 10,
      optimalTimes: prefs.optimalTimes,
      preferredDays: prefs.preferredDays,
      engagementTrend
    };
  }
}

// Made with Bob
