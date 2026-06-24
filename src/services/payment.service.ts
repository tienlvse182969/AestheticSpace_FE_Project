import api from "./api";
import type { ApiResponse } from "../types/api.types";

interface CreateVnPayRequest {
  amountVnd: number;
  returnUrl: string | null;
  description: string | null;
  purpose: string;
  storeItemId?: string | null;
  coinsAmount?: number | null;
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

  startTrial: async (): Promise<void> => {
    await api.post("/subscription/trial");
  },
};
