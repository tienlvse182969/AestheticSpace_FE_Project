import { Music, Timer, ListTodo, Clock, Quote } from "lucide-react";
import type { WidgetId, BackgroundItem } from "./types";
import stickerEarth from "figma:asset/523a81dd5cd4987e575a61010e8cccaceb341c59.png";
import stickerCat from "figma:asset/973e0a524173206b28b229b8fba5daec05767974.png";

export const RAINY_ART =
  "https://images.unsplash.com/photo-1641423522805-f446952f4173?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200";

export const SC_SRC =
  "https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/lofi-hip-hop-music/sets/lofi-hip-hop-music&color=%234e7c6a&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false";

export const TRACK_NAMES = [
  "Rainy Night", "Coffee & Books", "Late Autumn",
  "Midnight Study", "Forest Rain", "Soft Hours",
];

export type MusicSource = "youtube" | "soundcloud";

export interface PresetPlaylist {
  id: string;
  label: string;
  url: string;
  art: string;
  artist: string;
}

export const YT_PRESETS: PresetPlaylist[] = [
  {
    id: "yt-lofi-girl",
    label: "Lofi Girl",
    url: "https://www.youtube.com/playlist?list=PLZoTAELRMXVNMbAuQA5kMw5FHqHSq8OP1",
    art: "https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg",
    artist: "Lofi Girl",
  },
  {
    id: "yt-chillhop",
    label: "Chillhop",
    url: "https://www.youtube.com/watch?v=7NOSDKb0HlU",
    art: "https://img.youtube.com/vi/7NOSDKb0HlU/mqdefault.jpg",
    artist: "Chillhop Music",
  },
  {
    id: "yt-study",
    label: "Study Beats",
    url: "https://www.youtube.com/watch?v=lTRiuFIWV54",
    art: "https://img.youtube.com/vi/lTRiuFIWV54/mqdefault.jpg",
    artist: "College Music",
  },
];

export const SC_PRESETS: PresetPlaylist[] = [
  {
    id: "sc-lofi",
    label: "Lofi Hip Hop",
    url: "https://soundcloud.com/lofi-hip-hop-music/sets/lofi-hip-hop-music",
    art: RAINY_ART,
    artist: "lofi hip hop music",
  },
  {
    id: "sc-chill",
    label: "Chill Beats",
    url: "https://soundcloud.com/chillhopmusic/sets/chillhop-essentials-spring-2024",
    art: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    artist: "Chillhop Records",
  },
  {
    id: "sc-jazz",
    label: "Jazz Café",
    url: "https://soundcloud.com/jazz-night-music/sets/jazz-coffee-music",
    art: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    artist: "Jazz Night Music",
  },
];

export const DEFAULT_BG: BackgroundItem = {
  id: "dan-otis-default",
  url: "/assets/AboutWallpaper/dan-otis-OYFHT4X5isg-unsplash.jpg",
  thumb: "/assets/AboutWallpaper/dan-otis-OYFHT4X5isg-unsplash.jpg",
  label: "Aesthetic Room",
};

export const BACKGROUNDS: BackgroundItem[] = [
  {
    id: "cherry",
    url: "https://images.unsplash.com/photo-1773724631780-d8a14c237105?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    thumb: "https://images.unsplash.com/photo-1773724631780-d8a14c237105?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    label: "Cherry Blossom",
  },
  {
    id: "winter",
    url: "https://images.unsplash.com/photo-1642103358675-811b336afeed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    thumb: "https://images.unsplash.com/photo-1642103358675-811b336afeed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    label: "Winter Mountain",
  },
  {
    id: "beach",
    url: "https://images.unsplash.com/photo-1599514724006-daebc8dca239?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    thumb: "https://images.unsplash.com/photo-1599514724006-daebc8dca239?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    label: "Beach Sunset",
  },
  {
    id: "desk",
    url: "https://images.unsplash.com/photo-1767800766055-1cdbd2e351b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    thumb: "https://images.unsplash.com/photo-1767800766055-1cdbd2e351b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    label: "Gaming Desk",
  },
  {
    id: "rice",
    url: "https://images.unsplash.com/photo-1759509040606-62075bd7a5b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    thumb: "https://images.unsplash.com/photo-1759509040606-62075bd7a5b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    label: "Golden Field",
  },
  {
    id: "forest",
    url: "https://images.unsplash.com/photo-1766910095060-03115e07bbc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    thumb: "https://images.unsplash.com/photo-1766910095060-03115e07bbc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    label: "Rainy Forest",
  },
  {
    id: "library",
    url: "https://images.unsplash.com/photo-1723130038126-50c91c19ebe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    thumb: "https://images.unsplash.com/photo-1723130038126-50c91c19ebe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    label: "Autumn Library",
  },
  {
    id: "japan",
    url: "https://images.unsplash.com/photo-1769784496958-288f6e0ee2db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    thumb: "https://images.unsplash.com/photo-1769784496958-288f6e0ee2db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    label: "Japan Night",
  },
  {
    id: "bedroom",
    url: "https://images.unsplash.com/photo-1606796913825-2b02883605e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    thumb: "https://images.unsplash.com/photo-1606796913825-2b02883605e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    label: "Morning Light",
  },
];

export const WIDGET_DEFS: {
  id: WidgetId;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
}[] = [
  {
    id: "music",
    label: "Music Player",
    desc: "Lo-fi & chill music via YouTube & SoundCloud",
    icon: Music,
    color: "#38bdf8",
  },
  {
    id: "pomodoro",
    label: "Pomodoro Timer",
    desc: "Focus sessions with circular timer",
    icon: Timer,
    color: "#4ade80",
  },
  {
    id: "todo",
    label: "To-do List",
    desc: "Track tasks during your study session",
    icon: ListTodo,
    color: "#a78bfa",
  },
  {
    id: "clock",
    label: "Clock",
    desc: "Current time with seconds arc",
    icon: Clock,
    color: "#fbbf24",
  },
  {
    id: "quote",
    label: "Quote of the Day",
    desc: "Daily inspiration, refreshable anytime",
    icon: Quote,
    color: "#2dd4bf",
  },
];

export const SAMPLE_STICKERS = [
  { id: "earth", src: stickerEarth as string, label: "Earth Boy" },
  { id: "cat",   src: stickerCat as string,   label: "Cat Lemon" },
];