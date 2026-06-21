import api from "../api";
import type { ApiResponse } from "../../types/api.types";

export type StoreCategory = "Theme" | "Background" | "Sticker" | "Effect" | "AmbientSound";
export type StoreThemeSource = "Official" | "Community";
export type StoreItemStatus = "AdminCreated" | "PendingReview" | "Approved" | "Rejected";

export interface AdminStoreItemDto {
  id: string;
  category: StoreCategory;
  themeSource: StoreThemeSource | null;
  name: string | null;
  description: string | null;
  assetUrl: string | null;
  previewUrl: string | null;
  themeStickerItemId: string | null;
  themeBackgroundItemId: string | null;
  themeEffectItemId: string | null;
  themeAmbientSoundItemId: string | null;
  isPremium: boolean;
  coinPrice: number | null;
  realMoneyPriceVnd: number | null;
  isActive: boolean;
  status: StoreItemStatus;
  creatorId: string | null;
  creatorUsername: string | null;
  rejectionNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface StoreItemPagedResult {
  items: AdminStoreItemDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CreateStoreItemBody {
  category: StoreCategory;
  themeSource: StoreThemeSource;
  name: string | null;
  description: string | null;
  assetUrl: string | null;
  previewUrl?: string | null;
  themeBackgroundItemId?: string | null;
  themeStickerItemId?: string | null;
  themeAmbientSoundItemId?: string | null;
  isPremium: boolean;
  coinPrice: number | null;
  realMoneyPriceVnd: number | null;
  isActive: boolean;
}

export interface ApproveItemBody {
  isPremium: boolean;
  coinPrice: number | null;
  realMoneyPriceVnd: number | null;
}

export const adminStoreService = {
  getItems: async (params?: {
    category?: StoreCategory;
    themeSource?: StoreThemeSource;
    includeInactive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<StoreItemPagedResult> => {
    const { data } = await api.get<ApiResponse<StoreItemPagedResult>>("/admin/store/items", { params });
    return data.data;
  },

  createItem: async (body: CreateStoreItemBody): Promise<AdminStoreItemDto> => {
    const { data } = await api.post<ApiResponse<AdminStoreItemDto>>("/admin/store/items", body);
    return data.data;
  },

  updateItem: async (id: string, body: CreateStoreItemBody): Promise<AdminStoreItemDto> => {
    const { data } = await api.put<ApiResponse<AdminStoreItemDto>>(`/admin/store/items/${id}`, body);
    return data.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/admin/store/items/${id}`);
  },

  getPendingItems: async (params?: {
    category?: StoreCategory;
    page?: number;
    pageSize?: number;
  }): Promise<StoreItemPagedResult> => {
    const { data } = await api.get<ApiResponse<StoreItemPagedResult>>("/admin/store/items/pending", { params });
    return data.data;
  },

  approveItem: async (id: string, body: ApproveItemBody): Promise<AdminStoreItemDto> => {
    const { data } = await api.post<ApiResponse<AdminStoreItemDto>>(`/admin/store/items/${id}/approve`, body);
    return data.data;
  },

  rejectItem: async (id: string, body: { rejectionNote: string }): Promise<AdminStoreItemDto> => {
    const { data } = await api.post<ApiResponse<AdminStoreItemDto>>(`/admin/store/items/${id}/reject`, body);
    return data.data;
  },

  approveComponent: async (id: string, body: ApproveItemBody): Promise<AdminStoreItemDto> => {
    const { data } = await api.post<ApiResponse<AdminStoreItemDto>>(`/admin/store/items/${id}/approve-component`, body);
    return data.data;
  },

  rejectComponent: async (id: string, body: { rejectionNote: string }): Promise<AdminStoreItemDto> => {
    const { data } = await api.post<ApiResponse<AdminStoreItemDto>>(`/admin/store/items/${id}/reject-component`, body);
    return data.data;
  },
};
