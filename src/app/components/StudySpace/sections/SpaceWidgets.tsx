import { AnimatePresence } from "motion/react";
import { Box } from "@chakra-ui/react";
import { Settings } from "lucide-react";
import { DraggableWidget }       from "../ui/DraggableWidget";
import { DraggableSticker }      from "../ui/DraggableSticker";
import { StickyNoteWidget }      from "../widgets/StickyNote/StickyNoteWidget";
import { WorldClockInstance }    from "../widgets/WorldClock/WorldClockInstance";
import { DeadlineInstance }      from "../widgets/Deadline/DeadlineInstance";
import { MusicPlayerWidget }     from "../widgets/MusicPlayer/MusicPlayerWidget";
import { PomodoroWidget }        from "../widgets/Pomodoro/PomodoroWidget";
import { PomodoroSettingsPanel } from "../widgets/Pomodoro/PomodoroSettingsPanel";
import { TodoListWidget }        from "../widgets/TodoList/TodoListWidget";
import { ClockWidget }           from "../widgets/Clock/ClockWidget";
import { ClockSettingsPanel }    from "../widgets/Clock/ClockSettingsPanel";
import { QuoteWidget }           from "../widgets/Quote/QuoteWidget";
import { PhotoFrameWidget }        from "../widgets/PhotoFrame/PhotoFrameWidget";
import { PhotoFrameSettingsPanel } from "../widgets/PhotoFrame/PhotoFrameSettingsPanel";
import { WellnessWidget }          from "../widgets/Wellness/WellnessWidget";
import { WellnessSettingsPanel }   from "../widgets/Wellness/WellnessSettingsPanel";
import { DoodleWidget }            from "../widgets/Doodle/DoodleWidget";
import { GoogleCalendarWidget }        from "../widgets/GoogleCalendar/GoogleCalendarWidget";
import { GoogleCalendarSettingsPanel } from "../widgets/GoogleCalendar/GoogleCalendarSettingsPanel";
import type { StudySpaceCtx }    from "../../../hooks/studyspace/useStudySpace";

interface Props { ctx: StudySpaceCtx; }

