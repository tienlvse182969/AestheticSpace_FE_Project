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
  soundEnabled?: boolean;
  sounds?: { startFocus: string; startBreak: string; complete: string; pause: string; reset: string };
}

interface WorkspaceSaveParams {
  isLoggedIn: boolean;
  roomId: string | null;
  roomName: string | null;
  currentBg: BackgroundItem | null;
  activeEffect: string | null;
  activeWidgets: Set<string>;
  widgetPositions: Record<string, { x: number; y: number }>;
  placedStickers: PlacedSticker[];
  stickyNotes: StickyNote[];
  clockSettings: ClockSettings;
  pomodoroSettings: PomodoroSettings;
  todoItems: TodoItem[];
  accentColor?: string;
  musicState?: { source: string; activeUrl: string; ytUrl?: string; scUrl?: string };
  getAmbientSounds?: () => Array<{ id: string; url: string; volume: number }>;
  captureScreenshot?: () => Promise<string | null>;
  onNewUser?: () => void;
  onRestore: (data: {
    roomId: string;
    roomName?: string | null;
    bg: BackgroundItem;
    layout: LayoutConfig;
  }) => void;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useWorkspaceAutoSave({
  isLoggedIn,
  roomId,
  roomName,
  currentBg,
  activeEffect,
  activeWidgets,
  widgetPositions,
  placedStickers,
  stickyNotes,
  clockSettings,
  pomodoroSettings,
  todoItems,
  accentColor,
  musicState,
  getAmbientSounds,
  captureScreenshot,
  onNewUser,
  onRestore,
}: WorkspaceSaveParams) {
  const [saveStatus,   setSaveStatus]   = useState<SaveStatus>("idle");
  const [isRestoring,  setIsRestoring]  = useState(() => isLoggedIn);
  const isSavingRef    = useRef(false);
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always-current refs so saveNow captures latest state at call time
  const stateRef = useRef({
    roomId, roomName, currentBg, activeEffect, activeWidgets,
    widgetPositions, placedStickers, stickyNotes,
    clockSettings, pomodoroSettings, todoItems, accentColor, musicState,
  });
  useEffect(() => {
    stateRef.current = {
      roomId, roomName, currentBg, activeEffect, activeWidgets,
      widgetPositions, placedStickers, stickyNotes,
      clockSettings, pomodoroSettings, todoItems, accentColor, musicState,
    };
  });

  // Stable ref so saveNow always calls the latest getter without closure issues
  const getAmbientSoundsRef = useRef(getAmbientSounds);
  useEffect(() => { getAmbientSoundsRef.current = getAmbientSounds; });

  // Restore workspace on mount when user is logged in
  useEffect(() => {
    if (!isLoggedIn) { setIsRestoring(false); return; }
    workspaceService.getMyWorkspace()
      .then(async (config) => {
        if (!config?.roomId || !config?.jsonConfig) {
          // Check if user already has rooms before showing first-room modal
          const existingRooms = await roomService.getMyRooms().catch(() => []);
          if (existingRooms.length > 0) {
            const room = existingRooms[0];
            const bg: BackgroundItem = {
              id: room.id,
              url: room.thumbnailUrl ?? "",
              thumb: room.thumbnailUrl ?? "",
              label: room.name,
            };
            const emptyLayout: LayoutConfig = {
              activeEffect: null, activeWidgets: [], placedStickers: [],
              stickyNotes: [], widgetPositions: {}, todoItems: [],
            };
            onRestore({ roomId: room.id, roomName: room.name, bg, layout: emptyLayout });
            return;
          }
          // New user — show first-room naming modal if handler provided
          if (onNewUser) {
            onNewUser();
          }
          return;
        }

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
        onRestore({ roomId: config.roomId, roomName: config.roomName, bg, layout });
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
          accentColor:     s.accentColor,
          musicState:      s.musicState,
          ambientSounds:   getAmbientSoundsRef.current?.(),
        };
        const thumbnail = captureScreenshot ? await captureScreenshot() : null;
        await workspaceService.saveWorkspace({
          roomId: s.roomId!,
          jsonConfig: JSON.stringify(layout),
          ...(thumbnail ? { thumbnail } : {}),
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        // Sync room thumbnail with current background URL (no-op for preset/unowned rooms)
        if (s.roomId && s.roomName && s.currentBg?.url) {
          roomService.updateMyRoom(s.roomId, {
            name: s.roomName,
            thumbnailUrl: s.currentBg.url,
          }).catch(() => {});
        }
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
