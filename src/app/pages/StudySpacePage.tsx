import type { WidgetId, PlacedSticker, ClockMode, DigitalLayout, StickyNote, BackgroundItem } from "../components/StudySpace/types";
import { useState, useRef } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronUp, ChevronDown, Image as ImageIcon, LayoutGrid, Sparkles, Palette, AudioWaveform, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { AccountPanel, AvatarCircle, type UserInfo } from "../components/StudySpace/AccountPanel";

import { PomodoroWidget }        from "../components/StudySpace/PomodoroWidget";
import { PomodoroSettingsPanel } from "../components/StudySpace/PomodoroSettingsPanel";
import { MusicPlayerWidget }     from "../components/StudySpace/MusicPlayerWidget";
import { TodoListWidget }        from "../components/StudySpace/TodoListWidget";
import { ClockWidget }           from "../components/StudySpace/ClockWidget";
import { ClockSettingsPanel }    from "../components/StudySpace/ClockSettingsPanel";
import { DraggableWidget }       from "../components/StudySpace/DraggableWidget";
import { DraggableSticker }      from "../components/StudySpace/DraggableSticker";
import { StickyNoteWidget }      from "../components/StudySpace/StickyNoteWidget";
import { QuoteWidget }           from "../components/StudySpace/QuoteWidget";
import { WidgetPickerPanel }     from "../components/StudySpace/WidgetPickerPanel";
import { BackgroundPickerPanel } from "../components/StudySpace/BackgroundPickerPanel";
import { StickerPickerPanel }    from "../components/StudySpace/StickerPickerPanel";
import { ThemeStorePanel }       from "../components/StudySpace/ThemeStorePanel";
import { AmbientSoundPanel }     from "../components/StudySpace/AmbientSoundPanel";
import { AboutModal }            from "../components/StudySpace/AboutModal";
import { ToolbarBtn }            from "../components/StudySpace/ToolbarBtn";
import { BACKGROUNDS }           from "../components/StudySpace/constants";

const MotionBox = motion.create(Box);

type ActivePanel = "widget" | "image" | "sticker" | "theme" | "ambient" | null;

