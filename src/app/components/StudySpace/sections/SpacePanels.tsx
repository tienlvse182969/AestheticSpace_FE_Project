import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { BackgroundPickerPanel } from "../panels/BackgroundPickerPanel";
import { WidgetPickerPanel }     from "../panels/WidgetPickerPanel";
import { StickerPickerPanel }    from "../panels/StickerPickerPanel";
import { ThemeStorePanel, type ThemeApplyExtras } from "../panels/ThemeStorePanel";
import { AmbientSoundPanel }     from "../panels/AmbientSoundPanel";
import { EffectsPanel }          from "../panels/EffectsPanel";
import { SettingsPanel }         from "../panels/SettingsPanel";
import { RoomManagerPanel }      from "../panels/RoomManagerPanel";
import { PomodoroStatsPanel }    from "../panels/PomodoroStatsPanel";
import { QuestPanel }            from "../panels/QuestPanel";
import { CreateThemePanel }      from "../panels/CreateThemePanel";
import { TrialBanner }           from "../ui/TrialBanner";
import { TrialExpiredModal }     from "../ui/TrialExpiredModal";
import type { StudySpaceCtx }    from "../../../hooks/studyspace/useStudySpace";
import type { StoreItem }        from "../../../../services/aestheticStore.service";
import type { BackgroundItem }   from "../types";
import type { UserThemeSubmission } from "../../../../services/userTheme.service";

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
    space, saveNow,
    ambient,
  } = ctx;

  const [trialItem, setTrialItem]               = useState<StoreItem | null>(null);
  const [trialSecondsLeft, setTrialSecondsLeft] = useState(0);
  const [expiredItem, setExpiredItem]           = useState<StoreItem | null>(null);
  const [buyItemId, setBuyItemId]               = useState<string | undefined>(undefined);
  const [editingTheme, setEditingTheme]         = useState<UserThemeSubmission | null>(null);

  const trialOriginalBgRef  = useRef<BackgroundItem | null>(null);
  const trialStickerIdRef   = useRef<string | null>(null);
  const trialAmbientRef     = useRef<{ id: string; url: string } | null>(null);

  const restoreOriginalBg = useCallback(() => {
    if (trialOriginalBgRef.current) {
      setCurrentBg(trialOriginalBgRef.current);
      trialOriginalBgRef.current = null;
    }
  }, [setCurrentBg]);

  const cleanupTrialEffects = useCallback(() => {
    if (trialStickerIdRef.current) {
      space.removeSticker(trialStickerIdRef.current);
      trialStickerIdRef.current = null;
    }
    if (trialAmbientRef.current) {
      ambient.stopSound(trialAmbientRef.current.id);
      trialAmbientRef.current = null;
    }
  }, [space, ambient]);

  // Safety net: if trial ends for any reason, always clean up sticker + ambient
  useEffect(() => {
    if (trialItem) return;
    cleanupTrialEffects();
  }, [trialItem]); // eslint-disable-line react-hooks/exhaustive-deps

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
    cleanupTrialEffects();
    if (trialItem.category === "Background" || trialItem.category === "Theme") {
      restoreOriginalBg();
      setExpiredItem(trialItem);
    }
    setTrialItem(null);
    setBuyItemId(undefined);
  }, [trialItem, trialSecondsLeft, restoreOriginalBg, cleanupTrialEffects]);

  const handleStartTrial = useCallback((
    item: StoreItem,
    trialBgUrl?: string,
    trialStickerUrl?: string,
    trialAmbientUrl?: string,
  ) => {
    setTrialItem(item);
    setTrialSecondsLeft(TRIAL_DURATION);
    setBuyItemId(undefined);

    const bgUrl = trialBgUrl ?? item.assetUrl;
    if (bgUrl) {
      trialOriginalBgRef.current = currentBg;
      setCurrentBg({ id: `trial-${item.id}`, url: bgUrl, thumb: bgUrl, label: item.name });
    }

    if (trialStickerUrl) {
      const stickerId = space.placeSticker(trialStickerUrl);
      trialStickerIdRef.current = stickerId;
    }

    if (trialAmbientUrl) {
      const ambientId = `trial-ambient-${item.id}`;
      trialAmbientRef.current = { id: ambientId, url: trialAmbientUrl };
      ambient.toggle(ambientId, trialAmbientUrl, 50);
    }
  }, [currentBg, setCurrentBg, space, ambient]);

  const handleDiscardTrial = useCallback(() => {
    cleanupTrialEffects();
    restoreOriginalBg();
    setTrialItem(null);
    setTrialSecondsLeft(0);
    setBuyItemId(undefined);
  }, [cleanupTrialEffects, restoreOriginalBg]);

  const handleBuyFromTrial = useCallback(() => {
    if (trialItem) setBuyItemId(trialItem.id);
    setActivePanel("theme");
  }, [trialItem, setActivePanel]);

  const handleTrialEnd = useCallback(() => {
    cleanupTrialEffects();
    restoreOriginalBg();
    setTrialItem(null);
    setTrialSecondsLeft(0);
    setBuyItemId(undefined);
  }, [cleanupTrialEffects, restoreOriginalBg]);

  const handleBuyExpired = useCallback(() => {
    if (expiredItem) setBuyItemId(expiredItem.id);
    setExpiredItem(null);
    setActivePanel("theme");
  }, [expiredItem, setActivePanel]);

  const handleApplyItem = useCallback((item: StoreItem, extras?: ThemeApplyExtras) => {
    if (item.category === "Background" && item.assetUrl) {
      setCurrentBg({ id: item.id, url: item.assetUrl, thumb: item.assetUrl, label: item.name });
      saveNow();
    } else if (item.category === "Sticker" && item.assetUrl) {
      space.placeSticker(item.assetUrl);
      saveNow();
    } else if (item.category === "Theme" && extras) {
      if (extras.bgId && extras.bgUrl) {
        setCurrentBg({ id: extras.bgId, url: extras.bgUrl, thumb: extras.bgUrl, label: item.name });
      }
      if (extras.stickerUrl) {
        space.placeSticker(extras.stickerUrl);
      }
      if (extras.ambientId && extras.ambientUrl) {
        ambient.toggle(extras.ambientId, extras.ambientUrl, 50);
      }
      saveNow();
    }
  }, [setCurrentBg, saveNow, space, ambient]);

  return (
    <div className="no-capture" onPointerDown={ambient.tryResumePending}>
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
            onOpenCreate={() => { setEditingTheme(null); setActivePanel("create-theme"); }}
            onOpenEdit={(theme) => { setEditingTheme(theme); setActivePanel("create-theme"); }}
          />
        )}
        {activePanel === "create-theme" && (
          <CreateThemePanel
            key={editingTheme?.id ?? "create-theme-panel"}
            initialTheme={editingTheme ?? undefined}
            onClose={() => { setEditingTheme(null); setActivePanel(null); }}
          />
        )}
        {activePanel === "ambient" && (
          <AmbientSoundPanel
            key="ambient-panel"
            onClose={() => setActivePanel(null)}
            activeIds={ambient.activeIds}
            volumeMap={ambient.volumeMap}
            onToggle={(id, url, defaultVolume) => { ambient.toggle(id, url, defaultVolume); saveNow(); }}
            onVolume={(id, val) => { ambient.setVol(id, val); saveNow(); }}
            onInitVolume={ambient.initVolume}
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
      </AnimatePresence>
    </div>
  );
}
