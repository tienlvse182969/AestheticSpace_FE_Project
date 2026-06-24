import { useLayoutEffect, useRef, useState } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { motion, useMotionValue, AnimatePresence } from "motion/react";
import { GripHorizontal, X, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StickyNote } from "../../types";

export const STICKY_COLORS: {
  id: string;
  label: string;
  bg: string;
  text: string;
  border: string;
  swatch: string;
}[] = [
  { id: "yellow",   label: "colors.vanilla",  bg: "#fef08a", text: "#713f12", border: "#fde047", swatch: "#fde047" },
  { id: "mint",     label: "colors.mint",     bg: "#a7f3d0", text: "#064e3b", border: "#6ee7b7", swatch: "#6ee7b7" },
  { id: "pink",     label: "colors.blossom",  bg: "#fbcfe8", text: "#831843", border: "#f9a8d4", swatch: "#f9a8d4" },
  { id: "lavender", label: "colors.lavender", bg: "#ddd6fe", text: "#4c1d95", border: "#c4b5fd", swatch: "#c4b5fd" },
  { id: "sky",      label: "colors.sky",      bg: "#bae6fd", text: "#0c4a6e", border: "#7dd3fc", swatch: "#7dd3fc" },
];

const DEFAULT_W = 224;
const DEFAULT_H = 160;

const PANEL_W = 170 + 10;
const PANEL_H = 260;
const MARGIN  = 12;

interface StickyNoteWidgetProps {
  note: StickyNote;
  onRemove: () => void;
  onUpdate: (patch: Partial<Pick<StickyNote, "text" | "color" | "w" | "h" | "x" | "y">>) => void;
  onSave?: () => void;
  locked?: boolean;
}

