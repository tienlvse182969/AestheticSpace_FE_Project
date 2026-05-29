export function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).YT?.Player) { resolve(); return; }
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) {
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
      return;
    }
    (window as any).onYouTubeIframeAPIReady = resolve;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

export function parseYouTubeUrl(
  url: string,
): { videoId: string | null; playlistId: string | null } | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace("www.", "");
    if (host === "youtu.be") {
      return { videoId: u.pathname.slice(1) || null, playlistId: u.searchParams.get("list") };
    }
    if (host === "youtube.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") {
        return { videoId: u.searchParams.get("v"), playlistId: u.searchParams.get("list") };
      }
      if (u.pathname.startsWith("/playlist")) {
        return { videoId: null, playlistId: u.searchParams.get("list") };
      }
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts") {
        return { videoId: parts[1] ?? null, playlistId: null };
      }
    }
    return null;
  } catch { return null; }
}
