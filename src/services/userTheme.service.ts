import api from "./api";
import type { ApiResponse } from "../types/api.types";

export type ThemeSubmissionStatus = "AdminCreated" | "PendingReview" | "Approved" | "Rejected";

export interface UserThemeSubmission {
  id: string;
  name: string;
  description: string | null;
  assetUrl: string | null;
  themeStickerItemId: string | null;
  themeBackgroundItemId: string | null;
  themeEffectItemId: string | null;
  themeAmbientSoundItemId: string | null;
  coinPrice: number | null;
  realMoneyPriceVnd: number | null;
  themeSource: "Official" | "Community";
  status: ThemeSubmissionStatus;
  rejectionNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface SubmitThemeDto {
  name: string;
  description?: string;
  assetUrl: string;
  themeStickerItemId?: string;
  themeBackgroundItemId?: string;
  themeEffectItemId?: string;
  themeAmbientSoundItemId?: string;
  coinPrice?: number;
  realMoneyPriceVnd?: number;
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

  withdraw: async (id: string): Promise<void> => {
    await api.delete(`/me/themes/${id}`);
  },
};
