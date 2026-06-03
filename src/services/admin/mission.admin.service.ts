import api from "../api";
import type { ApiResponse } from "../../types/api.types";

export interface AdminMissionDto {
  id: string;
  code: string | null;
  name: string | null;
  description: string | null;
  rewardCoins: number;
  triggerKey: string | null;
  targetValue: number | null;
  frequency: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface MissionPagedResult {
  items: AdminMissionDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface MissionFormData {
  code: string;
  name: string;
  description: string;
  rewardCoins: number;
  triggerKey: string;
  targetValue: number | null;
  frequency: string;
  isActive: boolean;
}

export const adminMissionsService = {
  getMissions: async (page = 1, pageSize = 20, includeInactive = true): Promise<MissionPagedResult> => {
    const { data } = await api.get<ApiResponse<MissionPagedResult>>("/admin/missions", {
      params: { page, pageSize, includeInactive },
    });
    return data.data;
  },

  createMission: async (body: MissionFormData): Promise<AdminMissionDto> => {
    const { data } = await api.post<ApiResponse<AdminMissionDto>>("/admin/missions", body);
    return data.data;
  },

  updateMission: async (id: string, body: MissionFormData): Promise<AdminMissionDto> => {
    const { data } = await api.put<ApiResponse<AdminMissionDto>>(`/admin/missions/${id}`, body);
    return data.data;
  },

  deleteMission: async (id: string): Promise<void> => {
    await api.delete(`/admin/missions/${id}`);
  },
};
