import api from "./api";
import type { ApiResponse } from "../types/api.types";
import type { Room, RoomDetail, UserRoom } from "../types/room.types";

export interface UserRoomRequest {
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  backgroundUrl?: string | null;
}

export const roomService = {
  // Preset / system rooms
  getAll: async (): Promise<Room[]> => {
    const { data } = await api.get<ApiResponse<Room[]>>("/rooms");
    return data.data ?? [];
  },

  getById: async (id: string): Promise<RoomDetail> => {
    const { data } = await api.get<ApiResponse<RoomDetail>>(`/rooms/${id}`);
    return data.data;
  },

  // User's custom rooms (api/my/rooms)
  getMyRooms: async (): Promise<UserRoom[]> => {
    const { data } = await api.get<ApiResponse<UserRoom[]>>("/my/rooms");
    return data.data ?? [];
  },

  createMyRoom: async (body: UserRoomRequest): Promise<UserRoom> => {
    const { data } = await api.post<ApiResponse<UserRoom>>("/my/rooms", body);
    return data.data;
  },

  updateMyRoom: async (id: string, body: UserRoomRequest): Promise<UserRoom> => {
    const { data } = await api.put<ApiResponse<UserRoom>>(`/my/rooms/${id}`, body);
    return data.data;
  },

  deleteMyRoom: async (id: string): Promise<void> => {
    await api.delete(`/my/rooms/${id}`);
  },
};
