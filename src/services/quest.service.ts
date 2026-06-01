// TODO: Replace mock data with actual API calls when backend is ready
// Expected endpoints:
//   GET  /users/:userId/quests          → Quest[]
//   POST /users/:userId/quests/:id/claim → { newBalance: number }

export type QuestCategory = "daily" | "weekly" | "achievement";
export type QuestStatus = "active" | "claimable" | "claimed";

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  reward: number; // đơn vị coin = VND
  progress: number;
  target: number;
  status: QuestStatus;
  icon: string;
}

export interface ClaimResult {
  newBalance: number;
}

const MOCK_QUESTS: Quest[] = [
  // ── Daily ──────────────────────────────────────────────────────────────
  {
    id: "daily-visit",
    title: "Ghé thăm không gian",
    description: "Mở và học trong không gian ít nhất 15 phút",
    category: "daily",
    reward: 500,
    progress: 1,
    target: 1,
    status: "claimable",
    icon: "🏡",
  },
  {
    id: "daily-first-pomodoro",
    title: "Tập trung đầu tiên",
    description: "Hoàn thành 1 phiên Pomodoro trong ngày",
    category: "daily",
    reward: 1000,
    progress: 0,
    target: 1,
    status: "active",
    icon: "🍅",
  },
  {
    id: "daily-marathon",
    title: "Marathon tập trung",
    description: "Hoàn thành 4 phiên Pomodoro trong ngày",
    category: "daily",
    reward: 2000,
    progress: 1,
    target: 4,
    status: "active",
    icon: "🔥",
  },
  {
    id: "daily-todo",
    title: "Dọn việc",
    description: "Đánh dấu hoàn thành 3 todo item",
    category: "daily",
    reward: 1500,
    progress: 1,
    target: 3,
    status: "active",
    icon: "✅",
  },
  {
    id: "daily-ambient",
    title: "Thư giãn có nhạc",
    description: "Nghe ambient sound trong 30 phút",
    category: "daily",
    reward: 500,
    progress: 15,
    target: 30,
    status: "active",
    icon: "🎵",
  },

  // ── Weekly ─────────────────────────────────────────────────────────────
  {
    id: "weekly-champion",
    title: "Nhà vô địch tuần",
    description: "Hoàn thành 20 phiên Pomodoro trong tuần",
    category: "weekly",
    reward: 10000,
    progress: 8,
    target: 20,
    status: "active",
    icon: "🏆",
  },
  {
    id: "weekly-streak",
    title: "Học đều tay",
    description: "Đăng nhập và học đủ 5 ngày trong tuần",
    category: "weekly",
    reward: 5000,
    progress: 3,
    target: 5,
    status: "active",
    icon: "📅",
  },
  {
    id: "weekly-decorator",
    title: "Nhà trang trí",
    description: "Thay đổi background hoặc theme 3 lần trong tuần",
    category: "weekly",
    reward: 3000,
    progress: 1,
    target: 3,
    status: "active",
    icon: "🎨",
  },
  {
    id: "weekly-productive",
    title: "Siêu năng suất",
    description: "Hoàn thành 15 todo item trong tuần",
    category: "weekly",
    reward: 8000,
    progress: 6,
    target: 15,
    status: "active",
    icon: "⚡",
  },

  // ── Achievement ────────────────────────────────────────────────────────
  {
    id: "ach-first-pomodoro",
    title: "Bước đầu tiên",
    description: "Hoàn thành phiên Pomodoro đầu tiên",
    category: "achievement",
    reward: 5000,
    progress: 1,
    target: 1,
    status: "claimed",
    icon: "🌱",
  },
  {
    id: "ach-decorator",
    title: "Nhà thiết kế",
    description: "Tùy chỉnh không gian học lần đầu tiên",
    category: "achievement",
    reward: 10000,
    progress: 1,
    target: 1,
    status: "claimable",
    icon: "🖼️",
  },
  {
    id: "ach-streak-7",
    title: "Streak 7 ngày",
    description: "Đăng nhập 7 ngày liên tiếp",
    category: "achievement",
    reward: 15000,
    progress: 4,
    target: 7,
    status: "active",
    icon: "🗓️",
  },
  {
    id: "ach-100-pomodoro",
    title: "100 phiên Pomodoro",
    description: "Tích lũy 100 phiên tập trung",
    category: "achievement",
    reward: 25000,
    progress: 23,
    target: 100,
    status: "active",
    icon: "💯",
  },
  {
    id: "ach-streak-30",
    title: "Streak 30 ngày",
    description: "Đăng nhập 30 ngày liên tiếp",
    category: "achievement",
    reward: 50000,
    progress: 4,
    target: 30,
    status: "active",
    icon: "👑",
  },
];

// Simulates in-memory state for mock claim actions
let mockQuests = MOCK_QUESTS.map(q => ({ ...q }));

export const questService = {
  getQuests: async (_userId: string): Promise<Quest[]> => {
    await new Promise((res) => setTimeout(res, 150));
    return mockQuests.map(q => ({ ...q }));
  },

  claimReward: async (_userId: string, questId: string, currentBalance: number): Promise<ClaimResult> => {
    await new Promise((res) => setTimeout(res, 200));
    const quest = mockQuests.find(q => q.id === questId);
    if (!quest || quest.status !== "claimable") {
      throw new Error("Quest is not claimable");
    }
    quest.status = "claimed";
    return { newBalance: currentBalance + quest.reward };
  },
};
