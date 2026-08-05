import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import { useAccent } from "../../context/AccentContext";
import { useWorkspaceAutoSave } from "./useWorkspaceAutoSave";
import { useWeatherEffect } from "./useWeatherEffect";
import { useOnboardingTour }    from "./useOnboardingTour";
import { roomService }          from "../../../services/room.service";
import { useClockSettings }    from "./useClockSettings";
import { usePomodoroSettings, DEFAULT_POMODORO_SOUNDS } from "./usePomodoroSettings";
import { usePhotoFrameSettings } from "./usePhotoFrameSettings";
import { useWellnessSettings } from "./useWellnessSettings";
import { useDoodleSettings } from "./useDoodleSettings";
import { useGoogleCalendarSettings } from "./useGoogleCalendarSettings";
import { useSpaceItems }       from "./useSpaceItems";
import { useAmbientSound }     from "./useAmbientSound";
import { workspaceService }    from "../../../services/workspace.service";
import { DEFAULT_BG } from "../../components/StudySpace/constants";
import type { BackgroundItem } from "../../components/StudySpace/types";
import type { LayoutConfig }   from "../../../types/workspace.types";
import type { UserInfo }       from "../../components/StudySpace/panels/AccountPanel";
import type { EffectType }     from "../../components/StudySpace/panels/EffectsPanel";
import type { NavKey as SettingsNavKey } from "../../components/StudySpace/panels/SettingsPanel";
import type { TabValue as ThemeStoreTab } from "../../components/StudySpace/panels/ThemeStorePanel";

export type ActivePanel =
  | "widget" | "image" | "sticker" | "theme"
  | "ambient" | "effects" | "settings" | "room"
  | "pomodoro-stats" | "quest" | "lucky-draw" | "notification"
  | null;

export function useStudySpace() {
  const navigate = useNavigate();
  const { t }    = useTranslation();

  /* ── Auth ── */
  const { user, logout } = useAuth();

  /* ── Accent color ── */
  const { accent, setAccent } = useAccent();
  const currentUser: UserInfo | null = user
    ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl ?? undefined, accountTier: user.accountTier }
    : null;
  const handleLogout = () => { logout(); navigate("/"); };

  /* ── UI state ── */
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [activePanel,    setActivePanel]    = useState<ActivePanel>(null);
  const [settingsInitialNav, setSettingsInitialNav] = useState<SettingsNavKey | null>(null);
  const [themeStoreInitialTab, setThemeStoreInitialTab] = useState<ThemeStoreTab | null>(null);
  const [layoutLocked,   setLayoutLocked]   = useState(false);
