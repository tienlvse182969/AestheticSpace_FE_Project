import api from "./api";
import type { ApiResponse } from "../types/api.types";
import type { LoginRequest, RegisterRequest, AuthData } from "../types/auth.types";

export const authService = {
  login: async (payload: LoginRequest) => {
    const { data } = await api.post<ApiResponse<AuthData>>("/auth/login", payload);
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
    return data.data;
  },

  register: async (payload: RegisterRequest) => {
    const { data } = await api.post<ApiResponse<AuthData>>("/auth/register", payload);
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
    return data.data;
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};
