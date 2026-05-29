import { Box, Flex } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronUp, ChevronDown,
  Image as ImageIcon, LayoutGrid, Sparkles, Palette,
  AudioWaveform, Settings, Wand2, LayoutDashboard, BarChart2,
} from "lucide-react";
import { AccountPanel, AvatarCircle } from "../panels/AccountPanel";
import { ToolbarBtn }                 from "../ui/ToolbarBtn";
import type { StudySpaceCtx }         from "../../../hooks/studyspace/useStudySpace";

const MotionBox = motion.create(Box);

interface Props { ctx: StudySpaceCtx; }

export function SpaceToolbar({ ctx }: Props) {
  const {
    navigate, t,
    currentUser, handleLogout,
    saveStatus,
    toolbarVisible, setToolbarVisible,
    activePanel, togglePanel,
    accountOpen, setAccountOpen,
    avatarBtnRef, accountPanelRef,
    setAboutOpen,
  } = ctx;

  return (
    <div className="no-capture">
      {/* ── Save indicator ── */}
      <AnimatePresence>
        {saveStatus !== "idle" && (
          <MotionBox
            key="save-indicator"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 } as any}
            position="fixed"
            top="12px"
            right="16px"
            zIndex={200}
            px={3}
            py={1}
            borderRadius="full"
            style={{
              background: saveStatus === "error"
                ? "rgba(248,113,113,0.18)"
                : "rgba(12,18,22,0.72)",
              border: `1px solid ${saveStatus === "error" ? "rgba(248,113,113,0.35)" : "rgba(255,255,255,0.12)"}`,
              backdropFilter: "blur(10px)",
              color: saveStatus === "error" ? "#f87171" : "rgba(255,255,255,0.65)",
              fontSize: "0.72rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              letterSpacing: "0.02em",
            }}
          >
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved"  && "Saved ✓"}
            {saveStatus === "error"  && "Save failed"}
          </MotionBox>
        )}
      </AnimatePresence>

      {/* ── Account backdrop ── */}
      {accountOpen && (
        <Box position="fixed" inset={0} zIndex={99} onClick={() => setAccountOpen(false)} />
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
        left={0} right={0}
        display="flex"
        justifyContent="center"
        zIndex={30}
        pointerEvents="none"
        style={{
          bottom: toolbarVisible ? "72px" : "16px",
          transition: "bottom 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <Box
          as="button"
          onClick={() => setToolbarVisible(v => !v)}
          display="flex" alignItems="center" justifyContent="center"
          w="36px" h="36px" borderRadius="full" pointerEvents="auto"
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
              display="flex" alignItems="center" justifyContent="center"
            >
              {toolbarVisible ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </MotionBox>
          </AnimatePresence>
        </Box>
      </Box>

      {/* ── Bottom Toolbar ── */}
      <Box
        position="fixed" bottom={0} left={0} right={0}
        display="flex" justifyContent="center"
        zIndex={20} pointerEvents="none"
      >
        <AnimatePresence>
          {toolbarVisible && (
            <MotionBox
              key="toolbar"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              exit={{ y: 80,    opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] } as any}
              pointerEvents="auto"
            >
              <Flex
                align="center" justify="center" gap={8} px={12} h="64px"
                style={{
                  background: "rgba(10,15,22,0.72)",
                  backdropFilter: "blur(22px)",
                  WebkitBackdropFilter: "blur(22px)",
                  borderTop:    "1px solid rgba(255,255,255,0.1)",
                  borderLeft:   "1px solid rgba(255,255,255,0.08)",
                  borderRight:  "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "18px 18px 0 0",
                  boxShadow:    "0 -4px 24px rgba(0,0,0,0.3)",
                }}
              >
                <ToolbarBtn icon={<LayoutDashboard size={22} />} active={activePanel === "room"}     onClick={() => togglePanel("room")}     tooltip={t("space.rooms")} />
                <ToolbarBtn icon={<LayoutGrid size={22} />}      active={activePanel === "widget"}   onClick={() => togglePanel("widget")}   tooltip={t("space.widgets")} />
                <ToolbarBtn icon={<Sparkles size={22} />}        active={activePanel === "sticker"}  onClick={() => togglePanel("sticker")}  tooltip={t("space.stickers")} />
                <ToolbarBtn icon={<ImageIcon size={22} />}       active={activePanel === "image"}    onClick={() => togglePanel("image")}    tooltip={t("space.backgrounds")} />
                <ToolbarBtn icon={<Palette size={22} />}         active={activePanel === "theme"}    onClick={() => togglePanel("theme")}    tooltip={t("space.themes")} />
                <ToolbarBtn icon={<AudioWaveform size={22} />}   active={activePanel === "ambient"}  onClick={() => togglePanel("ambient")}  tooltip={t("space.ambientSounds")} />
                <ToolbarBtn icon={<Wand2 size={22} />}           active={activePanel === "effects"}         onClick={() => togglePanel("effects")}         tooltip={t("effects.title")} />
                <ToolbarBtn icon={<BarChart2 size={22} />}       active={activePanel === "pomodoro-stats"}  onClick={() => togglePanel("pomodoro-stats")}  tooltip="Phân tích Pomodoro" />
                <ToolbarBtn icon={<Settings size={22} />}        active={activePanel === "settings"}        onClick={() => togglePanel("settings")}        tooltip={t("settings.title")} />

                {/* Account avatar button */}
                <Box
                  ref={avatarBtnRef as any}
                  as="button"
                  onClick={() => setAccountOpen(v => !v)}
                  display="flex" alignItems="center" justifyContent="center"
                  bg="transparent" border="none" cursor="pointer"
                  title={currentUser ? currentUser.name : t("space.guestTooltip")}
                  transition="all 0.2s"
                  style={{
                    opacity:   accountOpen ? 1 : 0.75,
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
    </div>
  );
}
