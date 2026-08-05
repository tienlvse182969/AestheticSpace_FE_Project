import { useRef, useState } from "react";

export function useGoogleCalendarSettings() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [maxEvents, setMaxEvents]       = useState(5);
  const [showAllDay, setShowAllDay]     = useState(true);
  const containerRef                    = useRef<HTMLDivElement>(null);

  return {
    settingsOpen, setSettingsOpen,
    maxEvents, setMaxEvents,
    showAllDay, setShowAllDay,
    containerRef,
  };
}
