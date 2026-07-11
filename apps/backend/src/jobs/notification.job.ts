import { Queue, Worker, Job } from "bullmq";
import { env } from "../config/env.js";
import { sendPushNotification, sendMulticastPushNotification } from "../lib/fcm.js";
import { prisma } from "../config/prisma.js";
import { emitToUser } from "../realtime/socket.js";

/**
 * Notification job data structure
 */
export interface NotificationJobData {
  type: "single" | "multicast" | "socket";
  userId?: string;
  userIds?: string[];
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data?: Record<string, string>;
  socketEvent?: string;
  socketPayload?: unknown;
}

import { Redis } from "ioredis";

/**
 * Redis connection for BullMQ
 */
const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

/**
 * Notification queue for dispatching push notifications
 */
export const notificationQueue = new Queue<NotificationJobData>("notifications", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000
    },
    removeOnFail: {
      age: 7 * 24 * 3600 // Keep failed jobs for 7 days
    }
  }
});

/**
 * Notification worker for processing push notifications
 */
export const notificationWorker = new Worker<NotificationJobData>(
  "notifications",
  async (job: Job<NotificationJobData>) => {
    const { type, userId, userIds, notification, data, socketEvent, socketPayload } = job.data;

    try {
      if (type === "socket" && socketEvent && userId) {
        // Socket.io notification only
        emitToUser(userId, socketEvent, socketPayload);
        return { success: true, type: "socket" };
      }

      if (type === "single" && userId) {
        // Single device push notification
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { fcmToken: true }
        });

        if (!user?.fcmToken) {
          console.warn(`No FCM token found for user ${userId}`);
          return { success: false, reason: "no_token" };
        }

        const messageId = await sendPushNotification(user.fcmToken, notification, data);
        
        // Also emit socket event if specified
        if (socketEvent) {
          emitToUser(userId, socketEvent, socketPayload);
        }

        return { success: true, messageId, type: "single" };
      }

      if (type === "multicast" && userIds && userIds.length > 0) {
        // Multiple devices push notification
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fcmToken: true }
        });

        const tokens = users
          .filter((u: any) => u.fcmToken)
          .map((u: any) => u.fcmToken as string);

        if (tokens.length === 0) {
          console.warn(`No FCM tokens found for users ${userIds.join(", ")}`);
          return { success: false, reason: "no_tokens" };
        }

        const response = await sendMulticastPushNotification(tokens, notification, data);
        
        // Also emit socket events if specified
        if (socketEvent) {
          userIds.forEach((uid) => {
            emitToUser(uid, socketEvent, socketPayload);
          });
        }

        return {
          success: true,
          successCount: response.successCount,
          failureCount: response.failureCount,
          type: "multicast"
        };
      }

      throw new Error("Invalid notification job data");
    } catch (error) {
      console.error("Notification job failed:", error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 10
  }
);

/**
 * Queue a single push notification
 */
export async function queuePushNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: Record<string, string>,
  socketEvent?: string,
  socketPayload?: unknown
): Promise<Job<NotificationJobData>> {
  return notificationQueue.add("push-notification", {
    type: "single",
    userId,
    notification,
    data,
    socketEvent,
    socketPayload
  });
}

/**
 * Queue multicast push notification
 */
export async function queueMulticastPushNotification(
  userIds: string[],
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: Record<string, string>,
  socketEvent?: string,
  socketPayload?: unknown
): Promise<Job<NotificationJobData>> {
  return notificationQueue.add("multicast-push-notification", {
    type: "multicast",
    userIds,
    notification,
    data,
    socketEvent,
    socketPayload
  });
}

/**
 * Queue socket-only notification (no push)
 */
export async function queueSocketNotification(
  userId: string,
  socketEvent: string,
  socketPayload: unknown
): Promise<Job<NotificationJobData>> {
  return notificationQueue.add("socket-notification", {
    type: "socket",
    userId,
    notification: { title: "", body: "" }, // Required but unused
    socketEvent,
    socketPayload
  });
}

/**
 * Graceful shutdown
 */
export async function closeNotificationQueue(): Promise<void> {
  await notificationQueue.close();
  await notificationWorker.close();
  await redisConnection.quit();
}

// Handle worker events
notificationWorker.on("completed", (job) => {
  console.log(`✅ Notification job ${job.id} completed`);
});

notificationWorker.on("failed", (job, error) => {
  console.error(`❌ Notification job ${job?.id} failed:`, error);
});

notificationWorker.on("error", (error) => {
  console.error("❌ Notification worker error:", error);
});

console.log("📬 Notification queue and worker initialized");
