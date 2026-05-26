import api from "./api";
import type { ApiResponse, PaginatedResponse } from "../types/api.types";
import type { Background, CreateBackgroundRequest, UpdateBackgroundRequest } from "../types/background.types";

export const backgroundService = {
  getAll: async (page = 1, limit = 20, category?: string) => {
    const { data } = await api.get<PaginatedResponse<Background>>("/backgrounds", {
      params: { page, limit, category },
    });
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Background>>(`/backgrounds/${id}`);
    return data.data;
  },

  create: async (payload: CreateBackgroundRequest) => {
    const { data } = await api.post<ApiResponse<Background>>("/backgrounds", payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateBackgroundRequest) => {
    const { data } = await api.patch<ApiResponse<Background>>(`/backgrounds/${id}`, payload);
    return data.data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<void>>(`/backgrounds/${id}`);
    return data;
  },
};
