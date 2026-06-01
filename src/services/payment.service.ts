import api from "./api";
import type { ApiResponse } from "../types/api.types";

interface CreateVnPayRequest {
  amountVnd: number;
  returnUrl: string;
  description: string;
  purpose: string;
  storeItemId?: string;
  coinsAmount?: number;
}

export interface CreateVnPayResponse {
  transactionCode: string;
  paymentUrl: string;
}

export const paymentService = {
  createVnPayPayment: async (payload: CreateVnPayRequest): Promise<CreateVnPayResponse> => {
    const { data } = await api.post<ApiResponse<CreateVnPayResponse>>(
      "/payment/vnpay/create",
      payload
    );
    return data.data;
  },

  upgradeSubscription: async (transactionCode: string): Promise<void> => {
    await api.post("/subscription/upgrade", { transactionCode });
  },
};
