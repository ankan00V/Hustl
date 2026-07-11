import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";
import { api } from "@/lib/api";
import { useAuthStore } from "./auth";

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
}

interface ChatState {
  socket: Socket | null;
  messages: Record<string, ChatMessage[]>;
  unreadCounts: Record<string, number>;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  onlineUsers: Record<string, boolean>;
  lastSeen: Record<string, string>;
  typingUsers: Record<string, boolean>;

  // Actions
  connect: () => void;
  disconnect: () => void;
  fetchMessages: (matchId: string) => Promise<void>;
  sendMessage: (matchId: string, text: string) => Promise<void>;
  markAsRead: (matchId: string) => Promise<void>;
  setTyping: (matchId: string, isTyping: boolean) => void;
  clearChat: (matchId: string) => void;
  clearAllChats: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  messages: {},
  unreadCounts: {},
  loading: false,
  error: null,
  isConnected: false,
  onlineUsers: {},
  lastSeen: {},
  typingUsers: {},

  connect: () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:4000";
    const socket = io(apiUrl, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("Chat socket connected");
      set({ isConnected: true });
    });

    socket.on("disconnect", () => {
      console.log("Chat socket disconnected");
      set({ isConnected: false });
    });

    // Listen for online status
    socket.on("hustl:chat:presence", ({ userId, isOnline, lastSeen }: any) => {
      set((state) => ({
        onlineUsers: {
          ...state.onlineUsers,
          [userId]: isOnline,
        },
        lastSeen: {
          ...state.lastSeen,
          [userId]: lastSeen,
        },
      }));
    });

    // Listen for incoming messages
    socket.on("hustl:chat:message", (message: ChatMessage) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [message.matchId]: [...(state.messages[message.matchId] || []), message],
        },
        unreadCounts: {
          ...state.unreadCounts,
          [message.matchId]: (state.unreadCounts[message.matchId] || 0) + 1,
        },
      }));
    });

    // Listen for typing indicators
    socket.on("hustl:chat:typing", ({ matchId, userId, isTyping }: any) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [matchId]: isTyping,
        },
      }));
    });

    // Listen for read receipts
    socket.on("hustl:chat:read", ({ matchId }: any) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [matchId]: (state.messages[matchId] || []).map((msg) => ({
            ...msg,
            readAt: msg.readAt || new Date().toISOString(),
          })),
        },
      }));
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, onlineUsers: {} });
    }
  },

  fetchMessages: async (matchId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api<{ messages: ChatMessage[] }>(`/chat/${matchId}`);
      set((state) => ({
        messages: {
          ...state.messages,
          [matchId]: data.messages,
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch messages", loading: false });
    }
  },

  sendMessage: async (matchId: string, text: string) => {
    try {
      const data = await api<{ message: ChatMessage }>(`/chat/${matchId}`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });

      // Optimistically add message to local state
      set((state) => ({
        messages: {
          ...state.messages,
          [matchId]: [...(state.messages[matchId] || []), data.message],
        },
      }));

      // Socket.io will broadcast to other party
    } catch (error: any) {
      set({ error: error.message || "Failed to send message" });
      throw error;
    }
  },

  markAsRead: async (matchId: string) => {
    try {
      await api(`/chat/${matchId}/read`, {
        method: "POST",
      });

      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [matchId]: 0,
        },
        messages: {
          ...state.messages,
          [matchId]: (state.messages[matchId] || []).map((msg) => ({
            ...msg,
            readAt: msg.readAt || new Date().toISOString(),
          })),
        },
      }));
    } catch (error: any) {
      console.error("Failed to mark messages as read:", error);
    }
  },

  setTyping: (matchId: string, isTyping: boolean) => {
    const { socket } = get();
    if (socket) {
      socket.emit("hustl:chat:typing", { matchId, isTyping });
    }
  },

  clearChat: (matchId: string) => {
    set((state) => {
      const newMessages = { ...state.messages };
      delete newMessages[matchId];
      const newUnreadCounts = { ...state.unreadCounts };
      delete newUnreadCounts[matchId];
      return { messages: newMessages, unreadCounts: newUnreadCounts };
    });
  },

  clearAllChats: () => {
    set({ messages: {}, unreadCounts: {}, error: null });
  },
}));