const [activeEffect,   setActiveEffect]   = useState<EffectType>(null);
  const [weatherSyncEnabled, setWeatherSyncEnabled] = useState(false);
  const [accountOpen,         setAccountOpen]         = useState(false);
  const [currentBg,           setCurrentBg]           = useState<BackgroundItem>(DEFAULT_BG);
  const [roomId,              setRoomId]              = useState<string | null>(null);
  const [roomName,            setRoomName]            = useState<string | null>(null);
  const [showFirstRoomModal,  setShowFirstRoomModal]  = useState(false);
  const [musicSource,    setMusicSource]    = useState<"youtube" | "soundcloud">("youtube");
  const [musicYtUrl,     setMusicYtUrl]     = useState("");
  const [musicScUrl,     setMusicScUrl]     = useState("");

  const avatarBtnRef    = useRef<HTMLDivElement>(null);
  const accountPanelRef = useRef<HTMLDivElement>(null);
  const spaceRef        = useRef<HTMLDivElement>(null);

  /* ── Domain hooks ── */
  const clock      = useClockSettings();
  const pomodoro   = usePomodoroSettings();
  const photoFrame = usePhotoFrameSettings();
  const wellness   = useWellnessSettings();
  const doodle     = useDoodleSettings();
  const googleCalendar = useGoogleCalendarSettings();
  const space      = useSpaceItems();
  const ambient  = useAmbientSound();
  const tour     = useOnboardingTour();

  /* ── Default widget positions (computed once) ── */
  const WIDGET_POSITIONS = useMemo(() => {
    const w = typeof window !== "undefined" ? window.innerWidth  : 1440;
    const h = typeof window !== "undefined" ? window.innerHeight : 900;
    return {
      music:    { x: w - 320, y: Math.round(h * 0.12) },
      pomodoro: { x: w - 260, y: Math.round(h * 0.12) + 130 },
      todo:     { x: w - 260, y: Math.round(h * 0.12) + 390 },
      clock:    { x: 32,      y: Math.round(h * 0.12) },
      quote:    { x: 32,      y: Math.round(h * 0.12) + 210 },
      photoFrame: { x: 32,    y: Math.round(h * 0.12) + 300 },
      wellness:   { x: w - 220, y: Math.round(h * 0.12) + 260 },
      doodle:     { x: w - 260, y: Math.round(h * 0.12) + 420 },
      googleCalendar: { x: 32, y: Math.round(h * 0.12) + 420 },
    };
  }, []);

  /* ── Restore layout helper ── */
  const { restoreAmbient } = ambient;
  const applyLayout = useCallback((layout: LayoutConfig) => {
    if (layout.activeEffect !== undefined) setActiveEffect(layout.activeEffect as EffectType);
    setWeatherSyncEnabled(layout.weatherSyncEnabled ?? false);
    if (layout.accentColor) setAccent(layout.accentColor);
    if (layout.musicState) {
      const ms = layout.musicState;
      setMusicSource(ms.source as "youtube" | "soundcloud");
      // Support new format (both URLs stored) with fallback for old saves (single activeUrl)
      setMusicYtUrl(ms.ytUrl ?? (ms.source === "youtube"    ? ms.activeUrl : ""));
      setMusicScUrl(ms.scUrl ?? (ms.source === "soundcloud" ? ms.activeUrl : ""));
    }
    if (layout.clockSettings) {
      clock.setMode(layout.clockSettings.mode as any);
      clock.setLayout(layout.clockSettings.layout as any);
      clock.setShowSeconds(layout.clockSettings.showSeconds);
      clock.setShowLunar(layout.clockSettings.showLunar);
      clock.setShowDate(layout.clockSettings.showDate);
    }
    if (layout.pomodoroSettings) {
      pomodoro.setFocusMin(layout.pomodoroSettings.focusMin);
      pomodoro.setBreakMin(layout.pomodoroSettings.breakMin);
      pomodoro.setTotalSes(layout.pomodoroSettings.totalSes);
      if (layout.pomodoroSettings.soundEnabled !== undefined) pomodoro.setSoundEnabled(layout.pomodoroSettings.soundEnabled);
      if (layout.pomodoroSettings.sounds) pomodoro.setSounds({ ...DEFAULT_POMODORO_SOUNDS, ...layout.pomodoroSettings.sounds });
      if (layout.pomodoroSettings.volume !== undefined) pomodoro.setVolume(layout.pomodoroSettings.volume);
    }
    if (layout.photoFrameSettings) {
      photoFrame.setImages(layout.photoFrameSettings.images ?? []);
      photoFrame.setIntervalSec(layout.photoFrameSettings.intervalSec ?? 8);
      photoFrame.setTransition(layout.photoFrameSettings.transition ?? "fade");
      photoFrame.setShuffle(layout.photoFrameSettings.shuffle ?? false);
    }
    if (layout.doodleSettings) {
      doodle.setStrokes(layout.doodleSettings.strokes ?? []);
      doodle.setBrushColor(layout.doodleSettings.brushColor ?? "#f472b6");
      doodle.setBrushWidth(layout.doodleSettings.brushWidth ?? 3);
    }
    if (layout.googleCalendarSettings) {
      googleCalendar.setMaxEvents(layout.googleCalendarSettings.maxEvents ?? 5);
      googleCalendar.setShowAllDay(layout.googleCalendarSettings.showAllDay ?? true);
    }
    if (layout.wellnessSettings) {
      const ws = layout.wellnessSettings;
      wellness.setActiveTab(ws.activeTab ?? "breathing");
      wellness.setPattern(ws.pattern ?? "box");
      wellness.setCycleCount(ws.cycleCount ?? 0);
      wellness.setWaterEnabled(ws.waterEnabled ?? false);
      wellness.setWaterIntervalMin(ws.waterIntervalMin ?? 45);
      wellness.setEyeRestEnabled(ws.eyeRestEnabled ?? false);
      wellness.setEyeRestIntervalMin(ws.eyeRestIntervalMin ?? 20);
    }
    space.restoreItems({
      activeWidgets:   layout.activeWidgets,
      placedStickers:  layout.placedStickers,
      stickyNotes:     layout.stickyNotes,
      worldClocks:     layout.worldClocks,
      deadlines:       layout.deadlines,
      widgetPositions: layout.widgetPositions,
      todoItems:       layout.todoItems,
    });
    restoreAmbient(layout.ambientSounds ?? []);
  }, [clock, pomodoro, photoFrame, wellness, doodle, googleCalendar, space, restoreAmbient]);

  /* ── On-mount workspace restore callback ── */
  const handleRestore = useCallback(({ roomId: rid, roomName: rname, bg, layout }: {
    roomId: string; roomName?: string | null; bg: BackgroundItem; layout: LayoutConfig;
  }) => {
    setRoomId(rid);
    setRoomName(rname ?? null);
    setCurrentBg(bg);
    applyLayout(layout);
  }, [applyLayout]);

  /* ── Room select: switch room + restore saved layout ── */
  const saveNowRef = useRef<() => void>(() => {});

  const handleRoomSelect = useCallback(async (id: string, bg: BackgroundItem) => {
    setRoomId(id);
    setRoomName(bg.label);
    setCurrentBg(bg);

    const emptyLayout: LayoutConfig = {
      activeEffect: null,
      activeWidgets: [],
      placedStickers: [],
      stickyNotes: [],
      widgetPositions: {},
      todoItems: [],
    };

    if (!user) { applyLayout(emptyLayout); return; }
    try {
      const config = await workspaceService.getByRoomId(id);
      if (!config?.jsonConfig) { applyLayout(emptyLayout); saveNowRef.current(); return; }
      const layout: LayoutConfig = JSON.parse(config.jsonConfig);
      if (layout.currentBg) setCurrentBg(layout.currentBg);
      applyLayout(layout);
    } catch { applyLayout(emptyLayout); }
    saveNowRef.current();
  }, [user, applyLayout]);

  /* ── First-room creation flow ── */
  const handleNewUser = useCallback(() => {
    setShowFirstRoomModal(true);
  }, []);

  const handleFirstRoomCreate = useCallback(async (name: string) => {
    const created = await roomService.createMyRoom({ name, description: null, thumbnailUrl: null, backgroundUrl: null });
    const bg: BackgroundItem = {
      id: created.id,
      url: created.thumbnailUrl ?? DEFAULT_BG.url,
      thumb: created.thumbnailUrl ?? "",
      label: created.name,
    };
    const emptyLayout: LayoutConfig = {
      activeEffect: null, activeWidgets: [], placedStickers: [],
      stickyNotes: [], widgetPositions: {}, todoItems: [],
    };
    handleRestore({ roomId: created.id, roomName: created.name, bg, layout: emptyLayout });
    setShowFirstRoomModal(false);
    tour.maybeAutoStart(user?.userId);
  }, [handleRestore, tour, user?.userId]);

  /* ── Screenshot for thumbnail ── */
  const captureScreenshot = useCallback(async (): Promise<string | null> => {
    if (!spaceRef.current) return null;
    try {
      const canvas = await html2canvas(spaceRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
        ignoreElements: el => el.classList.contains("no-capture"),
      });
      return canvas.toDataURL("image/jpeg", 0.75);
    } catch {
      return null;
    }
  }, []);

  /* ── Auto-save ── */
  const { saveStatus, saveNow, isRestoring } = useWorkspaceAutoSave({
    isLoggedIn: !!user,
    roomId,
    roomName,
    currentBg,
    activeEffect,
    weatherSyncEnabled,
    activeWidgets:    space.activeWidgets,
    widgetPositions:  space.widgetPositions,
    placedStickers:   space.placedStickers,
    stickyNotes:      space.stickyNotes,
    worldClocks:      space.worldClocks,
    deadlines:        space.deadlines,
    clockSettings: {
      mode: clock.mode, layout: clock.layout,
      showSeconds: clock.showSeconds, showLunar: clock.showLunar, showDate: clock.showDate,
    },
    pomodoroSettings: {
      focusMin: pomodoro.focusMin, breakMin: pomodoro.breakMin, totalSes: pomodoro.totalSes,
      soundEnabled: pomodoro.soundEnabled, sounds: pomodoro.sounds, volume: pomodoro.volume,
    },
    photoFrameSettings: {
      images: photoFrame.images, intervalSec: photoFrame.intervalSec,
      transition: photoFrame.transition, shuffle: photoFrame.shuffle,
    },
    doodleSettings: {
      strokes: doodle.strokes, brushColor: doodle.brushColor, brushWidth: doodle.brushWidth,
    },
    googleCalendarSettings: {
      maxEvents: googleCalendar.maxEvents, showAllDay: googleCalendar.showAllDay,
    },
    wellnessSettings: {
      activeTab: wellness.activeTab, pattern: wellness.pattern, cycleCount: wellness.cycleCount,
      waterEnabled: wellness.waterEnabled, waterIntervalMin: wellness.waterIntervalMin,
      eyeRestEnabled: wellness.eyeRestEnabled, eyeRestIntervalMin: wellness.eyeRestIntervalMin,
    },
    todoItems: space.todoItems,
    accentColor: accent,
    musicState: { source: musicSource, activeUrl: musicSource === "youtube" ? musicYtUrl : musicScUrl, ytUrl: musicYtUrl, scUrl: musicScUrl },
    getAmbientSounds: ambient.getActiveSoundsForSave,
    captureScreenshot,
    onNewUser: handleNewUser,
    onRestore: handleRestore,
  });
  saveNowRef.current = saveNow;

  /* ── Auto-save when accent changes (skip first render) ── */
  const isFirstAccentRender = useRef(true);
  useEffect(() => {
    if (isFirstAccentRender.current) { isFirstAccentRender.current = false; return; }
    saveNow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accent]);

  /* ── Weather-synced effect (premium) ── */
  const weatherSync = useWeatherEffect({ enabled: weatherSyncEnabled, onResolve: setActiveEffect });

  // Persist whenever weather-sync resolves a new effect (manual picks already call saveNow at the call site)
  const isFirstEffectRender = useRef(true);
  useEffect(() => {
    if (isFirstEffectRender.current) { isFirstEffectRender.current = false; return; }
    if (weatherSyncEnabled) saveNow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEffect]);

  const handleSelectEffect = useCallback((e: EffectType) => {
    setWeatherSyncEnabled(false);
    setActiveEffect(e);
  }, []);

  const handleToggleWeatherSync = useCallback(() => {
    setWeatherSyncEnabled(v => !v);
  }, []);

  const togglePanel = (panel: ActivePanel) =>
    setActivePanel(p => p === panel ? null : panel);

  const toggleLayoutLock = () => setLayoutLocked(v => !v);

  return {
    navigate, t,
    user, currentUser, handleLogout,
    toolbarVisible, setToolbarVisible,
    activePanel, setActivePanel, togglePanel,
    settingsInitialNav, setSettingsInitialNav,
    themeStoreInitialTab, setThemeStoreInitialTab,
    layoutLocked, toggleLayoutLock,
    activeEffect, setActiveEffect,
    weatherSyncEnabled, handleSelectEffect, handleToggleWeatherSync,
    weatherSyncLoading: weatherSync.loading, weatherSyncError: weatherSync.error,
    weatherSyncLocation: weatherSync.location,
    accountOpen, setAccountOpen,
    currentBg, setCurrentBg,
    roomId, setRoomId,
    musicSource, setMusicSource,
    musicYtUrl, setMusicYtUrl,
    musicScUrl, setMusicScUrl,
    avatarBtnRef, accountPanelRef, spaceRef,
    clock, pomodoro, photoFrame, wellness, doodle, googleCalendar, space,
    WIDGET_POSITIONS,
    applyLayout, handleRestore, handleRoomSelect, captureScreenshot,
    showFirstRoomModal, handleFirstRoomCreate,
    saveStatus, saveNow, isRestoring,
    accent, setAccent,
    ambient,
    tour,
  };
}

export type StudySpaceCtx = ReturnType<typeof useStudySpace>;
