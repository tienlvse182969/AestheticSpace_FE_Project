import { useState, useCallback, useRef, useEffect } from "react";

export interface AmbientSoundEntry {
  id: string;
  url: string;
  volume: number;
}

export function useAmbientSound() {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [volumeMap, setVolumeMap] = useState<Record<string, number>>({});

  const audioMapRef   = useRef<Map<string, HTMLAudioElement>>(new Map());
  const urlMapRef     = useRef<Map<string, string>>(new Map());
  const activeIdsRef  = useRef<Set<string>>(new Set());
  const volumeRef     = useRef<Record<string, number>>({});
  // Sounds that were blocked by browser autoplay policy — retried on next user gesture
  const pendingPlayRef = useRef<Set<string>>(new Set());

  // Cleanup all audio when the workspace unmounts (not on panel close)
  useEffect(() => {
    return () => {
      audioMapRef.current.forEach(audio => { audio.pause(); audio.src = ""; });
      audioMapRef.current.clear();
    };
  }, []);

  const tryResumePending = useCallback(() => {
    if (pendingPlayRef.current.size === 0) return;
    pendingPlayRef.current.forEach(id => {
      const audio = audioMapRef.current.get(id);
      if (audio && activeIdsRef.current.has(id)) {
        audio.play().catch(() => {});
      }
    });
    pendingPlayRef.current.clear();
  }, []);

  // Resume any autoplay-blocked sounds on next user interaction.
  // Use pointerdown (not click) so drag interactions also count.
  // Use capture phase so stopPropagation() deep in the tree doesn't block us.
  useEffect(() => {
    const events = ["pointerdown", "keydown"] as const;
    events.forEach(e => document.addEventListener(e, tryResumePending, true));
    return () => { events.forEach(e => document.removeEventListener(e, tryResumePending, true)); };
  }, [tryResumePending]);

  const toggle = useCallback((id: string, url: string, defaultVolume = 50) => {
    urlMapRef.current.set(id, url);
    const isOn = activeIdsRef.current.has(id);
    if (isOn) {
      activeIdsRef.current.delete(id);
      pendingPlayRef.current.delete(id);
      const audio = audioMapRef.current.get(id);
      if (audio) audio.pause();
    } else {
      activeIdsRef.current.add(id);
      let audio = audioMapRef.current.get(id);
      if (!audio) {
        audio = new Audio(url);
        audio.loop = true;
        audioMapRef.current.set(id, audio);
      }
      audio.volume = (volumeRef.current[id] ?? defaultVolume) / 100;
      audio.play().catch(() => {});
    }
    setActiveIds(new Set(activeIdsRef.current));
  }, []);

  const setVol = useCallback((id: string, val: number) => {
    volumeRef.current[id] = val;
    setVolumeMap(prev => ({ ...prev, [id]: val }));
    const audio = audioMapRef.current.get(id);
    if (audio) audio.volume = val / 100;
  }, []);

  const initVolume = useCallback((id: string, defaultVol: number) => {
    if (id in volumeRef.current) return;
    volumeRef.current[id] = defaultVol;
    setVolumeMap(prev => (id in prev ? prev : { ...prev, [id]: defaultVol }));
  }, []);

  const restoreAmbient = useCallback((sounds: AmbientSoundEntry[]) => {
    audioMapRef.current.forEach(audio => { audio.pause(); audio.src = ""; });
    audioMapRef.current.clear();
    urlMapRef.current.clear();
    activeIdsRef.current.clear();
    pendingPlayRef.current.clear();

    const newVolumeMap: Record<string, number> = {};
    sounds.forEach(({ id, url, volume }) => {
      urlMapRef.current.set(id, url);
      activeIdsRef.current.add(id);
      newVolumeMap[id] = volume;
      volumeRef.current[id] = volume;
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = volume / 100;
      audioMapRef.current.set(id, audio);
      audio.play().catch(() => {
        // Browser blocked autoplay — will retry on next user interaction
        pendingPlayRef.current.add(id);
      });
    });

    setActiveIds(new Set(activeIdsRef.current));
    setVolumeMap(newVolumeMap);
  }, []);

  // Stable serializer — reads only refs, no reactive deps needed
  const getActiveSoundsForSave = useCallback((): AmbientSoundEntry[] => {
    return Array.from(activeIdsRef.current)
      .map(id => ({
        id,
        url: urlMapRef.current.get(id) ?? "",
        volume: volumeRef.current[id] ?? 50,
      }))
      .filter(s => s.url !== "");
  }, []);

  return { activeIds, volumeMap, toggle, setVol, initVolume, restoreAmbient, getActiveSoundsForSave, tryResumePending };
}
