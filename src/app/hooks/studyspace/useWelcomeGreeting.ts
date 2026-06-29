import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Sunrise, Sun, Sunset, Moon,
  Trophy, Flame, Star, Sprout,
  CalendarCheck, CalendarClock, HeartHandshake,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { pomodoroService } from "../../../services/pomodoro.service";
import { questService } from "../../../services/quest.service";

export interface WelcomeGreetingData {
  timeGreeting: string;
  TimeIcon: LucideIcon;
  praiseMessage: string;
  PraiseIcon: LucideIcon;
  returnMessage: string | null;
  ReturnIcon: LucideIcon | null;
  streakDays: number;
  isLoading: boolean;
}

function getTimeGreeting(name: string): { greeting: string; Icon: LucideIcon } {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return { greeting: `Chào buổi sáng, ${name}!`, Icon: Sunrise };
  if (h >= 11 && h < 17) return { greeting: `Chào buổi chiều, ${name}!`, Icon: Sun };
  if (h >= 17 && h < 22) return { greeting: `Chào buổi tối, ${name}!`, Icon: Sunset };
  return { greeting: `Khuya rồi đấy, ${name}! Nhớ nghỉ ngơi nhé`, Icon: Moon };
}

function getPraiseMessage(
  sessions: number,
  minutes: number,
): { message: string; Icon: LucideIcon } {
  if (sessions >= 20)
    return { message: `Wow! ${sessions} phiên học trong tuần — bạn thật sự kiên trì!`, Icon: Trophy };
  if (sessions >= 10)
    return { message: `Tuần này bạn đã học được ${minutes} phút — tuyệt vời!`, Icon: Flame };
  if (sessions >= 1)
    return { message: `Bạn đã hoàn thành ${sessions} phiên học tuần này, tiếp tục nào!`, Icon: Star };
  return { message: "Hôm nay là ngày tốt để bắt đầu! Bạn có thể làm được", Icon: Sprout };
}

function getReturnMessage(
  lastSessionStart: string,
  lastSessionMinutes: number,
): { message: string; Icon: LucideIcon } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(lastSessionStart);
  lastDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return null;
  if (diffDays === 1)
    return {
      message: `Hôm qua bạn đã học ${lastSessionMinutes} phút — tiếp tục đà này nhé!`,
      Icon: CalendarCheck,
    };
  if (diffDays <= 6)
    return {
      message: `Chào mừng trở lại sau ${diffDays} ngày! Tiếp tục nào!`,
      Icon: CalendarClock,
    };
  return { message: "Lâu rồi mới gặp! Chúng tôi đã nhớ bạn", Icon: HeartHandshake };
}

export function useWelcomeGreeting(): WelcomeGreetingData {
  const { user } = useAuth();
  const [data, setData] = useState<WelcomeGreetingData>({
    timeGreeting: "",
    TimeIcon: Sun,
    praiseMessage: "",
    PraiseIcon: Star,
    returnMessage: null,
    ReturnIcon: null,
    streakDays: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!user) return;

    const { greeting, Icon: TimeIcon } = getTimeGreeting(user.name);

    Promise.all([
      pomodoroService.getStats(),
      pomodoroService.getHistory(1),
      questService.getQuests(),
    ])
      .then(([stats, history, quests]) => {
        const { message: praiseMessage, Icon: PraiseIcon } = getPraiseMessage(
          stats.sessionsLast7Days,
          stats.totalMinutesLast7Days,
        );

        const lastSession = history[0];
        const returnData = lastSession
          ? getReturnMessage(lastSession.startTime, lastSession.durationMinutes)
          : null;

        const streakQuest =
          quests.find((q) => q.triggerKey === "login_streak_30") ??
          quests.find((q) => q.triggerKey === "login_streak_7");
        const streakDays = streakQuest?.progress ?? 0;

        setData({
          timeGreeting: greeting,
          TimeIcon,
          praiseMessage,
          PraiseIcon,
          returnMessage: returnData?.message ?? null,
          ReturnIcon: returnData?.Icon ?? null,
          streakDays,
          isLoading: false,
        });
      })
      .catch(() => {
        setData((prev) => ({ ...prev, timeGreeting: greeting, TimeIcon, isLoading: false }));
      });
  }, [user?.userId]);

  return data;
}