export function StudySpacePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* ── UI state ── */
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const avatarBtnRef = useRef<HTMLDivElement>(null);
  const accountPanelRef = useRef<HTMLDivElement>(null);

  const storedUser = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("user") : null;
  const currentUser: UserInfo | null = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    navigate("/");
  };
  const [clockSettingsOpen, setClockSettingsOpen] = useState(false);
  const clockContainerRef = useRef<HTMLDivElement>(null);

  // Clock widget settings (lifted up so ClockWidget + ClockSettingsPanel share state)
  const [clockMode, setClockMode]               = useState<ClockMode>("digital");
  const [clockLayout, setClockLayout]           = useState<DigitalLayout>("horizontal");
  const [clockShowSeconds, setClockShowSeconds] = useState(true);
  const [clockShowLunar, setClockShowLunar]     = useState(false);
  const [clockShowDate, setClockShowDate]       = useState(true);

  // Pomodoro settings (lifted up so PomodoroWidget + PomodoroSettingsPanel share state)
  const [pomodoroSettingsOpen, setPomodoroSettingsOpen] = useState(false);
  const pomodoroContainerRef = useRef<HTMLDivElement>(null);
  const [pomodoroFocusMin,    setPomodoroFocusMin]    = useState(25);
  const [pomodoroBreakMin,    setPomodoroBreakMin]    = useState(5);
  const [pomodoroTotalSes,    setPomodoroTotalSes]    = useState(4);

  /* ── Background ── */
  const [currentBg, setCurrentBg] = useState<BackgroundItem>(BACKGROUNDS[3]);

  /* ── Widgets ── */
  const [activeWidgets, setActiveWidgets] = useState<Set<WidgetId>>(
    new Set(["clock", "pomodoro"])
  );

  /* ── Stickers ── */
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);

  /* ── Sticky Notes ── */
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);

  const addStickyNote = () => {
    const sw = typeof window !== "undefined" ? window.innerWidth  : 1440;
    const sh = typeof window !== "undefined" ? window.innerHeight : 900;
    setStickyNotes(prev => [
      ...prev,
      {
        id: `sticky-${Date.now()}`,
        text: "",
        color: "yellow",
        x: Math.round(sw / 2 - 108 + (Math.random() - 0.5) * 200),
        y: Math.round(sh / 2 - 120 + (Math.random() - 0.5) * 140),
      },
    ]);
  };

  const removeStickyNote = (id: string) =>
    setStickyNotes(prev => prev.filter(n => n.id !== id));

  const updateStickyNote = (id: string, patch: Partial<Pick<StickyNote, "text" | "color" | "w" | "h">>) =>
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));

  /* ── Helpers ── */
  const screen = {
    w: typeof window !== "undefined" ? window.innerWidth : 1440,
    h: typeof window !== "undefined" ? window.innerHeight : 900,
  };

  const WIDGET_POSITIONS: Record<WidgetId, { x: number; y: number }> = {
    music:    { x: screen.w - 260, y: Math.round(screen.h * 0.12) },
    pomodoro: { x: screen.w - 260, y: Math.round(screen.h * 0.12) + 130 },
    todo:     { x: screen.w - 260, y: Math.round(screen.h * 0.12) + 390 },
    clock:    { x: 32,             y: Math.round(screen.h * 0.12) },
    quote:    { x: 32,             y: Math.round(screen.h * 0.12) + 210 },
  };

  const toggleWidget = (id: WidgetId) => {
    setActiveWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeWidget = (id: WidgetId) => {
    setActiveWidgets((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const placeSticker = (src: string) => {
    const sw = typeof window !== "undefined" ? window.innerWidth : 1440;
    const sh = typeof window !== "undefined" ? window.innerHeight : 900;
    setPlacedStickers((prev) => [
      ...prev,
      {
        id: `sticker-${Date.now()}`,
        src,
        x: Math.round(sw / 2 - 70 + (Math.random() - 0.5) * 160),
        y: Math.round(sh / 2 - 70 + (Math.random() - 0.5) * 120),
        size: 140,
      },
    ]);
  };

  const removeSticker = (id: string) =>
    setPlacedStickers((prev) => prev.filter((s) => s.id !== id));

  const togglePanel = (panel: ActivePanel) =>
    setActivePanel((p) => (p === panel ? null : panel));

  /* ── Render ── */
  return (
    <Box position="fixed" inset={0} overflow="hidden" style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}>

      {/* ── Background (fade on change) ── */}
      <MotionBox
        key={currentBg.id}
        position="absolute"
        inset={0}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 } as any}
        style={{
          backgroundImage: `url(${currentBg.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* ── Vignette ── */}
      <Box
        position="absolute"
        inset={0}
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />


      {/* ── Floating Panels ── */}
      <AnimatePresence>
        {activePanel === "image" && (
          <BackgroundPickerPanel
            key="bg-panel"
            currentBgId={currentBg.id}
            onSelect={(bg) => setCurrentBg(bg)}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "widget" && (
          <WidgetPickerPanel
            key="widget-panel"
            activeWidgets={activeWidgets}
            onToggle={toggleWidget}
            onAddStickyNote={() => { addStickyNote(); setActivePanel(null); }}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "sticker" && (
          <StickerPickerPanel
            key="sticker-panel"
            onPlace={(src) => placeSticker(src)}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "theme" && (
          <ThemeStorePanel
            key="theme-panel"
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "ambient" && (
          <AmbientSoundPanel
            key="ambient-panel"
            onClose={() => setActivePanel(null)}
          />
        )}
        {aboutOpen && (
          <AboutModal
            key="about-modal"
            onClose={() => setAboutOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Active Widgets ── */}
      <AnimatePresence>
        {activeWidgets.has("music") && (
          <DraggableWidget key="music" initialX={WIDGET_POSITIONS.music.x} initialY={WIDGET_POSITIONS.music.y} onRemove={() => removeWidget("music")}>
            <MusicPlayerWidget />
          </DraggableWidget>
        )}
        {activeWidgets.has("pomodoro") && (
          <DraggableWidget
            key="pomodoro"
            initialX={WIDGET_POSITIONS.pomodoro.x}
            initialY={WIDGET_POSITIONS.pomodoro.y}
            containerRef={pomodoroContainerRef}
            onRemove={() => { removeWidget("pomodoro"); setPomodoroSettingsOpen(false); }}
            extraControls={
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setPomodoroSettingsOpen(v => !v); }}
                display="flex" alignItems="center" justifyContent="center"
                w="18px" h="18px" borderRadius="full" border="none" cursor="pointer"
                style={{
                  background: pomodoroSettingsOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                  color: pomodoroSettingsOpen ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
                  transition: "all 0.15s",
                }}
                title="Pomodoro settings"
              >
                <Settings size={10} />
              </Box>
            }
            floatingPanel={
              <PomodoroSettingsPanel
                show={pomodoroSettingsOpen}
                containerRef={pomodoroContainerRef}
                focusMinutes={pomodoroFocusMin}
                breakMinutes={pomodoroBreakMin}
                totalSessions={pomodoroTotalSes}
                onFocusMinutes={setPomodoroFocusMin}
                onBreakMinutes={setPomodoroBreakMin}
                onTotalSessions={setPomodoroTotalSes}
                onClose={() => setPomodoroSettingsOpen(false)}
              />
            }
          >
            <PomodoroWidget
              focusMinutes={pomodoroFocusMin}
              breakMinutes={pomodoroBreakMin}
              totalSessions={pomodoroTotalSes}
            />
          </DraggableWidget>
        )}
        {activeWidgets.has("todo") && (
          <DraggableWidget key="todo" initialX={WIDGET_POSITIONS.todo.x} initialY={WIDGET_POSITIONS.todo.y} onRemove={() => removeWidget("todo")}>
            <TodoListWidget />
          </DraggableWidget>
        )}
        {activeWidgets.has("clock") && (
          <DraggableWidget
            key="clock"
            initialX={WIDGET_POSITIONS.clock.x}
            initialY={WIDGET_POSITIONS.clock.y}
            containerRef={clockContainerRef}
            onRemove={() => { removeWidget("clock"); setClockSettingsOpen(false); }}
            extraControls={
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setClockSettingsOpen(v => !v); }}
                display="flex" alignItems="center" justifyContent="center"
                w="18px" h="18px" borderRadius="full" border="none" cursor="pointer"
                style={{
                  background: clockSettingsOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                  color: clockSettingsOpen ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
                  transition: "all 0.15s",
                }}
                title="Clock settings"
              >
                <Settings size={10} />
              </Box>
            }
            floatingPanel={
              <ClockSettingsPanel
                show={clockSettingsOpen}
                containerRef={clockContainerRef}
                mode={clockMode}
                layout={clockLayout}
                showSeconds={clockShowSeconds}
                showLunar={clockShowLunar}
                showDate={clockShowDate}
                onMode={setClockMode}
                onLayout={setClockLayout}
                onShowSeconds={setClockShowSeconds}
                onShowLunar={setClockShowLunar}
                onShowDate={setClockShowDate}
                onClose={() => setClockSettingsOpen(false)}
              />
            }
          >
            <ClockWidget
              mode={clockMode}
              layout={clockLayout}
              showSeconds={clockShowSeconds}
              showLunar={clockShowLunar}
              showDate={clockShowDate}
            />
          </DraggableWidget>
        )}
        {activeWidgets.has("quote") && (
          <DraggableWidget key="quote" initialX={WIDGET_POSITIONS.quote.x} initialY={WIDGET_POSITIONS.quote.y} onRemove={() => removeWidget("quote")}>
            <QuoteWidget />
          </DraggableWidget>
        )}
      </AnimatePresence>

      {/* ── Placed Stickers ── */}
      <AnimatePresence>
        {placedStickers.map((s) => (
          <DraggableSticker key={s.id} sticker={s} onRemove={() => removeSticker(s.id)} />
        ))}
      </AnimatePresence>

      {/* ── Sticky Notes ── */}
      <AnimatePresence>
        {stickyNotes.map((note) => (
          <StickyNoteWidget
            key={note.id}
            note={note}
            onRemove={() => removeStickyNote(note.id)}
            onUpdate={(patch) => updateStickyNote(note.id, patch)}
          />
        ))}
      </AnimatePresence>

      {/* ── Account panel backdrop ── */}
      {accountOpen && (
        <Box
          position="fixed"
          inset={0}
          zIndex={99}
          onClick={() => setAccountOpen(false)}
        />
      )}

      {/* ── Account panel ── */}
      <AccountPanel
        open={accountOpen}
        user={currentUser}
        anchorRef={avatarBtnRef}
        panelRef={accountPanelRef}
        onClose={() => setAccountOpen(false)}
        onLogout={handleLogout}
        onHome={() => navigate("/")}
        onAbout={() => setAboutOpen(true)}
      />

      {/* ── Arrow toggle ── */}
      <Box
        position="fixed"
        left={0}
        right={0}
        display="flex"
        justifyContent="center"
        zIndex={30}
        pointerEvents="none"
        style={{ bottom: toolbarVisible ? "72px" : "16px", transition: "bottom 0.35s cubic-bezier(0.4,0,0.2,1)" }}
      >
        <Box
          as="button"
          onClick={() => setToolbarVisible((v) => !v)}
          display="flex"
          alignItems="center"
          justifyContent="center"
          w="36px"
          h="36px"
          borderRadius="full"
          pointerEvents="auto"
          style={{
            background: "rgba(10,15,20,0.65)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            transition: "background 0.2s, color 0.2s",
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
          _hover={{ background: "rgba(25,35,45,0.85)", color: "white" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <MotionBox
              key={toolbarVisible ? "down" : "up"}
              initial={{ opacity: 0, y: toolbarVisible ? -5 : 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: toolbarVisible ? 5 : -5 }}
              transition={{ duration: 0.18 } as any}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {toolbarVisible ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </MotionBox>
          </AnimatePresence>
        </Box>
      </Box>

      {/* ── Bottom Toolbar ── */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        display="flex"
        justifyContent="center"
        zIndex={20}
        pointerEvents="none"
      >
        <AnimatePresence>
          {toolbarVisible && (
            <MotionBox
              key="toolbar"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] } as any}
              pointerEvents="auto"
            >
              <Flex
                align="center"
                justify="center"
                gap={8}
                px={12}
                h="64px"
                style={{
                  background: "rgba(10,15,22,0.72)",
                  backdropFilter: "blur(22px)",
                  WebkitBackdropFilter: "blur(22px)",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  borderLeft: "1px solid rgba(255,255,255,0.08)",
                  borderRight: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "18px 18px 0 0",
                  boxShadow: "0 -4px 24px rgba(0,0,0,0.3)",
                }}
              >
                <ToolbarBtn
                  icon={<LayoutGrid size={22} />}
                  active={activePanel === "widget"}
                  onClick={() => togglePanel("widget")}
                  tooltip={t("space.widgets")}
                />
                <ToolbarBtn
                  icon={<Sparkles size={22} />}
                  active={activePanel === "sticker"}
                  onClick={() => togglePanel("sticker")}
                  tooltip={t("space.stickers")}
                />
                <ToolbarBtn
                  icon={<ImageIcon size={22} />}
                  active={activePanel === "image"}
                  onClick={() => togglePanel("image")}
                  tooltip={t("space.backgrounds")}
                />
                <ToolbarBtn
                  icon={<Palette size={22} />}
                  active={activePanel === "theme"}
                  onClick={() => togglePanel("theme")}
                  tooltip={t("space.themes")}
                />
                <ToolbarBtn
                  icon={<AudioWaveform size={22} />}
                  active={activePanel === "ambient"}
                  onClick={() => togglePanel("ambient")}
                  tooltip={t("space.ambientSounds")}
                />

                {/* Account avatar button */}
                <Box
                  ref={avatarBtnRef as any}
                  as="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="transparent"
                  border="none"
                  cursor="pointer"
                  title={currentUser ? currentUser.name : t("space.guestTooltip")}
                  transition="all 0.2s"
                  style={{
                    opacity: accountOpen ? 1 : 0.75,
                    transform: accountOpen ? "scale(1.1) translateY(-2px)" : "scale(1)",
                  }}
                  _hover={{ opacity: 1, transform: "scale(1.1) translateY(-2px)" } as any}
                >
                  <AvatarCircle user={currentUser} size={30} fontSize="0.72rem" />
                </Box>
              </Flex>
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}