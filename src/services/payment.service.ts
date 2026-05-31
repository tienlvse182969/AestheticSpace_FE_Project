import api from "./api";
import type { ApiResponse } from "../types/api.types";

interface CreateVnPayRequest {
  amountVnd: number;
  returnUrl: string;
  description: string;
  purpose: string;
}

interface CreateSePayRequest {
  amountVnd: number;
  description: string;
  purpose: string;
}

export interface CreateVnPayResponse {
  transactionCode: string;
  paymentUrl: string;
}

export interface CreateSePayResponse {
  transactionCode: string;
}

export const paymentService = {
  createVnPayPayment: async (payload: CreateVnPayRequest): Promise<CreateVnPayResponse> => {
    const { data } = await api.post<ApiResponse<CreateVnPayResponse>>(
      "/payment/vnpay/create",
      payload
    );
    return data.data;
  },

  createSePayPayment: async (payload: CreateSePayRequest): Promise<CreateSePayResponse> => {
    const { data } = await api.post<ApiResponse<CreateSePayResponse>>(
      "/payment/sepay/create",
      payload
    );
    return data.data;
  },

  upgradeSubscription: async (transactionCode: string): Promise<void> => {
    await api.post("/subscription/upgrade", { transactionCode });
  },
};
