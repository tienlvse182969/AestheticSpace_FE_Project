import quotesRaw from "../data/quotes.json";

export interface BilingualQuote {
  textEn: string;
  textVi: string;
  author: string;
}

const CACHE_KEY    = "aesthetic_quote";
const INTERVAL_MS  = 30 * 60 * 1000;

interface CacheEntry {
  fetchedAt: number;
  quote: BilingualQuote;
}

const quotes = quotesRaw as BilingualQuote[];

export async function fetchQuote(force = false): Promise<BilingualQuote> {
  if (!force) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const entry: CacheEntry = JSON.parse(cached);
        if (Date.now() - entry.fetchedAt < INTERVAL_MS) return entry.quote;
      } catch {
        // ignore malformed cache
      }
    }
  }

  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), quote }));
  return quote;
}
