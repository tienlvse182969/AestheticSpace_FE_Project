import api from "./api";
import type { ApiResponse, PaginatedResponse } from "../types/api.types";
import type { User, UpdateProfileRequest, ChangePasswordRequest } from "../types/user.types";

export const userService = {
  getAll: async (page = 1, limit = 10) => {
    const { data } = await api.get<PaginatedResponse<User>>("/users", {
      params: { page, limit },
    });
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },

  updateProfile: async (id: string, payload: UpdateProfileRequest) => {
    const { data } = await api.patch<ApiResponse<User>>(`/users/${id}`, payload);
    return data.data;
  },

  changePassword: async (id: string, payload: ChangePasswordRequest) => {
    const { data } = await api.patch<ApiResponse<void>>(`/users/${id}/password`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<void>>(`/users/${id}`);
    return data;
  },
};
