import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { WidgetId, PlacedSticker, StickyNote, TodoItem, WorldClockItem, DeadlineItem } from "../../components/StudySpace/types";
import { DEFAULT_WORLD_CLOCK_CITY } from "../../components/StudySpace/utils/timezone";

const DEFAULT_TODOS: TodoItem[] = [];

export function useSpaceItems() {
  const { t } = useTranslation();
  const [activeWidgets, setActiveWidgets]     = useState<Set<WidgetId>>(new Set());
  const [placedStickers, setPlacedStickers]   = useState<PlacedSticker[]>([]);
  const [stickyNotes, setStickyNotes]         = useState<StickyNote[]>([]);
  const [worldClocks, setWorldClocks]         = useState<WorldClockItem[]>([]);
  const [deadlines, setDeadlines]             = useState<DeadlineItem[]>([]);
  const [widgetPositions, setWidgetPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [todoItems, setTodoItems]             = useState<TodoItem[]>(DEFAULT_TODOS);

  const toggleWidget = (id: WidgetId) =>
    setActiveWidgets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const removeWidget = (id: WidgetId) =>
    setActiveWidgets(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const placeSticker = (src: string): string => {
    const id = `sticker-${Date.now()}`;
    const sw = window.innerWidth, sh = window.innerHeight;
    setPlacedStickers(prev => [
      ...prev,
      {
        id,
        src,
        x: Math.round(sw / 2 - 70 + (Math.random() - 0.5) * 160),
        y: Math.round(sh / 2 - 70 + (Math.random() - 0.5) * 120),
        size: 140,
      },
    ]);
    return id;
  };

  const placeStickerAt = (src: string, x: number, y: number): string => {
    const id = `sticker-${Date.now()}`;
    setPlacedStickers(prev => [...prev, { id, src, x, y, size: 140 }]);
    return id;
  };

  const removeSticker = (id: string) =>
    setPlacedStickers(prev => prev.filter(s => s.id !== id));

  const updateSticker = (id: string, patch: Partial<Pick<PlacedSticker, "x" | "y">>) =>
    setPlacedStickers(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

  const addStickyNote = () => {
    // Default spawn point sits just to the right of the Quote widget
    // (quote is anchored at x: 32, width 240, y: h*0.12 + 210 — see WIDGET_POSITIONS in useStudySpace.ts).
    const sh = window.innerHeight;
    setStickyNotes(prev => [
      ...prev,
      {
        id: `sticky-${Date.now()}`,
        text: "",
        color: "yellow",
        x: 292,
        y: Math.round(sh * 0.12) + 210,
      },
    ]);
  };

  const addStickyNoteAt = (x: number, y: number) => {
    setStickyNotes(prev => [
      ...prev,
      { id: `sticky-${Date.now()}`, text: "", color: "yellow", x, y },
    ]);
  };

  const removeStickyNote = (id: string) =>
    setStickyNotes(prev => prev.filter(n => n.id !== id));

  const updateStickyNote = (id: string, patch: Partial<Pick<StickyNote, "text" | "color" | "w" | "h" | "x" | "y">>) =>
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));

  const setWidgetPosition = (id: string, pos: { x: number; y: number }) =>
    setWidgetPositions(prev => ({ ...prev, [id]: pos }));

  const addWorldClock = () => {
    const sw = window.innerWidth, sh = window.innerHeight;
    setWorldClocks(prev => [
      ...prev,
      {
        id: `worldclock-${Date.now()}`,
        label: DEFAULT_WORLD_CLOCK_CITY.label,
        timezone: DEFAULT_WORLD_CLOCK_CITY.timezone,
        x: Math.round(sw / 2 - 85 + (Math.random() - 0.5) * 200),
        y: Math.round(sh / 2 - 60 + (Math.random() - 0.5) * 140),
      },
    ]);
  };

  const addWorldClockAt = (x: number, y: number) => {
    setWorldClocks(prev => [
      ...prev,
      { id: `worldclock-${Date.now()}`, label: DEFAULT_WORLD_CLOCK_CITY.label, timezone: DEFAULT_WORLD_CLOCK_CITY.timezone, x, y },
    ]);
  };

  const removeWorldClock = (id: string) =>
    setWorldClocks(prev => prev.filter(w => w.id !== id));

  const updateWorldClock = (id: string, patch: Partial<Pick<WorldClockItem, "label" | "timezone" | "x" | "y">>) =>
    setWorldClocks(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));

  const addDeadline = () => {
    const sw = window.innerWidth, sh = window.innerHeight;
    const targetAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    setDeadlines(prev => [
      ...prev,
      {
        id: `deadline-${Date.now()}`,
        title: t("deadline.defaultTitle"),
        targetAt,
        color: "#f87171",
        x: Math.round(sw / 2 - 88 + (Math.random() - 0.5) * 200),
        y: Math.round(sh / 2 - 60 + (Math.random() - 0.5) * 140),
      },
    ]);
  };

  const addDeadlineAt = (x: number, y: number) => {
    const targetAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    setDeadlines(prev => [
      ...prev,
      { id: `deadline-${Date.now()}`, title: t("deadline.defaultTitle"), targetAt, color: "#f87171", x, y },
    ]);
  };

  const removeDeadline = (id: string) =>
    setDeadlines(prev => prev.filter(d => d.id !== id));

  const updateDeadline = (id: string, patch: Partial<Pick<DeadlineItem, "title" | "targetAt" | "color" | "x" | "y">>) =>
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));

  const restoreItems = (data: {
    activeWidgets?: string[];
    placedStickers?: PlacedSticker[];
    stickyNotes?: StickyNote[];
    worldClocks?: WorldClockItem[];
    deadlines?: DeadlineItem[];
    widgetPositions?: Record<string, { x: number; y: number }>;
    todoItems?: TodoItem[];
  }) => {
    if (data.activeWidgets) setActiveWidgets(new Set(data.activeWidgets as WidgetId[]));
    if (data.placedStickers) setPlacedStickers(data.placedStickers);
    if (data.stickyNotes) setStickyNotes(data.stickyNotes);
    if (data.worldClocks) setWorldClocks(data.worldClocks);
    if (data.deadlines) setDeadlines(data.deadlines);
    if (data.widgetPositions) setWidgetPositions(data.widgetPositions);
    if (data.todoItems) setTodoItems(data.todoItems);
  };

  return {
    activeWidgets, toggleWidget, removeWidget,
    placedStickers, placeSticker, placeStickerAt, removeSticker, updateSticker,
    stickyNotes, addStickyNote, addStickyNoteAt, removeStickyNote, updateStickyNote,
    worldClocks, addWorldClock, addWorldClockAt, removeWorldClock, updateWorldClock,
    deadlines, addDeadline, addDeadlineAt, removeDeadline, updateDeadline,
    widgetPositions, setWidgetPosition,
    todoItems, setTodoItems,
    restoreItems,
  };
}
