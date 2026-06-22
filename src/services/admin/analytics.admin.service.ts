import api from "../api";
import type { ApiResponse } from "../../types/api.types";

export interface AdminOverview {
  totalUsers: number;
  activeUsersToday: number;
  newUsersThisMonth: number;
  totalPremiumUsers: number;
  totalRevenueVnd: number;
}

export interface AdminDateCount {
  date: string;
  count: number;
}

export interface AdminFeatureUsage {
  pomodoroSessions: number;
  todosCompleted: number;
  roomsVisited: number;
  paymentsSucceeded: number;
}

export interface AdminRevenueSummary {
  totalRevenueVnd: number;
  subscriptionRevenueVnd: number;
  coinPackRevenueVnd: number;
  assetRevenueVnd: number;
  totalTransactions: number;
}

export interface AdminRevenueTrend {
  date: string;
  amountVnd: number;
  transactions: number;
}

export const analyticsAdminService = {
  getOverview: async (): Promise<AdminOverview> => {
    const { data } = await api.get<ApiResponse<AdminOverview>>("/admin/analytics/overview");
    return data.data;
  },

  getUserGrowth: async (days = 30): Promise<AdminDateCount[]> => {
    const { data } = await api.get<ApiResponse<AdminDateCount[]>>("/admin/analytics/user-growth", {
      params: { days },
    });
    return data.data ?? [];
  },

  getFeatureUsage: async (): Promise<AdminFeatureUsage> => {
    const { data } = await api.get<ApiResponse<AdminFeatureUsage>>("/admin/analytics/feature-usage");
    return data.data;
  },

  getRevenueSummary: async (): Promise<AdminRevenueSummary> => {
    const { data } = await api.get<ApiResponse<AdminRevenueSummary>>("/admin/analytics/revenue");
    return data.data;
  },

  getRevenueTrend: async (days = 30): Promise<AdminRevenueTrend[]> => {
    const { data } = await api.get<ApiResponse<AdminRevenueTrend[]>>("/admin/analytics/revenue-trend", {
      params: { days },
    });
    return data.data ?? [];
  },
};
