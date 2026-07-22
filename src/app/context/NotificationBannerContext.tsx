import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Bell, Brush, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useAccent } from "./AccentContext";
import { notificationService, type NotificationDto } from "../../services/notification.service";
import { questService, type Quest, type QuestStatus } from "../../services/quest.service";

export interface BannerItem {
  id: string;
  content: ReactNode;
  durationMs: number;
}

type PushBannerInput = Omit<BannerItem, "durationMs"> & { durationMs?: number };

export interface NotificationHistoryItem {
  id: string;
  title: string;
  message: string;
  kind: "notification" | "quest" | "welcome" | "creator";
  createdAt: string;
  read: boolean;
}

type AddHistoryInput = Omit<NotificationHistoryItem, "read">;

export interface BannerSoundOption {
  key: string;
  label: string;
  value: string;
}

export const BANNER_SOUND_OPTIONS: BannerSoundOption[] = [
  { key: "default",       label: "Mặc định",     value: "/assets/BannerSound/Default.mp3" },
  { key: "notification1", label: "Thông báo 1",  value: "/assets/BannerSound/Notification1.mp3" },
  { key: "notification2", label: "Thông báo 2",  value: "/assets/BannerSound/Notification2.mp3" },
];

interface NotificationBannerCtx {
  banners: BannerItem[];
  pushBanner: (banner: PushBannerInput) => void;
  dismissBanner: (id: string) => void;
  /** Call when the user opens the Creator tab in the Aesthetic Store — clears any pending approve/reject banners for good. */
  markCreatorReviewNotificationsRead: () => void;
  /** Banner sound volume, 0–100. */
  bannerVolume: number;
  setBannerVolume: (v: number) => void;
  /** Which chime plays for banners — one of BANNER_SOUND_OPTIONS' values. */
  bannerSound: string;
  setBannerSound: (v: string) => void;
  /** Play the banner sound once at the current volume — used for a live preview in Settings. */
  previewBannerSound: () => void;
  /** Persisted (localStorage) log of every notification/quest/welcome banner ever shown to this user. */
  history: NotificationHistoryItem[];
  unreadHistoryCount: number;
  /** Call when the user opens the notification history panel — clears the unread badge. */
  markHistoryRead: () => void;
  /** Marks a single history entry read (used by a banner's action button, so its badge clears without opening the panel). */
  markHistoryItemRead: (id: string) => void;
  /** Wipes the notification history, both in memory and localStorage. */
  clearHistory: () => void;
  /** Removes a single history entry (used by the per-card delete button). */
  removeHistoryItem: (id: string) => void;
  /** Records a banner into the persisted history — call alongside pushBanner for banners raised outside this provider (e.g. WelcomeGreeting). */
  addHistoryItem: (item: AddHistoryInput) => void;
}

const DEFAULT_DURATION_MS = 6000;
const POLL_INTERVAL_MS = 25000;
const VOLUME_STORAGE_KEY = "asfe_banner_volume";
const SOUND_STORAGE_KEY = "asfe_banner_sound";
const HISTORY_STORAGE_PREFIX = "asfe_notification_history_";
const HISTORY_MAX_ITEMS = 200;

function historyKey(userId: string | null | undefined): string {
  return `${HISTORY_STORAGE_PREFIX}${userId ?? "guest"}`;
}

function loadHistory(userId: string | null | undefined): NotificationHistoryItem[] {
  try {
    const raw = localStorage.getItem(historyKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(userId: string | null | undefined, items: NotificationHistoryItem[]): void {
  try {
    localStorage.setItem(historyKey(userId), JSON.stringify(items));
  } catch {}
}

/** Backend sends "Transaction Approved" / "Transaction Rejected" for creator submission review outcomes. */
function isCreatorReviewNotification(title: string): boolean {
  return title.startsWith("Transaction ");
}

/** Small pill button rendered inside a banner's content — navigates to the relevant panel and dismisses the banner. */
function BannerActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        marginTop: 8, padding: "4px 8px", borderRadius: 7,
        background: `${color}1f`, border: `1px solid ${color}55`,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: "0.7rem", fontWeight: 600, color }}>{label}</span>
      <ArrowRight size={10} style={{ color }} />
    </button>
  );
}

const Ctx = createContext<NotificationBannerCtx | null>(null);

