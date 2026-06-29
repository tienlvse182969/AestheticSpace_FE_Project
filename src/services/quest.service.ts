import api from "./api";
import type { ApiResponse } from "../types/api.types";
import type { LucideIcon } from "lucide-react";
import {
  LogIn,
  Flame,
  CircleCheck,
  Music,
  Trophy,
  CalendarDays,
  Palette,
  Zap,
  Leaf,
  Image,
  CalendarCheck,
  Star,
  Crown,
} from "lucide-react";

export type QuestCategory = "daily" | "weekly" | "achievement";
export type QuestStatus = "active" | "claimable" | "claimed";

export interface Quest {
  id: string;
  triggerKey: string | null;
  title: string;
  description: string;
  category: QuestCategory;
  reward: number;
  progress: number;
  target: number;
  status: QuestStatus;
  icon: LucideIcon;
}

interface MissionWithProgressDto {
  id: string;
  code: string | null;
  name: string | null;
  description: string | null;
  rewardCoins: number;
  triggerKey: string | null;
  targetValue: number | null;
  frequency: string | null;
  progressValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
  periodDate: string;
  completedAt: string | null;
  claimedAt: string | null;
}

const TRIGGER_ICON: Record<string, LucideIcon> = {
  daily_login: LogIn,
  pomodoro_complete: Flame,
  pomodoro_minutes: Flame,
  todo_complete: CircleCheck,
  ambient_minutes: Music,
  weekly_pomodoro: Trophy,
  weekly_login: CalendarDays,
  weekly_theme_change: Palette,
  weekly_todo: Zap,
  first_pomodoro: Leaf,
  first_theme: Image,
  login_streak_7: CalendarCheck,
  pomodoro_100: Star,
  login_streak_30: Crown,
};

function mapFrequencyToCategory(frequency: string | null): QuestCategory {
  if (frequency === "daily") return "daily";
  if (frequency === "weekly") return "weekly";
  return "achievement";
}

function mapStatus(isCompleted: boolean, isClaimed: boolean): QuestStatus {
  if (isClaimed) return "claimed";
  if (isCompleted) return "claimable";
  return "active";
}

function mapMissionToQuest(m: MissionWithProgressDto): Quest {
  return {
    id: m.id,
    triggerKey: m.triggerKey,
    title: m.name ?? "",
    description: m.description ?? "",
    category: mapFrequencyToCategory(m.frequency),
    reward: m.rewardCoins,
    progress: m.progressValue,
    target: m.targetValue ?? 1,
    status: mapStatus(m.isCompleted, m.isClaimed),
    icon: TRIGGER_ICON[m.triggerKey ?? ""] ?? Star,
  };
}

export const questService = {
  getQuests: async (): Promise<Quest[]> => {
    const { data } = await api.get<ApiResponse<MissionWithProgressDto[]>>("/missions");
    return (data.data ?? []).map(mapMissionToQuest);
  },

  claimReward: async (missionId: string): Promise<void> => {
    await api.post(`/missions/${missionId}/claim`);
  },
};
