import { create } from "zustand";
import { matchesApi } from "@/lib/api";

export interface Match {
  id: string;
  status: "PENDING" | "ACCEPTED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  listing: {
    id: string;
    title: string;
    description: string;
    hourlyRate: string;
    totalHours: number;
    startTime: string;
    endTime: string;
    businessName: string;
    businessCategory: string;
    address: string;
  };
  checkInTime: string | null;
  checkOutTime: string | null;
  agreedHours: number | null;
  createdAt: string;
}

interface MatchesState {
  matches: Match[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchMatches: () => Promise<void>;
  updateMatchStatus: (matchId: string, status: string) => Promise<void>;
  cancelMatch: (matchId: string, reason?: string) => Promise<void>;
  refreshMatch: (matchId: string) => Promise<void>;
  clearMatches: () => void;
}

export const useMatchesStore = create<MatchesState>((set, get) => ({
  matches: [],
  loading: false,
  error: null,

  fetchMatches: async () => {
    set({ loading: true, error: null });
    try {
      const data = await matchesApi.list();
      set({ matches: data.matches, loading: false });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch matches", loading: false });
    }
  },

  updateMatchStatus: async (matchId: string, status: string) => {
    try {
      await matchesApi.updateStatus(matchId, status);
      
      // Update local state
      set((state) => ({
        matches: state.matches.map((m) =>
          m.id === matchId ? { ...m, status: status as Match["status"] } : m
        ),
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to update match status" });
      throw error;
    }
  },

  cancelMatch: async (matchId: string, reason?: string) => {
    try {
      await matchesApi.cancel(matchId, reason);
      
      // Update local state
      set((state) => ({
        matches: state.matches.map((m) =>
          m.id === matchId ? { ...m, status: "CANCELLED" as Match["status"] } : m
        ),
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to cancel match" });
      throw error;
    }
  },

  refreshMatch: async (matchId: string) => {
    try {
      const data = await matchesApi.list();
      const updatedMatch = data.matches.find((m: Match) => m.id === matchId);
      
      if (updatedMatch) {
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? updatedMatch : m
          ),
        }));
      }
    } catch (error: any) {
      set({ error: error.message || "Failed to refresh match" });
    }
  },

  clearMatches: () => {
    set({ matches: [], error: null });
  },
}));
