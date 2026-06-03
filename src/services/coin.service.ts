import api from "./api";
import type { ApiResponse } from "../types/api.types";

export interface CoinBalance {
  balance: number;
}

export interface CoinTransaction {
  id: string;
  type: 0 | 1 | 2;
  amount: number;
  reason: string | null;
  relatedPurchaseId: string | null;
  relatedMissionId: string | null;
  createdAt: string;
}

interface TransactionPage {
  items: CoinTransaction[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const coinService = {
  getBalance: async (): Promise<CoinBalance> => {
    const { data } = await api.get<ApiResponse<CoinBalance>>("/coins/balance");
    return data.data;
  },

  getTransactions: async (page = 1, pageSize = 5): Promise<CoinTransaction[]> => {
    const { data } = await api.get<ApiResponse<TransactionPage>>("/coins/transactions", {
      params: { page, pageSize },
    });
    return data.data?.items ?? [];
  },
};
