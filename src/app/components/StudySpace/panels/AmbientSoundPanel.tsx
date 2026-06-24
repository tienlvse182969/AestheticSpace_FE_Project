import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { LoadingRing } from "../../ui/LoadingRing";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { Music2, AudioWaveform, Music, ShoppingBag, Waves, Palette, AlertCircle, RefreshCw } from "lucide-react";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { adminAssetsService } from "../../../../services/admin/assets.admin.service";
import {
  aestheticStoreService,
  type StoreItem,
} from "../../../../services/aestheticStore.service";

const MotionBox = motion.create(Box);
const MotionDiv = motion.div;

/* ── Color helpers ────────────────────────────────────────────────────────── */
const CATEGORY_COLOR_MAP: Record<string, string> = {
  cafe: "#fb923c", coffee: "#fb923c",
  rain: "#60a5fa", nature: "#4ade80",
  forest: "#22c55e", rainforest: "#22c55e",
  ocean: "#38bdf8", beach: "#fbbf24",
  fire: "#f97316", fireplace: "#f97316",
  wind: "#a3e635", thunder: "#818cf8",
  storm: "#818cf8", city: "#a78bfa",
  street: "#a78bfa", birds: "#4ade80",
  lofi: "#c084fc", study: "#c084fc",
  white: "#94a3b8", noise: "#94a3b8",
  water: "#22d3ee", waterfall: "#22d3ee",
  creek: "#34d399", underwater: "#38bdf8",
};
const FALLBACK_COLORS = [
  "#60a5fa", "#4ade80", "#fb923c", "#a78bfa",
  "#fbbf24", "#22d3ee", "#f87171", "#34d399",
];

function resolveColor(hint: string | null, idx: number): string {
  if (hint) {
    const lower = hint.toLowerCase();
    for (const [key, color] of Object.entries(CATEGORY_COLOR_MAP)) {
      if (lower.includes(key)) return color;
    }
  }
  return FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

function parseFirstPreviewUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p) && p[0]) return p[0];
  } catch {}
  return raw;
}

/* ── Sound entry ──────────────────────────────────────────────────────────── */
interface SoundEntry {
  id: string;
  name: string;
  url: string | null;
  colorHint: string | null;
  defaultVolume: number;
  previewUrl?: string | null;
}

/* ── Theme ambient group ──────────────────────────────────────────────────── */
type ThemeAmbientGroup = {
  themeId: string;
  themeName: string;
  themeSource: string | null;
  sound: SoundEntry | null;
};

type PurchasedFilter = "store" | "theme";

/* ── Animated waveform ────────────────────────────────────────────────────── */
function WaveIndicator({ color }: { color: string }) {
  return (
    <Flex align="flex-end" gap="2px" style={{ height: 14 }}>
      {[3, 5, 4, 7, 4, 5, 3].map((h, i) => (
        <MotionDiv
          key={i}
          style={{ width: 2.5, borderRadius: 1.5, background: color }}
          animate={{ height: [h * 1.4, h * 2.6, h * 1.2, h * 2.2, h * 1.4] }}
          transition={{ repeat: Infinity, duration: 0.78 + i * 0.09, ease: "easeInOut" }}
        />
      ))}
    </Flex>
  );
}

