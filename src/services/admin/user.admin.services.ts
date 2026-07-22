import api from "../api";
import type { ApiResponse } from "../../types/api.types";

export interface AdminUserDto {
  id: string;
  username: string | null;
  email: string | null;
  role: string | null;
  accountTier: string | null;
  isBanned: boolean;
  coinsBalance: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminUserPagedResult {
  items: AdminUserDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const adminUsersService = {
  getUsers: async (page = 1, pageSize = 20): Promise<AdminUserPagedResult> => {
    const { data } = await api.get<ApiResponse<AdminUserPagedResult>>(
      `/admin/users?page=${page}&pageSize=${pageSize}`
    );
    return data.data;
  },

  banUser: async (id: string): Promise<void> => {
    await api.put(`/admin/users/${id}/ban`);
  },

  unbanUser: async (id: string): Promise<void> => {
    await api.put(`/admin/users/${id}/unban`);
  },

  addCoins: async (id: string, amount: number): Promise<void> => {
    await api.post(`/admin/users/${id}/add-coins`, { amount });
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },
};
