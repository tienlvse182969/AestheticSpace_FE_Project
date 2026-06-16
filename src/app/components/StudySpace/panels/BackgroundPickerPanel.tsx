import { useState, useCallback, useEffect, useRef, memo } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { motion } from "motion/react";
import { Search, Heart, Loader2, AlertCircle, RefreshCw, ExternalLink, ShoppingBag, Construction, ImagePlus, X, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { BACKGROUNDS } from "../constants";
import type { BackgroundItem } from "../types";
import { aestheticStoreService } from "../../../../services/aestheticStore.service";

const MotionBox = motion.create(Box);

import { hasUnsplashKey, searchUnsplash, triggerUnsplashDownload } from "../../../../services/unsplash.service";

const PRESET_TAGS = [
  "Aesthetic Study", "Forest", "Japan Night", "Cozy Cafe",
  "Mountain", "Ocean", "Rainy", "Cherry Blossom", "Library",
];


interface PhotoCardProps {
  bg: BackgroundItem;
  isActive: boolean;
  isFav: boolean;
  onSelect: () => void;
  onToggleFav: (e: React.MouseEvent) => void;
  favLabel: string;
}

const PhotoCard = memo(function PhotoCard({ bg, isActive, isFav, onSelect, onToggleFav, favLabel }: PhotoCardProps) {
  return (
    <Box
      position="relative"
      borderRadius="8px"
      overflow="hidden"
      style={{
        aspectRatio: "16/9",
        cursor: "pointer",
        border: isActive
          ? "2px solid rgba(255,255,255,0.9)"
          : "2px solid rgba(255,255,255,0.06)",
        boxShadow: isActive
          ? "0 0 0 3px rgba(255,255,255,0.18), 0 4px 16px rgba(0,0,0,0.5)"
          : "0 2px 10px rgba(0,0,0,0.45)",
        transform: isActive ? "scale(1.03)" : "scale(1)",
        transition: "all 0.18s ease",
      }}
      css={{
        "&:hover": {
          border: "2px solid rgba(255,255,255,0.5) !important",
          boxShadow: "0 6px 22px rgba(0,0,0,0.7) !important",
          transform: "scale(1.04) !important",
        },
        "&:hover .card-overlay": { opacity: "1 !important" },
        "&:hover .fav-btn":     { opacity: "1 !important" },
      }}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <Box
        position="absolute"
        inset={0}
        style={{
          backgroundImage: `url(${bg.thumb})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Gradient overlay with label */}
      <Box
        className="card-overlay"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        px="7px"
        py="5px"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
          opacity: isActive ? 1 : 0,
          transition: "opacity 0.18s",
        }}
      >
        <Text style={{
          fontSize: "0.6rem",
          color: "rgba(255,255,255,0.88)",
          fontFamily: "'HarmonyOS Sans', sans-serif",
          letterSpacing: "0.02em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {bg.label}
        </Text>
        {bg.photographer && (
          <Text style={{ fontSize: "0.55rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
            <Box
              as="a"
              href={bg.photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none" }}
              _hover={{ textDecoration: "underline" }}
            >
              Photo by {bg.photographer}
            </Box>
            <Box as="span" style={{ color: "rgba(255,255,255,0.35)" }}> on </Box>
            <Box
              as="a"
              href="https://unsplash.com/?utm_source=aesthetic_space&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none" }}
              _hover={{ textDecoration: "underline" }}
            >
              Unsplash
            </Box>
          </Text>
        )}
      </Box>

      {/* Active checkmark */}
      {isActive && (
        <Box
          position="absolute"
          top="5px"
          right="5px"
          w="15px"
          h="15px"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          style={{ background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.4)", zIndex: 2 }}
        >
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="#0d2b24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
      )}

      {/* Favorite button */}
      <Box
        as="button"
        className="fav-btn"
        position="absolute"
        bottom="6px"
        right="6px"
        w="22px"
        h="22px"
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="transparent"
        border="none"
        cursor="pointer"
        style={{
          opacity: isFav ? 1 : 0,
          zIndex: 3,
          color: isFav ? "#f87171" : "rgba(255,255,255,0.85)",
          transition: "all 0.15s",
          background: "rgba(0,0,0,0.32)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onToggleFav}
        title={favLabel}
      >
        <Heart size={11} fill={isFav ? "#f87171" : "none"} stroke={isFav ? "#f87171" : "currentColor"} />
      </Box>
    </Box>
  );
});

interface BackgroundPickerPanelProps {
  currentBgId: string;
  onSelect: (bg: BackgroundItem) => void;
  onClose: () => void;
}

export function BackgroundPickerPanel({ currentBgId, onSelect, onClose }: BackgroundPickerPanelProps) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(604, 580);

  /* ── Search state ── */
  const [inputValue, setInputValue]   = useState("Aesthetic Study");
  const [activeQuery, setActiveQuery] = useState("Aesthetic Study");
  const [photos, setPhotos]           = useState<BackgroundItem[]>([]);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(0);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const reqIdRef = useRef(0);

  /* ── Favorites (localStorage) ── */
  const [favorites, setFavorites] = useState<BackgroundItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("bg_favorites") ?? "[]"); }
    catch { return []; }
  });

  const isFav = (id: string) => favorites.some(f => f.id === id);
  const toggleFav = useCallback((bg: BackgroundItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.some(f => f.id === bg.id)
        ? prev.filter(f => f.id !== bg.id)
        : [...prev, bg];
      localStorage.setItem("bg_favorites", JSON.stringify(next));
      return next;
    });
  }, []);

  /* ── Fetch ── */
  const fetchPhotos = useCallback(async (q: string, pg: number, append: boolean) => {
    if (!hasUnsplashKey()) return;
    const myId = ++reqIdRef.current;
    if (append) setLoadingMore(true);
    else { setLoading(true); setPhotos([]); }
    setError(null);
    try {
      const { items, totalPages: tp } = await searchUnsplash(q, pg);
      if (myId !== reqIdRef.current) return;
      setPhotos(prev => append ? [...prev, ...items] : items);
      setTotalPages(tp);
      setPage(pg);
    } catch (e: any) {
      if (myId !== reqIdRef.current) return;
      setError(e.message ?? "Failed to fetch");
    } finally {
      if (myId === reqIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPhotos("Aesthetic Study", 1, false);
  }, [fetchPhotos]);

  const handleSearch = () => {
    const q = inputValue.trim();
    if (!q) return;
    setActiveQuery(q);
    fetchPhotos(q, 1, false);
  };

  const handlePreset = (tag: string) => {
    setInputValue(tag);
    setActiveQuery(tag);
    fetchPhotos(tag, 1, false);
  };

  const handleLoadMore = () => fetchPhotos(activeQuery, page + 1, true);

  const makeCardProps = (bg: BackgroundItem) => {
    const favored = favorites.some(f => f.id === bg.id);
    return {
      bg,
      isActive: bg.id === currentBgId,
      isFav: favored,
      onSelect: () => { triggerUnsplashDownload(bg.downloadLocation); onSelect(bg); },
      onToggleFav: (e: React.MouseEvent) => toggleFav(bg, e),
      favLabel: favored ? t("backgrounds.removeFromFavorites") : t("backgrounds.addToFavorites"),
    };
  };

  /* ── Upload tab ── */
  const [uploadedBgs, setUploadedBgs] = useState<BackgroundItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("bg_uploads") ?? "[]"); }
    catch { return []; }
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const MAX_W = 1920, MAX_H = 1080;
          let w = img.width, h = img.height;
          if (w > MAX_W || h > MAX_H) {
            const ratio = Math.min(MAX_W / w, MAX_H / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;
    try {
      const dataUrl = await compressImage(file);
      const newBg: BackgroundItem = {
        id: `upload_${Date.now()}`,
        url: dataUrl,
        thumb: dataUrl,
        label: file.name.replace(/\.[^/.]+$/, ""),
      };
      setUploadedBgs(prev => {
        const next = [newBg, ...prev].slice(0, 8);
        try { localStorage.setItem("bg_uploads", JSON.stringify(next)); } catch {}
        return next;
      });
      onSelect(newBg);
    } catch {}
  }, [onSelect]);

  const deleteUpload = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedBgs(prev => {
      const next = prev.filter(b => b.id !== id);
      try { localStorage.setItem("bg_uploads", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  /* ── Purchased backgrounds ── */
  const [purchasedFilter, setPurchasedFilter] = useState<"store" | "theme">("store");
  const [purchasedItems,  setPurchasedItems]  = useState<BackgroundItem[]>([]);
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [purchasedError,   setPurchasedError]   = useState(false);

  const fetchPurchased = useCallback(async () => {
    setPurchasedLoading(true);
    setPurchasedError(false);
    try {
      const inv = await aestheticStoreService.getInventory();
      setPurchasedItems(
        inv
          .filter(i => i.category === "Background" && i.assetUrl)
          .map(i => ({ id: i.storeItemId, url: i.assetUrl!, thumb: i.assetUrl!, label: i.name }))
      );
    } catch {
      setPurchasedError(true);
    } finally {
      setPurchasedLoading(false);
    }
  }, []);

  const TABS = [
    { id: "discover",  label: t("backgrounds.discover") },
    { id: "favorites", label: favorites.length > 0 ? t("backgrounds.favoritesCount", { count: favorites.length }) : t("backgrounds.favorites") },
    { id: "purchased", label: t("backgrounds.purchased") },
    { id: "upload",    label: t("backgrounds.upload") },
  ] as const;

  type TabId = typeof TABS[number]["id"];
  const [tab, setTab] = useState<TabId>("discover");

  useEffect(() => {
    if (tab === "purchased" && purchasedFilter === "store") fetchPurchased();
  }, [tab, purchasedFilter, fetchPurchased]);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.76rem",
    fontFamily: "'HarmonyOS Sans', sans-serif",
    fontWeight: active ? 600 : 400,
    color: active ? "#fff" : "rgba(255,255,255,0.45)",
    background: active ? "rgba(255,255,255,0.1)" : "transparent",
    border: "none",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  });

  const TAB_ICONS: Record<TabId, React.ReactNode> = {
    discover:  <Search size={13} />,
    favorites: <Heart size={13} />,
    purchased: <ShoppingBag size={13} />,
    upload:    <ImagePlus size={13} />,
  };

  return (
    <MotionBox
      ref={ref as any}
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 24, mass: 0.9 } } as any}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } } as any}
      position="fixed"
      top={0}
      left={0}
      zIndex={50}
      style={{
        x, y,
        width: 604,
        height: 580,
        borderRadius: "10px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header (non-scrolling) */}
      <Box style={{ padding: "18px 18px 0", flexShrink: 0 }}>
        <PanelCloseBtn onClose={onClose} />

        {/* Title */}
        <Flex align="center" gap={2} mb={3} pr="50px">
          <ImageIcon size={15} style={{ color: "rgba(255,255,255,0.45)" }} />
          <Text style={{
            fontSize: "0.7rem", color: "rgba(255,255,255,0.32)",
            letterSpacing: "0.1em", fontFamily: "'HarmonyOS Sans', sans-serif",
          }}>
            {t("backgrounds.title")}
          </Text>
        </Flex>

        {/* Tabs */}
        <Flex mb={3} gap={1} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "10px" }}>
          {TABS.map(tabItem => (
            <Box
              key={tabItem.id}
              as="button"
              style={tabStyle(tab === tabItem.id)}
              onClick={() => setTab(tabItem.id)}
            >
              {TAB_ICONS[tabItem.id]}
              {tabItem.label}
            </Box>
          ))}
        </Flex>

        {/* Search + chips — only in Discover */}
        {tab === "discover" && hasUnsplashKey() && (
          <>
            {/* Search input */}
            <Box position="relative" mb={3}>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder={t("backgrounds.searchPlaceholder")}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "0.85rem",
                  paddingLeft: "36px",
                  paddingRight: "48px",
                  height: "36px",
                  outline: "none",
                  width: "100%",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                }}
                _placeholder={{ color: "rgba(255,255,255,0.3)" }}
                _focus={{
                  border: "1px solid rgba(255,255,255,0.28)",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
              {/* Left icon */}
              <Box
                position="absolute"
                left="11px"
                top="50%"
                style={{ transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }}
              >
                <Search size={14} />
              </Box>
              {/* Right search button */}
              <Box
                as="button"
                position="absolute"
                right="6px"
                top="50%"
                style={{ transform: "translateY(-50%)" }}
                onClick={handleSearch}
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="26px"
                h="26px"
                borderRadius="6px"
                bg="transparent"
                border="none"
                cursor="pointer"
                style2={{ color: "rgba(255,255,255,0.4)", transition: "all 0.15s" }}
                _hover={{ background: "rgba(255,255,255,0.1)", color: "white" }}
              >
                <Search size={13} color="rgba(255,255,255,0.5)" />
              </Box>
            </Box>

            {/* Preset chips */}
            <Flex gap={2} mb={3} flexWrap="wrap">
              {PRESET_TAGS.map(tag => (
                <Box
                  key={tag}
                  as="button"
                  onClick={() => handlePreset(tag)}
                  style={{
                    background: activeQuery === tag
                      ? "rgba(255,255,255,0.18)"
                      : "rgba(255,255,255,0.07)",
                    border: activeQuery === tag
                      ? "1px solid rgba(255,255,255,0.35)"
                      : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "20px",
                    color: activeQuery === tag ? "white" : "rgba(255,255,255,0.52)",
                    fontSize: "0.72rem",
                    padding: "3px 10px",
                    cursor: "pointer",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  _hover={{ background: "rgba(255,255,255,0.13)", color: "rgba(255,255,255,0.9)" }}
                >
                  {tag}
                </Box>
              ))}
            </Flex>
          </>
        )}
      </Box>

      {/* Scrollable content */}
      <Box style={{ overflowY: "auto", padding: "0 18px 20px", flexGrow: 1 }}>

        {/* ── DISCOVER TAB ── */}
        {tab === "discover" && (
          <>
            {/* No API key — show curated fallback */}
            {!hasUnsplashKey() ? (
              <>
                <Box
                  mb={3}
                  p={3}
                  borderRadius="8px"
                  style={{
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.28)",
                  }}
                >
                  <Text style={{
                    color: "rgba(251,191,36,0.85)",
                    fontSize: "0.74rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    lineHeight: 1.5,
                  }}>
                    Add{" "}
                    <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: "4px", fontSize: "0.72rem" }}>
                      VITE_UNSPLASH_ACCESS_KEY=your_key
                    </code>
                    {" "}to <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: "4px", fontSize: "0.72rem" }}>.env</code> to enable live Unsplash search. Showing curated picks for now.
                  </Text>
                </Box>
                <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {BACKGROUNDS.map(bg => <PhotoCard key={bg.id} {...makeCardProps(bg)} />)}
                </Box>
              </>
            ) : loading ? (
              /* Skeleton loading */
              <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <Box
                    key={i}
                    borderRadius="8px"
                    className="animate-pulse"
                    style={{ aspectRatio: "16/9", background: "rgba(255,255,255,0.07)" }}
                  />
                ))}
              </Box>
            ) : error ? (
              /* Error state */
              <Flex direction="column" align="center" justify="center" gap={3} py={10}>
                <AlertCircle size={28} color="rgba(248,113,113,0.65)" />
                <Text style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.8rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  textAlign: "center",
                }}>
                  {error === "403"
                    ? t("backgrounds.invalidKey")
                    : error === "429"
                    ? t("backgrounds.rateLimit")
                    : t("backgrounds.errorCode", { code: error })}
                </Text>
                <Box
                  as="button"
                  onClick={() => fetchPhotos(activeQuery, 1, false)}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: "7px",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: "0.78rem",
                    padding: "5px 14px",
                    cursor: "pointer",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                  }}
                  _hover={{ background: "rgba(255,255,255,0.13)", color: "white" }}
                >
                  <RefreshCw size={12} /> Retry
                </Box>
              </Flex>
            ) : (
              <>
                {/* Photo grid */}
                <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {photos.map(bg => <PhotoCard key={bg.id} {...makeCardProps(bg)} />)}
                </Box>

                {/* Load more */}
                {page < totalPages && photos.length > 0 && (
                  <Flex justify="center" mt={4}>
                    <Box
                      as="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "8px",
                        color: loadingMore ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.65)",
                        fontSize: "0.78rem",
                        padding: "6px 18px",
                        cursor: loadingMore ? "default" : "pointer",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        transition: "all 0.15s",
                      }}
                      _hover={!loadingMore ? { background: "rgba(255,255,255,0.12)", color: "white" } : {}}
                    >
                      {loadingMore
                        ? <><Loader2 size={12} className="animate-spin" /> {t("backgrounds.loadMore")}…</>
                        : t("backgrounds.loadMore")}
                    </Box>
                  </Flex>
                )}

                {/* Unsplash attribution (required by API guidelines) */}
                {photos.length > 0 && (
                  <Flex justify="center" mt={3}>
                    <Box
                      as="a"
                      href="https://unsplash.com/?utm_source=aesthetic_space&utm_medium=referral"
                      target="_blank"
                      rel="noopener noreferrer"
                      display="flex"
                      alignItems="center"
                      gap={1}
                      style={{
                        color: "rgba(255,255,255,0.28)",
                        fontSize: "0.64rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        textDecoration: "none",
                        transition: "color 0.15s",
                      }}
                      _hover={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {t("backgrounds.photosVia")} <ExternalLink size={9} />
                    </Box>
                  </Flex>
                )}
              </>
            )}
          </>
        )}

        {/* ── FAVORITES TAB ── */}
        {tab === "favorites" && (
          favorites.length === 0 ? (
            <Flex align="center" justify="center" h="180px" direction="column" gap={2}>
              <Heart size={22} color="rgba(255,255,255,0.18)" />
              <Text style={{
                color: "rgba(255,255,255,0.28)",
                fontSize: "0.82rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
              }}>
                {t("backgrounds.noFavorites")}
              </Text>
              <Text style={{
                color: "rgba(255,255,255,0.18)",
                fontSize: "0.72rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
              }}>
                {t("backgrounds.noFavoritesHint")}
              </Text>
            </Flex>
          ) : (
            <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {favorites.map(bg => <PhotoCard key={bg.id} {...makeCardProps(bg)} />)}
            </Box>
          )
        )}

        {/* ── UPLOAD TAB ── */}
        {tab === "upload" && (
          <>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* Drop zone */}
            <Box
              mb={4}
              borderRadius="10px"
              style={{
                border: isDragging
                  ? "2px dashed rgba(255,255,255,0.55)"
                  : "2px dashed rgba(255,255,255,0.15)",
                background: isDragging
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(255,255,255,0.03)",
                padding: "32px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.18s",
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files); }}
            >
              <Flex direction="column" align="center" gap={2}>
                <Box
                  w="44px" h="44px" borderRadius="full"
                  display="flex" alignItems="center" justifyContent="center"
                  style={{
                    background: isDragging ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    transition: "all 0.18s",
                  }}
                >
                  <ImagePlus size={20} color={isDragging ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)"} />
                </Box>
                <Text style={{
                  color: isDragging ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)",
                  fontSize: "0.82rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  transition: "color 0.18s",
                }}>
                  {t("backgrounds.uploadHint")}
                </Text>
                <Text style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: "0.68rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                }}>
                  {t("backgrounds.uploadFormats")}
                </Text>
              </Flex>
            </Box>

            {/* Uploaded images grid */}
            {uploadedBgs.length === 0 ? (
              <Flex align="center" justify="center" h="100px" direction="column" gap={2}>
                <Text style={{
                  color: "rgba(255,255,255,0.22)",
                  fontSize: "0.76rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                }}>
                  {t("backgrounds.noUploads")}
                </Text>
              </Flex>
            ) : (
              <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {uploadedBgs.map(bg => (
                  <Box
                    key={bg.id}
                    position="relative"
                    borderRadius="8px"
                    overflow="hidden"
                    css={{
                      "&:hover .upload-delete-btn": { opacity: "1 !important" },
                      "&:hover": {
                        border: "2px solid rgba(255,255,255,0.5) !important",
                        boxShadow: "0 6px 22px rgba(0,0,0,0.7) !important",
                        transform: "scale(1.04) !important",
                      },
                    }}
                    style={{
                      aspectRatio: "16/9",
                      cursor: "pointer",
                      border: bg.id === currentBgId
                        ? "2px solid rgba(255,255,255,0.9)"
                        : "2px solid rgba(255,255,255,0.06)",
                      boxShadow: bg.id === currentBgId
                        ? "0 0 0 3px rgba(255,255,255,0.18), 0 4px 16px rgba(0,0,0,0.5)"
                        : "0 2px 10px rgba(0,0,0,0.45)",
                      transform: bg.id === currentBgId ? "scale(1.03)" : "scale(1)",
                      transition: "all 0.18s ease",
                    }}
                    onClick={() => onSelect(bg)}
                  >
                    {/* Thumbnail */}
                    <Box
                      position="absolute"
                      inset={0}
                      style={{
                        backgroundImage: `url(${bg.thumb})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />

                    {/* Active checkmark */}
                    {bg.id === currentBgId && (
                      <Box
                        position="absolute"
                        top="5px"
                        left="5px"
                        w="15px"
                        h="15px"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        style={{ background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.4)", zIndex: 2 }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="#0d2b24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Box>
                    )}

                    {/* Delete button */}
                    <Box
                      as="button"
                      className="upload-delete-btn"
                      position="absolute"
                      top="5px"
                      right="5px"
                      w="20px"
                      h="20px"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg="transparent"
                      border="none"
                      cursor="pointer"
                      style={{
                        opacity: 0,
                        zIndex: 3,
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(4px)",
                        color: "rgba(255,255,255,0.85)",
                        transition: "all 0.15s",
                      }}
                      onClick={(e: React.MouseEvent) => deleteUpload(bg.id, e)}
                      title={t("backgrounds.deleteUpload")}
                    >
                      <X size={10} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}

        {/* ── PURCHASED TAB ── */}
        {tab === "purchased" && (
          <>
            {/* Sub-filter pills */}
            <Flex gap={2} mb={4}>
              {(["store", "theme"] as const).map(f => (
                <Box
                  key={f}
                  as="button"
                  onClick={() => setPurchasedFilter(f)}
                  style={{
                    background: purchasedFilter === f
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.06)",
                    border: purchasedFilter === f
                      ? "1px solid rgba(255,255,255,0.32)"
                      : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "20px",
                    color: purchasedFilter === f ? "#fff" : "rgba(255,255,255,0.45)",
                    fontSize: "0.74rem",
                    padding: "4px 14px",
                    cursor: "pointer",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    fontWeight: purchasedFilter === f ? 600 : 400,
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f === "store" ? t("backgrounds.purchasedStore") : t("backgrounds.purchasedTheme")}
                </Box>
              ))}
            </Flex>

            {/* ── Store-bought backgrounds ── */}
            {purchasedFilter === "store" && (
              purchasedLoading ? (
                <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Box key={i} borderRadius="8px" className="animate-pulse"
                      style={{ aspectRatio: "16/9", background: "rgba(255,255,255,0.07)" }} />
                  ))}
                </Box>
              ) : purchasedError ? (
                <Flex direction="column" align="center" justify="center" gap={3} py={10}>
                  <AlertCircle size={24} color="rgba(248,113,113,0.55)" />
                  <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("backgrounds.errorCode", { code: "load" })}
                  </Text>
                  <Box
                    as="button" onClick={fetchPurchased}
                    display="flex" alignItems="center" gap={2}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      borderRadius: "7px",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "0.76rem",
                      padding: "5px 14px",
                      cursor: "pointer",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                    }}
                  >
                    <RefreshCw size={12} /> Retry
                  </Box>
                </Flex>
              ) : purchasedItems.length === 0 ? (
                <Flex align="center" justify="center" h="180px" direction="column" gap={2}>
                  <ShoppingBag size={22} color="rgba(255,255,255,0.15)" />
                  <Text style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("backgrounds.noPurchased")}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {t("backgrounds.noPurchasedHint")}
                  </Text>
                </Flex>
              ) : (
                <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {purchasedItems.map(bg => (
                    <PhotoCard
                      key={bg.id}
                      bg={bg}
                      isActive={bg.id === currentBgId}
                      isFav={isFav(bg.id)}
                      onSelect={() => onSelect(bg)}
                      onToggleFav={(e) => toggleFav(bg, e)}
                      favLabel={isFav(bg.id) ? t("backgrounds.removeFromFavorites") : t("backgrounds.addToFavorites")}
                    />
                  ))}
                </Box>
              )
            )}

            {/* ── Theme-bundled backgrounds ── */}
            {purchasedFilter === "theme" && (
              <Flex direction="column" align="center" justify="center" gap={4} py={8}>
                <Box
                  w="60px" h="60px" borderRadius="full"
                  display="flex" alignItems="center" justifyContent="center"
                  style={{
                    background: "radial-gradient(circle at 40% 35%, rgba(168,85,247,0.2), rgba(99,102,241,0.1) 70%)",
                    border: "1px solid rgba(168,85,247,0.2)",
                  }}
                >
                  <Construction size={24} color="rgba(192,132,252,0.7)" />
                </Box>
                <Box
                  px={3} py="3px" borderRadius="full"
                  style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}
                >
                  <Text style={{ fontSize: "0.62rem", color: "rgba(192,132,252,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {t("backgrounds.inDevelopment")}
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.75)", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: "6px" }}>
                    {t("backgrounds.themesTitle")}
                  </Text>
                  <Text style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.32)", fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.65, maxWidth: "280px" }}>
                    {t("backgrounds.themesDesc")}
                  </Text>
                </Box>
              </Flex>
            )}
          </>
        )}
      </Box>
    </MotionBox>
  );
}