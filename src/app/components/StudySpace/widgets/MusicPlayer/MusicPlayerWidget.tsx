import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { RAINY_ART, SC_SRC, TRACK_NAMES } from "../../constants";

export function MusicPlayerWidget() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState("Rainy Night");
  const [trackIdx, setTrackIdx] = useState(0);
  const [ready, setReady] = useState(false);

  const initWidget = useCallback(() => {
    if (!iframeRef.current || !(window as any).SC) return;
    const SC = (window as any).SC;
    const widget = SC.Widget(iframeRef.current);
    widgetRef.current = widget;
    widget.bind(SC.Widget.Events.READY, () => {
      setReady(true);
      widget.getCurrentSound((sound: any) => { if (sound?.title) setTrackName(sound.title); });
    });
    widget.bind(SC.Widget.Events.PLAY, () => {
      setIsPlaying(true);
      widget.getCurrentSound((sound: any) => { if (sound?.title) setTrackName(sound.title.split(" - ")[0]); });
    });
    widget.bind(SC.Widget.Events.PAUSE, () => setIsPlaying(false));
    widget.bind(SC.Widget.Events.FINISH, () => { setIsPlaying(false); setTrackIdx((i) => i + 1); });
  }, []);

  useEffect(() => {
    const existing = document.querySelector('script[src="https://w.soundcloud.com/player/api.js"]');
    if (existing) {
      const check = setInterval(() => { if ((window as any).SC) { clearInterval(check); initWidget(); } }, 100);
      return () => clearInterval(check);
    }
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.onload = initWidget;
    document.head.appendChild(script);
  }, [initWidget]);

  const displayName = trackName || TRACK_NAMES[trackIdx % TRACK_NAMES.length];

  return (
    <Box style={{ background: "rgba(var(--widget-bg-rgb), 0.78)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(var(--accent-rgb), 0.18)", borderRadius: "16px", padding: "14px 16px" }}>
      <iframe
        ref={iframeRef}
        allow="autoplay"
        src={SC_SRC}
        title="SoundCloud Player"
        style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", border: "none", pointerEvents: "none" }}
      />
      <Flex align="center" gap={3}>
        {/* Album art */}
        <Box w="56px" h="56px" borderRadius="10px" overflow="hidden" flexShrink={0}
          style={{ backgroundImage: `url(${RAINY_ART})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.5)" }}
        />
        <Box flex={1} minW={0}>
          <Text mb={1} style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.88rem", fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </Text>
          {!ready && (
            <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif", marginBottom: "6px" }}>
              Loading...
            </Text>
          )}
          <Flex align="center" gap={4} mt={2}>
            <Box as="button" onClick={() => widgetRef.current?.prev()} display="flex" alignItems="center" bg="transparent" border="none" cursor="pointer" style={{ color: "rgba(255,255,255,0.75)", transition: "color 0.15s" }} _hover={{ color: "white" }}>
              <SkipBack size={16} />
            </Box>
            <Box as="button" onClick={() => widgetRef.current?.toggle()} display="flex" alignItems="center" justifyContent="center" w="30px" h="30px" borderRadius="full" bg="transparent" border="none" cursor="pointer" style={{ color: "white", transition: "transform 0.15s" }} _hover={{ transform: "scale(1.15)" }}>
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </Box>
            <Box as="button" onClick={() => widgetRef.current?.next()} display="flex" alignItems="center" bg="transparent" border="none" cursor="pointer" style={{ color: "rgba(255,255,255,0.75)", transition: "color 0.15s" }} _hover={{ color: "white" }}>
              <SkipForward size={16} />
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}