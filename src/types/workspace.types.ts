export interface PomodoroSounds {
  startFocus: string;
  startBreak: string;
  complete:   string;
  pause:      string;
  reset:      string;
}

export interface LayoutConfig {
  activeEffect: string | null;
  weatherSyncEnabled?: boolean;
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
  worldClocks?: Array<{
    id: string;
    label: string;
    timezone: string;
    x: number;
    y: number;
  }>;
  deadlines?: Array<{
    id: string;
    title: string;
    targetAt: string;
    color?: string;
    x: number;
    y: number;
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
    soundEnabled?: boolean;
    sounds?: PomodoroSounds;
    volume?: number;
  };
  todoItems?: Array<{ id: string; text: string; done: boolean }>;
  photoFrameSettings?: {
    images: string[];
    intervalSec: number;
    transition: "fade" | "slide" | "none";
    shuffle?: boolean;
  };
  doodleSettings?: {
    strokes: Array<{ color: string; width: number; points: number[] }>;
    brushColor: string;
    brushWidth: number;
  };
  googleCalendarSettings?: {
    maxEvents: number;
    showAllDay?: boolean;
  };
  wellnessSettings?: {
    activeTab: "breathing" | "reminders";
    pattern: "box" | "478" | "462";
    cycleCount: number;
    waterEnabled: boolean;
    waterIntervalMin: number;
    eyeRestEnabled: boolean;
    eyeRestIntervalMin: number;
  };
  accentColor?: string;
  musicState?: { source: string; activeUrl: string; ytUrl?: string; scUrl?: string };
  ambientSounds?: Array<{ id: string; url: string; volume: number }>;
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
