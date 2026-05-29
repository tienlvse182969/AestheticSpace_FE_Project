import api from "./api";
import type { ApiResponse } from "../types/api.types";

export interface TodoDto {
  id: string;
  content: string;
  isCompleted: boolean;
  createdAt: string;
}

export const todoService = {
  getAll: async (): Promise<TodoDto[]> => {
    const { data } = await api.get<ApiResponse<TodoDto[]>>("/todos");
    return data.data ?? [];
  },

  create: async (content: string): Promise<TodoDto> => {
    const { data } = await api.post<ApiResponse<TodoDto>>("/todos", { content });
    return data.data;
  },

  update: async (id: string, patch: { content?: string; isCompleted?: boolean }): Promise<TodoDto> => {
    const { data } = await api.put<ApiResponse<TodoDto>>(`/todos/${id}`, patch);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/todos/${id}`);
  },
};
