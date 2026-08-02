import api from "./api";
import type { ApiResponse } from "../types/api.types";

export interface LuckyDrawHistoryItem {
  id: string;
  rewardCoins: number;
  rewardDescription: string | null;
  createdAt: string;
}

export interface LuckyDrawStatus {
  remainingDrawsToday: number;
  maxDrawsToday: number;
  canSpin: boolean;
  isPremium: boolean;
  drawHistoryToday: LuckyDrawHistoryItem[] | null;
}

export interface LuckyDrawResult {
  rewardCoins: number;
  rewardDescription: string | null;
  remainingDrawsToday: number;
  newCoinsBalance: number;
}

export const luckyDrawService = {
  getStatus: async (): Promise<LuckyDrawStatus> => {
    const { data } = await api.get<ApiResponse<LuckyDrawStatus>>("/lucky-draw/status");
    return data.data;
  },

  spin: async (): Promise<LuckyDrawResult> => {
    const { data } = await api.post<ApiResponse<LuckyDrawResult>>("/lucky-draw/spin");
    return data.data;
  },
};
