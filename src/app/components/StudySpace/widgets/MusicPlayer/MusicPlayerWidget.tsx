import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle } from "lucide-react";
import type { MusicSource } from "../../constants";
import { loadYouTubeApi, parseYouTubeUrl } from "../../../../../services/youtube.service";
import { buildScWidgetSrc } from "../../../../../services/soundcloud.service";

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type LoopMode = "none" | "all" | "one";

/* ─────────────────────────── component ─────────────────────────── */

interface MusicPlayerProps {
  initialSource?: MusicSource;
  initialUrl?: string;
  onStateChange?: (source: MusicSource, activeUrl: string) => void;
}

export function MusicPlayerWidget({ initialSource, initialUrl, onStateChange }: MusicPlayerProps) {
  /* ── source & URL ── */
  const [source,    setSource]    = useState<MusicSource>(initialSource ?? "youtube");
  const [inputUrl,  setInputUrl]  = useState("");
  const [activeUrl, setActiveUrl] = useState(initialUrl ?? "");

  /* ── playback ── */
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [isLive,      setIsLive]      = useState(false);
  const [trackName,   setTrackName]   = useState("");
  const [artistName,  setArtistName]  = useState("");
  const [thumbUrl,    setThumbUrl]    = useState("");
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  /* ── controls ── */
  const [loopMode, setLoopMode] = useState<LoopMode>("none");
  const [shuffle,  setShuffle]  = useState(false);

  /* ── seek ── */
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [isSeeking,   setIsSeeking]   = useState(false);
  const [seekValue,   setSeekValue]   = useState(0);

  /* ── refs ── */
  const ytContainerRef  = useRef<HTMLDivElement>(null);
  const ytPlayerRef     = useRef<any>(null);
  const scIframeRef     = useRef<HTMLIFrameElement>(null);
  const scWidgetRef     = useRef<any>(null);
  const scTimeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSeekingRef       = useRef(false);
  const loopModeRef        = useRef<LoopMode>("none");
  const shuffleRef         = useRef(false);
  const autoplayOnReadyRef = useRef(false);
  const [scKey, setScKey] = useState(0);

  /* keep refs in sync */
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);
  useEffect(() => { shuffleRef.current  = shuffle;   }, [shuffle]);
  useEffect(() => { isSeekingRef.current = isSeeking; }, [isSeeking]);

  /* ─── seek polling ─── */
  useEffect(() => {
    if (seekIntervalRef.current) { clearInterval(seekIntervalRef.current); seekIntervalRef.current = null; }
    if (!isPlaying) return;

    seekIntervalRef.current = setInterval(() => {
      if (isSeekingRef.current) return;
      if (source === "youtube" && ytPlayerRef.current) {
        try {
          const ct    = ytPlayerRef.current.getCurrentTime?.() ?? 0;
          const dur   = ytPlayerRef.current.getDuration?.()    ?? 0;
          const state = ytPlayerRef.current.getPlayerState?.() ?? -1;
          setCurrentTime(ct);
          if (dur > 0) setDuration(dur);
          /* detect live stream */
          const live = ytPlayerRef.current.getVideoData?.()?.isLive === true || dur > 86400;
          setIsLive(live);
          /* fallback: catch ENDED state in case onStateChange missed it */
          if (state === 0 && loopModeRef.current === "one") {
            const vid = ytPlayerRef.current.getVideoData?.()?.video_id;
            if (vid) ytPlayerRef.current.loadVideoById({ videoId: vid, startSeconds: 0 });
            else { ytPlayerRef.current.seekTo(0, true); ytPlayerRef.current.playVideo(); }
          }
        } catch {}
      } else if (source === "soundcloud" && scWidgetRef.current) {
        scWidgetRef.current.getPosition((pos: number) => {
          if (!isSeekingRef.current) setCurrentTime(pos / 1000);
        });
        scWidgetRef.current.getDuration((dur: number) => {
          if (dur > 0) setDuration(dur / 1000);
        });
      }
    }, 500);

    return () => { if (seekIntervalRef.current) { clearInterval(seekIntervalRef.current); seekIntervalRef.current = null; } };
  }, [isPlaying, source]);

  /* ─── apply loop + shuffle to YT player ─── */
  useEffect(() => {
    if (source !== "youtube" || !playerReady) return;
    try { ytPlayerRef.current?.setLoop?.(loopMode === "all"); } catch {}
  }, [loopMode, source, playerReady]);

  useEffect(() => {
    if (source !== "youtube" || !playerReady) return;
    try { ytPlayerRef.current?.setShuffle?.(shuffle); } catch {}
  }, [shuffle, source, playerReady]);

  /* ─── YouTube player init ─── */
  useEffect(() => {
    if (source !== "youtube") return;
    if (!activeUrl) return;
    setPlayerReady(false);
    setPlayerError(null);
    setCurrentTime(0);
    setDuration(0);

    const parsed = parseYouTubeUrl(activeUrl);
    if (!parsed) { setPlayerError("Invalid YouTube URL"); return; }

    let destroyed = false;

    loadYouTubeApi().then(() => {
      if (destroyed || !ytContainerRef.current) return;
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;

      const playerVars: Record<string, any> = {
        autoplay: 0, controls: 0, enablejsapi: 1,
        origin: window.location.origin,
      };
      if (parsed.playlistId) {
        playerVars.listType = "playlist";
        playerVars.list     = parsed.playlistId;
      }

      const playerConfig: Record<string, any> = {
        height: "1", width: "1",
        playerVars,
        events: {},
      };
      /* Only pass videoId when we actually have one — passing undefined causes "Invalid video id" */
      if (parsed.videoId) playerConfig.videoId = parsed.videoId;

      playerConfig.events = {
          onReady: (e: any) => {
            if (destroyed) return;
            setPlayerReady(true);
            if (loopModeRef.current === "all") try { e.target.setLoop?.(true); } catch {}
            if (shuffleRef.current)           try { e.target.setShuffle?.(true); } catch {}
            const data = e.target.getVideoData?.();
            if (data?.title)  setTrackName(data.title);
            if (data?.author) setArtistName(data.author);
            const vid = parsed.videoId ?? data?.video_id;
            if (vid) setThumbUrl(`https://img.youtube.com/vi/${vid}/mqdefault.jpg`);
            if (autoplayOnReadyRef.current) {
              autoplayOnReadyRef.current = false;
              try { e.target.playVideo(); } catch {}
            }
          },
          onStateChange: (e: any) => {
            if (destroyed) return;
            const YT = (window as any).YT;
            /* loop one: replay on end */
            if (e.data === YT.PlayerState.ENDED && loopModeRef.current === "one") {
              const idx = e.target.getPlaylistIndex?.() ?? -1;
              if (idx >= 0) {
                /* playlist: slight delay so YouTube's auto-advance doesn't race-win */
                setTimeout(() => { try { e.target.playVideoAt(idx); } catch {} }, 80);
              } else {
                /* single video: loadVideoById is more reliable than seekTo+play after ENDED */
                const vid = e.target.getVideoData?.()?.video_id;
                if (vid) {
                  e.target.loadVideoById({ videoId: vid, startSeconds: 0 });
                } else {
                  e.target.seekTo(0, true);
                  e.target.playVideo();
                }
              }
              return;
            }
            const playing = e.data === YT.PlayerState.PLAYING;
            setIsPlaying(playing);
            if (playing) {
              const data = e.target.getVideoData?.();
              if (data?.title)    setTrackName(data.title);
              if (data?.author)   setArtistName(data.author);
              if (data?.video_id) setThumbUrl(`https://img.youtube.com/vi/${data.video_id}/mqdefault.jpg`);
              const dur = e.target.getDuration?.() ?? 0;
              if (dur > 0) setDuration(dur);
              setIsLive(data?.isLive === true || dur > 86400);
            }
          },
          onError: () => {
            if (destroyed) return;
            setPlayerError("Playback error — try another URL or preset");
            setIsPlaying(false);
          },
      };

      ytPlayerRef.current = new (window as any).YT.Player(ytContainerRef.current, playerConfig);
    });

    return () => { destroyed = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, activeUrl]);

  /* ─── SoundCloud widget init ─── */
  const initScWidget = useCallback(() => {
    if (!scIframeRef.current || !(window as any).SC) return;
    const SC = (window as any).SC;
    const widget = SC.Widget(scIframeRef.current);
    scWidgetRef.current = widget;

    if (scTimeoutRef.current) clearTimeout(scTimeoutRef.current);
    scTimeoutRef.current = setTimeout(() => {
      setPlayerError("Could not connect to SoundCloud — try another URL");
    }, 8000);

    widget.bind(SC.Widget.Events.READY, () => {
      if (scTimeoutRef.current) clearTimeout(scTimeoutRef.current);
      setPlayerReady(true);
      setPlayerError(null);
      widget.getCurrentSound((sound: any) => {
        if (sound?.title) setTrackName(sound.title.split(" - ")[0]);
      });
      if (autoplayOnReadyRef.current) {
        autoplayOnReadyRef.current = false;
        try { widget.play(); } catch {}
      }
    });
    widget.bind(SC.Widget.Events.PLAY, () => {
      setIsPlaying(true);
      widget.getCurrentSound((sound: any) => {
        if (sound?.title)          setTrackName(sound.title.split(" - ")[0]);
        if (sound?.user?.username) setArtistName(sound.user.username);
        if (sound?.artwork_url)    setThumbUrl(sound.artwork_url.replace("-large", "-t300x300"));
      });
    });
    widget.bind(SC.Widget.Events.PAUSE,  () => setIsPlaying(false));
    widget.bind(SC.Widget.Events.FINISH, () => {
      if (loopModeRef.current === "one") { widget.seekTo(0); widget.play(); return; }
      setIsPlaying(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (source !== "soundcloud") return;
    setPlayerReady(false);
    setPlayerError(null);
    setCurrentTime(0);
    setDuration(0);

    const existing = document.querySelector('script[src="https://w.soundcloud.com/player/api.js"]');
    if (existing) {
      const check = setInterval(() => {
        if ((window as any).SC) { clearInterval(check); initScWidget(); }
      }, 100);
      return () => clearInterval(check);
    }
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.onload = initScWidget;
    document.head.appendChild(script);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, scKey]);

  /* ─── cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;
      if (scTimeoutRef.current)    clearTimeout(scTimeoutRef.current);
      if (seekIntervalRef.current) clearInterval(seekIntervalRef.current);
    };
  }, []);

  /* ─── handlers ─── */
  const handlePlayPause = () => {
    if (!playerReady) return;
    if (source === "youtube") isPlaying ? ytPlayerRef.current?.pauseVideo() : ytPlayerRef.current?.playVideo();
    else scWidgetRef.current?.toggle();
  };
  const handleNext = () => { if (source === "youtube") ytPlayerRef.current?.nextVideo(); else scWidgetRef.current?.next(); };
  const handlePrev = () => { if (source === "youtube") ytPlayerRef.current?.previousVideo(); else scWidgetRef.current?.prev(); };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSeekValue(val);
    setIsSeeking(true);
  };
  const handleSeekCommit = (val: number) => {
    setCurrentTime(val);
    setIsSeeking(false);
    if (source === "youtube") ytPlayerRef.current?.seekTo?.(val, true);
    else scWidgetRef.current?.seekTo?.(val * 1000);
  };

  const handleLoopToggle = () => {
    setLoopMode(m => m === "none" ? "all" : m === "all" ? "one" : "none");
  };
  const handleShuffleToggle = () => setShuffle(v => !v);

  const stopAndReset = () => {
    if (source === "youtube") ytPlayerRef.current?.pauseVideo();
    else scWidgetRef.current?.pause();
    setIsPlaying(false);
    setIsLive(false);
    setPlayerReady(false);
    setPlayerError(null);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleSourceSwitch = (next: MusicSource) => {
    if (next === source) return;
    stopAndReset();
    setTrackName("");
    setArtistName("");
    setThumbUrl("");
    setActiveUrl("");
    setInputUrl("");
    setSource(next);
    if (next === "soundcloud") setScKey(k => k + 1);
    onStateChange?.(next, "");
  };

  const handleUrlSubmit = () => {
    const raw = inputUrl.trim();
    if (!raw) return;
    if (source === "youtube" && !parseYouTubeUrl(raw)) { setPlayerError("Invalid YouTube URL"); return; }
    if (source === "soundcloud" && !raw.includes("soundcloud.com")) { setPlayerError("Invalid SoundCloud URL"); return; }
    stopAndReset();
    autoplayOnReadyRef.current = true;
    setTrackName("Loading…");
    setArtistName("");
    setActiveUrl(raw);
    setInputUrl("");
    if (source === "soundcloud") setScKey(k => k + 1);
    onStateChange?.(source, raw);
  };

  /* ─── derived ─── */
  const progress  = duration > 0 ? ((isSeeking ? seekValue : currentTime) / duration) * 100 : 0;
  const accentBtn = (active: boolean) => ({
    color: active ? "var(--accent)" : "rgba(255,255,255,0.38)",
    transition: "color 0.15s",
  });

  /* ─────────────────────────── render ─────────────────────────── */
  return (
    <Box style={{
      background: "rgba(var(--widget-bg-rgb), 0.78)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      border: "1px solid rgba(var(--accent-rgb), 0.18)",
      borderRadius: "16px",
      padding: "14px 14px 16px",
      position: "relative",
    }}>
      {/* seek bar thumb style */}
      <style>{`
        .music-seek::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 11px; height: 11px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
          transition: transform 0.15s;
        }
        .music-seek::-webkit-slider-thumb:hover { transform: scale(1.3); }
        .music-seek::-moz-range-thumb {
          width: 11px; height: 11px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: none;
        }
      `}</style>

      {/* hidden YouTube container — always in DOM */}
      <div ref={ytContainerRef} style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", pointerEvents: "none" }} />

      {/* hidden SoundCloud iframe */}
      {source === "soundcloud" && activeUrl && (
        <iframe key={scKey} ref={scIframeRef} allow="autoplay" src={buildScWidgetSrc(activeUrl)} title="SoundCloud Player"
          style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", border: "none", pointerEvents: "none" }} />
      )}

      {/* ── Tab switcher ── */}
      <Flex mb="10px" style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "10px",
        padding: "2px",
      }}>
        {(["youtube", "soundcloud"] as MusicSource[]).map(s => (
          <Box key={s} as="button" flex={1} onClick={() => handleSourceSwitch(s)}
            bg="transparent" border="none" cursor="pointer"
            style={{
              padding: "5px 0", borderRadius: "8px",
              fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif",
              transition: "all 0.2s",
              background: source === s ? "rgba(255,255,255,0.13)" : "transparent",
              color: source === s ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.35)",
              boxShadow: source === s ? "inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
            }}>
            {s === "youtube" ? "YouTube" : "SoundCloud"}
          </Box>
        ))}
      </Flex>

      {/* ── URL input (always visible) ── */}
      <Flex gap="6px" align="center" mb="10px">
        <input
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleUrlSubmit(); }}
          placeholder={source === "youtube" ? "youtube.com/watch?v=… or playlist" : "soundcloud.com/…"}
          style={{
            flex: 1, minWidth: 0,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px",
            padding: "5px 9px", fontSize: "0.72rem",
            color: "rgba(255,255,255,0.85)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
            outline: "none",
          }}
        />
        <Box as="button" onClick={handleUrlSubmit}
          bg="transparent" border="none" cursor="pointer"
          display="flex" alignItems="center" justifyContent="center"
          w="28px" h="28px" borderRadius="8px" flexShrink={0}
          style={{ background: "rgba(var(--accent-rgb), 0.85)", color: "#fff", transition: "opacity 0.15s" }}
          _hover={{ opacity: 0.85 }}>
          <Play size={11} fill="currentColor" />
        </Box>
      </Flex>

      {/* ── Error state ── */}
      {playerError && (
        <Box mb="8px" style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "8px", padding: "5px 10px",
          fontSize: "0.68rem", color: "rgba(239,68,68,0.8)",
          fontFamily: "'HarmonyOS Sans', sans-serif", lineHeight: 1.4,
        }}>
          {playerError}
        </Box>
      )}

      {!activeUrl ? (
        /* ── Empty state ── */
        <Flex direction="column" align="center" justify="center" py="20px" gap="6px">
          <Text style={{
            color: "rgba(255,255,255,0.22)", fontSize: "0.75rem",
            fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center", lineHeight: 1.5,
          }}>
            Dán link bài hát hoặc playlist
          </Text>
          <Text style={{
            color: "rgba(255,255,255,0.13)", fontSize: "0.67rem",
            fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center",
          }}>
            YouTube · YouTube Music · SoundCloud
          </Text>
        </Flex>
      ) : (
        <>
          {/* ── Album art (centered, large) ── */}
          <Flex justify="center" mb="10px" mt="4px">
            <Box
              w="84px" h="84px" borderRadius="12px"
              style={{
                ...(thumbUrl
                  ? { backgroundImage: `url(${thumbUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { backgroundColor: "rgba(255,255,255,0.06)" }
                ),
                boxShadow: "0 6px 20px rgba(0,0,0,0.55)",
                flexShrink: 0,
              }}
            />
          </Flex>

          {/* ── Track name + artist (centered) ── */}
          <Box textAlign="center" mb="10px">
            <Text style={{
              color: "rgba(255,255,255,0.9)", fontSize: "0.85rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              marginBottom: "3px",
            }}>
              {trackName}
            </Text>
            <Text style={{
              color: "rgba(255,255,255,0.38)", fontSize: "0.7rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {!playerReady ? "Loading…" : artistName || "—"}
            </Text>
          </Box>
        </>
      )}

      {/* ── Seek bar / LIVE badge (hidden when no URL) ── */}
      {activeUrl && isLive ? (
        <Flex justify="center" align="center" mb="2px" py="5px">
          <Box style={{
            background: "rgba(239,68,68,0.13)",
            border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: "5px",
            padding: "2px 8px",
            fontSize: "0.64rem",
            fontWeight: 700,
            letterSpacing: "0.09em",
            color: "rgba(239,68,68,0.95)",
            fontFamily: "'HarmonyOS Sans', sans-serif",
          }}>
            ● LIVE
          </Box>
        </Flex>
      ) : (
        <Box mb="2px">
          <input
            type="range"
            className="music-seek"
            min={0}
            max={duration || 100}
            step={0.5}
            value={isSeeking ? seekValue : currentTime}
            onChange={handleSeekChange}
            onMouseUp={(e) => handleSeekCommit(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => handleSeekCommit(Number((e.target as HTMLInputElement).value))}
            style={{
              width: "100%", height: 3, borderRadius: 4,
              appearance: "none", WebkitAppearance: "none",
              background: `linear-gradient(to right, var(--accent) ${progress}%, rgba(255,255,255,0.15) ${progress}%)`,
              outline: "none",
              cursor: duration > 0 ? "pointer" : "default",
              opacity: duration > 0 ? 1 : 0.35,
            }}
          />
          <Flex justify="space-between" mt="3px">
            <Text style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {formatTime(isSeeking ? seekValue : currentTime)}
            </Text>
            <Text style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {formatTime(duration)}
            </Text>
          </Flex>
        </Box>
      )}

      {/* ── Controls (centered, hidden when no URL) ── */}
      {activeUrl && <Flex align="center" justify="center" gap="14px" mt="6px">
        {/* Shuffle */}
        <Box as="button" onClick={handleShuffleToggle}
          bg="transparent" border="none"
          cursor={source === "youtube" ? "pointer" : "default"}
          display="flex" alignItems="center"
          title={source === "soundcloud" ? "Shuffle (YouTube only)" : undefined}
          style={{ ...accentBtn(shuffle && source === "youtube"), opacity: source === "soundcloud" ? 0.3 : 1 }}>
          <Shuffle size={14} />
        </Box>

        {/* Prev */}
        <Box as="button" onClick={handlePrev} bg="transparent" border="none" cursor="pointer"
          display="flex" alignItems="center"
          style={{ color: "rgba(255,255,255,0.55)", transition: "color 0.15s" }}
          _hover={{ color: "rgba(255,255,255,0.9)" }}>
          <SkipBack size={16} />
        </Box>

        {/* Play / Pause */}
        <Box as="button" onClick={handlePlayPause}
          bg="transparent" border="none"
          cursor={playerReady ? "pointer" : "default"}
          display="flex" alignItems="center" justifyContent="center"
          w="34px" h="34px" borderRadius="full"
          style={{
            background: isPlaying ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)",
            color: "white",
            transition: "transform 0.15s, background 0.15s",
            opacity: playerReady ? 1 : 0.4,
          }}
          _hover={playerReady ? { transform: "scale(1.1)", background: "rgba(255,255,255,0.22)" } as any : {}}>
          {isPlaying ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
        </Box>

        {/* Next */}
        <Box as="button" onClick={handleNext} bg="transparent" border="none" cursor="pointer"
          display="flex" alignItems="center"
          style={{ color: "rgba(255,255,255,0.55)", transition: "color 0.15s" }}
          _hover={{ color: "rgba(255,255,255,0.9)" }}>
          <SkipForward size={16} />
        </Box>

        {/* Loop */}
        <Box as="button" onClick={handleLoopToggle}
          bg="transparent" border="none" cursor="pointer"
          display="flex" alignItems="center"
          title={loopMode === "none" ? "Loop off" : loopMode === "all" ? "Loop playlist" : "Loop track"}
          style={accentBtn(loopMode !== "none")}>
          {loopMode === "one" ? <Repeat1 size={14} /> : <Repeat size={14} />}
        </Box>
      </Flex>}
    </Box>
  );
}
