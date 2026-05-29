import type { BackgroundItem } from "../app/components/StudySpace/types";

const UNSPLASH_KEY =
  (import.meta as ImportMeta & { env?: { VITE_UNSPLASH_ACCESS_KEY?: string } }).env
    ?.VITE_UNSPLASH_ACCESS_KEY ?? "";
const PER_PAGE = 12;

interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string };
  alt_description: string | null;
  description: string | null;
  user: { name: string; links: { html: string } };
  links: { download_location: string };
}

function mapPhoto(p: UnsplashPhoto): BackgroundItem {
  return {
    id: p.id,
    url: p.urls.regular,
    thumb: p.urls.small,
    label: p.alt_description || p.description || "Untitled",
    photographer: p.user.name,
    photographerUrl: `${p.user.links.html}?utm_source=aesthetic_space&utm_medium=referral`,
    downloadLocation: p.links.download_location,
  };
}

export function hasUnsplashKey(): boolean {
  return !!UNSPLASH_KEY;
}

/** Required by Unsplash API guidelines when a user selects a photo */
export function triggerUnsplashDownload(downloadLocation: string | undefined): void {
  if (!downloadLocation || !UNSPLASH_KEY) return;
  fetch(`${downloadLocation}?client_id=${UNSPLASH_KEY}`).catch(() => {});
}

export async function searchUnsplash(
  query: string,
  page: number,
  perPage = PER_PAGE,
): Promise<{ items: BackgroundItem[]; totalPages: number }> {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } },
  );
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return {
    items: (data.results as UnsplashPhoto[]).map(mapPhoto),
    totalPages: data.total_pages as number,
  };
}
