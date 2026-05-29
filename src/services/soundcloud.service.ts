/** SoundCloud widget requires slashes un-encoded — only the colon is encoded */
export function buildScWidgetSrc(trackUrl: string): string {
  const encoded = encodeURIComponent(trackUrl).replace(/%2F/gi, "/");
  return `https://w.soundcloud.com/player/?url=${encoded}&color=%234e7c6a&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
}
