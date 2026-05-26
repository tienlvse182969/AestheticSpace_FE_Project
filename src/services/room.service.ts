import api from "./api";
import type { ApiResponse } from "../types/api.types";
import type { Room, RoomDetail } from "../types/room.types";

export const roomService = {
  getAll: async (): Promise<Room[]> => {
    const { data } = await api.get<ApiResponse<Room[]>>("/rooms");
    return data.data ?? [];
  },

  getById: async (id: string): Promise<RoomDetail> => {
    const { data } = await api.get<ApiResponse<RoomDetail>>(`/rooms/${id}`);
    return data.data;
  },
};
