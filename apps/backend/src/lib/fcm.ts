import admin from "firebase-admin";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if Firebase credentials are configured
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    console.warn("Firebase credentials not configured. Push notifications will be disabled.");
    throw new AppError(500, "Firebase not configured", "FIREBASE_NOT_CONFIGURED");
  }

  try {
    // Parse private key (handle escaped newlines)
    const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });

    console.log("✅ Firebase Admin SDK initialized");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    throw new AppError(500, "Failed to initialize Firebase", "FIREBASE_INIT_FAILED");
  }
}

/**
 * Get Firebase Messaging instance
 */
export function getMessaging(): admin.messaging.Messaging {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.messaging();
}

/**
 * Send push notification to a single device
 */
export async function sendPushNotification(
  token: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: Record<string, string>
): Promise<string> {
  try {
    const messaging = getMessaging();
    
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl
      },
      data,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "hustl_notifications"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1
          }
        }
      }
    };

    const messageId = await messaging.send(message);
    return messageId;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    throw new AppError(500, "Failed to send push notification", "PUSH_SEND_FAILED");
  }
}

/**
 * Send push notification to multiple devices
 */
export async function sendMulticastPushNotification(
  tokens: string[],
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: Record<string, string>
): Promise<admin.messaging.BatchResponse> {
  try {
    const messaging = getMessaging();
    
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl
      },
      data,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "hustl_notifications"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1
          }
        }
      }
    };

    const response = await messaging.sendEachForMulticast(message);
    
    // Log failures
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const token = tokens[idx];
          if (token) {
            failedTokens.push(token);
          }
        }
      });
      console.warn(`Failed to send to ${response.failureCount} tokens:`, failedTokens);
    }

    return response;
  } catch (error) {
    console.error("Failed to send multicast push notification:", error);
    throw new AppError(500, "Failed to send multicast push notification", "MULTICAST_PUSH_FAILED");
  }
}

/**
 * Send push notification to a topic
 */
export async function sendTopicPushNotification(
  topic: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: Record<string, string>
): Promise<string> {
  try {
    const messaging = getMessaging();
    
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl
      },
      data,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "hustl_notifications"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1
          }
        }
      }
    };

    const messageId = await messaging.send(message);
    return messageId;
  } catch (error) {
    console.error("Failed to send topic push notification:", error);
    throw new AppError(500, "Failed to send topic push notification", "TOPIC_PUSH_FAILED");
  }
}

/**
 * Subscribe device tokens to a topic
 */
export async function subscribeToTopic(
  tokens: string[],
  topic: string
): Promise<admin.messaging.MessagingTopicManagementResponse> {
  try {
    const messaging = getMessaging();
    const response = await messaging.subscribeToTopic(tokens, topic);
    
    if (response.failureCount > 0) {
      console.warn(`Failed to subscribe ${response.failureCount} tokens to topic ${topic}`);
    }
    
    return response;
  } catch (error) {
    console.error("Failed to subscribe to topic:", error);
    throw new AppError(500, "Failed to subscribe to topic", "TOPIC_SUBSCRIBE_FAILED");
  }
}

/**
 * Unsubscribe device tokens from a topic
 */
export async function unsubscribeFromTopic(
  tokens: string[],
  topic: string
): Promise<admin.messaging.MessagingTopicManagementResponse> {
  try {
    const messaging = getMessaging();
    const response = await messaging.unsubscribeFromTopic(tokens, topic);
    
    if (response.failureCount > 0) {
      console.warn(`Failed to unsubscribe ${response.failureCount} tokens from topic ${topic}`);
    }
    
    return response;
  } catch (error) {
    console.error("Failed to unsubscribe from topic:", error);
    throw new AppError(500, "Failed to unsubscribe from topic", "TOPIC_UNSUBSCRIBE_FAILED");
  }
}

/**
 * Validate FCM token
 */
export async function validateFCMToken(token: string): Promise<boolean> {
  try {
    const messaging = getMessaging();
    // Try to send a dry-run message to validate the token
    await messaging.send({ token }, true);
    return true;
  } catch (error) {
    return false;
  }
}
