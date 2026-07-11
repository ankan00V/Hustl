import { create } from "zustand";
import { walletApi } from "@/lib/api";

export interface WalletTransaction {
  id: string;
  type: string;
  amount: string;
  status: string;
  description: string;
  createdAt: string;
}

export interface Wallet {
  balance: string;
  pendingBalance: string;
  totalEarnings: string;
  totalWithdrawals: string;
}

interface WalletState {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  loading: boolean;
  error: string | null;
  transactionsPage: number;
  hasMoreTransactions: boolean;

  // Actions
  fetchWallet: () => Promise<void>;
  fetchTransactions: (page?: number) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  requestPayout: (amount: number, upiId: string) => Promise<void>;
  refreshWallet: () => Promise<void>;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  transactions: [],
  loading: false,
  error: null,
  transactionsPage: 1,
  hasMoreTransactions: true,

  fetchWallet: async () => {
    set({ loading: true, error: null });
    try {
      const data = await walletApi.getBalance();
      set({ wallet: data.wallet, loading: false });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch wallet", loading: false });
    }
  },

  fetchTransactions: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const data = await walletApi.getTransactions(page, 20);
      set({
        transactions: page === 1 ? data.transactions : [...get().transactions, ...data.transactions],
        transactionsPage: page,
        hasMoreTransactions: data.transactions.length === 20,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch transactions", loading: false });
    }
  },

  loadMoreTransactions: async () => {
    const { transactionsPage, hasMoreTransactions, loading } = get();
    if (!hasMoreTransactions || loading) return;

    await get().fetchTransactions(transactionsPage + 1);
  },

  requestPayout: async (amount: number, upiId: string) => {
    try {
      await walletApi.requestPayout(amount, upiId);
      
      // Refresh wallet after payout request
      await get().fetchWallet();
      await get().fetchTransactions(1);
    } catch (error: any) {
      set({ error: error.message || "Failed to request payout" });
      throw error;
    }
  },

  refreshWallet: async () => {
    await Promise.all([
      get().fetchWallet(),
      get().fetchTransactions(1),
    ]);
  },

  clearWallet: () => {
    set({
      wallet: null,
      transactions: [],
      error: null,
      transactionsPage: 1,
      hasMoreTransactions: true,
    });
  },
}));
