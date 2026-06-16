import api from "./api";
import type { ApiResponse } from "../types/api.types";

export type StoreCategory = "Theme" | "Background" | "Sticker" | "Effect" | "AmbientSound";

export interface StoreItem {
  id: string;
  category: StoreCategory;
  name: string;
  description: string | null;
  assetUrl: string | null;
  isPremium: boolean;
  coinPrice: number | null;
  realMoneyPriceVnd: number | null;
  isActive: boolean;
  isOwned: boolean | null;
  canBuyWithCoins: boolean;
  canBuyWithMoney: boolean;
  themeBackgroundItemId?: string | null;
  themeStickerItemId?: string | null;
  themeAmbientSoundItemId?: string | null;
  previewUrl?: string | null;
}

export interface InventoryItem {
  inventoryId: string;
  storeItemId: string;
  category: StoreCategory;
  name: string;
  description: string | null;
  assetUrl: string | null;
  isPremium: boolean;
  acquiredAt: string;
}

export interface StorePurchaseResult {
  purchased: boolean;
  storeItemId: string;
  remainingCoins: number;
}

interface PagedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const aestheticStoreService = {
  getItems: async (category?: StoreCategory, page = 1, pageSize = 50): Promise<StoreItem[]> => {
    const params: Record<string, unknown> = { page, pageSize };
    if (category) params.category = category;
    const { data } = await api.get<ApiResponse<PagedData<StoreItem>>>("/store/catalog", { params });
    return data.data?.items ?? [];
  },

  getInventory: async (page = 1, pageSize = 50): Promise<InventoryItem[]> => {
    const { data } = await api.get<ApiResponse<PagedData<InventoryItem>>>("/store/me/inventory", {
      params: { page, pageSize },
    });
    return data.data?.items ?? [];
  },

  purchase: async (storeItemId: string): Promise<StorePurchaseResult> => {
    const { data } = await api.post<ApiResponse<StorePurchaseResult>>("/store/purchase", { storeItemId });
    return data.data;
  },
};
