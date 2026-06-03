import api from "./api";
import type { ApiResponse } from "../types/api.types";

export interface PomodoroSessionDto {
  id: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  isActive: boolean;
}

export interface PomodoroStatsDto {
  sessionsLast7Days: number;
  totalMinutesLast7Days: number;
  sessionsLast30Days: number;
  totalMinutesLast30Days: number;
}

export interface PomodoroHistoryPage {
  items: PomodoroSessionDto[];
  totalCount: number;
}

export const pomodoroService = {
  start: async (durationMinutes: number): Promise<PomodoroSessionDto> => {
    const { data } = await api.post<ApiResponse<PomodoroSessionDto>>("/pomodoro/start", { durationMinutes });
    return data.data;
  },

  end: async (sessionId: string): Promise<PomodoroSessionDto> => {
    const { data } = await api.post<ApiResponse<PomodoroSessionDto>>("/pomodoro/end", { sessionId });
    return data.data;
  },

  cancel: async (sessionId: string): Promise<void> => {
    await api.post("/pomodoro/cancel", { sessionId });
  },

  getStats: async (): Promise<PomodoroStatsDto> => {
    const { data } = await api.get<ApiResponse<PomodoroStatsDto>>("/pomodoro/stats");
    return data.data;
  },

  getHistory: async (pageSize = 50): Promise<PomodoroSessionDto[]> => {
    const { data } = await api.get<ApiResponse<PomodoroHistoryPage>>(
      `/pomodoro/history?page=1&pageSize=${pageSize}`
    );
    return data.data?.items ?? [];
  },
};
