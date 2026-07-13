import api from "./api";
import type { ApiResponse } from "../types/api.types";

export interface NotificationDto {
  id: string;
  userId: string | null;
  isForAdmin: boolean;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function unwrapList(raw: unknown): NotificationDto[] {
  if (Array.isArray(raw)) return raw;
  const items = (raw as { items?: NotificationDto[] } | null)?.items;
  return items ?? [];
}

export const notificationService = {
  getMyNotifications: async (): Promise<NotificationDto[]> => {
    const { data } = await api.get<ApiResponse<NotificationDto[]>>("/notifications");
    return unwrapList(data.data);
  },

  markRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.post("/notifications/read-all");
  },
};
