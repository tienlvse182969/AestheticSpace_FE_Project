import { useState, useEffect, useCallback } from "react";
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
import type { StudySpaceCtx }    from "../../../hooks/studyspace/useStudySpace";
import type { StoreItem }        from "../../../../services/aestheticStore.service";

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

  const [trialItem, setTrialItem]           = useState<StoreItem | null>(null);
  const [trialSecondsLeft, setTrialSecondsLeft] = useState(0);
  // ID to auto-open detail view when navigating to store from trial banner
  const [buyItemId, setBuyItemId]           = useState<string | undefined>(undefined);

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
    if (trialItem && trialSecondsLeft === 0) {
      setTrialItem(null);
    }
  }, [trialItem, trialSecondsLeft]);

  const handleStartTrial = useCallback((item: StoreItem) => {
    setTrialItem(item);
    setTrialSecondsLeft(TRIAL_DURATION);
    setBuyItemId(undefined);
  }, []);

  const handleDiscardTrial = useCallback(() => {
    setTrialItem(null);
    setTrialSecondsLeft(0);
    setBuyItemId(undefined);
  }, []);

  const handleBuyFromTrial = useCallback(() => {
    if (trialItem) setBuyItemId(trialItem.id);
    setActivePanel("theme");
  }, [trialItem, setActivePanel]);

  const handleTrialEnd = useCallback(() => {
    setTrialItem(null);
    setTrialSecondsLeft(0);
    setBuyItemId(undefined);
  }, []);

  return (
    <div className="no-capture">
      {/* ── Trial banner (lives outside panel so it persists when store is closed) ── */}
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
