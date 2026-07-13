import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, Trophy } from "lucide-react";
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
}

const DEFAULT_DURATION_MS = 6000;
const POLL_INTERVAL_MS = 25000;
const VOLUME_STORAGE_KEY = "asfe_banner_volume";
const SOUND_STORAGE_KEY = "asfe_banner_sound";

/** Backend sends "Transaction Approved" / "Transaction Rejected" for creator submission review outcomes. */
function isCreatorReviewNotification(title: string): boolean {
  return title.startsWith("Transaction ");
}

const Ctx = createContext<NotificationBannerCtx | null>(null);

export function NotificationBannerProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { accent } = useAccent();
  const accentRef = useRef(accent);
  accentRef.current = accent;

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const seenBannerIdsRef = useRef<Set<string>>(new Set());
  const questStatusRef = useRef<Map<string, QuestStatus> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [bannerVolume, setBannerVolumeState] = useState<number>(() => {
    const stored = Number(localStorage.getItem(VOLUME_STORAGE_KEY));
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
            <Bell size={16} style={{ color: accentRef.current, flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "rgba(255,255,255,0.92)", fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.35 }}>
                {n.title}
              </div>
              {n.message && (
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.76rem", lineHeight: 1.45, marginTop: 4 }}>
                  {n.message}
                </div>
              )}
            </div>
          </div>
        ),
      });

      // Approve/reject outcomes stay unread — and keep reappearing on every space entry —
      // until the user checks their theme's status in the Creator tab. Everything else
      // (e.g. "Asset Published") is a one-time heads-up, so mark it read right away.
      if (!isCreatorReview) {
        notificationService.markRead(n.id).catch(() => {});
      }
    }
  }, [pushBanner]);

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
        pushBanner({
          id: `quest_${q.id}`,
          durationMs: 7000,
          content: (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Trophy size={16} style={{ color: "#facc15", flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "rgba(255,255,255,0.92)", fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.35 }}>
                  {t("quest.completedBannerTitle", { title: q.title })}
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.76rem", lineHeight: 1.45, marginTop: 4 }}>
                  {t("quest.completedBannerDesc", { reward: q.reward.toLocaleString("vi-VN") })}
                </div>
              </div>
            </div>
          ),
        });
      }
    }

    questStatusRef.current = nextStatuses;
  }, [pushBanner, t]);

  useEffect(() => {
    seenBannerIdsRef.current = new Set();
    questStatusRef.current = null;
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
