import { useState } from "react";
import type { WidgetId, PlacedSticker, StickyNote, TodoItem } from "../../components/StudySpace/types";

const DEFAULT_TODOS: TodoItem[] = [];

export function useSpaceItems() {
  const [activeWidgets, setActiveWidgets]     = useState<Set<WidgetId>>(new Set());
  const [placedStickers, setPlacedStickers]   = useState<PlacedSticker[]>([]);
  const [stickyNotes, setStickyNotes]         = useState<StickyNote[]>([]);
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

  const placeSticker = (src: string) => {
    const sw = window.innerWidth, sh = window.innerHeight;
    setPlacedStickers(prev => [
      ...prev,
      {
        id: `sticker-${Date.now()}`,
        src,
        x: Math.round(sw / 2 - 70 + (Math.random() - 0.5) * 160),
        y: Math.round(sh / 2 - 70 + (Math.random() - 0.5) * 120),
        size: 140,
      },
    ]);
  };

  const removeSticker = (id: string) =>
    setPlacedStickers(prev => prev.filter(s => s.id !== id));

  const updateSticker = (id: string, patch: Partial<Pick<PlacedSticker, "x" | "y">>) =>
    setPlacedStickers(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

  const addStickyNote = () => {
    const sw = window.innerWidth, sh = window.innerHeight;
    setStickyNotes(prev => [
      ...prev,
      {
        id: `sticky-${Date.now()}`,
        text: "",
        color: "yellow",
        x: Math.round(sw / 2 - 108 + (Math.random() - 0.5) * 200),
        y: Math.round(sh / 2 - 120 + (Math.random() - 0.5) * 140),
      },
    ]);
  };

  const removeStickyNote = (id: string) =>
    setStickyNotes(prev => prev.filter(n => n.id !== id));

  const updateStickyNote = (id: string, patch: Partial<Pick<StickyNote, "text" | "color" | "w" | "h" | "x" | "y">>) =>
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));

  const setWidgetPosition = (id: string, pos: { x: number; y: number }) =>
    setWidgetPositions(prev => ({ ...prev, [id]: pos }));

  const restoreItems = (data: {
    activeWidgets?: string[];
    placedStickers?: PlacedSticker[];
    stickyNotes?: StickyNote[];
    widgetPositions?: Record<string, { x: number; y: number }>;
    todoItems?: TodoItem[];
  }) => {
    if (data.activeWidgets) setActiveWidgets(new Set(data.activeWidgets as WidgetId[]));
    if (data.placedStickers) setPlacedStickers(data.placedStickers);
    if (data.stickyNotes) setStickyNotes(data.stickyNotes);
    if (data.widgetPositions) setWidgetPositions(data.widgetPositions);
    if (data.todoItems) setTodoItems(data.todoItems);
  };

  return {
    activeWidgets, toggleWidget, removeWidget,
    placedStickers, placeSticker, removeSticker, updateSticker,
    stickyNotes, addStickyNote, removeStickyNote, updateStickyNote,
    widgetPositions, setWidgetPosition,
    todoItems, setTodoItems,
    restoreItems,
  };
}
