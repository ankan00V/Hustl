import { create } from "zustand";

// ─── Types ──────────────────────────────────────────────────────
export interface StudentProfile {
  userId: string;
  skills: string[];
  portfolioUrls: string[];
  collegeName: string;
  badges: string[];
  completedShifts: number;
  availabilitySlots: string[];
  urgentOptIn: boolean;
  campusId: string | null;
  campusVerifiedAt: string | null;
}

export interface BusinessProfile {
  userId: string;
  businessName: string;
  category: string;
  address: string;
  isVerified: boolean;
  badgeLevel: string | null;
  campusId: string | null;
  currentTier: "FREE" | "PRO" | "ELITE" | "PRO_PLUS";
}

export interface Badge {
  id: string;
  name: string;
  category: string;
  earnedAt: string;
}

export interface WalletBalance {
  availableBalance: string;
  pendingBalance: string;
  currency: string;
}

interface ProfileState {
  studentProfile: StudentProfile | null;
  businessProfile: BusinessProfile | null;
  badges: Badge[];
  wallet: WalletBalance | null;
  isProfileLoading: boolean;

  // Actions
  setStudentProfile: (profile: StudentProfile) => void;
  setBusinessProfile: (profile: BusinessProfile) => void;
  setBadges: (badges: Badge[]) => void;
  setWallet: (wallet: WalletBalance) => void;
  setProfileLoading: (loading: boolean) => void;
  clearProfile: () => void;
}

// ─── Profile Store ──────────────────────────────────────────────
export const useProfileStore = create<ProfileState>((set) => ({
  studentProfile: null,
  businessProfile: null,
  badges: [],
  wallet: null,
  isProfileLoading: false,

  setStudentProfile: (studentProfile) => set({ studentProfile }),
  setBusinessProfile: (businessProfile) => set({ businessProfile }),
  setBadges: (badges) => set({ badges }),
  setWallet: (wallet) => set({ wallet }),
  setProfileLoading: (isProfileLoading) => set({ isProfileLoading }),
  clearProfile: () =>
    set({
      studentProfile: null,
      businessProfile: null,
      badges: [],
      wallet: null,
    }),
}));
