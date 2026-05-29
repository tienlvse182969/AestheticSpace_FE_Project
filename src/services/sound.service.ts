import api from "./api";
import type { ApiResponse, PaginatedResponse } from "../types/api.types";
import type { Sound, CreateSoundRequest, UpdateSoundRequest } from "../types/sound.types";

export const soundService = {
  getAll: async (page = 1, limit = 20, category?: string) => {
    const { data } = await api.get<PaginatedResponse<Sound>>("/sounds", {
      params: { page, limit, category },
    });
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Sound>>(`/sounds/${id}`);
    return data.data;
  },

  create: async (payload: CreateSoundRequest) => {
    const { data } = await api.post<ApiResponse<Sound>>("/sounds", payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateSoundRequest) => {
    const { data } = await api.patch<ApiResponse<Sound>>(`/sounds/${id}`, payload);
    return data.data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<void>>(`/sounds/${id}`);
    return data;
  },
};
