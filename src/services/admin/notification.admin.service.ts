import api from "../api";
import type { ApiResponse } from "../../types/api.types";
import type { NotificationDto } from "../notification.service";

export type { NotificationDto };

function unwrapList(raw: unknown): NotificationDto[] {
  if (Array.isArray(raw)) return raw;
  const items = (raw as { items?: NotificationDto[] } | null)?.items;
  return items ?? [];
}

export const adminNotificationService = {
  getAdminNotifications: async (): Promise<NotificationDto[]> => {
    const { data } = await api.get<ApiResponse<NotificationDto[]>>("/notifications/admin");
    return unwrapList(data.data);
  },

  markRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.post("/notifications/read-all");
  },
};
