import { AnimatePresence } from "motion/react";
import { BackgroundPickerPanel } from "../panels/BackgroundPickerPanel";
import { WidgetPickerPanel }     from "../panels/WidgetPickerPanel";
import { StickerPickerPanel }    from "../panels/StickerPickerPanel";
import { ThemeStorePanel }       from "../panels/ThemeStorePanel";
import { AmbientSoundPanel }     from "../panels/AmbientSoundPanel";
import { EffectsPanel }          from "../panels/EffectsPanel";
import { SettingsPanel }         from "../panels/SettingsPanel";
import { RoomManagerPanel }      from "../panels/RoomManagerPanel";
import { AboutModal }            from "../ui/AboutModal";
import type { StudySpaceCtx }    from "../../../hooks/studyspace/useStudySpace";

interface Props { ctx: StudySpaceCtx; }

export function SpacePanels({ ctx }: Props) {
  const {
    activePanel, setActivePanel,
    currentBg, setCurrentBg,
    activeEffect, setActiveEffect,
    roomId, handleRoomSelect,
    aboutOpen, setAboutOpen,
    space, saveNow,
  } = ctx;

  return (
    <div className="no-capture">
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
            onClose={() => setActivePanel(null)}
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
