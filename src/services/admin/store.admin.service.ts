import api from "../api";
import type { ApiResponse } from "../../types/api.types";

export type StoreCategory = "Theme" | "Background" | "Sticker" | "Effect" | "AmbientSound";
export type StoreThemeSource = "Official" | "Community";
export type StoreItemStatus =
  | "AdminCreated"
  | "PendingReview"
  | "PendingTransaction"
  | "PurchasedPendingPricing"
  | "Approved"
  | "Rejected";

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
  requestedCoinPrice: number | null;
  requestedRealMoneyPriceVnd: number | null;
  isBoughtByAdmin: boolean;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankAccountOwnerName: string | null;
  transactionNote: string | null;
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

export interface ApproveTransactionBody {
  payInCoins: boolean;
  transactionNote?: string;
}

export interface RejectTransactionBody {
  rejectionNote: string;
}

export interface PricePublishBody {
  coinPrice: number;
  isPremium: boolean;
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

  getPendingTransactions: async (params?: {
    category?: StoreCategory;
    page?: number;
    pageSize?: number;
  }): Promise<StoreItemPagedResult> => {
    const { data } = await api.get<ApiResponse<StoreItemPagedResult>>("/admin/store/items/pending-transactions", { params });
    return data.data;
  },

  approveTransaction: async (id: string, body: ApproveTransactionBody): Promise<AdminStoreItemDto> => {
    const { data } = await api.post<ApiResponse<AdminStoreItemDto>>(`/admin/store/items/${id}/approve-transaction`, body);
    return data.data;
  },

  rejectTransaction: async (id: string, body: RejectTransactionBody): Promise<AdminStoreItemDto> => {
    const { data } = await api.post<ApiResponse<AdminStoreItemDto>>(`/admin/store/items/${id}/reject-transaction`, body);
    return data.data;
  },

  getPurchasedPendingPricing: async (params?: {
    category?: StoreCategory;
    page?: number;
    pageSize?: number;
  }): Promise<StoreItemPagedResult> => {
    const { data } = await api.get<ApiResponse<StoreItemPagedResult>>("/admin/store/items/purchased-pending-pricing", { params });
    return data.data;
  },

  pricePublish: async (id: string, body: PricePublishBody): Promise<AdminStoreItemDto> => {
    const { data } = await api.post<ApiResponse<AdminStoreItemDto>>(`/admin/store/items/${id}/price-publish`, body);
    return data.data;
  },
};
