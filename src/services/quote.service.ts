export interface BilingualQuote {
  textEn: string;
  textVi: string;
  author: string;
}

const CACHE_KEY = "aesthetic_quote";
const INTERVAL_MS = 30 * 60 * 1000;

interface CacheEntry {
  fetchedAt: number;
  quote: BilingualQuote;
}

async function translateToVi(text: string): Promise<string> {
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`,
  );
  if (!res.ok) return text;
  const data = (await res.json()) as { responseData?: { translatedText?: string } };
  return data.responseData?.translatedText ?? text;
}

export async function fetchQuote(): Promise<BilingualQuote> {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const entry: CacheEntry = JSON.parse(cached);
      if (Date.now() - entry.fetchedAt < INTERVAL_MS) return entry.quote;
    } catch {
      // ignore malformed cache
    }
  }

  const res = await fetch("https://corsproxy.io/?https://zenquotes.io/api/random");
  if (!res.ok) throw new Error(`Quote fetch failed: ${res.status}`);
  const data = (await res.json()) as [{ q: string; a: string }];
  const { q, a } = data[0];

  const textVi = await translateToVi(q);
  const quote: BilingualQuote = { textEn: q, textVi, author: a };

  localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), quote }));
  return quote;
}
