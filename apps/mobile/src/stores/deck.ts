import { create } from "zustand";

// ─── Types ──────────────────────────────────────────────────────
export interface Listing {
  id: string;
  businessId: string;
  businessName: string;
  businessCategory: string;
  businessReputation: number;
  businessAvatar: string | null;
  title: string;
  description: string;
  skills: string[];
  hourlyRate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  isUrgent: boolean;
  verifiedBadgeOnly: boolean;
  status: string;
  distance?: number;
  matchScore?: number;
  boostedUntil: string | null;
}

export interface Match {
  id: string;
  listingId: string;
  listing: {
    title: string;
    businessName: string;
    hourlyRate: string;
    startTime: string;
    endTime: string;
  };
  studentId: string;
  student?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    reputationScore: number;
    skills?: string[];
    completedShifts?: number;
  };
  status: "PENDING" | "ACCEPTED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
}

interface DeckState {
  // Deck
  listings: Listing[];
  skippedListings: Listing[];
  deckIndex: number;
  isDeckLoading: boolean;
  deckError: string | null;

  // Matches
  matches: Match[];
  isMatchesLoading: boolean;

  // Actions
  setListings: (listings: Listing[]) => void;
  addListing: (listing: Listing) => void;
  advanceDeck: () => void;
  resetDeck: () => void;
  setDeckLoading: (loading: boolean) => void;
  setDeckError: (error: string | null) => void;
  setMatches: (matches: Match[]) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  setMatchesLoading: (loading: boolean) => void;
}

// ─── Deck & Matches Store ───────────────────────────────────────
export const useDeckStore = create<DeckState>((set) => ({
  listings: [],
  skippedListings: [],
  deckIndex: 0,
  isDeckLoading: false,
  deckError: null,
  matches: [],
  isMatchesLoading: false,

  setListings: (listings) => set({ listings, deckIndex: 0, deckError: null }),
  addListing: (listing) => set((s) => ({ listings: [...s.listings, listing] })),
  advanceDeck: () => set((s) => {
    const skipped = s.listings[s.deckIndex];
    return {
      deckIndex: s.deckIndex + 1,
      skippedListings: skipped ? [...s.skippedListings, skipped] : s.skippedListings
    };
  }),
  resetDeck: () => set({ deckIndex: 0 }),
  setDeckLoading: (isDeckLoading) => set({ isDeckLoading }),
  setDeckError: (deckError) => set({ deckError }),
  setMatches: (matches) => set({ matches }),
  updateMatch: (matchId, updates) =>
    set((s) => ({
      matches: s.matches.map((m) =>
        m.id === matchId ? { ...m, ...updates } : m
      ),
    })),
  setMatchesLoading: (isMatchesLoading) => set({ isMatchesLoading }),
}));
