import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { BackgroundPickerPanel } from "../panels/BackgroundPickerPanel";
import { WidgetPickerPanel }     from "../panels/WidgetPickerPanel";
import { StickerPickerPanel }    from "../panels/StickerPickerPanel";
import { ThemeStorePanel }       from "../panels/ThemeStorePanel";
import { AmbientSoundPanel }     from "../panels/AmbientSoundPanel";
import { EffectsPanel }          from "../panels/EffectsPanel";
import { SettingsPanel }         from "../panels/SettingsPanel";
import { RoomManagerPanel }      from "../panels/RoomManagerPanel";
import { PomodoroStatsPanel }    from "../panels/PomodoroStatsPanel";
import { QuestPanel }            from "../panels/QuestPanel";
import { AboutModal }            from "../ui/AboutModal";
import { TrialBanner }           from "../ui/TrialBanner";
import { TrialExpiredModal }     from "../ui/TrialExpiredModal";
import type { StudySpaceCtx }    from "../../../hooks/studyspace/useStudySpace";
import type { StoreItem }        from "../../../../services/aestheticStore.service";
import type { BackgroundItem }   from "../types";

const TRIAL_DURATION = 600; // 10 minutes in seconds

interface Props {
  ctx: StudySpaceCtx;
  onCoinBalanceChange?: (newBalance: number) => void;
  coinBalance?: number;
}

export function SpacePanels({ ctx, onCoinBalanceChange, coinBalance }: Props) {
  const {
    activePanel, setActivePanel,
    currentBg, setCurrentBg,
    activeEffect, setActiveEffect,
    roomId, handleRoomSelect,
    aboutOpen, setAboutOpen,
    space, saveNow,
  } = ctx;

  const [trialItem, setTrialItem]               = useState<StoreItem | null>(null);
  const [trialSecondsLeft, setTrialSecondsLeft] = useState(0);
  const [expiredItem, setExpiredItem]           = useState<StoreItem | null>(null);
  const [buyItemId, setBuyItemId]               = useState<string | undefined>(undefined);

  // Ref for the original background before a Background trial — avoids stale closure issues
  const trialOriginalBgRef = useRef<BackgroundItem | null>(null);

  const restoreOriginalBg = useCallback(() => {
    if (trialOriginalBgRef.current) {
      setCurrentBg(trialOriginalBgRef.current);
      trialOriginalBgRef.current = null;
    }
  }, [setCurrentBg]);

  // Countdown tick
  useEffect(() => {
    if (!trialItem) return;
    const timer = setInterval(() => {
      setTrialSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [!!trialItem]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expire when time runs out
  useEffect(() => {
    if (!trialItem || trialSecondsLeft !== 0) return;
    if (trialItem.category === "Background") {
      restoreOriginalBg();
      setExpiredItem(trialItem);
    }
    setTrialItem(null);
    setBuyItemId(undefined);
  }, [trialItem, trialSecondsLeft, restoreOriginalBg]);

  const handleStartTrial = useCallback((item: StoreItem) => {
    setTrialItem(item);
    setTrialSecondsLeft(TRIAL_DURATION);
    setBuyItemId(undefined);
    if (item.category === "Background" && item.assetUrl) {
      trialOriginalBgRef.current = currentBg;
      setCurrentBg({ id: `trial-${item.id}`, url: item.assetUrl, thumb: item.assetUrl, label: item.name });
    }
  }, [currentBg, setCurrentBg]);

  const handleDiscardTrial = useCallback(() => {
    restoreOriginalBg();
    setTrialItem(null);
    setTrialSecondsLeft(0);
    setBuyItemId(undefined);
  }, [restoreOriginalBg]);

  const handleBuyFromTrial = useCallback(() => {
    if (trialItem) setBuyItemId(trialItem.id);
    setActivePanel("theme");
  }, [trialItem, setActivePanel]);

  const handleTrialEnd = useCallback(() => {
    restoreOriginalBg();
    setTrialItem(null);
    setTrialSecondsLeft(0);
    setBuyItemId(undefined);
  }, [restoreOriginalBg]);

  const handleBuyExpired = useCallback(() => {
    if (expiredItem) setBuyItemId(expiredItem.id);
    setExpiredItem(null);
    setActivePanel("theme");
  }, [expiredItem, setActivePanel]);

  const handleApplyItem = useCallback((item: StoreItem) => {
    if (item.category === "Background" && item.assetUrl) {
      setCurrentBg({ id: item.id, url: item.assetUrl, thumb: item.assetUrl, label: item.name });
      saveNow();
    }
  }, [setCurrentBg, saveNow]);

  return (
    <div className="no-capture">
      {/* ── Trial banner (persists when store is closed) ── */}
      <AnimatePresence>
        {trialItem && trialSecondsLeft > 0 && (
          <TrialBanner
            key="trial-banner"
            item={trialItem}
            secondsLeft={trialSecondsLeft}
            onBuy={handleBuyFromTrial}
            onDiscard={handleDiscardTrial}
          />
        )}
      </AnimatePresence>

      {/* ── Trial expired modal (Background only) ── */}
      <AnimatePresence>
        {expiredItem && (
          <TrialExpiredModal
            key="trial-expired"
            item={expiredItem}
            onBuy={handleBuyExpired}
            onDismiss={() => setExpiredItem(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePanel === "image" && (
          <BackgroundPickerPanel
            key="bg-panel"
            currentBgId={currentBg.id}
            onSelect={bg => { setCurrentBg(bg); saveNow(); }}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "widget" && (
          <WidgetPickerPanel
            key="widget-panel"
            activeWidgets={space.activeWidgets}
            onToggle={id => { space.toggleWidget(id); saveNow(); }}
            onAddStickyNote={() => { space.addStickyNote(); setActivePanel(null); saveNow(); }}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "sticker" && (
          <StickerPickerPanel
            key="sticker-panel"
            onPlace={src => { space.placeSticker(src); saveNow(); }}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "theme" && (
          <ThemeStorePanel
            key="theme-panel"
            onClose={() => { setActivePanel(null); setBuyItemId(undefined); }}
            coinBalance={coinBalance}
            onCoinBalanceChange={onCoinBalanceChange}
            onStartTrial={handleStartTrial}
            onTrialEnd={handleTrialEnd}
            onApplyItem={handleApplyItem}
            trialItemId={trialItem?.id}
            initialDetailItemId={buyItemId}
          />
        )}
        {activePanel === "ambient" && (
          <AmbientSoundPanel
            key="ambient-panel"
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "effects" && (
          <EffectsPanel
            key="effects-panel"
            activeEffect={activeEffect}
            onSelect={v => { setActiveEffect(v); saveNow(); }}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "settings" && (
          <SettingsPanel
            key="settings-panel"
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "room" && (
          <RoomManagerPanel
            key="room-panel"
            currentRoomId={roomId}
            onSelect={handleRoomSelect}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "pomodoro-stats" && (
          <PomodoroStatsPanel
            key="pomodoro-stats-panel"
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "quest" && (
          <QuestPanel
            key="quest-panel"
            onClose={() => setActivePanel(null)}
            onBalanceChange={onCoinBalanceChange}
            currentCoinBalance={coinBalance}
          />
        )}
        {aboutOpen && (
          <AboutModal
            key="about-modal"
            onClose={() => setAboutOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
