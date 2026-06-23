import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, useDragControls } from "motion/react";
import { Trash2, Plus, StickyNote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { WIDGET_DEFS } from "../constants";
import { STICKY_COLORS } from "../widgets/StickyNote/StickyNoteWidget";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import type { WidgetId } from "../types";

const WIDGET_WIDTHS: Partial<Record<WidgetId, number>> = { music: 300 };

const MotionBox = motion.create(Box);

interface WidgetPickerPanelProps {
  activeWidgets: Set<WidgetId>;
  onToggle: (id: WidgetId) => void;
  onAddStickyNote: () => void;
  onDropWidget?: (id: WidgetId, x: number, y: number) => void;
  onDropStickyNote?: (x: number, y: number) => void;
  onClose: () => void;
}

/* ── Mini widget thumbnail previews ──────────────────────────────────────── */

function MusicThumbnail() {
  const bars = [55, 80, 40, 90, 60, 35, 75, 50];
  return (
    <svg width="100%" height="100%" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid meet">
      {/* BG */}
      <rect width="160" height="96" fill="rgba(56,189,248,0.06)" rx="0" />
      {/* Waveform bars */}
      {bars.map((h, i) => (
        <rect
          key={i}
          x={20 + i * 16}
          y={48 - h / 2}
          width={8}
          height={h}
          rx={4}
          fill={`rgba(56,189,248,${0.25 + (i % 3) * 0.18})`}
        />
      ))}
      {/* Center line */}
      <line x1="12" y1="48" x2="148" y2="48" stroke="rgba(56,189,248,0.15)" strokeWidth="1" />
      {/* Music note */}
      <text x="130" y="22" fontSize="16" fill="rgba(56,189,248,0.5)" fontFamily="serif">♪</text>
    </svg>
  );
}

function PomodoroThumbnail() {
  const r = 30, cx = 80, cy = 48;
  const circ = 2 * Math.PI * r;
  const progress = 0.68;
  return (
    <svg width="100%" height="100%" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid meet">
      <rect width="160" height="96" fill="rgba(74,222,128,0.06)" />
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(74,222,128,0.12)" strokeWidth="5" />
      {/* Arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="rgba(74,222,128,0.72)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${circ * progress} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Time text */}
      <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(74,222,128,0.9)" fontSize="13" fontFamily="'HarmonyOS Sans', sans-serif" fontWeight="600" letterSpacing="1">
        25:00
      </text>

    </svg>
  );
}

function TodoThumbnail() {
  const items = [
    { done: true,  label: "Morning review" },
    { done: false, label: "Study session" },
    { done: false, label: "Practice problems" },
  ];
  return (
    <svg width="100%" height="100%" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid meet">
      <rect width="160" height="96" fill="rgba(167,139,250,0.06)" />
      {items.map((item, i) => (
        <g key={i} transform={`translate(18, ${22 + i * 24})`}>
          {/* Circle checkbox */}
          <circle cx="7" cy="7" r="6" fill={item.done ? "rgba(167,139,250,0.8)" : "none"} stroke="rgba(167,139,250,0.45)" strokeWidth="1.5" />
          {item.done && (
            <polyline points="3.5,7 6,10 11,4" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {/* Text */}
          <text x="18" y="11" fill={item.done ? "rgba(167,139,250,0.38)" : "rgba(255,255,255,0.65)"} fontSize="9" fontFamily="'HarmonyOS Sans', sans-serif"
            style={{ textDecoration: item.done ? "line-through" : "none" }}>
            {item.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ClockThumbnail() {
  const cx = 80, cy = 48, r = 32;
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
  const hrAngle = 300; // ~10:00
  const mnAngle = 60;  // :12
  const hr = { x: cx + 18 * Math.cos(toRad(hrAngle)), y: cy + 18 * Math.sin(toRad(hrAngle)) };
  const mn = { x: cx + 26 * Math.cos(toRad(mnAngle)), y: cy + 26 * Math.sin(toRad(mnAngle)) };
  return (
    <svg width="100%" height="100%" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid meet">
      <rect width="160" height="96" fill="rgba(251,191,36,0.06)" />
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(251,191,36,0.18)" strokeWidth="1.5" />
      {/* Tick marks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        return (
          <line key={i}
            x1={cx + (r - 5) * Math.cos(a)} y1={cy + (r - 5) * Math.sin(a)}
            x2={cx + (r - 1) * Math.cos(a)} y2={cy + (r - 1) * Math.sin(a)}
            stroke="rgba(251,191,36,0.4)" strokeWidth="1.5" strokeLinecap="round"
          />
        );
      })}
      {/* Hour hand */}
      <line x1={cx} y1={cy} x2={hr.x} y2={hr.y} stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" />
      {/* Minute hand */}
      <line x1={cx} y1={cy} x2={mn.x} y2={mn.y} stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
      {/* Second hand */}
      <line x1={cx} y1={cy} x2={cx + 28 * Math.cos(toRad(180))} y2={cy + 28 * Math.sin(toRad(180))} stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="2.5" fill="rgba(251,191,36,0.9)" />
    </svg>
  );
}

function QuoteThumbnail() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid meet">
      <rect width="160" height="96" fill="rgba(45,212,191,0.06)" />
      {/* Big quotation marks */}
      <text x="14" y="56" fontSize="52" fill="rgba(45,212,191,0.28)" fontFamily="Georgia, serif" fontWeight="bold">"</text>
      {/* Text lines */}
      <rect x="38" y="30" width="90" height="6" rx="3" fill="rgba(45,212,191,0.28)" />
      <rect x="38" y="42" width="72" height="6" rx="3" fill="rgba(45,212,191,0.18)" />
      <rect x="38" y="54" width="56" height="6" rx="3" fill="rgba(45,212,191,0.12)" />
      {/* Author line */}
      <rect x="90" y="70" width="50" height="4" rx="2" fill="rgba(45,212,191,0.22)" />
      <text x="88" y="73" fontSize="8" fill="rgba(45,212,191,0.4)" fontFamily="'HarmonyOS Sans', sans-serif">—</text>
    </svg>
  );
}

function StickyThumbnail() {
  const notes = [
    { x: 20, y: 22, w: 58, h: 50, color: "#fde047" },
    { x: 52, y: 14, w: 58, h: 50, color: "#f9a8d4" },
    { x: 84, y: 22, w: 58, h: 50, color: "#a7f3d0" },
  ];
  return (
    <svg width="100%" height="100%" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid meet">
      <rect width="160" height="96" fill="rgba(254,224,71,0.04)" />
      {notes.map((n, i) => (
        <g key={i}>
          <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="5" fill={n.color} opacity={0.82} />
          <rect x={n.x + 6} y={n.y + 10} width={n.w - 16} height="4" rx="2" fill="rgba(0,0,0,0.15)" />
          <rect x={n.x + 6} y={n.y + 20} width={n.w - 22} height="4" rx="2" fill="rgba(0,0,0,0.1)" />
          <rect x={n.x + 6} y={n.y + 30} width={n.w - 18} height="4" rx="2" fill="rgba(0,0,0,0.08)" />
        </g>
      ))}
    </svg>
  );
}

const THUMBNAIL_MAP: Record<string, React.FC> = {
  music:    MusicThumbnail,
  pomodoro: PomodoroThumbnail,
  todo:     TodoThumbnail,
  clock:    ClockThumbnail,
  quote:    QuoteThumbnail,
  sticky:   StickyThumbnail,
};

/* ── Main component ──────────────────────────────────────────────────────── */

export function WidgetPickerPanel({ activeWidgets, onToggle, onAddStickyNote, onDropWidget, onDropStickyNote, onClose }: WidgetPickerPanelProps) {
  const { t } = useTranslation();
  const sw = typeof window !== "undefined" ? window.innerWidth  : 1440;

  const [isMobile, setIsMobile] = useState(sw < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const panelW = isMobile ? Math.min(sw - 32, 340) : 600;
  const panelH = isMobile ? 480 : 520;
  const { x, y, ref } = useCenteredPanel(panelW, panelH);
  const dragControls = useDragControls();

  type DraggingWidget = typeof WIDGET_DEFS[0];
  type DraggingItem = DraggingWidget | "sticky";
  const [draggingItem, setDraggingItem] = useState<DraggingItem | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!draggingItem) return;
    document.body.style.cursor = "grabbing";

    const onMove = (e: PointerEvent) => setGhostPos({ x: e.clientX, y: e.clientY });

    const onUp = (e: PointerEvent) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const outside = e.clientX < rect.left || e.clientX > rect.right ||
                        e.clientY < rect.top  || e.clientY > rect.bottom;
        if (outside) {
          if (draggingItem === "sticky") {
            onDropStickyNote?.(Math.round(e.clientX - 108), Math.round(e.clientY - 20));
          } else {
            const w = WIDGET_WIDTHS[draggingItem.id] ?? 240;
            onDropWidget?.(draggingItem.id, Math.round(e.clientX - w / 2), Math.round(e.clientY - 20));
          }
        }
      }
      setDraggingItem(null);
      document.body.style.cursor = "";
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
    };
  }, [draggingItem, ref, onDropWidget, onDropStickyNote]);

  return (
    <>
    <MotionBox
      ref={ref as any}
      drag
      dragControls={dragControls}
      dragListener={false}
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
        width: panelW,
        height: panelH,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.80)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header (drag handle) ── */}
      <Box
        position="relative"
        style={{ padding: "20px 18px 0", flexShrink: 0, cursor: "grab" }}
        onPointerDown={(e) => dragControls.start(e)}
      >
        <PanelCloseBtn onClose={onClose} />

        <Text mb={1} style={{
          fontSize: "0.7rem",
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.1em",
          fontFamily: "'HarmonyOS Sans', sans-serif",
        }}>
          {t("widgetPicker.title")}
        </Text>
      </Box>

      {/* ── Scrollable content ── */}
      <Box
        style={{ padding: "0 18px 18px", flex: 1, overflowY: "auto" }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* ── Grid (desktop) / List (mobile) ──────────────────────────── */}
        {isMobile ? (
          /* ── Mobile: list ── */
          <Flex direction="column" gap={2} mt={3}>
            {WIDGET_DEFS.map((w) => {
              const isAdded = activeWidgets.has(w.id);
              const Icon = w.icon;
              const isSoon = false;
              return (
                <Flex key={w.id} align="center" gap={3} px={3} py={3} borderRadius="10px" style={{
                  background: isSoon ? "rgba(255,255,255,0.015)" : isAdded ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                  border: isSoon ? "1px solid rgba(255,255,255,0.05)" : isAdded ? `1px solid ${w.color}30` : "1px solid rgba(255,255,255,0.07)",
                  transition: "all 0.2s",
                  opacity: isSoon ? 0.55 : 1,
                }}>
                  <Flex w="36px" h="36px" borderRadius="9px" align="center" justify="center" flexShrink={0}
                    style={{ background: `${w.color}18`, border: `1px solid ${w.color}30` }}>
                    <Icon size={16} color={w.color} />
                  </Flex>
                  <Box flex={1} minW={0}>
                    <Text style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.88)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{w.label}</Text>
                    <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif", marginTop: "1px" }}>{w.desc}</Text>
                  </Box>
                  <Box
                    as="button"
                    onClick={isSoon ? undefined : () => onToggle(w.id)}
                    display="flex" alignItems="center" justifyContent="center" gap={1}
                    border="none" cursor={isSoon ? "default" : "pointer"} flexShrink={0}
                    style={{
                      padding: "4px 10px", borderRadius: "20px",
                      fontSize: "0.7rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                      transition: "all 0.18s",
                      background: isSoon ? "rgba(255,255,255,0.06)" : isAdded ? "rgba(239,68,68,0.1)" : `${w.color}20`,
                      color: isSoon ? "rgba(255,255,255,0.3)" : isAdded ? "rgba(239,68,68,0.8)" : w.color,
                      border: isSoon ? "1px solid rgba(255,255,255,0.08)" : isAdded ? "1px solid rgba(239,68,68,0.25)" : `1px solid ${w.color}40`,
                    }}
                  >
                    {isSoon ? t("widgetPicker.soon") : isAdded ? <><Trash2 size={10} /><span style={{ marginLeft: 3 }}>{t("widgetPicker.remove")}</span></> : <><Plus size={10} /><span style={{ marginLeft: 3 }}>{t("widgetPicker.addToSpace")}</span></>}
                  </Box>
                </Flex>
              );
            })}
          </Flex>
        ) : (
          /* ── Desktop: 3-column thumbnail grid ── */
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
            marginTop: "14px",
          }}>
            {WIDGET_DEFS.map((w) => {
              const isAdded = activeWidgets.has(w.id);
              const Thumb = THUMBNAIL_MAP[w.id];
              const isSoon = false;
              return (
                <div key={w.id} style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: isSoon ? "1px solid rgba(255,255,255,0.06)" : isAdded ? `1px solid ${w.color}40` : "1px solid rgba(255,255,255,0.08)",
                  background: isSoon ? "rgba(255,255,255,0.015)" : isAdded ? `${w.color}0a` : "rgba(255,255,255,0.03)",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  opacity: isSoon ? 0.6 : 1,
                }}>
                  {/* Thumbnail area — drag handle to drop onto canvas */}
                  <div
                    onPointerDown={(e) => {
                      if (isSoon) return;
                      e.preventDefault();
                      setDraggingItem(w);
                      setGhostPos({ x: e.clientX, y: e.clientY });
                    }}
                    style={{
                      width: "100%",
                      height: "100px",
                      overflow: "hidden",
                      position: "relative",
                      background: `linear-gradient(145deg, ${w.color}0d 0%, rgba(12,18,22,0.5) 100%)`,
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      cursor: isSoon ? "default" : "grab",
                    }}
                  >
                    {Thumb && <Thumb />}
                    {/* Coming Soon badge */}
                    {isSoon && (
                      <div style={{
                        position: "absolute",
                        top: 7,
                        right: 7,
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "20px",
                        padding: "2px 7px",
                        fontSize: "0.58rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        color: "rgba(255,255,255,0.45)",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}>
                        {t("widgetPicker.soon")}
                      </div>
                    )}
                    {/* Active badge */}
                    {!isSoon && isAdded && (
                      <div style={{
                        position: "absolute",
                        top: 7,
                        right: 7,
                        background: `${w.color}cc`,
                        borderRadius: "20px",
                        padding: "2px 7px",
                        fontSize: "0.58rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        color: "#0c1216",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                      }}>
                        {t("widgetPicker.added")}
                      </div>
                    )}
                  </div>

                  {/* Info + action */}
                  <div style={{ padding: "10px 11px 11px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    <div>
                      <div style={{
                        fontSize: "0.8rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        color: "rgba(255,255,255,0.88)",
                        marginBottom: "2px",
                      }}>
                        {w.label}
                      </div>
                      <div style={{
                        fontSize: "0.65rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        color: "rgba(255,255,255,0.32)",
                        lineHeight: 1.45,
                      }}>
                        {isSoon ? t("widgetPicker.comingSoon") : w.desc}
                      </div>
                    </div>

                    <button
                      disabled={isSoon}
                      onClick={isSoon ? undefined : () => onToggle(w.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        width: "100%",
                        padding: "6px 0",
                        borderRadius: "8px",
                        fontSize: "0.72rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        cursor: isSoon ? "default" : "pointer",
                        transition: "all 0.18s",
                        background: isSoon ? "rgba(255,255,255,0.05)" : isAdded ? "rgba(239,68,68,0.12)" : `${w.color}1a`,
                        color: isSoon ? "rgba(255,255,255,0.22)" : isAdded ? "rgba(239,68,68,0.85)" : w.color,
                        border: isSoon ? "1px solid rgba(255,255,255,0.08)" : isAdded ? "1px solid rgba(239,68,68,0.28)" : `1px solid ${w.color}38`,
                      }}
                    >
                      {isSoon
                        ? t("widgetPicker.comingSoon")
                        : isAdded
                          ? <><Trash2 size={11} /> {t("widgetPicker.remove")}</>
                          : <><Plus size={11} /> {t("widgetPicker.addToSpace")}</>}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Sticky Notes card — inline in grid */}
            <div style={{
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid rgba(254,224,71,0.22)",
              background: "rgba(254,224,71,0.04)",
              display: "flex",
              flexDirection: "column",
            }}>
              <div
                onPointerDown={(e) => {
                  e.preventDefault();
                  setDraggingItem("sticky");
                  setGhostPos({ x: e.clientX, y: e.clientY });
                }}
                style={{
                  width: "100%",
                  height: "100px",
                  overflow: "hidden",
                  background: "linear-gradient(145deg, rgba(254,224,71,0.1) 0%, rgba(12,18,22,0.5) 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  cursor: "grab",
                }}
              >
                <StickyThumbnail />
              </div>
              <div style={{ padding: "10px 11px 11px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <div>
                  <div style={{ fontSize: "0.8rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.88)", marginBottom: "2px" }}>
                    {t("widgetPicker.stickyNotes")}
                  </div>
                  <Flex gap="4px" align="center" mt="2px">
                    {STICKY_COLORS.map(c => (
                      <Box key={c.id} w="7px" h="7px" borderRadius="50%" style={{ background: c.swatch, flexShrink: 0 }} />
                    ))}
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.32)", fontFamily: "'HarmonyOS Sans', sans-serif", marginLeft: 3 }}>
                      {t("widgetPicker.unlimitedInstances")}
                    </span>
                  </Flex>
                </div>
                <button
                  onClick={onAddStickyNote}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    width: "100%",
                    padding: "6px 0",
                    borderRadius: "8px",
                    fontSize: "0.72rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    cursor: "pointer",
                    transition: "all 0.18s",
                    background: "rgba(254,240,138,0.13)",
                    color: "#fde047",
                    border: "1px solid rgba(254,224,71,0.32)",
                  }}
                >
                  <Plus size={11} /> {t("widgetPicker.addNote")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile sticky list row — appended after WIDGET_DEFS list */}
        {isMobile && (
          <Flex align="center" gap={3} px={3} py={3} borderRadius="10px" mt={2} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <Flex w="36px" h="36px" borderRadius="9px" align="center" justify="center" flexShrink={0}
              style={{ background: "rgba(254,240,138,0.12)", border: "1px solid rgba(254,240,138,0.25)" }}>
              <StickyNote size={16} color="#fde047" />
            </Flex>
            <Box flex={1} minW={0}>
              <Text style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.88)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{t("widgetPicker.stickyNotes")}</Text>
              <Flex gap="4px" mt="4px" align="center">
                {STICKY_COLORS.map(c => (
                  <Box key={c.id} w="7px" h="7px" borderRadius="50%" style={{ background: c.swatch, flexShrink: 0 }} />
                ))}
                <Text style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.28)", fontFamily: "'HarmonyOS Sans', sans-serif", marginLeft: 3 }}>{t("widgetPicker.unlimited")}</Text>
              </Flex>
            </Box>
            <Box as="button" onClick={onAddStickyNote}
              display="flex" alignItems="center" justifyContent="center" gap={1}
              border="none" cursor="pointer" flexShrink={0}
              style={{
                padding: "4px 10px", borderRadius: "20px",
                fontSize: "0.7rem", fontFamily: "'HarmonyOS Sans', sans-serif",
                background: "rgba(254,240,138,0.12)", color: "#fde047",
                border: "1px solid rgba(254,240,138,0.28)", transition: "all 0.18s",
              }}>
              <Plus size={10} /><span style={{ marginLeft: 3 }}>{t("widgetPicker.addNote")}</span>
            </Box>
          </Flex>
        )}

        <Text mt="14px" style={{
          fontSize: "0.62rem",
          color: "rgba(255,255,255,0.18)",
          fontFamily: "'HarmonyOS Sans', sans-serif",
          textAlign: "center",
        }}>
          {t("widgetPicker.hint")}
        </Text>
      </Box>
    </MotionBox>

    {/* ── Drag ghost (portal) ── */}
    {draggingItem && typeof document !== "undefined" && createPortal(
      <div style={{
        position: "fixed",
        left: ghostPos.x - 60,
        top: ghostPos.y - 28,
        pointerEvents: "none",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: "10px",
        background: "rgba(12,18,22,0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: draggingItem === "sticky" ? "1px solid rgba(254,224,71,0.4)" : `1px solid ${draggingItem.color}40`,
        boxShadow: draggingItem === "sticky"
          ? "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(254,224,71,0.2)"
          : `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${draggingItem.color}20`,
        transform: "rotate(-2deg) scale(1.04)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: draggingItem === "sticky" ? "rgba(254,240,138,0.12)" : `${draggingItem.color}1a`,
          border: draggingItem === "sticky" ? "1px solid rgba(254,240,138,0.28)" : `1px solid ${draggingItem.color}35`,
        }}>
          {draggingItem === "sticky"
            ? <StickyNote size={14} color="#fde047" />
            : <draggingItem.icon size={14} color={draggingItem.color} />}
        </div>
        <span style={{
          fontSize: "0.78rem",
          fontFamily: "'HarmonyOS Sans', sans-serif",
          color: "rgba(255,255,255,0.88)",
          whiteSpace: "nowrap",
        }}>
          {draggingItem === "sticky" ? t("widgetPicker.stickyNotes") : draggingItem.label}
        </span>
      </div>,
      document.body,
    )}
    </>
  );
}