import api from "./api";
import type { ApiResponse } from "../types/api.types";

export type ThemeSubmissionStatus =
  | "AdminCreated"
  | "PendingReview"
  | "PendingTransaction"
  | "PurchasedPendingPricing"
  | "Approved"
  | "Rejected";

export interface ThemeInlineComponent {
  id: string;
  category: "Background" | "Sticker" | "AmbientSound" | "Effect";
  name: string;
  description: string | null;
  assetUrl: string | null;
  previewUrl: string | null;
  coinPrice: number | null;
  realMoneyPriceVnd: number | null;
  status: ThemeSubmissionStatus;
  rejectionNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface UserThemeSubmission {
  id: string;
  name: string;
  description: string | null;
  assetUrl: string | null;
  previewUrl: string | null;
  themeStickerItemId: string | null;
  themeBackgroundItemId: string | null;
  themeEffectItemId: string | null;
  themeAmbientSoundItemId: string | null;
  coinPrice: number | null;
  realMoneyPriceVnd: number | null;
  requestedCoinPrice: number | null;
  requestedRealMoneyPriceVnd: number | null;
  isBoughtByAdmin: boolean;
  transactionNote: string | null;
  themeSource: "Official" | "Community";
  status: ThemeSubmissionStatus;
  rejectionNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  /** All component items embedded by the backend */
  inlineComponents: ThemeInlineComponent[];
}

export interface InlineComponentDto {
  category: "Background" | "Sticker" | "AmbientSound";
  name: string;
  description?: string;
  assetUrl: string;
  previewUrl?: string;
}

export interface SubmitThemeDto {
  name: string;
  description?: string;
  assetUrl: string;
  previewUrl?: string;
  inlineBackground?: InlineComponentDto;
  inlineSticker?: InlineComponentDto;
  inlineAmbientSound?: InlineComponentDto;
  requestedCoinPrice?: number;
  requestedRealMoneyPriceVnd?: number;
  isAgreedToTerms: boolean;
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountOwnerName?: string;
}

interface PagedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const userThemeService = {
  submit: async (dto: SubmitThemeDto): Promise<UserThemeSubmission> => {
    const { data } = await api.post<ApiResponse<UserThemeSubmission>>("/me/themes", dto);
    return data.data;
  },

  getMyThemes: async (page = 1, pageSize = 50): Promise<UserThemeSubmission[]> => {
    const { data } = await api.get<ApiResponse<PagedData<UserThemeSubmission>>>("/me/themes", {
      params: { page, pageSize },
    });
    return data.data?.items ?? [];
  },

  update: async (id: string, dto: SubmitThemeDto): Promise<UserThemeSubmission> => {
    const { data } = await api.put<ApiResponse<UserThemeSubmission>>(`/me/themes/${id}`, dto);
    return data.data;
  },

  withdraw: async (id: string): Promise<void> => {
    await api.delete(`/me/themes/${id}`);
  },
};
