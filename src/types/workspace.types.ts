export interface LayoutConfig {
  activeEffect: string | null;
  activeWidgets: string[];
  currentBg?: { id: string; url: string; thumb: string; label: string };
  widgetPositions?: Record<string, { x: number; y: number }>;
  placedStickers: Array<{
    id: string;
    src: string;
    x: number;
    y: number;
    size: number;
  }>;
  stickyNotes: Array<{
    id: string;
    text: string;
    color: string;
    x: number;
    y: number;
    w?: number;
    h?: number;
  }>;
  clockSettings?: {
    mode: string;
    layout: string;
    showSeconds: boolean;
    showLunar: boolean;
    showDate: boolean;
  };
  pomodoroSettings?: {
    focusMin: number;
    breakMin: number;
    totalSes: number;
  };
  todoItems?: Array<{ id: string; text: string; done: boolean }>;
  accentColor?: string;
  musicState?: { source: string; activeUrl: string; ytUrl?: string; scUrl?: string };
}

export interface WorkspaceConfig {
  configId: string | null;
  roomId: string;
  roomName: string | null;
  jsonConfig: string | null;
  updatedAt: string | null;
}

export interface SaveWorkspaceRequest {
  roomId: string;
  jsonConfig: string;
  thumbnail?: string;
}
