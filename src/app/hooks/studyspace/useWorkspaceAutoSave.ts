import { useCallback, useEffect, useRef, useState } from "react";
import { workspaceService } from "../../../services/workspace.service";
import { roomService } from "../../../services/room.service";
import type { PlacedSticker, StickyNote, BackgroundItem, TodoItem } from "../../components/StudySpace/types";
import type { LayoutConfig } from "../../../types/workspace.types";

interface ClockSettings {
  mode: string;
  layout: string;
  showSeconds: boolean;
  showLunar: boolean;
  showDate: boolean;
}

interface PomodoroSettings {
  focusMin: number;
  breakMin: number;
  totalSes: number;
}

interface WorkspaceSaveParams {
  isLoggedIn: boolean;
  roomId: string | null;
  currentBg: BackgroundItem | null;
  activeEffect: string | null;
  activeWidgets: Set<string>;
  widgetPositions: Record<string, { x: number; y: number }>;
  placedStickers: PlacedSticker[];
  stickyNotes: StickyNote[];
  clockSettings: ClockSettings;
  pomodoroSettings: PomodoroSettings;
  todoItems: TodoItem[];
  captureScreenshot?: () => Promise<string | null>;
  onRestore: (data: {
    roomId: string;
    bg: BackgroundItem;
    layout: LayoutConfig;
  }) => void;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useWorkspaceAutoSave({
  isLoggedIn,
  roomId,
  currentBg,
  activeEffect,
  activeWidgets,
  widgetPositions,
  placedStickers,
  stickyNotes,
  clockSettings,
  pomodoroSettings,
  todoItems,
  captureScreenshot,
  onRestore,
}: WorkspaceSaveParams) {
  const [saveStatus,   setSaveStatus]   = useState<SaveStatus>("idle");
  const [isRestoring,  setIsRestoring]  = useState(() => isLoggedIn);
  const isSavingRef    = useRef(false);
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always-current refs so saveNow captures latest state at call time
  const stateRef = useRef({
    roomId, currentBg, activeEffect, activeWidgets,
    widgetPositions, placedStickers, stickyNotes,
    clockSettings, pomodoroSettings, todoItems,
  });
  useEffect(() => {
    stateRef.current = {
      roomId, currentBg, activeEffect, activeWidgets,
      widgetPositions, placedStickers, stickyNotes,
      clockSettings, pomodoroSettings, todoItems,
    };
  });

  // Restore workspace on mount when user is logged in
  useEffect(() => {
    if (!isLoggedIn) { setIsRestoring(false); return; }
    workspaceService.getMyWorkspace()
      .then(async (config) => {
        if (!config?.roomId || !config?.jsonConfig) return;
        let layout: LayoutConfig;
        try { layout = JSON.parse(config.jsonConfig); } catch { return; }

        let bg: BackgroundItem;
        if (layout.currentBg) {
          bg = layout.currentBg;
        } else {
          const room = await roomService.getById(config.roomId).catch(() => null);
          if (!room) return;
          bg = {
            id: room.id,
            url: room.backgroundUrl ?? room.thumbnailUrl ?? "",
            thumb: room.thumbnailUrl ?? "",
            label: room.name,
          };
        }
        onRestore({ roomId: config.roomId, bg, layout });
      })
      .catch(() => {})
      .finally(() => setIsRestoring(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Call this after a drag-end to persist the current layout.
  // A 300ms debounce collapses rapid consecutive drops into one request.
  const saveNow = useCallback(() => {
    if (!isLoggedIn) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const s = stateRef.current;
      if (!s.roomId || isSavingRef.current) return;

      isSavingRef.current = true;
      setSaveStatus("saving");
      try {
        const layout: LayoutConfig = {
          activeEffect: s.activeEffect,
          activeWidgets: Array.from(s.activeWidgets),
          currentBg: s.currentBg
            ? { id: s.currentBg.id, url: s.currentBg.url, thumb: s.currentBg.thumb, label: s.currentBg.label }
            : undefined,
          widgetPositions: s.widgetPositions,
          placedStickers:  s.placedStickers,
          stickyNotes:     s.stickyNotes,
          clockSettings:   s.clockSettings,
          pomodoroSettings: s.pomodoroSettings,
          todoItems:       s.todoItems,
        };
        const thumbnail = captureScreenshot ? await captureScreenshot() : null;
        await workspaceService.saveWorkspace({
          roomId: s.roomId!,
          jsonConfig: JSON.stringify(layout),
          ...(thumbnail ? { thumbnail } : {}),
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } finally {
        isSavingRef.current = false;
      }
    }, 300);
  }, [isLoggedIn, captureScreenshot]);

  return { saveStatus, saveNow, isRestoring };
}
