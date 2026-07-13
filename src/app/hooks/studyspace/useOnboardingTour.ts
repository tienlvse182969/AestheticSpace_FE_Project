import { useCallback, useRef, useState } from "react";

export type TourStepId =
  | "welcome" | "room" | "widget" | "theme" | "image" | "sticker"
  | "ambient" | "effects" | "quest" | "pomodoro-stats" | "settings"
  | "widget-add" | "background-change" | "room-create" | "account";

/** Panel id to auto-open (via ctx.setActivePanel) while this step is active, if any. */
export type TourStepPanel = "widget" | "image" | "room";

export interface TourStep {
  id: TourStepId;
  titleKey: string;
  descKey: string;
  panel?: TourStepPanel;
  /** The action spans beyond the panel itself (e.g. dropping/dragging a widget anywhere
   *  on the canvas), so nothing should be blocked anywhere on screen for this step. */
  fullyInteractive?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  { id: "welcome",         titleKey: "tour.welcomeTitle",  descKey: "tour.welcomeDesc" },
  { id: "room",            titleKey: "space.rooms",         descKey: "tour.roomsDesc" },
  { id: "widget",          titleKey: "space.widgets",        descKey: "tour.widgetsDesc" },
  { id: "theme",           titleKey: "themeStore.tooltip",   descKey: "tour.themeDesc" },
  { id: "image",           titleKey: "space.backgrounds",    descKey: "tour.backgroundsDesc" },
  { id: "sticker",         titleKey: "space.stickers",       descKey: "tour.stickersDesc" },
  { id: "ambient",         titleKey: "space.ambientSounds",  descKey: "tour.ambientDesc" },
  { id: "effects",         titleKey: "effects.title",        descKey: "tour.effectsDesc" },
  { id: "quest",           titleKey: "tour.questTitle",       descKey: "tour.questDesc" },
  { id: "pomodoro-stats",  titleKey: "tour.pomodoroStatsTitle", descKey: "tour.pomodoroStatsDesc" },
  { id: "settings",        titleKey: "settings.title",       descKey: "tour.settingsDesc" },
  { id: "widget-add",        titleKey: "tour.widgetAddTitle",   descKey: "tour.widgetAddDesc",   panel: "widget", fullyInteractive: true },
  { id: "background-change", titleKey: "tour.bgChangeTitle",    descKey: "tour.bgChangeDesc",    panel: "image" },
  { id: "room-create",       titleKey: "tour.roomCreateTitle",  descKey: "tour.roomCreateDesc",  panel: "room" },
  { id: "account",         titleKey: "tour.accountTitle",    descKey: "tour.accountDesc" },
];

const SEEN_KEY_PREFIX = "asfe_tour_seen_";

export function useOnboardingTour() {
  const [active, setActive]       = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const userIdRef = useRef<string | null>(null);

  const start = useCallback((userId?: string | null) => {
    userIdRef.current = userId ?? null;
    setStepIndex(0);
    setActive(true);
  }, []);

  const maybeAutoStart = useCallback((userId?: string | null) => {
    if (!userId) return;
    if (localStorage.getItem(SEEN_KEY_PREFIX + userId)) return;
    start(userId);
  }, [start]);

  const markSeen = useCallback(() => {
    if (userIdRef.current) localStorage.setItem(SEEN_KEY_PREFIX + userIdRef.current, "1");
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= TOUR_STEPS.length - 1) {
        setActive(false);
        markSeen();
        return i;
      }
      return i + 1;
    });
  }, [markSeen]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skip = useCallback(() => {
    setActive(false);
    markSeen();
  }, [markSeen]);

  return {
    active,
    stepIndex,
    steps: TOUR_STEPS,
    currentStep: TOUR_STEPS[stepIndex],
    start,
    maybeAutoStart,
    next,
    prev,
    skip,
  };
}

export type OnboardingTourCtx = ReturnType<typeof useOnboardingTour>;
