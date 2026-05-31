import api from "./api";
import { tokenStore } from "./token.store";
import type { ApiResponse } from "../types/api.types";
import type { LoginRequest, RegisterRequest, AuthData } from "../types/auth.types";

export const authService = {
  login: async (payload: LoginRequest, rememberMe = false) => {
    const { data } = await api.post<ApiResponse<AuthData>>("/auth/login", payload);
    tokenStore.setTokens(data.data.accessToken, data.data.refreshToken, rememberMe);
    return data.data;
  },

  register: async (payload: RegisterRequest) => {
    const { data } = await api.post<ApiResponse<AuthData>>("/auth/register", payload);
    tokenStore.setTokens(data.data.accessToken, data.data.refreshToken, true);
    return data.data;
  },

  googleLogin: async (idToken: string): Promise<AuthData> => {
    const { data } = await api.post<ApiResponse<AuthData>>("/auth/google-login", { idToken });
    tokenStore.setTokens(data.data.accessToken, data.data.refreshToken, true);
    return data.data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post<ApiResponse<object>>("/auth/forgot-password", { email });
    return data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const { data } = await api.post<ApiResponse<object>>("/auth/reset-password", { token, newPassword });
    return data;
  },

  logout: () => {
    tokenStore.clearTokens();
  },
};
