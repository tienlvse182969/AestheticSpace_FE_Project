import api from "../api";
import type { ApiResponse } from "../../types/api.types";

export interface AssetDto {
  id: string;
  name: string | null;
  description: string | null;
  url: string | null;
  type: string | null;
  category: string | null;
  defaultVolume: number;
  isPremium: boolean;
}

export interface AssetFormData {
  name: string;
  description: string;
  url: string;
  type: string;
  category: string;
  defaultVolume: number;
  isPremium: boolean;
}

export const adminAssetsService = {
  getAssets: async (type?: string, category?: string): Promise<AssetDto[]> => {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (category) params.category = category;
    const { data } = await api.get<ApiResponse<AssetDto[]>>("/assets", { params });
    return data.data;
  },

  createAsset: async (body: AssetFormData): Promise<AssetDto> => {
    const { data } = await api.post<ApiResponse<AssetDto>>("/admin/assets", body);
    return data.data;
  },

  updateAsset: async (id: string, body: AssetFormData): Promise<AssetDto> => {
    const { data } = await api.put<ApiResponse<AssetDto>>(`/admin/assets/${id}`, body);
    return data.data;
  },

  deleteAsset: async (id: string): Promise<void> => {
    await api.delete(`/admin/assets/${id}`);
  },
};
