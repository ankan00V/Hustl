import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";
import { useAuthStore } from "@/stores/auth";
import { useDeckStore } from "@/stores/deck";
import { useChatStore } from "@/stores/chat";
import * as Notifications from "expo-notifications";

let socket: Socket | null = null;

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!token || !user) return;

    // Connect socket
    const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:4000";
    socket = io(apiUrl, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      // Join user-specific room
      socket?.emit("hustl:join_user", user.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // ─── Deck Events ────────────────────────────────────────────
    socket.on("hustl:deck:refresh", (listing: any) => {
      console.log("New listing added to deck:", listing.id);
      useDeckStore.getState().addListing(listing);
    });

    socket.on("hustl:urgent_listing_nearby", async (listing: any) => {
      console.log("Urgent listing nearby:", listing.id);
      
      // Add to deck
      useDeckStore.getState().addListing(listing);
      
      // Show notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔴 Urgent HUSTL Nearby!",
          body: `${listing.title} at ${listing.businessName} - ₹${listing.hourlyRate}/hr`,
          data: { type: "urgent_listing", listingId: listing.id },
        },
        trigger: null,
      });
    });

    // ─── Match Events ───────────────────────────────────────────
    socket.on("hustl:match:created", async (match: any) => {
      console.log("New match created:", match.id);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎉 New Match!",
          body: `You matched with ${match.listing.businessName}`,
          data: { type: "match", matchId: match.id },
        },
        trigger: null,
      });
    });

    socket.on("hustl:match:accepted", async (match: any) => {
      console.log("Match accepted:", match.id);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Match Accepted!",
          body: `${match.listing.businessName} accepted your application`,
          data: { type: "match_accepted", matchId: match.id },
        },
        trigger: null,
      });
    });

    socket.on("hustl:match:status_changed", async ({ matchId, status }: any) => {
      console.log("Match status changed:", matchId, status);
    });

    // ─── Check-in Events ────────────────────────────────────────
    socket.on("hustl:checkin:confirmed", async ({ matchId }: any) => {
      console.log("Check-in confirmed:", matchId);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✓ Check-In Confirmed",
          body: "Your check-in has been confirmed. Have a great shift!",
          data: { type: "checkin", matchId },
        },
        trigger: null,
      });
    });

    socket.on("hustl:checkout:confirmed", async ({ matchId, earnings }: any) => {
      console.log("Checkout confirmed:", matchId);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💰 Shift Complete!",
          body: `You earned ₹${earnings}. Great work!`,
          data: { type: "checkout", matchId },
        },
        trigger: null,
      });
    });

    // ─── Badge Events ───────────────────────────────────────────
    socket.on("hustl:badge:unlocked", async ({ badge }: any) => {
      console.log("Badge unlocked:", badge);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🏆 Badge Unlocked!",
          body: `You earned the ${badge.name} badge!`,
          data: { type: "badge", badgeId: badge.id },
        },
        trigger: null,
      });
    });

    // ─── Chat Events ────────────────────────────────────────────
    socket.on("hustl:chat:message", (message: any) => {
      console.log("New chat message:", message.id);
      // Chat store handles this
    });

    // ─── Review Events ──────────────────────────────────────────
    socket.on("hustl:review:prompt", async ({ matchId }: any) => {
      console.log("Review prompt:", matchId);
      
      // Show review prompt notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⭐ Rate Your Experience",
          body: "How was your shift? Leave a review to help others.",
          data: { type: "review_prompt", matchId },
        },
        trigger: null, // Show immediately
      });
    });

    // Cleanup
    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [token, user]);

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}
