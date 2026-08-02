import api from "../api";
import type { ApiResponse } from "../../types/api.types";

export type PaymentProvider = "VNPay" | "SePay" | "PayOS";
export type PaymentStatus = "Pending" | "Succeeded" | "Failed" | "Cancelled";
export type PaymentPurpose = "Subscription" | "BuyCoins" | "BuyAsset";

export interface AdminPaymentTransactionDto {
  id: string;
  userId: string;
  username: string | null;
  email: string | null;
  provider: PaymentProvider;
  status: PaymentStatus;
  purpose: PaymentPurpose;
  transactionCode: string | null;
  amount: number;
  currency: string | null;
  isFulfilled: boolean;
  succeededAt: string | null;
  failedAt: string | null;
  createdAt: string;
}

export interface AdminPaymentTransactionPagedResult {
  items: AdminPaymentTransactionDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface GetPaymentsParams {
  search?: string;
  provider?: PaymentProvider;
  status?: PaymentStatus;
  purpose?: PaymentPurpose;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export const adminPaymentsService = {
  getPayments: async (params: GetPaymentsParams = {}): Promise<AdminPaymentTransactionPagedResult> => {
    const { data } = await api.get<ApiResponse<AdminPaymentTransactionPagedResult>>("/admin/payments", { params });
    return data.data;
  },

  getAllPayments: async (params: Omit<GetPaymentsParams, "page" | "pageSize"> = {}): Promise<AdminPaymentTransactionDto[]> => {
    let items: AdminPaymentTransactionDto[] = [];
    let page = 1;
    const pageSize = 100;
    while (true) {
      const result = await adminPaymentsService.getPayments({ ...params, page, pageSize });
      items = items.concat(result.items);
      if (!result.hasNext) break;
      page += 1;
    }
    return items;
  },
};
