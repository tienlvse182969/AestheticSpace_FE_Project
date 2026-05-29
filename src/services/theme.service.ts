import api from "./api";
import type { ApiResponse, PaginatedResponse } from "../types/api.types";
import type { Theme, CreateThemeRequest, UpdateThemeRequest } from "../types/theme.types";

export const themeService = {
  getAll: async (page = 1, limit = 20) => {
    const { data } = await api.get<PaginatedResponse<Theme>>("/themes", {
      params: { page, limit },
    });
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Theme>>(`/themes/${id}`);
    return data.data;
  },

  create: async (payload: CreateThemeRequest) => {
    const { data } = await api.post<ApiResponse<Theme>>("/themes", payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateThemeRequest) => {
    const { data } = await api.patch<ApiResponse<Theme>>(`/themes/${id}`, payload);
    return data.data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<void>>(`/themes/${id}`);
    return data;
  },
};
