import { useLayoutEffect, useRef, useState, useCallback } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { motion, useMotionValue, AnimatePresence } from "motion/react";
import { GripHorizontal, X, Settings, Check } from "lucide-react";
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

const SIZES_BASE: { id: "sm" | "md" | "lg"; labelKey: string; w: number; h: number }[] = [
  { id: "sm", labelKey: "stickyNote.small",  w: 180, h: 110 },
  { id: "md", labelKey: "stickyNote.medium", w: 224, h: 160 },
  { id: "lg", labelKey: "stickyNote.large",  w: 300, h: 240 },
];

const PANEL_W = 170 + 10;
const PANEL_H = 260;
const MARGIN  = 12;

interface StickyNoteWidgetProps {
  note: StickyNote;
  onRemove: () => void;
  onUpdate: (patch: Partial<Pick<StickyNote, "text" | "color" | "w" | "h" | "x" | "y">>) => void;
  onSave?: () => void;
}

export function StickyNoteWidget({ note, onRemove, onUpdate, onSave }: StickyNoteWidgetProps) {
  const { t } = useTranslation();
  const SIZES = SIZES_BASE.map(s => ({ ...s, label: t(s.labelKey) }));
  const [hovered,      setHovered]      = useState(false);
  const [focused,      setFocused]      = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saved,        setSaved]        = useState(false);

  const [w, setW] = useState(note.w ?? SIZES[1].w);
  const [h, setH] = useState(note.h ?? SIZES[1].h);

  const activeSize = SIZES.find(s => s.w === w && s.h === h)?.id ?? null;

  const x = useMotionValue(note.x);
  const y = useMotionValue(note.y);

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
  const showControls = hovered || focused || settingsOpen;

  const applySize = (size: typeof SIZES[number]) => {
    setW(size.w);
    setH(size.h);
    onUpdate({ w: size.w, h: size.h });
  };

  const handleSave = useCallback(() => {
    onSave?.();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      textareaRef.current?.blur();
    }, 400);
  }, [onSave]);

  return (
    <motion.div
      ref={containerRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragListener={!focused}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1, width: w }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: "spring", stiffness: 500, damping: 24, mass: 0.9 }}
      whileDrag={{ scale: 1.02, zIndex: 60 }}
      onDragEnd={() => onUpdate({ x: Math.round(x.get()), y: Math.round(y.get()) })}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        x,
        y,
        width: w,
        cursor: focused ? "default" : "grab",
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
        animate={{ height: h }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.8 }}
        style={{
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
          onBlur={() => setFocused(false)}
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

        {/* Save button — bottom-right, only when editing */}
        <AnimatePresence>
          {focused && onSave && (
            <motion.button
              key="save-btn"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              onMouseDown={e => e.preventDefault()}
              onClick={handleSave}
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: saved ? "none" : "1.5px solid rgba(255,255,255,0.85)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: saved ? "rgb(34,197,94)" : "rgb(34,197,94)",
                color: "white",
                transition: "background 0.15s, color 0.15s",
                boxShadow: "0 2px 10px rgba(0,0,0,0.22)",
              }}
            >
              <Check size={13} />
            </motion.button>
          )}
        </AnimatePresence>
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

              {/* Size picker */}
              <div style={{
                fontSize: "0.62rem",
                color: "rgba(255,255,255,0.28)",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 7,
              }}>
                {t("stickyNote.size")}
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {SIZES.map(size => {
                  const isActive = activeSize === size.id;
                  const iconW = size.id === "sm" ? 14 : size.id === "md" ? 20 : 28;
                  const iconH = size.id === "sm" ? 10 : size.id === "md" ? 15 : 21;
                  return (
                    <button
                      key={size.id}
                      onClick={() => applySize(size)}
                      title={size.label}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 7,
                        border: isActive
                          ? `1.5px solid ${c.swatch}99`
                          : "1.5px solid rgba(255,255,255,0.1)",
                        background: isActive ? `${c.swatch}22` : "rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.18s",
                      }}
                    >
                      <div style={{
                        width: iconW,
                        height: iconH,
                        borderRadius: 3,
                        background: isActive ? `${c.swatch}66` : "rgba(255,255,255,0.15)",
                        transition: "all 0.18s",
                      }} />
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                {SIZES.map(size => (
                  <span key={size.id} style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: "0.62rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    color: activeSize === size.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.28)",
                    transition: "color 0.18s",
                  }}>
                    {size.label}
                  </span>
                ))}
              </div>

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
