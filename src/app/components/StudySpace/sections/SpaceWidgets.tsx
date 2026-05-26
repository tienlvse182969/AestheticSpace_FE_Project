import { AnimatePresence } from "motion/react";
import { Box } from "@chakra-ui/react";
import { Settings } from "lucide-react";
import { DraggableWidget }       from "../ui/DraggableWidget";
import { DraggableSticker }      from "../ui/DraggableSticker";
import { StickyNoteWidget }      from "../widgets/StickyNote/StickyNoteWidget";
import { MusicPlayerWidget }     from "../widgets/MusicPlayer/MusicPlayerWidget";
import { PomodoroWidget }        from "../widgets/Pomodoro/PomodoroWidget";
import { PomodoroSettingsPanel } from "../widgets/Pomodoro/PomodoroSettingsPanel";
import { TodoListWidget }        from "../widgets/TodoList/TodoListWidget";
import { ClockWidget }           from "../widgets/Clock/ClockWidget";
import { ClockSettingsPanel }    from "../widgets/Clock/ClockSettingsPanel";
import { QuoteWidget }           from "../widgets/Quote/QuoteWidget";
import type { StudySpaceCtx }    from "../../../hooks/studyspace/useStudySpace";

interface Props { ctx: StudySpaceCtx; }

export function SpaceWidgets({ ctx }: Props) {
  const { space, clock, pomodoro, saveNow, WIDGET_POSITIONS } = ctx;

  return (
    <>
      {/* ── Active Widgets ── */}
      <AnimatePresence>
        {space.activeWidgets.has("music") && (
          <DraggableWidget
            key="music"
            initialX={space.widgetPositions["music"]?.x ?? WIDGET_POSITIONS.music.x}
            initialY={space.widgetPositions["music"]?.y ?? WIDGET_POSITIONS.music.y}
            onRemove={() => { space.removeWidget("music"); saveNow(); }}
            onDragEnd={(x, y) => { space.setWidgetPosition("music", { x, y }); saveNow(); }}
          >
            <MusicPlayerWidget />
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
                onClose={() => pomodoro.setSettingsOpen(false)}
              />
            }
          >
            <PomodoroWidget
              focusMinutes={pomodoro.focusMin}
              breakMinutes={pomodoro.breakMin}
              totalSessions={pomodoro.totalSes}
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

        {space.activeWidgets.has("quote") && (
          <DraggableWidget
            key="quote"
            initialX={space.widgetPositions["quote"]?.x ?? WIDGET_POSITIONS.quote.x}
            initialY={space.widgetPositions["quote"]?.y ?? WIDGET_POSITIONS.quote.y}
            onRemove={() => { space.removeWidget("quote"); saveNow(); }}
            onDragEnd={(x, y) => { space.setWidgetPosition("quote", { x, y }); saveNow(); }}
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
          />
        ))}
      </AnimatePresence>
    </>
  );
}
