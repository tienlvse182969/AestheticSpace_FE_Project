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

const DELETED_EMAIL_RE = /^deleted-[0-9a-f-]{36}@/i;

export function isDeletedAccount(u: AdminUserDto): boolean {
  return !!u.email && DELETED_EMAIL_RE.test(u.email);
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

  getAllUsers: async (): Promise<AdminUserDto[]> => {
    let items: AdminUserDto[] = [];
    let page = 1;
    const pageSize = 100;
    while (true) {
      const result = await adminUsersService.getUsers(page, pageSize);
      items = items.concat(result.items);
      if (!result.hasNext) break;
      page += 1;
    }
    return items;
  },
};
