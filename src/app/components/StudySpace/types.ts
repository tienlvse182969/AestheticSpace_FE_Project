export type WidgetId =
  | "music" | "pomodoro" | "todo" | "clock" | "quote"
  | "wellness" | "photoFrame" | "doodle" | "googleCalendar";

export type ClockMode     = "digital" | "analog";
export type DigitalLayout = "horizontal" | "vertical";

export interface BackgroundItem {
  id: string;
  url: string;
  thumb: string;
  label: string;
  photographer?: string;
  photographerUrl?: string;
  downloadLocation?: string;
}

export interface PlacedSticker {
  id: string;
  src: string;
  x: number;
  y: number;
  size: number;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface StickyNote {
  id: string;
  text: string;
  color: string; // color id from STICKY_COLORS
  x: number;
  y: number;
  w?: number;
  h?: number;
}

export interface WorldClockItem {
  id: string;
  label: string;
  timezone: string; // IANA timezone id, e.g. "Asia/Tokyo"
  x: number;
  y: number;
}

export interface DeadlineItem {
  id: string;
  title: string;
  targetAt: string; // ISO datetime
  color?: string;
  x: number;
  y: number;
}