import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import { useAccent } from "../../context/AccentContext";
import { useWorkspaceAutoSave } from "./useWorkspaceAutoSave";
import { useClockSettings }    from "./useClockSettings";
import { usePomodoroSettings } from "./usePomodoroSettings";
import { useSpaceItems }       from "./useSpaceItems";
import { workspaceService }    from "../../../services/workspace.service";
import { BACKGROUNDS }         from "../../components/StudySpace/constants";
import type { BackgroundItem } from "../../components/StudySpace/types";
import type { LayoutConfig }   from "../../../types/workspace.types";
import type { UserInfo }       from "../../components/StudySpace/panels/AccountPanel";
import type { EffectType }     from "../../components/StudySpace/panels/EffectsPanel";

export type ActivePanel =
  | "widget" | "image" | "sticker" | "theme"
  | "ambient" | "effects" | "settings" | "room"
  | "pomodoro-stats"
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
  const [layoutLocked,   setLayoutLocked]   = useState(false);
  const [aboutOpen,      setAboutOpen]      = useState(false);
  const [activeEffect,   setActiveEffect]   = useState<EffectType>(null);
  const [accountOpen,    setAccountOpen]    = useState(false);
  const [currentBg,      setCurrentBg]      = useState<BackgroundItem>(BACKGROUNDS[3]);
  const [roomId,         setRoomId]         = useState<string | null>(null);
  const [musicSource,    setMusicSource]    = useState<"youtube" | "soundcloud">("youtube");
  const [musicUrl,       setMusicUrl]       = useState("");

  const avatarBtnRef    = useRef<HTMLDivElement>(null);
  const accountPanelRef = useRef<HTMLDivElement>(null);
  const spaceRef        = useRef<HTMLDivElement>(null);

  /* ── Domain hooks ── */
  const clock    = useClockSettings();
  const pomodoro = usePomodoroSettings();
  const space    = useSpaceItems();

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
    };
  }, []);

  /* ── Restore layout helper ── */
  const applyLayout = useCallback((layout: LayoutConfig) => {
    if (layout.activeEffect !== undefined) setActiveEffect(layout.activeEffect as EffectType);
    if (layout.accentColor) setAccent(layout.accentColor);
    if (layout.musicState) {
      setMusicSource(layout.musicState.source as "youtube" | "soundcloud");
      setMusicUrl(layout.musicState.activeUrl);
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
    }
    space.restoreItems({
      activeWidgets:   layout.activeWidgets,
      placedStickers:  layout.placedStickers,
      stickyNotes:     layout.stickyNotes,
      widgetPositions: layout.widgetPositions,
      todoItems:       layout.todoItems,
    });
  }, [clock, pomodoro, space]);

  /* ── On-mount workspace restore callback ── */
  const handleRestore = useCallback(({ roomId: rid, bg, layout }: {
    roomId: string; bg: BackgroundItem; layout: LayoutConfig;
  }) => {
    setRoomId(rid);
    setCurrentBg(bg);
    applyLayout(layout);
  }, [applyLayout]);

  /* ── Room select: switch room + restore saved layout ── */
  const handleRoomSelect = useCallback(async (id: string, bg: BackgroundItem) => {
    setRoomId(id);
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
      if (!config?.jsonConfig) { applyLayout(emptyLayout); return; }
      const layout: LayoutConfig = JSON.parse(config.jsonConfig);
      if (layout.currentBg) setCurrentBg(layout.currentBg);
      applyLayout(layout);
    } catch { applyLayout(emptyLayout); }
  }, [user, applyLayout]);

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
    currentBg,
    activeEffect,
    activeWidgets:    space.activeWidgets,
    widgetPositions:  space.widgetPositions,
    placedStickers:   space.placedStickers,
    stickyNotes:      space.stickyNotes,
    clockSettings: {
      mode: clock.mode, layout: clock.layout,
      showSeconds: clock.showSeconds, showLunar: clock.showLunar, showDate: clock.showDate,
    },
    pomodoroSettings: {
      focusMin: pomodoro.focusMin, breakMin: pomodoro.breakMin, totalSes: pomodoro.totalSes,
    },
    todoItems: space.todoItems,
    accentColor: accent,
    musicState: { source: musicSource, activeUrl: musicUrl },
    captureScreenshot,
    onRestore: handleRestore,
  });

  /* ── Auto-save when accent changes (skip first render) ── */
  const isFirstAccentRender = useRef(true);
  useEffect(() => {
    if (isFirstAccentRender.current) { isFirstAccentRender.current = false; return; }
    saveNow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accent]);

  const togglePanel = (panel: ActivePanel) =>
    setActivePanel(p => p === panel ? null : panel);

  const toggleLayoutLock = () => setLayoutLocked(v => !v);

  return {
    navigate, t,
    user, currentUser, handleLogout,
    toolbarVisible, setToolbarVisible,
    activePanel, setActivePanel, togglePanel,
    layoutLocked, toggleLayoutLock,
    aboutOpen, setAboutOpen,
    activeEffect, setActiveEffect,
    accountOpen, setAccountOpen,
    currentBg, setCurrentBg,
    roomId, setRoomId,
    musicSource, setMusicSource,
    musicUrl, setMusicUrl,
    avatarBtnRef, accountPanelRef, spaceRef,
    clock, pomodoro, space,
    WIDGET_POSITIONS,
    applyLayout, handleRestore, handleRoomSelect, captureScreenshot,
    saveStatus, saveNow, isRestoring,
    accent, setAccent,
  };
}

export type StudySpaceCtx = ReturnType<typeof useStudySpace>;
