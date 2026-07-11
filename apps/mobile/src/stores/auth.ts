import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { api } from "@/lib/api";

const isWeb = Platform.OS === "web";

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key: string): Promise<void> => {
    if (isWeb) {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// ─── Types ──────────────────────────────────────────────────────
export type UserRole = "STUDENT" | "BUSINESS" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isVerified: boolean;
  reputationScore: number;
  referralCode: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

interface RegisterInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  role: UserRole;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
}

// ─── Store Keys ─────────────────────────────────────────────────
const TOKEN_KEY = "hustl_jwt";
const USER_KEY = "hustl_user";

// ─── Auth Store ─────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [token, userJson] = await Promise.all([
        storage.getItem(TOKEN_KEY),
        storage.getItem(USER_KEY),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson) as AuthUser;
        set({ token, user, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      // Corrupt storage — clear and proceed as logged out
      await storage.deleteItem(TOKEN_KEY);
      await storage.deleteItem(USER_KEY);
      set({ isHydrated: true });
    }
  },

  login: async (emailOrPhone: string, password: string) => {
    set({ isLoading: true });
    try {
      const isEmail = emailOrPhone.includes("@");
      const body = isEmail
        ? { email: emailOrPhone, password }
        : { phone: emailOrPhone, password };

      const data = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      });

      await Promise.all([
        storage.setItem(TOKEN_KEY, data.token),
        storage.setItem(USER_KEY, JSON.stringify(data.user)),
      ]);

      set({ user: data.user, token: data.token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (input: RegisterInput) => {
    set({ isLoading: true });
    try {
      const data = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });

      await Promise.all([
        storage.setItem(TOKEN_KEY, data.token),
        storage.setItem(USER_KEY, JSON.stringify(data.user)),
      ]);

      set({ user: data.user, token: data.token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await Promise.all([
      storage.deleteItem(TOKEN_KEY),
      storage.deleteItem(USER_KEY),
    ]);
    set({ user: null, token: null });
  },

  setUser: (user: AuthUser) => {
    storage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },
}));
