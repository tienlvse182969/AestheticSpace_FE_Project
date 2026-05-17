import { useState } from "react";
import type { WidgetId, PlacedSticker, StickyNote } from "../../components/StudySpace/types";

export function useSpaceItems() {
  const [activeWidgets, setActiveWidgets]     = useState<Set<WidgetId>>(new Set(["clock", "pomodoro"]));
  const [placedStickers, setPlacedStickers]   = useState<PlacedSticker[]>([]);
  const [stickyNotes, setStickyNotes]         = useState<StickyNote[]>([]);

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

  const updateStickyNote = (id: string, patch: Partial<Pick<StickyNote, "text" | "color" | "w" | "h">>) =>
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));

  return {
    activeWidgets, toggleWidget, removeWidget,
    placedStickers, placeSticker, removeSticker,
    stickyNotes, addStickyNote, removeStickyNote, updateStickyNote,
  };
}
