import Constants from "expo-constants";
import { useAuthStore } from "@/stores/auth";

// ─── Base URL ───────────────────────────────────────────────────
const API_URL = Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:4000";

// ─── Core Fetch Wrapper ─────────────────────────────────────────
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    // If 401, auto-logout
    if (response.status === 401) {
      useAuthStore.getState().logout();
    }

    throw new ApiError(
      body?.error?.message ?? `Request failed: ${response.status}`,
      response.status,
      body?.error?.code
    );
  }

  return response.json() as Promise<T>;
}

// ─── Error Class ────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Auth API ───────────────────────────────────────────────────
export const authApi = {
  register: (body: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    role: "STUDENT" | "BUSINESS";
  }) =>
    api<{ user: any; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email?: string; phone?: string; password: string }) =>
    api<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ─── Listings API ───────────────────────────────────────────────
export const listingsApi = {
  search: (params: {
    lat: number;
    lng: number;
    radius?: number;
    skills?: string;
    isUrgent?: boolean;
  }) => {
    const qs = new URLSearchParams();
    qs.set("lat", String(params.lat));
    qs.set("lng", String(params.lng));
    if (params.radius) qs.set("radius", String(params.radius));
    if (params.skills) qs.set("skills", params.skills);
    if (params.isUrgent !== undefined) qs.set("isUrgent", String(params.isUrgent));
    return api<{ listings: any[] }>(`/listings?${qs.toString()}`);
  },

  create: (body: {
    title: string;
    description: string;
    skills: string[];
    hourlyRate: number;
    startTime: string;
    endTime: string;
    isUrgent?: boolean;
    verifiedBadgeOnly?: boolean;
    lat?: number;
    lng?: number;
  }) =>
    api<{ listing: any }>("/listings", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Record<string, any>) =>
    api<{ listing: any }>(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  remove: (id: string) =>
    api<void>(`/listings/${id}`, { method: "DELETE" }),
};

// ─── Swipes API ─────────────────────────────────────────────────
export const swipesApi = {
  swipe: (body: { listingId: string; direction: "LEFT" | "RIGHT" }) =>
    api<{ swipe: any; match?: any }>("/swipes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ─── Matches API ────────────────────────────────────────────────
export const matchesApi = {
  list: () => api<{ matches: any[] }>("/matches"),

  updateStatus: (matchId: string, status: string) =>
    api<{ match: any }>(`/matches/${matchId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  cancel: (matchId: string, reason?: string) =>
    api<{ match: any }>(`/matches/${matchId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  markNoShow: (matchId: string, reason?: string) =>
    api<void>(`/matches/${matchId}/no-show`, {
      method: "POST",
      body: JSON.stringify({ matchId, reason }),
    }),
};

// ─── Check-In API ───────────────────────────────────────────────
export const checkInApi = {
  arrive: (matchId: string, lat: number, lng: number) =>
    api<{ checkIn: any }>(`/checkin/${matchId}/arrive`, {
      method: "POST",
      body: JSON.stringify({ matchId, lat, lng }),
    }),

  confirmArrival: (matchId: string) =>
    api<{ checkIn: any }>(`/checkin/${matchId}/confirm`, {
      method: "POST",
      body: JSON.stringify({ status: "BUSINESS_CONFIRMED" }),
    }),

  checkout: (matchId: string) =>
    api<{ checkIn: any }>(`/checkin/${matchId}/checkout`, {
      method: "POST",
    }),

  completeShift: (matchId: string, confirmedMinutes: number) =>
    api<{ checkIn: any }>(`/checkin/${matchId}/complete`, {
      method: "POST",
      body: JSON.stringify({ status: "CHECKED_OUT", confirmedMinutes }),
    }),

  getStatus: (matchId: string) =>
    api<{ checkIn: any }>(`/checkin/${matchId}`),
};

// ─── Wallet API ─────────────────────────────────────────────────
export const walletApi = {
  getBalance: () =>
    api<{ wallet: any }>("/wallet"),

  getTransactions: (page = 1, limit = 20) =>
    api<{ transactions: any[]; total: number }>(
      `/wallet/transactions?page=${page}&limit=${limit}`
    ),

  requestPayout: (amount: number, upiId: string) =>
    api<{ payout: any }>("/wallet/payout", {
      method: "POST",
      body: JSON.stringify({ amount, upiId }),
    }),
};

// ─── Profile API ────────────────────────────────────────────────
export const profileApi = {
  get: (userId: string) =>
    api<{ user: any; studentProfile?: any; businessProfile?: any }>(
      `/profile/${userId}`
    ),

  updateStudent: (body: {
    bio?: string;
    avatarUrl?: string;
    skills?: string[];
    portfolioUrls?: string[];
    collegeName?: string;
    availabilitySlots?: string[];
  }) =>
    api<{ profile: any }>("/profile/student", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  updateBusiness: (body: {
    bio?: string;
    avatarUrl?: string;
    businessName?: string;
    category?: string;
    address?: string;
    lat?: number;
    lng?: number;
  }) =>
    api<{ profile: any }>("/profile/business", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

// ─── Reviews API ────────────────────────────────────────────────
export const reviewsApi = {
  create: (body: {
    matchId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
  }) =>
    api<{ review: any }>("/reviews", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ─── Badges API ─────────────────────────────────────────────────
export const badgesApi = {
  get: (userId: string) =>
    api<{ badges: any[] }>(`/badges/${userId}`),
};

// ─── Memberships API ────────────────────────────────────────────
export const membershipsApi = {
  upgrade: (body: {
    tier: "PRO" | "ELITE" | "PRO_PLUS";
    successUrl: string;
    cancelUrl: string;
  }) =>
    api<{ orderId: string; amount: number; currency: string }>(
      "/memberships/upgrade",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    ),
};

// ─── Boost API ──────────────────────────────────────────────────
export const boostApi = {
  purchase: (body: {
    targetType: "STUDENT_PROFILE" | "BUSINESS_LISTING";
    source: "PAID" | "REFERRAL_REWARD";
    listingId?: string;
    category?: string;
  }) =>
    api<{ boost: any }>("/boosts", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  list: () => api<{ boosts: any[] }>("/boosts"),
};

// ─── Referrals API ──────────────────────────────────────────────
export const referralsApi = {
  create: (code: string) =>
    api<{ referral: any }>("/referrals", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  redeem: (code: string) =>
    api<{ referral: any }>("/referrals/redeem", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  list: () => api<{ referrals: any[] }>("/referrals"),
};

// ─── Portfolio API ──────────────────────────────────────────────
export const portfolioApi = {
  get: (userId: string) =>
    api<{ assets: any[] }>(`/portfolio/${userId}`),

  upload: (body: {
    type: "IMAGE" | "VIDEO";
    cloudinaryId: string;
    url: string;
    thumbnailUrl?: string;
    sortOrder?: number;
  }) =>
    api<{ asset: any }>("/portfolio", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  remove: (assetId: string) =>
    api<void>(`/portfolio/${assetId}`, { method: "DELETE" }),

  reorder: (assetIds: string[]) =>
    api<void>("/portfolio/reorder", {
      method: "PATCH",
      body: JSON.stringify({ assetIds }),
    }),
};

// ─── Chat API ───────────────────────────────────────────────────
export const chatApi = {
  getMessages: (matchId: string) =>
    api<{ messages: any[] }>(`/chat/${matchId}`),

  sendMessage: (matchId: string, text: string) =>
    api<{ message: any }>(`/chat/${matchId}`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  markAsRead: (matchId: string) =>
    api<void>(`/chat/${matchId}/read`, {
      method: "POST",
    }),

  getUnreadCount: (matchId: string) =>
    api<{ count: number }>(`/chat/${matchId}/unread`),
};

// ─── Devices API ────────────────────────────────────────────────
export const devicesApi = {
  register: (pushToken: string) =>
    api<void>("/devices", {
      method: "POST",
      body: JSON.stringify({ token: pushToken }),
    }),

  unregister: (pushToken: string) =>
    api<void>(`/devices/${encodeURIComponent(pushToken)}`, {
      method: "DELETE",
    }),
};
