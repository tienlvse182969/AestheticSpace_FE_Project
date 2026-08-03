import { useState, useEffect, useRef } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Image as ImageIcon, LayoutGrid, ShoppingBag,
  AudioWaveform, Settings, Wand2, Layers, BarChart2, Trophy, Sticker,
} from "lucide-react";
import { useToolbarPosition } from "../../../context/ToolbarPositionContext";
import { useNotificationBanners } from "../../../context/NotificationBannerContext";
import { NotificationBellIcon } from "../ui/NotificationBellIcon";
import { LuckyDrawGiftIcon }    from "../ui/LuckyDrawGiftIcon";
import { AccountPanel, AvatarCircle } from "../panels/AccountPanel";
import { ToolbarBtn }                 from "../ui/ToolbarBtn";
import { PremiumGateModal, type LockedFeature } from "../ui/PremiumGateModal";
import { OnboardingTour }             from "../ui/OnboardingTour";
import { coinService }                from "../../../../services/coin.service";
import { luckyDrawService }           from "../../../../services/luckyDraw.service";
import type { StudySpaceCtx }         from "../../../hooks/studyspace/useStudySpace";
import type { TourStepId }            from "../../../hooks/studyspace/useOnboardingTour";

const MotionBox = motion.create(Box);

interface Props {
  ctx: StudySpaceCtx;
  coinBalance?: number;
  onCoinBalanceReady?: (balance: number) => void;
  luckyDrawRemaining?: number;
  onLuckyDrawRemainingReady?: (remaining: number) => void;
}

