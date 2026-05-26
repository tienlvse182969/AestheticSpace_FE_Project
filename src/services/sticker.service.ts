import api from "./api";
import type { ApiResponse, PaginatedResponse } from "../types/api.types";
import type { Sticker, CreateStickerRequest, UpdateStickerRequest } from "../types/sticker.types";

export const stickerService = {
  getAll: async (page = 1, limit = 20, category?: string) => {
    const { data } = await api.get<PaginatedResponse<Sticker>>("/stickers", {
      params: { page, limit, category },
    });
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Sticker>>(`/stickers/${id}`);
    return data.data;
  },

  create: async (payload: CreateStickerRequest) => {
    const { data } = await api.post<ApiResponse<Sticker>>("/stickers", payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateStickerRequest) => {
    const { data } = await api.patch<ApiResponse<Sticker>>(`/stickers/${id}`, payload);
    return data.data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<void>>(`/stickers/${id}`);
    return data;
  },
};
