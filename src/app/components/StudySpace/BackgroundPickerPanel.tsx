import { useState, useCallback, useEffect } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { motion } from "motion/react";
import { Search, Heart, Loader2, AlertCircle, RefreshCw, ExternalLink, Palette, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PanelCloseBtn } from "./PanelCloseBtn";
import { useCenteredPanel } from "./useCenteredPanel";
import { BACKGROUNDS } from "./constants";
import type { BackgroundItem } from "./types";

const MotionBox = motion.create(Box);

const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY ?? "";
const PER_PAGE = 12;

const PRESET_TAGS = [
  "Aesthetic Study", "Forest", "Japan Night", "Cozy Cafe",
  "Mountain", "Ocean", "Rainy", "Cherry Blossom", "Library",
];

interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string };
  alt_description: string | null;
  description: string | null;
  user: { name: string; links: { html: string } };
}

function mapPhoto(p: UnsplashPhoto): BackgroundItem {
  return {
    id: p.id,
    url: p.urls.regular,
    thumb: p.urls.small,
    label: p.alt_description || p.description || "Untitled",
    photographer: p.user.name,
    photographerUrl: `${p.user.links.html}?utm_source=aesthetic_space&utm_medium=referral`,
  };
}

async function searchUnsplash(query: string, page: number) {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${PER_PAGE}&page=${page}&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
  );
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return {
    items: (data.results as UnsplashPhoto[]).map(mapPhoto),
    totalPages: data.total_pages as number,
  };
}

interface BackgroundPickerPanelProps {
  currentBgId: string;
  onSelect: (bg: BackgroundItem) => void;
  onClose: () => void;
}

export function BackgroundPickerPanel({ currentBgId, onSelect, onClose }: BackgroundPickerPanelProps) {
  const { t } = useTranslation();
  const { x, y, ref } = useCenteredPanel(604);

  /* ── Search state ── */
  const [inputValue, setInputValue]   = useState("Aesthetic Study");
  const [activeQuery, setActiveQuery] = useState("Aesthetic Study");
  const [photos, setPhotos]           = useState<BackgroundItem[]>([]);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(0);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);

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
    if (!UNSPLASH_KEY) return;
    if (append) setLoadingMore(true);
    else { setLoading(true); setPhotos([]); }
    setError(null);
    try {
      const { items, totalPages: tp } = await searchUnsplash(q, pg);
      setPhotos(prev => append ? [...prev, ...items] : items);
      setTotalPages(tp);
      setPage(pg);
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch");
    } finally {
      setLoading(false);
      setLoadingMore(false);
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

  /* ── Photo card ── */
  const PhotoCard = ({ bg }: { bg: BackgroundItem }) => {
    const isActive = bg.id === currentBgId;
    const fav = isFav(bg.id);
    return (
      <Box
        key={bg.id}
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
            <Text style={{
              fontSize: "0.55rem",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "'HarmonyOS Sans', sans-serif",
            }}>
              📷 {bg.photographer}
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
            opacity: fav ? 1 : 0,
            zIndex: 3,
            color: fav ? "#f87171" : "rgba(255,255,255,0.85)",
            transition: "all 0.15s",
            background: "rgba(0,0,0,0.32)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => toggleFav(bg, e)}
          title={fav ? t("backgrounds.removeFromFavorites") : t("backgrounds.addToFavorites")}
        >
          <Heart size={11} fill={fav ? "#f87171" : "none"} stroke={fav ? "#f87171" : "currentColor"} />
        </Box>
      </Box>
    );
  };

  const TABS = [
    { id: "discover",  label: t("backgrounds.discover") },
    { id: "favorites", label: favorites.length > 0 ? t("backgrounds.favoritesCount", { count: favorites.length }) : t("backgrounds.favorites") },
    { id: "themes",    label: t("backgrounds.themes") },
  ] as const;

  type TabId = typeof TABS[number]["id"];
  const [tab, setTab] = useState<TabId>("discover");

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
        maxHeight: "82vh",
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

        {/* Tabs */}
        <Flex align="center" justify="center" gap={0} mb={4}>
          {TABS.map((t, i) => (
            <Box key={t.id} display="flex" alignItems="center">
              <Box
                as="button"
                onClick={() => setTab(t.id)}
                bg="transparent"
                border="none"
                cursor="pointer"
                style={{
                  color: tab === t.id ? "#ffffff" : "rgba(255,255,255,0.4)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  fontSize: "0.92rem",
                  fontWeight: tab === t.id ? 700 : 400,
                  padding: "2px 6px 6px",
                  borderBottom: tab === t.id
                    ? "2px solid rgba(255,255,255,0.7)"
                    : "2px solid transparent",
                  transition: "all 0.18s",
                  letterSpacing: "0.01em",
                }}
              >
                {t.label}
              </Box>
              {i < TABS.length - 1 && (
                <Text mx={3} style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.88rem", userSelect: "none" }}>|</Text>
              )}
            </Box>
          ))}
        </Flex>

        {/* Search + chips — only in Discover */}
        {tab === "discover" && UNSPLASH_KEY && (
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
            {!UNSPLASH_KEY ? (
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
                  {BACKGROUNDS.map(bg => <PhotoCard key={bg.id} bg={bg} />)}
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
                  {photos.map(bg => <PhotoCard key={bg.id} bg={bg} />)}
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
              {favorites.map(bg => <PhotoCard key={bg.id} bg={bg} />)}
            </Box>
          )
        )}

        {/* ── THEMES TAB ── */}
        {tab === "themes" && (
          <Flex direction="column" align="center" justify="center" gap={5} py={8}>
            {/* Icon ring */}
            <Box
              position="relative"
              w="72px"
              h="72px"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              style={{
                background: "radial-gradient(circle at 40% 35%, rgba(168,85,247,0.22), rgba(99,102,241,0.14) 70%, transparent)",
                border: "1px solid rgba(168,85,247,0.22)",
                boxShadow: "0 0 32px rgba(168,85,247,0.12)",
              }}
            >
              <Palette size={28} color="rgba(192,132,252,0.75)" />
              {/* Sparkle decoration */}
              <Box
                position="absolute"
                top="-4px"
                right="-4px"
                style={{ color: "rgba(251,191,36,0.7)" }}
              >
                <Sparkles size={14} />
              </Box>
            </Box>

            {/* Badge */}
            <Box
              px={3}
              py={1}
              borderRadius="full"
              style={{
                background: "rgba(168,85,247,0.12)",
                border: "1px solid rgba(168,85,247,0.3)",
              }}
            >
              <Text style={{
                fontSize: "0.65rem",
                color: "rgba(192,132,252,0.9)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                {t("backgrounds.inDevelopment")}
              </Text>
            </Box>

            {/* Title */}
            <Box textAlign="center">
              <Text style={{
                fontSize: "1.05rem",
                color: "rgba(255,255,255,0.82)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                letterSpacing: "0.01em",
                marginBottom: "6px",
              }}>
                {t("backgrounds.themesTitle")}
              </Text>
              <Text style={{
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.35)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                lineHeight: 1.65,
                maxWidth: "300px",
              }}>
                {t("backgrounds.themesDesc")}
              </Text>
            </Box>
          </Flex>
        )}
      </Box>
    </MotionBox>
  );
}