/* ── Individual sound card ────────────────────────────────────────────────── */
function SoundCard({
  label, color, isOn, volume, onToggle, onVolume, previewUrl,
}: {
  label: string; color: string;
  isOn: boolean; volume: number;
  onToggle: () => void; onVolume: (v: number) => void;
  previewUrl?: string | null;
}) {
  return (
    <Box
      as="button"
      onClick={onToggle}
      position="relative"
      overflow="hidden"
      borderRadius="12px"
      style={{
        height: 165, cursor: "pointer",
        border: `2px solid ${isOn ? color : "transparent"}`,
        boxShadow: isOn ? `0 0 18px ${color}55` : "none",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
        display: "block", width: "100%", padding: 0,
        background: previewUrl
          ? `center/cover no-repeat url(${previewUrl})`
          : isOn
          ? `linear-gradient(145deg, ${color}38 0%, rgba(8,18,14,0.96) 65%)`
          : `linear-gradient(145deg, ${color}14 0%, rgba(8,18,14,0.92) 65%)`,
      }}
      _hover={{ transform: "scale(1.03)" } as any}
    >
      {/* Dot-grid texture — only when no preview image */}
      {!previewUrl && (
        <Box position="absolute" inset={0} style={{
          backgroundImage: `radial-gradient(circle, ${color}22 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
          opacity: isOn ? 0.9 : 0.45,
          transition: "opacity 0.25s",
        }} />
      )}

      {/* Active color tint overlay */}
      {previewUrl && isOn && (
        <Box position="absolute" inset={0} style={{
          background: `${color}18`,
          transition: "background 0.2s",
        }} />
      )}

      <Box position="absolute" top="10px" right="10px"
        style={{ opacity: isOn ? 0.6 : 0.2, transition: "opacity 0.2s", zIndex: 1 }}>
        <Music size={18} style={{ color }} />
      </Box>

      <Flex position="absolute" bottom={0} left={0} right={0}
        direction="column" px="10px" pb="10px" gap="6px" style={{ zIndex: 1 }}>
        <AnimatePresence>
          {isOn && (
            <MotionBox key="slider"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.16 } as any}>
              <input
                type="range" min={0} max={100} value={volume}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => { e.stopPropagation(); onVolume(Number(e.target.value)); }}
                style={{
                  width: "100%", height: 3, borderRadius: 4,
                  appearance: "none", WebkitAppearance: "none",
                  background: `linear-gradient(to right, ${color} ${volume}%, rgba(255,255,255,0.22) ${volume}%)`,
                  outline: "none", cursor: "pointer", display: "block",
                }}
              />
            </MotionBox>
          )}
        </AnimatePresence>

        <Flex align="center" justify="space-between">
          <Text style={{
            fontSize: "0.78rem", fontWeight: 500,
            color: isOn ? "white" : "rgba(255,255,255,0.72)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            textShadow: "0 1px 6px rgba(0,0,0,0.7)",
            letterSpacing: "0.01em",
            maxWidth: "70%", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {label}
          </Text>
          <AnimatePresence>
            {isOn && (
              <MotionBox key="wave"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 } as any}>
                <WaveIndicator color={color} />
              </MotionBox>
            )}
          </AnimatePresence>
        </Flex>
      </Flex>
    </Box>
  );
}

/* ── Main panel ───────────────────────────────────────────────────────────── */
interface AmbientSoundPanelProps {
  onClose: () => void;
  activeIds: Set<string>;
  volumeMap: Record<string, number>;
  onToggle: (id: string, url: string, defaultVolume: number) => void;
  onVolume: (id: string, val: number) => void;
  onInitVolume: (id: string, defaultVol: number) => void;
}

export function AmbientSoundPanel({
  onClose, activeIds, volumeMap, onToggle, onVolume, onInitVolume,
}: AmbientSoundPanelProps) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(548, 580);
  const FONT = "'HarmonyOS Sans', sans-serif";

  const [tab, setTab] = useState<"default" | "purchased">("default");
  const [purchasedFilter, setPurchasedFilter] = useState<PurchasedFilter>("store");

  /* ── Default sounds ── */
  const [defaultSounds,  setDefaultSounds]  = useState<SoundEntry[]>([]);
  const [defaultLoading, setDefaultLoading] = useState(true);
  const [defaultError,   setDefaultError]   = useState<string | null>(null);

  /* ── Store-bought sounds ── */
  const [purchasedSounds,  setPurchasedSounds]  = useState<SoundEntry[]>([]);
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [purchasedError,   setPurchasedError]   = useState<string | null>(null);

  /* ── Theme-bundled sounds ── */
  const [themeGroups,      setThemeGroups]      = useState<ThemeAmbientGroup[]>([]);
  const [themeLoading,     setThemeLoading]     = useState(false);
  const [themeError,       setThemeError]       = useState(false);

  /* ── Fetch default ── */
  const fetchDefault = useCallback(async () => {
    setDefaultLoading(true);
    setDefaultError(null);
    try {
      const result = await adminAssetsService.getAssets("Audio");
      setDefaultSounds(result.map(s => ({
        id: s.id, name: s.name ?? "",
        url: s.url, colorHint: s.category,
        defaultVolume: s.defaultVolume ?? 50,
      })));
      result.forEach(s => onInitVolume(s.id, s.defaultVolume ?? 50));
    } catch {
      setDefaultError(t("ambient.loadError"));
    } finally {
      setDefaultLoading(false);
    }
  }, [t, onInitVolume]);

  /* ── Fetch store-bought ── */
  const fetchPurchased = useCallback(async () => {
    setPurchasedLoading(true);
    setPurchasedError(null);
    try {
      const allItems = await aestheticStoreService.getItems(undefined, 1, 200);
      const filtered = allItems.filter((i: StoreItem) => i.category === "AmbientSound" && i.isOwned);
      setPurchasedSounds(filtered.map((item: StoreItem) => ({
        id: item.id, name: item.name,
        url: item.assetUrl ?? null, colorHint: item.name,
        defaultVolume: 50,
        previewUrl: parseFirstPreviewUrl(item.previewUrl),
      })));
      filtered.forEach((item: StoreItem) => onInitVolume(item.id, 50));
    } catch {
      setPurchasedError(t("ambient.loadError"));
    } finally {
      setPurchasedLoading(false);
    }
  }, [t, onInitVolume]);

  /* ── Fetch theme-bundled ── */
  const fetchThemeAmbients = useCallback(async () => {
    setThemeLoading(true);
    setThemeError(false);
    try {
      const allItems = await aestheticStoreService.getItems(undefined, 1, 200);
      const ownedThemes = allItems.filter((i: StoreItem) => i.category === "Theme" && i.isOwned);
      const groups: ThemeAmbientGroup[] = ownedThemes.map((theme: StoreItem) => {
        const soundItem = theme.themeAmbientSoundItemId
          ? allItems.find((i: StoreItem) => i.id === theme.themeAmbientSoundItemId)
          : null;
        const sound: SoundEntry | null = soundItem?.assetUrl
          ? {
              id: soundItem.id,
              name: soundItem.name,
              url: soundItem.assetUrl,
              colorHint: soundItem.name,
              defaultVolume: 50,
              previewUrl: parseFirstPreviewUrl(soundItem.previewUrl),
            }
          : null;
        return {
          themeId: theme.id,
          themeName: theme.name,
          themeSource: theme.themeSource ?? null,
          sound,
        };
      });
      setThemeGroups(groups);
      groups.forEach(g => g.sound && onInitVolume(g.sound.id, 50));
    } catch {
      setThemeError(true);
    } finally {
      setThemeLoading(false);
    }
  }, [onInitVolume]);

  useEffect(() => { fetchDefault(); }, [fetchDefault]);

  useEffect(() => {
    if (tab !== "purchased") return;
    if (purchasedFilter === "store") fetchPurchased();
    else fetchThemeAmbients();
  }, [tab, purchasedFilter, fetchPurchased, fetchThemeAmbients]);

  /* ── All sounds for footer ── */
  const themeSounds = themeGroups.map(g => g.sound).filter((s): s is SoundEntry => s !== null);
  const allSounds = [...defaultSounds, ...purchasedSounds, ...themeSounds];
  const activeSoundEntries = allSounds.filter(s => activeIds.has(s.id));
  const activeCount        = activeSoundEntries.length;
  const mixLabel           = activeSoundEntries.slice(0, 3).map(s => s.name).join(" · ");

  /* ── Styles ── */
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: "8px", cursor: "pointer",
    fontSize: "0.76rem", fontFamily: FONT,
    fontWeight: active ? 600 : 400,
    color: active ? "#fff" : "rgba(255,255,255,0.45)",
    background: active ? "rgba(255,255,255,0.1)" : "transparent",
    border: "none", transition: "all 0.15s",
    display: "flex", alignItems: "center", gap: "6px",
  });

  const pillStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
    border: active ? "1px solid rgba(255,255,255,0.32)" : "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px",
    color: active ? "#fff" : "rgba(255,255,255,0.45)",
    fontSize: "0.74rem", fontFamily: FONT,
    fontWeight: active ? 600 : 400,
    padding: "4px 14px", cursor: "pointer",
    transition: "all 0.15s", whiteSpace: "nowrap",
  });

  /* ── Grid renderer ── */
  const renderGrid = (
    sounds: SoundEntry[],
    loading: boolean,
    error: string | null,
    onRetry: () => void,
    emptyMsg: string,
    emptyHint?: string,
    emptyIcon?: React.ReactNode,
  ) => {
    if (loading) return (
      <Flex align="center" justify="center" style={{ height: "100%" }} gap={3}>
        <LoadingRing size={18} />
        <Text style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", fontFamily: FONT }}>
          {t("ambient.loading")}
        </Text>
      </Flex>
    );
    if (error) return (
      <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
        <AlertCircle size={24} color="rgba(248,113,113,0.55)" />
        <Text style={{ fontSize: "0.82rem", color: "rgba(248,113,113,0.8)", fontFamily: FONT }}>
          {error}
        </Text>
        <Box as="button" onClick={onRetry} display="flex" alignItems="center" gap={2}
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 7, padding: "5px 14px", cursor: "pointer",
            fontSize: "0.76rem", color: "rgba(255,255,255,0.6)", fontFamily: FONT,
          }}>
          <RefreshCw size={12} /> {t("ambient.retry")}
        </Box>
      </Flex>
    );
    if (sounds.length === 0) return (
      <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
        {emptyIcon ?? <ShoppingBag size={32} style={{ color: "rgba(255,255,255,0.2)" }} />}
        <Text style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", fontFamily: FONT, fontWeight: 500 }}>
          {emptyMsg}
        </Text>
        {emptyHint && (
          <Text style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.22)", fontFamily: FONT }}>
            {emptyHint}
          </Text>
        )}
      </Flex>
    );
    return (
      <Box display="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {sounds.map((s, i) => (
          <SoundCard
            key={s.id}
            label={s.name}
            color={resolveColor(s.colorHint, i)}
            isOn={activeIds.has(s.id)}
            volume={volumeMap[s.id] ?? s.defaultVolume}
            onToggle={() => { if (s.url) onToggle(s.id, s.url, s.defaultVolume); }}
            onVolume={(v) => onVolume(s.id, v)}
            previewUrl={s.previewUrl}
          />
        ))}
      </Box>
    );
  };

  /* ── Theme groups renderer ── */
  const renderThemeGroups = () => {
    if (themeLoading) return (
      <Box display="flex" flexDirection="column" gap="16px">
        {Array.from({ length: 3 }).map((_, i) => (
          <Box key={i}>
            <Box mb="6px" h="12px" w="100px" borderRadius="4px"
              className="animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
            <Box display="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              <Box borderRadius="12px" className="animate-pulse"
                style={{ height: 165, background: "rgba(255,255,255,0.07)" }} />
            </Box>
          </Box>
        ))}
      </Box>
    );

    if (themeError) return (
      <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
        <AlertCircle size={24} color="rgba(248,113,113,0.55)" />
        <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", fontFamily: FONT }}>
          Không tải được dữ liệu
        </Text>
        <Box as="button" onClick={fetchThemeAmbients} display="flex" alignItems="center" gap={2}
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 7, color: "rgba(255,255,255,0.6)", fontSize: "0.76rem",
            padding: "5px 14px", cursor: "pointer", fontFamily: FONT,
          }}>
          <RefreshCw size={12} /> Retry
        </Box>
      </Flex>
    );

    if (themeGroups.length === 0) return (
      <Flex direction="column" align="center" justify="center" style={{ height: "100%" }} gap={3}>
        <Palette size={32} style={{ color: "rgba(255,255,255,0.15)" }} />
        <Text style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", fontFamily: FONT, fontWeight: 500 }}>
          {t("ambient.noPurchased")}
        </Text>
        <Text style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.22)", fontFamily: FONT }}>
          Mua theme để âm thanh xuất hiện ở đây
        </Text>
      </Flex>
    );

    return (
      <Box display="flex" flexDirection="column" gap="16px">
        {themeGroups.map(group => (
          <Box key={group.themeId}>
            {/* Theme label */}
            <Flex align="center" gap="7px" mb="7px"
              style={{ borderLeft: "2px solid rgba(167,139,250,0.45)", paddingLeft: "8px" }}>
              <Palette size={11} color="rgba(167,139,250,0.65)" />
              <Text style={{
                fontSize: "0.68rem", fontFamily: FONT, fontWeight: 600,
                color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em",
                flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {group.themeName}
              </Text>
              {group.themeSource && (
                <Box style={{
                  padding: "1px 6px", borderRadius: "4px",
                  fontSize: "0.55rem", fontFamily: FONT, fontWeight: 700,
                  letterSpacing: "0.06em", flexShrink: 0,
                  background: group.themeSource === "Official"
                    ? "rgba(251,191,36,0.18)" : "rgba(20,184,166,0.15)",
                  color: group.themeSource === "Official"
                    ? "rgba(251,191,36,0.9)" : "rgba(20,184,166,0.9)",
                }}>
                  {group.themeSource === "Official" ? "✦ Official" : "Community"}
                </Box>
              )}
            </Flex>

            {/* Sound card */}
            {group.sound ? (
              <Box display="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                <SoundCard
                  label={group.sound.name}
                  color={resolveColor(group.sound.colorHint, themeGroups.indexOf(group))}
                  isOn={activeIds.has(group.sound.id)}
                  volume={volumeMap[group.sound.id] ?? group.sound.defaultVolume}
                  onToggle={() => { if (group.sound?.url) onToggle(group.sound.id, group.sound.url, group.sound.defaultVolume); }}
                  onVolume={(v) => group.sound && onVolume(group.sound.id, v)}
                  previewUrl={group.sound.previewUrl}
                />
              </Box>
            ) : (
              <Text style={{ fontSize: "0.7rem", fontFamily: FONT, color: "rgba(255,255,255,0.2)", paddingLeft: "10px" }}>
                Không có âm thanh kèm theo
              </Text>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <MotionBox
      ref={ref as any}
      drag dragMomentum={false} dragElastic={0}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 24, mass: 0.9 } } as any}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } } as any}
      position="fixed" top={0} left={0} zIndex={50}
      style={{
        x, y, width: 548, height: 580,
        borderRadius: "18px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 28px 90px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
        cursor: "grab", display: "flex", flexDirection: "column", overflow: "hidden",
      }}
    >
      <Box position="relative" style={{ padding: "18px 18px 16px", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <PanelCloseBtn onClose={onClose} />

        {/* ── Header ── */}
        <Flex align="center" gap={2} mb={3} pr="50px">
          <AudioWaveform size={15} style={{ color: "rgba(255,255,255,0.45)" }} />
          <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.32)", letterSpacing: "0.1em", fontFamily: FONT }}>
            {t("ambient.title")}
          </Text>
          {activeCount > 0 && (
            <Box ml="auto" style={{
              fontSize: "0.62rem", color: "rgba(74,222,128,0.75)",
              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
              borderRadius: "20px", padding: "2px 9px",
              fontFamily: FONT, letterSpacing: "0.06em",
            }}>
              {activeCount} {activeCount === 1 ? "layer" : "layers"}
            </Box>
          )}
        </Flex>

        {/* ── Tabs ── */}
        <Flex mb={3} gap={1} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "10px" }}>
          <Box as="button" style={tabStyle(tab === "default")} onClick={() => setTab("default")}>
            <Waves size={13} />
            {t("ambient.tabDefault")}
          </Box>
          <Box as="button" style={tabStyle(tab === "purchased")} onClick={() => setTab("purchased")}>
            <ShoppingBag size={13} />
            {t("ambient.tabPurchased")}
          </Box>
        </Flex>

        {/* ── Sub-filter pills — purchased tab only ── */}
        {tab === "purchased" && (
          <Flex gap={2} mb={3}>
            {(["store", "theme"] as const).map(f => (
              <Box key={f} as="button" onClick={() => setPurchasedFilter(f)} style={pillStyle(purchasedFilter === f)}>
                {f === "store" ? "Mua lẻ" : "Kèm giao diện"}
              </Box>
            ))}
          </Flex>
        )}

        {/* ── Content ── */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", marginRight: -4, paddingRight: 4 }}>
          {tab === "default" && renderGrid(
            defaultSounds, defaultLoading, defaultError, fetchDefault,
            "No audio assets found",
          )}
          {tab === "purchased" && purchasedFilter === "store" && renderGrid(
            purchasedSounds, purchasedLoading, purchasedError, fetchPurchased,
            t("ambient.noPurchased"),
            t("ambient.noPurchasedHint"),
          )}
          {tab === "purchased" && purchasedFilter === "theme" && renderThemeGroups()}
        </Box>

        {/* ── Now mixing footer ── */}
        <Box mt={3} flexShrink={0} borderRadius="12px" px="14px" py="10px"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {activeCount > 0 ? (
            <Flex align="center" gap={3}>
              <Flex borderRadius="full" align="center" justify="center" flexShrink={0}
                style={{ width: 30, height: 30, background: "linear-gradient(135deg,#4ade80,#38bdf8)" }}>
                <Music2 size={13} style={{ color: "#0a0f14" }} />
              </Flex>
              <Box flex={1} minW={0}>
                <Text style={{
                  fontSize: "0.77rem", color: "rgba(255,255,255,0.82)", fontFamily: FONT,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {mixLabel}{activeCount > 3 ? ` +${activeCount - 3}` : ""}
                </Text>
                <Text style={{ fontSize: "0.68rem", color: "rgba(74,222,128,0.5)", fontFamily: FONT }}>
                  {t("ambient.layersActive", { count: activeCount })}
                </Text>
              </Box>
              <WaveIndicator color="#4ade80" />
            </Flex>
          ) : (
            <Flex align="center" gap={3}>
              <Flex borderRadius="full" align="center" justify="center" flexShrink={0}
                style={{ width: 30, height: 30, background: "rgba(255,255,255,0.05)" }}>
                <Music2 size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
              </Flex>
              <Text style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.28)", fontFamily: FONT }}>
                {t("ambient.noSounds")}
              </Text>
            </Flex>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
}
