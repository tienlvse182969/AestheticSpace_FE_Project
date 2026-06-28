import api from "./api";
import type { ApiResponse } from "../types/api.types";

interface CreatePayOsRequest {
  amountVnd: number;
  description: string | null;
  purpose: string | null;
  returnUrl: string | null;
  cancelUrl: string | null;
  storeItemId?: string | null;
  coinsAmount?: number | null;
}

export interface CreatePayOsResponse {
  transactionCode: string;
  checkoutUrl: string;
}

export const paymentService = {
  createPayOsPayment: async (payload: CreatePayOsRequest): Promise<CreatePayOsResponse> => {
    const { data } = await api.post<ApiResponse<CreatePayOsResponse>>(
      "/payment/payos/create",
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