interface NotificationBannerProviderProps {
  children: ReactNode;
  /** Opens the Quest panel — wired by StudySpacePage so quest-completed banners/history can jump there. */
  onOpenQuest?: () => void;
  /** Opens the Aesthetic Store's Creator tab — wired by StudySpacePage for creator-review banners/history. */
  onOpenCreatorStore?: () => void;
}

export function NotificationBannerProvider({ children, onOpenQuest, onOpenCreatorStore }: NotificationBannerProviderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { accent } = useAccent();
  const accentRef = useRef(accent);
  accentRef.current = accent;
  const onOpenQuestRef = useRef(onOpenQuest);
  onOpenQuestRef.current = onOpenQuest;
  const onOpenCreatorStoreRef = useRef(onOpenCreatorStore);
  onOpenCreatorStoreRef.current = onOpenCreatorStore;

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const seenBannerIdsRef = useRef<Set<string>>(new Set());
  const questStatusRef = useRef<Map<string, QuestStatus> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.userId ?? null;

  const unreadHistoryCount = history.filter((h) => !h.read).length;

  const [bannerVolume, setBannerVolumeState] = useState<number>(() => {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw === null) return 100;
    const stored = Number(raw);
    return Number.isFinite(stored) && stored >= 0 && stored <= 100 ? stored : 100;
  });

  const [bannerSound, setBannerSoundState] = useState<string>(() => {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    return stored && BANNER_SOUND_OPTIONS.some((o) => o.value === stored)
      ? stored
      : BANNER_SOUND_OPTIONS[0].value;
  });

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = bannerVolume / 100;
  }, [bannerVolume]);

  const setBannerVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    setBannerVolumeState(clamped);
    localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
  }, []);

  const setBannerSound = useCallback((v: string) => {
    setBannerSoundState(v);
    localStorage.setItem(SOUND_STORAGE_KEY, v);
    if (audioRef.current) {
      audioRef.current.src = v;
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const dismissBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const pushBanner = useCallback((banner: PushBannerInput) => {
    if (seenBannerIdsRef.current.has(banner.id)) return;
    seenBannerIdsRef.current.add(banner.id);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    // New banner goes to the front so it renders on top, pushing earlier ones down.
    setBanners((prev) => [{ ...banner, durationMs: banner.durationMs ?? DEFAULT_DURATION_MS }, ...prev]);
  }, []);

  const previewBannerSound = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const addHistoryItem = useCallback((item: AddHistoryInput) => {
    setHistory((prev) => {
      if (prev.some((h) => h.id === item.id)) return prev;
      const next = [{ ...item, read: false }, ...prev].slice(0, HISTORY_MAX_ITEMS);
      saveHistory(userIdRef.current, next);
      return next;
    });
  }, []);

  const markHistoryRead = useCallback(() => {
    setHistory((prev) => {
      if (prev.every((h) => h.read)) return prev;
      const next = prev.map((h) => ({ ...h, read: true }));
      saveHistory(userIdRef.current, next);
      return next;
    });
  }, []);

  const markHistoryItemRead = useCallback((id: string) => {
    setHistory((prev) => {
      const item = prev.find((h) => h.id === id);
      if (!item || item.read) return prev;
      const next = prev.map((h) => (h.id === id ? { ...h, read: true } : h));
      saveHistory(userIdRef.current, next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory(userIdRef.current, []);
  }, []);

  const removeHistoryItem = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      saveHistory(userIdRef.current, next);
      return next;
    });
  }, []);

  const fetchAndAnnounce = useCallback(async () => {
    let list: NotificationDto[];
    try {
      list = await notificationService.getMyNotifications();
    } catch {
      return;
    }

    for (const n of list) {
      const bannerId = `notif_${n.id}`;
      if (n.isRead || seenBannerIdsRef.current.has(bannerId)) continue;

      const isCreatorReview = isCreatorReviewNotification(n.title);
      pushBanner({
        id: bannerId,
        durationMs: 7000,
        content: (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            {isCreatorReview
              ? <Brush size={16} style={{ color: "#a78bfa", flexShrink: 0, marginTop: 1 }} />
              : <Bell size={16} style={{ color: accentRef.current, flexShrink: 0, marginTop: 1 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "rgba(255,255,255,0.92)", fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.35 }}>
                {n.title}
              </div>
              {n.message && (
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.76rem", lineHeight: 1.45, marginTop: 4 }}>
                  {n.message}
                </div>
              )}
              {isCreatorReview && onOpenCreatorStoreRef.current && (
                <BannerActionBtn
                  label={t("notification.viewCreator")}
                  color="#a78bfa"
                  onClick={() => { onOpenCreatorStoreRef.current?.(); dismissBanner(bannerId); markHistoryItemRead(bannerId); }}
                />
              )}
            </div>
          </div>
        ),
      });
      addHistoryItem({ id: bannerId, title: n.title, message: n.message, kind: isCreatorReview ? "creator" : "notification", createdAt: n.createdAt });

      // Approve/reject outcomes stay unread — and keep reappearing on every space entry —
      // until the user checks their theme's status in the Creator tab. Everything else
      // (e.g. "Asset Published") is a one-time heads-up, so mark it read right away.
      if (!isCreatorReview) {
        notificationService.markRead(n.id).catch(() => {});
      }
    }
  }, [pushBanner, addHistoryItem, dismissBanner, markHistoryItemRead, t]);

  const fetchAndAnnounceQuests = useCallback(async () => {
    let quests: Quest[];
    try {
      quests = await questService.getQuests();
    } catch {
      return;
    }

    // First fetch after login only establishes the baseline — it never banner-storms
    // quests that were already claimable before this session started.
    const prevStatuses = questStatusRef.current;
    const nextStatuses = new Map<string, QuestStatus>();

    for (const q of quests) {
      nextStatuses.set(q.id, q.status);
      if (prevStatuses && prevStatuses.get(q.id) === "active" && q.status === "claimable") {
        const questTitle = t("quest.completedBannerTitle", { title: q.title });
        const questDesc = t("quest.completedBannerDesc", { reward: q.reward.toLocaleString("vi-VN") });
        const questBannerId = `quest_${q.id}`;
        pushBanner({
          id: questBannerId,
          durationMs: 7000,
          content: (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Trophy size={16} style={{ color: "#facc15", flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "rgba(255,255,255,0.92)", fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.35 }}>
                  {questTitle}
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.76rem", lineHeight: 1.45, marginTop: 4 }}>
                  {questDesc}
                </div>
                {onOpenQuestRef.current && (
                  <BannerActionBtn
                    label={t("notification.viewQuest")}
                    color="#facc15"
                    onClick={() => { onOpenQuestRef.current?.(); dismissBanner(questBannerId); markHistoryItemRead(questBannerId); }}
                  />
                )}
              </div>
            </div>
          ),
        });
        addHistoryItem({ id: questBannerId, title: questTitle, message: questDesc, kind: "quest", createdAt: new Date().toISOString() });
      }
    }

    questStatusRef.current = nextStatuses;
  }, [pushBanner, addHistoryItem, dismissBanner, markHistoryItemRead, t]);

  useEffect(() => {
    seenBannerIdsRef.current = new Set();
    questStatusRef.current = null;
    setHistory(loadHistory(user?.userId ?? null));
    if (!user) return;

    audioRef.current = new Audio(bannerSound);
    audioRef.current.volume = bannerVolume / 100;
    audioRef.current.load();

    fetchAndAnnounce();
    fetchAndAnnounceQuests();
    const interval = window.setInterval(() => {
      fetchAndAnnounce();
      fetchAndAnnounceQuests();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, fetchAndAnnounce, fetchAndAnnounceQuests]);

  const markCreatorReviewNotificationsRead = useCallback(() => {
    notificationService.getMyNotifications()
      .then((list) => {
        const unreadReview = list.filter((n) => !n.isRead && isCreatorReviewNotification(n.title));
        unreadReview.forEach((n) => { notificationService.markRead(n.id).catch(() => {}); });
      })
      .catch(() => {});
  }, []);

  return (
    <Ctx.Provider
      value={{
        banners,
        pushBanner,
        dismissBanner,
        markCreatorReviewNotificationsRead,
        bannerVolume,
        setBannerVolume,
        bannerSound,
        setBannerSound,
        previewBannerSound,
        history,
        unreadHistoryCount,
        markHistoryRead,
        markHistoryItemRead,
        clearHistory,
        removeHistoryItem,
        addHistoryItem,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useNotificationBanners(): NotificationBannerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotificationBanners must be used within a NotificationBannerProvider");
  return ctx;
}