export function StickyNoteWidget({ note, onRemove, onUpdate, onSave, locked }: StickyNoteWidgetProps) {
  const { t } = useTranslation();
  const [hovered,      setHovered]      = useState(false);
  const [focused,      setFocused]      = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const x   = useMotionValue(note.x);
  const y   = useMotionValue(note.y);
  const wMV = useMotionValue(note.w ?? DEFAULT_W);
  const hMV = useMotionValue(note.h ?? DEFAULT_H);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hSide, setHSide] = useState<"right" | "left">("right");
  const [vSide, setVSide] = useState<"top" | "bottom">("top");

  useLayoutEffect(() => {
    if (!settingsOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHSide(rect.right + PANEL_W > window.innerWidth  - MARGIN ? "left" : "right");
    setVSide(rect.top   + PANEL_H > window.innerHeight - MARGIN ? "bottom" : "top");
  }, [settingsOpen]);

  const posStyle: React.CSSProperties =
    hSide === "right"
      ? { left: "calc(100% + 10px)", right: "auto" }
      : { right: "calc(100% + 10px)", left: "auto" };

  const vStyle: React.CSSProperties =
    vSide === "top"
      ? { top: "0px",    bottom: "auto" }
      : { bottom: "0px", top: "auto"    };

  const xInit  = hSide === "right" ? -10 : 10;
  const origin = hSide === "right" ? "left center" : "right center";

  const c            = STICKY_COLORS.find(col => col.id === note.color) ?? STICKY_COLORS[0];
  const showControls = !locked && (hovered || focused || settingsOpen);

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = wMV.get();
    const startH = hMV.get();
    let latestW = startW;
    let latestH = startH;

    const onMove = (ev: PointerEvent) => {
      latestW = Math.max(150, Math.min(520, Math.round(startW + ev.clientX - startX)));
      latestH = Math.max(80,  Math.min(480, Math.round(startH + ev.clientY - startY)));
      wMV.set(latestW);
      hMV.set(latestH);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      onUpdate({ w: latestW, h: latestH });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <motion.div
      ref={containerRef}
      drag={!locked}
      dragMomentum={false}
      dragElastic={0}
      dragListener={!locked && !focused}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: "spring", stiffness: 500, damping: 24, mass: 0.9 }}
      whileDrag={locked ? undefined : { scale: 1.02, zIndex: 60 }}
      onDragEnd={() => !locked && onUpdate({ x: Math.round(x.get()), y: Math.round(y.get()) })}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        x,
        y,
        width: wMV,
        cursor: locked ? "default" : focused ? "default" : "grab",
        userSelect: "none",
        zIndex: 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Top control bar ─────────────────────────────────────────────── */}
      <Flex
        justify="space-between"
        align="center"
        px="6px"
        pb="4px"
        style={{ height: 20, opacity: showControls ? 1 : 0, transition: "opacity 0.2s" }}
      >
        <GripHorizontal size={14} color="rgba(255,255,255,0.45)" />

        <Flex align="center" gap="4px">
          <Box
            as="button"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSettingsOpen(v => !v); }}
            display="flex" alignItems="center" justifyContent="center"
            w="18px" h="18px" borderRadius="full" border="none" cursor="pointer"
            style={{
              background: settingsOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
              color:      settingsOpen ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
              transition: "all 0.15s",
            }}
            _hover={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}
            title={t("stickyNote.settingsTooltip")}
          >
            <Settings size={10} />
          </Box>

          <Box
            as="button"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRemove(); }}
            display="flex" alignItems="center" justifyContent="center"
            w="18px" h="18px" borderRadius="full" border="none" cursor="pointer"
            style={{ background: "rgba(239,68,68,0.18)", color: "rgba(239,68,68,0.7)", transition: "all 0.15s" }}
            _hover={{ background: "rgba(239,68,68,0.85)", color: "white" }}
            title={t("stickyNote.removeTooltip")}
          >
            <X size={10} />
          </Box>
        </Flex>
      </Flex>

      {/* ── Note body ───────────────────────────────────────────────────── */}
      <motion.div
        style={{
          height: hMV,
          background: c.bg,
          border: `1.5px solid ${c.border}`,
          borderRadius: 12,
          padding: "10px 12px 10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
          transition: "background 0.24s ease, border-color 0.24s ease",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <textarea
          ref={textareaRef}
          value={note.text}
          onChange={e => onUpdate({ text: e.target.value })}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onSave?.(); }}
          placeholder={t("stickyNote.placeholder")}
          style={{
            flex: 1,
            width: "100%",
            resize: "none",
            background: "transparent",
            border: "none",
            outline: "none",
            color: c.text,
            fontFamily: "'HarmonyOS Sans', sans-serif",
            fontSize: "0.82rem",
            lineHeight: 1.58,
            letterSpacing: "0.01em",
            cursor: "text",
            userSelect: "text",
            overflowY: "auto",
            padding: 0,
          }}
          onPointerDown={e => e.stopPropagation()}
        />

        {!locked && (
          <div
            onPointerDown={handleResizeStart}
            style={{
              position: "absolute",
              bottom: 3,
              right: 3,
              width: 18,
              height: 18,
              cursor: "se-resize",
              opacity: hovered || focused || settingsOpen ? 0.5 : 0,
              transition: "opacity 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="8.5" cy="8.5" r="1.3" fill={c.text} />
              <circle cx="4.5" cy="8.5" r="1.3" fill={c.text} />
              <circle cx="8.5" cy="4.5" r="1.3" fill={c.text} />
            </svg>
          </div>
        )}

      </motion.div>

      {/* ── Settings panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {settingsOpen && (
          <div style={{ position: "absolute", ...posStyle, ...vStyle, zIndex: 40 }}>
            <motion.div
              key="sticky-settings"
              initial={{ opacity: 0, scale: 0.92, x: xInit }}
              animate={{ opacity: 1, scale: 1,    x: 0    }}
              exit={{    opacity: 0, scale: 0.92, x: xInit }}
              transition={{ type: "spring", stiffness: 500, damping: 24, mass: 0.9 }}
              onPointerDown={e => e.stopPropagation()}
              style={{
                width: 168,
                background: "rgba(12,18,22,0.82)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "12px 14px 14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                transformOrigin: origin,
              }}
            >
              {/* Header */}
              <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
                <div style={{
                  fontSize: "0.7rem",
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>
                  {t("stickyNote.settingsTitle")}
                </div>
                <Box
                  as="button"
                  onClick={() => setSettingsOpen(false)}
                  display="flex" alignItems="center" justifyContent="center"
                  w="20px" h="20px" borderRadius="full" border="none" cursor="pointer"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", transition: "all 0.15s" }}
                  _hover={{ background: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.8)" }}
                >
                  <X size={11} />
                </Box>
              </Flex>

              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 10 }} />

              {/* Color picker */}
              <div style={{
                fontSize: "0.62rem",
                color: "rgba(255,255,255,0.28)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 7,
              }}>
                {t("stickyNote.color")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {STICKY_COLORS.map(col => {
                  const isActive = note.color === col.id;
                  return (
                    <button
                      key={col.id}
                      onClick={() => onUpdate({ color: col.id })}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "5px 8px",
                        borderRadius: 8,
                        border: isActive ? `1px solid ${col.swatch}55` : "1px solid transparent",
                        background: isActive ? `${col.swatch}18` : "rgba(255,255,255,0.03)",
                        cursor: "pointer",
                        transition: "all 0.18s",
                      }}
                    >
                      <div style={{
                        width: 13, height: 13,
                        borderRadius: "50%",
                        background: col.swatch,
                        flexShrink: 0,
                        boxShadow: isActive ? `0 0 0 2px rgba(0,0,0,0.35), 0 0 0 3.5px ${col.swatch}` : "none",
                        transition: "box-shadow 0.18s",
                      }} />
                      <span style={{
                        fontSize: "0.76rem",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.42)",
                        transition: "color 0.18s",
                      }}>
                        {t(col.label)}
                      </span>
                      {isActive && (
                        <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: col.swatch }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