export function SpaceWidgets({ ctx }: Props) {
  const {
    space, clock, pomodoro, photoFrame, wellness, doodle, googleCalendar, saveNow, WIDGET_POSITIONS, layoutLocked,
    musicSource, musicYtUrl, musicScUrl, setMusicSource, setMusicYtUrl, setMusicScUrl,
    setActivePanel, setSettingsInitialNav,
  } = ctx;

  return (
    <>
      {/* ── Active Widgets ── */}
      <AnimatePresence>
        {space.activeWidgets.has("music") && (
          <DraggableWidget
            key="music"
            width={300}
            initialX={space.widgetPositions["music"]?.x ?? WIDGET_POSITIONS.music.x}
            initialY={space.widgetPositions["music"]?.y ?? WIDGET_POSITIONS.music.y}
            onRemove={() => { space.removeWidget("music"); saveNow(); }}
            onDragEnd={(x, y) => { space.setWidgetPosition("music", { x, y }); saveNow(); }}
            locked={layoutLocked}
          >
            <MusicPlayerWidget
              initialSource={musicSource}
              initialYtUrl={musicYtUrl}
              initialScUrl={musicScUrl}
              onStateChange={(src, ytUrl, scUrl) => { setMusicSource(src); setMusicYtUrl(ytUrl); setMusicScUrl(scUrl); saveNow(); }}
            />
          </DraggableWidget>
        )}

        {space.activeWidgets.has("pomodoro") && (
          <DraggableWidget
            key="pomodoro"
            initialX={space.widgetPositions["pomodoro"]?.x ?? WIDGET_POSITIONS.pomodoro.x}
            initialY={space.widgetPositions["pomodoro"]?.y ?? WIDGET_POSITIONS.pomodoro.y}
            containerRef={pomodoro.containerRef}
            onRemove={() => { space.removeWidget("pomodoro"); pomodoro.setSettingsOpen(false); saveNow(); }}
            onDragEnd={(x, y) => { space.setWidgetPosition("pomodoro", { x, y }); saveNow(); }}
            locked={layoutLocked}
            extraControls={
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); pomodoro.setSettingsOpen(v => !v); }}
                display="flex" alignItems="center" justifyContent="center"
                w="18px" h="18px" borderRadius="full" border="none" cursor="pointer"
                style={{
                  background: pomodoro.settingsOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                  color:      pomodoro.settingsOpen ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
                  transition: "all 0.15s",
                }}
                title="Pomodoro settings"
              >
                <Settings size={10} />
              </Box>
            }
            floatingPanel={
              <PomodoroSettingsPanel
                show={pomodoro.settingsOpen}
                containerRef={pomodoro.containerRef}
                focusMinutes={pomodoro.focusMin}
                breakMinutes={pomodoro.breakMin}
                totalSessions={pomodoro.totalSes}
                onFocusMinutes={v => { pomodoro.setFocusMin(v); saveNow(); }}
                onBreakMinutes={v => { pomodoro.setBreakMin(v); saveNow(); }}
                onTotalSessions={v => { pomodoro.setTotalSes(v); saveNow(); }}
                onOpenSoundSettings={() => {
                  pomodoro.setSettingsOpen(false);
                  setSettingsInitialNav("sounds");
                  setActivePanel("settings");
                }}
                onClose={() => pomodoro.setSettingsOpen(false)}
              />
            }
          >
            <PomodoroWidget
              focusMinutes={pomodoro.focusMin}
              breakMinutes={pomodoro.breakMin}
              totalSessions={pomodoro.totalSes}
              soundEnabled={pomodoro.soundEnabled}
              sounds={pomodoro.sounds}
              volume={pomodoro.volume}
            />
          </DraggableWidget>
        )}

        {space.activeWidgets.has("todo") && (
          <DraggableWidget
            key="todo"
            initialX={space.widgetPositions["todo"]?.x ?? WIDGET_POSITIONS.todo.x}
            initialY={space.widgetPositions["todo"]?.y ?? WIDGET_POSITIONS.todo.y}
            onRemove={() => { space.removeWidget("todo"); saveNow(); }}
            onDragEnd={(x, y) => { space.setWidgetPosition("todo", { x, y }); saveNow(); }}
            locked={layoutLocked}
          >
            <TodoListWidget
              todos={space.todoItems}
              onTodosChange={space.setTodoItems}
            />
          </DraggableWidget>
        )}

        {space.activeWidgets.has("clock") && (
          <DraggableWidget
            key="clock"
            initialX={space.widgetPositions["clock"]?.x ?? WIDGET_POSITIONS.clock.x}
            initialY={space.widgetPositions["clock"]?.y ?? WIDGET_POSITIONS.clock.y}
            containerRef={clock.containerRef}
            onRemove={() => { space.removeWidget("clock"); clock.setSettingsOpen(false); saveNow(); }}
            onDragEnd={(x, y) => { space.setWidgetPosition("clock", { x, y }); saveNow(); }}
            locked={layoutLocked}
            extraControls={
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); clock.setSettingsOpen(v => !v); }}
                display="flex" alignItems="center" justifyContent="center"
                w="18px" h="18px" borderRadius="full" border="none" cursor="pointer"
                style={{
                  background: clock.settingsOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                  color:      clock.settingsOpen ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
                  transition: "all 0.15s",
                }}
                title="Clock settings"
              >
                <Settings size={10} />
              </Box>
            }
            floatingPanel={
              <ClockSettingsPanel
                show={clock.settingsOpen}
                containerRef={clock.containerRef}
                mode={clock.mode}
                layout={clock.layout}
                showSeconds={clock.showSeconds}
                showLunar={clock.showLunar}
                showDate={clock.showDate}
                onMode={v => { clock.setMode(v); saveNow(); }}
                onLayout={v => { clock.setLayout(v); saveNow(); }}
                onShowSeconds={v => { clock.setShowSeconds(v); saveNow(); }}
                onShowLunar={v => { clock.setShowLunar(v); saveNow(); }}
                onShowDate={v => { clock.setShowDate(v); saveNow(); }}
                onClose={() => clock.setSettingsOpen(false)}
              />
            }
          >
            <ClockWidget
              mode={clock.mode}
              layout={clock.layout}
              showSeconds={clock.showSeconds}
              showLunar={clock.showLunar}
              showDate={clock.showDate}
            />
          </DraggableWidget>
        )}

        {space.activeWidgets.has("photoFrame") && (
          <DraggableWidget
            key="photoFrame"
            width={220}
            initialX={space.widgetPositions["photoFrame"]?.x ?? WIDGET_POSITIONS.photoFrame.x}
            initialY={space.widgetPositions["photoFrame"]?.y ?? WIDGET_POSITIONS.photoFrame.y}
            containerRef={photoFrame.containerRef}
            onRemove={() => { space.removeWidget("photoFrame"); photoFrame.setSettingsOpen(false); saveNow(); }}
            onDragEnd={(x, y) => { space.setWidgetPosition("photoFrame", { x, y }); saveNow(); }}
            locked={layoutLocked}
            extraControls={
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); photoFrame.setSettingsOpen(v => !v); }}
                display="flex" alignItems="center" justifyContent="center"
                w="18px" h="18px" borderRadius="full" border="none" cursor="pointer"
                style={{
                  background: photoFrame.settingsOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                  color:      photoFrame.settingsOpen ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
                  transition: "all 0.15s",
                }}
                title="Photo frame settings"
              >
                <Settings size={10} />
              </Box>
            }
            floatingPanel={
              <PhotoFrameSettingsPanel
                show={photoFrame.settingsOpen}
                containerRef={photoFrame.containerRef}
                images={photoFrame.images}
                intervalSec={photoFrame.intervalSec}
                transition={photoFrame.transition}
                shuffle={photoFrame.shuffle}
                maxPhotos={photoFrame.maxPhotos}
                onAddImage={url => { photoFrame.addImage(url); saveNow(); }}
                onRemoveImage={url => { photoFrame.removeImage(url); saveNow(); }}
                onIntervalSec={v => { photoFrame.setIntervalSec(v); saveNow(); }}
                onTransition={v => { photoFrame.setTransition(v); saveNow(); }}
                onShuffle={v => { photoFrame.setShuffle(v); saveNow(); }}
                onClose={() => photoFrame.setSettingsOpen(false)}
              />
            }
          >
            <PhotoFrameWidget
              images={photoFrame.images}
              intervalSec={photoFrame.intervalSec}
              transition={photoFrame.transition}
              shuffle={photoFrame.shuffle}
            />
          </DraggableWidget>
        )}

        {space.activeWidgets.has("wellness") && (
          <DraggableWidget
            key="wellness"
            width={200}
            initialX={space.widgetPositions["wellness"]?.x ?? WIDGET_POSITIONS.wellness.x}
            initialY={space.widgetPositions["wellness"]?.y ?? WIDGET_POSITIONS.wellness.y}
            containerRef={wellness.containerRef}
            onRemove={() => { space.removeWidget("wellness"); wellness.setSettingsOpen(false); saveNow(); }}
            onDragEnd={(x, y) => { space.setWidgetPosition("wellness", { x, y }); saveNow(); }}
            locked={layoutLocked}
            extraControls={
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); wellness.setSettingsOpen(v => !v); }}
                display="flex" alignItems="center" justifyContent="center"
                w="18px" h="18px" borderRadius="full" border="none" cursor="pointer"
                style={{
                  background: wellness.settingsOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                  color:      wellness.settingsOpen ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
                  transition: "all 0.15s",
                }}
                title="Wellness settings"
              >
                <Settings size={10} />
              </Box>
            }
            floatingPanel={
              <WellnessSettingsPanel
                show={wellness.settingsOpen}
                containerRef={wellness.containerRef}
                pattern={wellness.pattern}
                cycleCount={wellness.cycleCount}
                onPattern={v => { wellness.setPattern(v); saveNow(); }}
                onCycleCount={v => { wellness.setCycleCount(v); saveNow(); }}
                onClose={() => wellness.setSettingsOpen(false)}
              />
            }
          >
            <WellnessWidget
              activeTab={wellness.activeTab}
              onActiveTab={v => { wellness.setActiveTab(v); saveNow(); }}
              pattern={wellness.pattern}
              cycleCount={wellness.cycleCount}
              waterEnabled={wellness.waterEnabled}
              waterIntervalMin={wellness.waterIntervalMin}
              eyeRestEnabled={wellness.eyeRestEnabled}
              eyeRestIntervalMin={wellness.eyeRestIntervalMin}
              onWaterEnabled={v => { wellness.setWaterEnabled(v); saveNow(); }}
              onWaterIntervalMin={v => { wellness.setWaterIntervalMin(v); saveNow(); }}
              onEyeRestEnabled={v => { wellness.setEyeRestEnabled(v); saveNow(); }}
              onEyeRestIntervalMin={v => { wellness.setEyeRestIntervalMin(v); saveNow(); }}
            />
          </DraggableWidget>
        )}

        {space.activeWidgets.has("doodle") && (
          <DraggableWidget
            key="doodle"
            width={236}
            initialX={space.widgetPositions["doodle"]?.x ?? WIDGET_POSITIONS.doodle.x}
            initialY={space.widgetPositions["doodle"]?.y ?? WIDGET_POSITIONS.doodle.y}
            onRemove={() => { space.removeWidget("doodle"); saveNow(); }}
            onDragEnd={(x, y) => { space.setWidgetPosition("doodle", { x, y }); saveNow(); }}
            locked={layoutLocked}
          >
            <DoodleWidget
              strokes={doodle.strokes}
              brushColor={doodle.brushColor}
              brushWidth={doodle.brushWidth}
              onAddStroke={s => { doodle.addStroke(s); saveNow(); }}
              onClearAll={() => { doodle.clearAll(); saveNow(); }}
              onBrushColor={doodle.setBrushColor}
              onBrushWidth={doodle.setBrushWidth}
            />
          </DraggableWidget>
        )}

        {space.activeWidgets.has("googleCalendar") && (
          <DraggableWidget
            key="googleCalendar"
            width={210}
            initialX={space.widgetPositions["googleCalendar"]?.x ?? WIDGET_POSITIONS.googleCalendar.x}
            initialY={space.widgetPositions["googleCalendar"]?.y ?? WIDGET_POSITIONS.googleCalendar.y}
            containerRef={googleCalendar.containerRef}
            onRemove={() => { space.removeWidget("googleCalendar"); googleCalendar.setSettingsOpen(false); saveNow(); }}
            onDragEnd={(x, y) => { space.setWidgetPosition("googleCalendar", { x, y }); saveNow(); }}
            locked={layoutLocked}
            extraControls={
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); googleCalendar.setSettingsOpen(v => !v); }}
                display="flex" alignItems="center" justifyContent="center"
                w="18px" h="18px" borderRadius="full" border="none" cursor="pointer"
                style={{
                  background: googleCalendar.settingsOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                  color:      googleCalendar.settingsOpen ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
                  transition: "all 0.15s",
                }}
                title="Calendar settings"
              >
                <Settings size={10} />
              </Box>
            }
            floatingPanel={
              <GoogleCalendarSettingsPanel
                show={googleCalendar.settingsOpen}
                containerRef={googleCalendar.containerRef}
                maxEvents={googleCalendar.maxEvents}
                showAllDay={googleCalendar.showAllDay}
                onMaxEvents={v => { googleCalendar.setMaxEvents(v); saveNow(); }}
                onShowAllDay={v => { googleCalendar.setShowAllDay(v); saveNow(); }}
                onClose={() => googleCalendar.setSettingsOpen(false)}
              />
            }
          >
            <GoogleCalendarWidget maxEvents={googleCalendar.maxEvents} showAllDay={googleCalendar.showAllDay} />
          </DraggableWidget>
        )}

        {space.activeWidgets.has("quote") && (
          <DraggableWidget
            key="quote"
            initialX={space.widgetPositions["quote"]?.x ?? WIDGET_POSITIONS.quote.x}
            initialY={space.widgetPositions["quote"]?.y ?? WIDGET_POSITIONS.quote.y}
            onRemove={() => { space.removeWidget("quote"); saveNow(); }}
            onDragEnd={(x, y) => { space.setWidgetPosition("quote", { x, y }); saveNow(); }}
            locked={layoutLocked}
          >
            <QuoteWidget />
          </DraggableWidget>
        )}
      </AnimatePresence>

      {/* ── Placed Stickers ── */}
      <AnimatePresence>
        {space.placedStickers.map(s => (
          <DraggableSticker
            key={s.id}
            sticker={s}
            onRemove={() => { space.removeSticker(s.id); saveNow(); }}
            onDragEnd={(x, y) => { space.updateSticker(s.id, { x, y }); saveNow(); }}
            locked={layoutLocked}
          />
        ))}
      </AnimatePresence>

      {/* ── Sticky Notes ── */}
      <AnimatePresence>
        {space.stickyNotes.map(note => (
          <StickyNoteWidget
            key={note.id}
            note={note}
            onRemove={() => { space.removeStickyNote(note.id); saveNow(); }}
            onUpdate={patch => {
              space.updateStickyNote(note.id, patch);
              if ("x" in patch || "y" in patch || "color" in patch || "w" in patch || "h" in patch) saveNow();
            }}
            onSave={saveNow}
            locked={layoutLocked}
          />
        ))}
      </AnimatePresence>

      {/* ── World Clocks ── */}
      <AnimatePresence>
        {space.worldClocks.map(item => (
          <WorldClockInstance
            key={item.id}
            item={item}
            onRemove={() => { space.removeWorldClock(item.id); saveNow(); }}
            onUpdate={patch => { space.updateWorldClock(item.id, patch); saveNow(); }}
            locked={layoutLocked}
          />
        ))}
      </AnimatePresence>

      {/* ── Deadlines / Countdowns ── */}
      <AnimatePresence>
        {space.deadlines.map(item => (
          <DeadlineInstance
            key={item.id}
            item={item}
            onRemove={() => { space.removeDeadline(item.id); saveNow(); }}
            onUpdate={patch => { space.updateDeadline(item.id, patch); saveNow(); }}
            locked={layoutLocked}
          />
        ))}
      </AnimatePresence>
    </>
  );
}