export function SpaceToolbar({ ctx, coinBalance, onCoinBalanceReady, luckyDrawRemaining, onLuckyDrawRemainingReady }: Props) {
  const {
    navigate, t,
    currentUser, handleLogout,
    saveStatus,
    toolbarVisible, setToolbarVisible,
    activePanel, togglePanel, setActivePanel,
    accountOpen, setAccountOpen,
    avatarBtnRef, accountPanelRef,
    tour,
  } = ctx;

  const isFree = !!currentUser && currentUser.accountTier?.toLowerCase() !== "premium";
  const { unreadHistoryCount } = useNotificationBanners();
  const [gateFeature, setGateFeature] = useState<LockedFeature | null>(null);
  const [nearToolbar, setNearToolbar] = useState(false);
  const { position } = useToolbarPosition();
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tourTargetsRef = useRef<Partial<Record<TourStepId, HTMLElement | null>>>({});

  // Steps whose target lives inside a panel rendered elsewhere (SpacePanels), located by DOM id
  // rather than a React ref, since those panels are far outside the toolbar's component tree.
  const TOUR_DOM_TARGET_IDS: Partial<Record<TourStepId, string>> = {
    "widget-add":        "tour-target-widget-panel",
    "background-change": "tour-target-bg-panel",
    "room-create":       "tour-target-room-panel",
  };

  const getTourTarget = (id: TourStepId) => {
    if (id === "account") return avatarBtnRef.current;
    const domId = TOUR_DOM_TARGET_IDS[id];
    if (domId) return document.getElementById(domId);
    return tourTargetsRef.current[id] ?? null;
  };

  // Keep the toolbar visible for the duration of the tour so its targets stay on screen.
  useEffect(() => {
    if (tour.active && !toolbarVisible) setToolbarVisible(true);
  }, [tour.active, toolbarVisible, setToolbarVisible]);

  // Auto-open/close the panel a tour step wants shown (e.g. the widget/background/room panels).
  useEffect(() => {
    if (!tour.active) return;
    setActivePanel(tour.currentStep.panel ?? null);
  }, [tour.active, tour.currentStep, setActivePanel]);

  // Close whatever panel the tour opened once the tour ends.
  const tourWasActiveRef = useRef(false);
  useEffect(() => {
    if (tourWasActiveRef.current && !tour.active) setActivePanel(null);
    tourWasActiveRef.current = tour.active;
  }, [tour.active, setActivePanel]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const threshold = toolbarVisible ? 110 : 52;
      let near = false;
      if (position === "bottom") near = e.clientY > window.innerHeight - threshold;
      else if (position === "left")  near = e.clientX < threshold;
      else                           near = e.clientX > window.innerWidth - threshold;

      if (near) {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setNearToolbar(true);
      } else {
        hideTimerRef.current = setTimeout(() => setNearToolbar(false), 350);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [position, toolbarVisible]);

  const handleLockedClick = (feature: LockedFeature) => setGateFeature(feature);

  useEffect(() => {
    if (currentUser) {
      coinService.getBalance().then((data) => onCoinBalanceReady?.(data.balance));
      luckyDrawService.getStatus().then((data) => onLuckyDrawRemainingReady?.(data.remainingDrawsToday));
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAvatarClick = () => {
    const opening = !accountOpen;
    setAccountOpen(opening);
    if (opening && currentUser) {
      coinService.getBalance().then((data) => onCoinBalanceReady?.(data.balance));
    }
  };

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

      {/* ── Premium gate modal ── */}
      <PremiumGateModal feature={gateFeature} onClose={() => setGateFeature(null)} />

      {/* ── Account panel ── */}
      <AccountPanel
        open={accountOpen}
        user={currentUser}
        coinBalance={coinBalance}
        anchorRef={avatarBtnRef}
        panelRef={accountPanelRef}
        onClose={() => setAccountOpen(false)}
        onLogout={handleLogout}
        onHome={() => navigate("/")}
        onHelp={() => tour.start(ctx.user?.userId ?? null)}
      />

      {/* ── Onboarding tour ── */}
      <OnboardingTour
        active={tour.active}
        stepIndex={tour.stepIndex}
        steps={tour.steps}
        getTarget={getTourTarget}
        toolbarPosition={position}
        onNext={tour.next}
        onPrev={tour.prev}
        onSkip={tour.skip}
      />

      {/* ── Arrow toggle (shown only when near toolbar) ── */}
      <Box
        position="fixed"
        zIndex={30}
        pointerEvents="none"
        style={position === "bottom" ? {
          left: 0, right: 0,
          bottom: toolbarVisible ? "72px" : "10px",
          display: "flex", justifyContent: "center",
          transition: "bottom 0.3s cubic-bezier(0.4,0,0.2,1)",
        } : position === "left" ? {
          top: 0, bottom: 0,
          left: toolbarVisible ? "72px" : "10px",
          display: "flex", alignItems: "center",
          transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
        } : {
          top: 0, bottom: 0,
          right: toolbarVisible ? "72px" : "10px",
          display: "flex", alignItems: "center",
          transition: "right 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <AnimatePresence initial={false}>
          {nearToolbar && (
            <MotionBox
              key="toggle"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15, ease: "easeOut" } as any}
              display="flex"
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
                    key={toolbarVisible ? "hide" : "show"}
                    initial={{ opacity: 0, rotate: -30 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 30 }}
                    transition={{ duration: 0.14 } as any}
                    display="flex" alignItems="center" justifyContent="center"
                  >
                    {position === "bottom"
                      ? (toolbarVisible ? <ChevronDown size={18} /> : <ChevronUp size={18} />)
                      : position === "left"
                      ? (toolbarVisible ? <ChevronLeft size={18} /> : <ChevronRight size={18} />)
                      : (toolbarVisible ? <ChevronRight size={18} /> : <ChevronLeft size={18} />)
                    }
                  </MotionBox>
                </AnimatePresence>
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>

      {/* ── Toolbar ── */}
      <Box
        position="fixed"
        zIndex={20}
        pointerEvents="none"
        style={position === "bottom" ? {
          bottom: 0, left: 0, right: 0,
          display: "flex", justifyContent: "center",
        } : position === "left" ? {
          left: 0, top: 0, bottom: 0,
          display: "flex", alignItems: "center",
        } : {
          right: 0, top: 0, bottom: 0,
          display: "flex", alignItems: "center",
        }}
      >
        <AnimatePresence mode="wait">
          {toolbarVisible && (
            <MotionBox
              key="toolbar"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] } as any}
              pointerEvents="auto"
            >
              <Flex
                direction={position === "bottom" ? "row" : "column"}
                align="center" justify="center"
                gap={8}
                {...(position === "bottom" ? { px: 12, h: "64px" } : { py: 12, w: "64px" })}
                style={{
                  background: "rgba(10,15,22,0.72)",
                  backdropFilter: "blur(22px)",
                  WebkitBackdropFilter: "blur(22px)",
                  ...(position === "bottom" ? {
                    borderTop:    "1px solid rgba(255,255,255,0.1)",
                    borderLeft:   "1px solid rgba(255,255,255,0.08)",
                    borderRight:  "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "18px 18px 0 0",
                    boxShadow:    "0 -4px 24px rgba(0,0,0,0.3)",
                  } : position === "left" ? {
                    borderRight:  "1px solid rgba(255,255,255,0.1)",
                    borderTop:    "1px solid rgba(255,255,255,0.08)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0 18px 18px 0",
                    boxShadow:    "4px 0 24px rgba(0,0,0,0.3)",
                  } : {
                    borderLeft:   "1px solid rgba(255,255,255,0.1)",
                    borderTop:    "1px solid rgba(255,255,255,0.08)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "18px 0 0 18px",
                    boxShadow:    "-4px 0 24px rgba(0,0,0,0.3)",
                  }),
                }}
              >
                <ToolbarBtn ref={el => (tourTargetsRef.current.room = el)} icon={<Layers size={22} />} active={activePanel === "room"}   onClick={() => togglePanel("room")}   tooltip={t("space.rooms")} position={position} />
                <ToolbarBtn ref={el => (tourTargetsRef.current.widget = el)} icon={<LayoutGrid size={22} />}      active={activePanel === "widget"} onClick={() => togglePanel("widget")} tooltip={t("space.widgets")} position={position} />
                <ToolbarBtn ref={el => (tourTargetsRef.current.theme = el)} icon={<ShoppingBag size={22} />}     active={activePanel === "theme"}  onClick={() => togglePanel("theme")}  tooltip={t("themeStore.tooltip")} position={position} />
                <ToolbarBtn ref={el => (tourTargetsRef.current.image = el)} icon={<ImageIcon size={22} />}       active={activePanel === "image"}  onClick={() => togglePanel("image")}  tooltip={t("space.backgrounds")} position={position} />
                <ToolbarBtn ref={el => (tourTargetsRef.current.sticker = el)} icon={<Sticker size={22} />}       active={activePanel === "sticker"} onClick={() => togglePanel("sticker")} tooltip={t("space.stickers")} position={position} />
                <ToolbarBtn ref={el => (tourTargetsRef.current.ambient = el)} icon={<AudioWaveform size={22} />} active={activePanel === "ambient"} onClick={() => togglePanel("ambient")} tooltip={t("space.ambientSounds")} position={position} />
                <ToolbarBtn ref={el => (tourTargetsRef.current.effects = el)} icon={<Wand2 size={22} />}         active={activePanel === "effects"} locked={isFree} onClick={() => isFree ? handleLockedClick("effects") : togglePanel("effects")} tooltip={t("effects.title")} position={position} />
                <ToolbarBtn ref={el => (tourTargetsRef.current.quest = el)} icon={<Trophy size={22} />}        active={activePanel === "quest"}   onClick={() => togglePanel("quest")}   tooltip="Nhiệm vụ" position={position} />
                <ToolbarBtn
                  icon={<LuckyDrawGiftIcon size={22} remainingDraws={luckyDrawRemaining ?? 0} />}
                  active={activePanel === "lucky-draw"}
                  badgeCount={luckyDrawRemaining ?? 0}
                  onClick={() => togglePanel("lucky-draw")}
                  tooltip={t("luckyDraw.tooltip")}
                  position={position}
                />
                <ToolbarBtn ref={el => (tourTargetsRef.current["pomodoro-stats"] = el)} icon={<BarChart2 size={22} />} active={activePanel === "pomodoro-stats"} onClick={() => togglePanel("pomodoro-stats")} tooltip="Phân tích Pomodoro" position={position} />
                <ToolbarBtn ref={el => (tourTargetsRef.current.settings = el)} icon={<Settings size={22} />}  active={activePanel === "settings"}       onClick={() => togglePanel("settings")}       tooltip={t("settings.title")} position={position} />
                <ToolbarBtn icon={<NotificationBellIcon size={22} unreadCount={unreadHistoryCount} />} active={activePanel === "notification"} badgeCount={unreadHistoryCount} onClick={() => togglePanel("notification")} tooltip={t("notification.tooltip")} position={position} />

                {/* Account avatar button */}
                <Box
                  ref={avatarBtnRef as any}
                  as="button"
                  onClick={handleAvatarClick}
                  display="flex" alignItems="center" justifyContent="center"
                  bg="transparent" border="none" cursor="pointer"
                  title={currentUser ? currentUser.name : t("space.guestTooltip")}
                  transition="all 0.2s"
                  style={{
                    opacity:   accountOpen ? 1 : 0.75,
                    transform: accountOpen ? "scale(1.1)" : "scale(1)",
                  }}
                  _hover={{ opacity: 1, transform: "scale(1.1)" } as any}
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
