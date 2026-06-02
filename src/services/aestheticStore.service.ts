// TODO: Replace mock data with actual API calls when backend is ready
// Expected endpoints:
//   GET    /store/items              → StoreItem[]
//   POST   /store/items/:id/purchase → { newBalance: number }

export type StoreItemType = "theme" | "sticker-pack" | "wallpaper" | "sound-pack" | "effect-pack";
export type StoreItemSource = "official" | "community";

export interface StoreIncludes {
  wallpaper?: boolean;
  stickerCount?: number;
  soundCount?: number;
  hasEffect?: boolean;
  widgetStyle?: boolean;
}

export interface StoreItem {
  id: string;
  type: StoreItemType;
  name: string;
  description: string;
  thumbnail: string;
  previewImages?: string[];
  price: number; // coins, 0 = free
  source: StoreItemSource;
  creatorName: string;
  tags: string[];
  includes?: StoreIncludes;
  rating: number; // 1–5
  downloads: number;
  isFeatured?: boolean;
  accentColor?: string;
  isPurchased: boolean;
  createdAt: string;
}

export interface PurchaseResult {
  newBalance: number;
}

type RawItem = Omit<StoreItem, "isPurchased">;

const MOCK_ITEMS: RawItem[] = [
  // ── Official Themes ──────────────────────────────────────────────────────
  {
    id: "theme-lofi-night",
    type: "theme",
    name: "Lofi Night",
    description: "A moody dark theme inspired by late-night lofi sessions. Deep purples and soft glows create the perfect focus atmosphere.",
    thumbnail: "https://picsum.photos/seed/lofi-night/400/240",
    previewImages: [
      "https://picsum.photos/seed/lofi-night-2/400/240",
      "https://picsum.photos/seed/lofi-night-3/400/240",
      "https://picsum.photos/seed/lofi-night-4/400/240",
    ],
    price: 8000,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["lofi", "night", "dark", "purple"],
    includes: { wallpaper: true, stickerCount: 14, soundCount: 3, hasEffect: true, widgetStyle: true },
    rating: 4.9,
    downloads: 2847,
    isFeatured: true,
    accentColor: "#8b5cf6",
    createdAt: "2025-12-01T00:00:00Z",
  },
  {
    id: "theme-cottagecore",
    type: "theme",
    name: "Cottagecore",
    description: "Soft greens and warm browns bring the charm of a countryside cottage to your study space. Cozy and calming.",
    thumbnail: "https://picsum.photos/seed/cottagecore/400/240",
    previewImages: [
      "https://picsum.photos/seed/cottagecore-2/400/240",
      "https://picsum.photos/seed/cottagecore-3/400/240",
      "https://picsum.photos/seed/cottagecore-4/400/240",
    ],
    price: 6000,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["cottagecore", "nature", "green", "cozy"],
    includes: { wallpaper: true, stickerCount: 12, soundCount: 2, hasEffect: true },
    rating: 4.7,
    downloads: 1932,
    accentColor: "#84cc16",
    createdAt: "2025-12-15T00:00:00Z",
  },
  {
    id: "theme-tokyo-rain",
    type: "theme",
    name: "Tokyo Rain",
    description: "Neon-lit streets and rainy nights. A cyberpunk-inspired theme that blends electric blues and magentas for night owls.",
    thumbnail: "https://picsum.photos/seed/tokyo-rain/400/240",
    previewImages: [
      "https://picsum.photos/seed/tokyo-rain-2/400/240",
      "https://picsum.photos/seed/tokyo-rain-3/400/240",
      "https://picsum.photos/seed/tokyo-rain-4/400/240",
    ],
    price: 8000,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["tokyo", "rain", "neon", "cyberpunk"],
    includes: { wallpaper: true, stickerCount: 10, soundCount: 3, hasEffect: true, widgetStyle: true },
    rating: 4.8,
    downloads: 3201,
    isFeatured: true,
    accentColor: "#06b6d4",
    createdAt: "2026-01-05T00:00:00Z",
  },
  {
    id: "theme-sakura-dreams",
    type: "theme",
    name: "Sakura Dreams",
    description: "Delicate cherry blossoms and soft pinks create a serene Japanese-inspired space. Perfect for mindful study.",
    thumbnail: "https://picsum.photos/seed/sakura-dreams/400/240",
    previewImages: [
      "https://picsum.photos/seed/sakura-dreams-2/400/240",
      "https://picsum.photos/seed/sakura-dreams-3/400/240",
      "https://picsum.photos/seed/sakura-dreams-4/400/240",
    ],
    price: 6000,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["sakura", "japanese", "pink", "spring"],
    includes: { wallpaper: true, stickerCount: 15, soundCount: 2, hasEffect: true },
    rating: 4.6,
    downloads: 1547,
    accentColor: "#f472b6",
    createdAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "theme-ocean-depths",
    type: "theme",
    name: "Ocean Depths",
    description: "Dive into deep cerulean blues and soft aquas. A calming oceanic theme for long study sessions.",
    thumbnail: "https://picsum.photos/seed/ocean-depths/400/240",
    previewImages: [
      "https://picsum.photos/seed/ocean-depths-2/400/240",
      "https://picsum.photos/seed/ocean-depths-3/400/240",
      "https://picsum.photos/seed/ocean-depths-4/400/240",
    ],
    price: 5000,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["ocean", "blue", "calm", "water"],
    includes: { wallpaper: true, stickerCount: 8, soundCount: 3 },
    rating: 4.5,
    downloads: 1088,
    accentColor: "#0ea5e9",
    createdAt: "2026-02-01T00:00:00Z",
  },

  // ── Community Themes ──────────────────────────────────────────────────────
  {
    id: "theme-forest-meditation",
    type: "theme",
    name: "Forest Meditation",
    description: "Inspired by a quiet forest morning. Earthy tones and organic textures bring peace to your workspace.",
    thumbnail: "https://picsum.photos/seed/forest-meditation/400/240",
    previewImages: [
      "https://picsum.photos/seed/forest-meditation-2/400/240",
      "https://picsum.photos/seed/forest-meditation-3/400/240",
    ],
    price: 3000,
    source: "community",
    creatorName: "tranminhkhoa_dev",
    tags: ["forest", "green", "earthy", "calm"],
    includes: { wallpaper: true, stickerCount: 6, soundCount: 1 },
    rating: 4.3,
    downloads: 412,
    accentColor: "#22c55e",
    createdAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "theme-retro-arcade",
    type: "theme",
    name: "Retro Arcade",
    description: "80s pixel vibes with bright primary colors and retro grid patterns. Gameify your study sessions!",
    thumbnail: "https://picsum.photos/seed/retro-arcade/400/240",
    previewImages: [
      "https://picsum.photos/seed/retro-arcade-2/400/240",
      "https://picsum.photos/seed/retro-arcade-3/400/240",
    ],
    price: 4000,
    source: "community",
    creatorName: "pixel_vu",
    tags: ["retro", "pixel", "arcade", "80s"],
    includes: { wallpaper: true, stickerCount: 10, soundCount: 1, hasEffect: true },
    rating: 4.4,
    downloads: 683,
    accentColor: "#f59e0b",
    createdAt: "2026-02-18T00:00:00Z",
  },
  {
    id: "theme-arctic-minimal",
    type: "theme",
    name: "Arctic Minimal",
    description: "Clean whites and icy blues for a distraction-free, minimalist study environment. Crisp and focused.",
    thumbnail: "https://picsum.photos/seed/arctic-minimal/400/240",
    previewImages: [
      "https://picsum.photos/seed/arctic-minimal-2/400/240",
      "https://picsum.photos/seed/arctic-minimal-3/400/240",
    ],
    price: 2500,
    source: "community",
    creatorName: "nguyenlinh.design",
    tags: ["minimal", "white", "clean", "arctic"],
    includes: { wallpaper: true, stickerCount: 4 },
    rating: 4.1,
    downloads: 298,
    accentColor: "#7dd3fc",
    createdAt: "2026-03-01T00:00:00Z",
  },

  // ── Official Sticker Packs ────────────────────────────────────────────────
  {
    id: "sticker-kawaii-study",
    type: "sticker-pack",
    name: "Kawaii Study Set",
    description: "Adorable hand-drawn study companions: coffee cups, books, little foxes and more. 16 unique stickers.",
    thumbnail: "https://picsum.photos/seed/kawaii-study/400/240",
    previewImages: ["https://picsum.photos/seed/kawaii-study-2/400/240", "https://picsum.photos/seed/kawaii-study-3/400/240"],
    price: 2000,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["kawaii", "cute", "study", "pastel"],
    includes: { stickerCount: 16 },
    rating: 4.8,
    downloads: 2103,
    accentColor: "#fb7185",
    createdAt: "2025-12-05T00:00:00Z",
  },
  {
    id: "sticker-celestial",
    type: "sticker-pack",
    name: "Celestial Dreams",
    description: "Stars, moons, planets and cosmic wonders. 14 celestial stickers to decorate your space.",
    thumbnail: "https://picsum.photos/seed/celestial-dreams/400/240",
    previewImages: ["https://picsum.photos/seed/celestial-dreams-2/400/240", "https://picsum.photos/seed/celestial-dreams-3/400/240"],
    price: 2500,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["space", "stars", "moon", "celestial"],
    includes: { stickerCount: 14 },
    rating: 4.6,
    downloads: 1456,
    accentColor: "#a78bfa",
    createdAt: "2026-01-10T00:00:00Z",
  },

  // ── Community Sticker Pack ────────────────────────────────────────────────
  {
    id: "sticker-lofi-chars",
    type: "sticker-pack",
    name: "Lo-fi Characters",
    description: "Chill lo-fi anime-style characters: reading, sleeping, studying. 10 expressive stickers.",
    thumbnail: "https://picsum.photos/seed/lofi-chars/400/240",
    previewImages: ["https://picsum.photos/seed/lofi-chars-2/400/240", "https://picsum.photos/seed/lofi-chars-3/400/240"],
    price: 1500,
    source: "community",
    creatorName: "anhnghia.art",
    tags: ["lofi", "anime", "characters", "chill"],
    includes: { stickerCount: 10 },
    rating: 4.5,
    downloads: 734,
    accentColor: "#c084fc",
    createdAt: "2026-02-14T00:00:00Z",
  },

  // ── Official Wallpapers ───────────────────────────────────────────────────
  {
    id: "wallpaper-misty-mountains",
    type: "wallpaper",
    name: "Misty Mountains",
    description: "Serene mountain peaks shrouded in morning mist. A peaceful landscape for deep focus.",
    thumbnail: "https://picsum.photos/seed/misty-mountains/400/240",
    previewImages: ["https://picsum.photos/seed/misty-mountains-2/400/240", "https://picsum.photos/seed/misty-mountains-3/400/240"],
    price: 1000,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["mountains", "misty", "landscape", "calm"],
    includes: { wallpaper: true },
    rating: 4.4,
    downloads: 891,
    accentColor: "#94a3b8",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "wallpaper-neon-city",
    type: "wallpaper",
    name: "Neon City Nights",
    description: "A vibrant neon cityscape at midnight. Energizing and atmospheric for late-night sessions.",
    thumbnail: "https://picsum.photos/seed/neon-city/400/240",
    previewImages: ["https://picsum.photos/seed/neon-city-2/400/240", "https://picsum.photos/seed/neon-city-3/400/240"],
    price: 1500,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["city", "neon", "night", "urban"],
    includes: { wallpaper: true },
    rating: 4.6,
    downloads: 1123,
    accentColor: "#ec4899",
    createdAt: "2026-01-25T00:00:00Z",
  },

  // ── Community Wallpaper ───────────────────────────────────────────────────
  {
    id: "wallpaper-cherry-path",
    type: "wallpaper",
    name: "Cherry Blossom Path",
    description: "A winding path beneath cherry blossom trees in full bloom. Warm, soft and beautiful.",
    thumbnail: "https://picsum.photos/seed/cherry-path/400/240",
    previewImages: ["https://picsum.photos/seed/cherry-path-2/400/240"],
    price: 800,
    source: "community",
    creatorName: "bichtram.photo",
    tags: ["cherry", "spring", "path", "pink"],
    includes: { wallpaper: true },
    rating: 4.3,
    downloads: 445,
    accentColor: "#fda4af",
    createdAt: "2026-03-05T00:00:00Z",
  },

  // ── Official Sound Packs ──────────────────────────────────────────────────
  {
    id: "sound-coffee-shop",
    type: "sound-pack",
    name: "Coffee Shop Vibes",
    description: "Warm espresso machine sounds, soft chatter and jazzy background music. The perfect cafe ambiance.",
    thumbnail: "https://picsum.photos/seed/coffee-shop/400/240",
    previewImages: ["https://picsum.photos/seed/coffee-shop-2/400/240", "https://picsum.photos/seed/coffee-shop-3/400/240"],
    price: 1500,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["cafe", "coffee", "jazz", "warm"],
    includes: { soundCount: 4 },
    rating: 4.7,
    downloads: 1789,
    accentColor: "#92400e",
    createdAt: "2025-12-20T00:00:00Z",
  },
  {
    id: "sound-rainy-library",
    type: "sound-pack",
    name: "Rainy Library",
    description: "Soft rainfall, turning pages and the quiet hush of a cozy library on a rainy day.",
    thumbnail: "https://picsum.photos/seed/rainy-library/400/240",
    previewImages: ["https://picsum.photos/seed/rainy-library-2/400/240", "https://picsum.photos/seed/rainy-library-3/400/240"],
    price: 1500,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["rain", "library", "books", "cozy"],
    includes: { soundCount: 3 },
    rating: 4.8,
    downloads: 2034,
    accentColor: "#4b5563",
    createdAt: "2026-01-08T00:00:00Z",
  },

  // ── Official Effect Packs ─────────────────────────────────────────────────
  {
    id: "effect-cherry-blossom",
    type: "effect-pack",
    name: "Cherry Blossoms",
    description: "Gentle cherry blossom petals drifting across your screen. Beautiful and soothing.",
    thumbnail: "https://picsum.photos/seed/blossom-fall/400/240",
    previewImages: ["https://picsum.photos/seed/blossom-fall-2/400/240", "https://picsum.photos/seed/blossom-fall-3/400/240"],
    price: 2000,
    source: "official",
    creatorName: "Aesthetic Space Team",
    tags: ["cherry", "petals", "spring", "gentle"],
    includes: { hasEffect: true },
    rating: 4.9,
    downloads: 2567,
    isFeatured: true,
    accentColor: "#fb7185",
    createdAt: "2026-01-30T00:00:00Z",
  },

  // ── Community Effect Pack ─────────────────────────────────────────────────
  {
    id: "effect-firefly-garden",
    type: "effect-pack",
    name: "Firefly Garden",
    description: "Tiny glowing fireflies drifting through your space at night. Magical and mesmerizing.",
    thumbnail: "https://picsum.photos/seed/firefly-garden/400/240",
    previewImages: ["https://picsum.photos/seed/firefly-garden-2/400/240", "https://picsum.photos/seed/firefly-garden-3/400/240"],
    price: 1800,
    source: "community",
    creatorName: "vinhtrung.creative",
    tags: ["firefly", "night", "glow", "magical"],
    includes: { hasEffect: true },
    rating: 4.4,
    downloads: 387,
    accentColor: "#facc15",
    createdAt: "2026-02-25T00:00:00Z",
  },
];

// In-memory purchased set — persists for the browser session
let purchasedIds = new Set<string>(["theme-ocean-depths", "sticker-kawaii-study"]);

export const aestheticStoreService = {
  getItems: async (): Promise<StoreItem[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return MOCK_ITEMS.map((item) => ({ ...item, isPurchased: purchasedIds.has(item.id) }));
  },

  purchase: async (itemId: string, currentBalance: number): Promise<PurchaseResult> => {
    await new Promise((res) => setTimeout(res, 300));
    const item = MOCK_ITEMS.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found");
    if (purchasedIds.has(itemId)) throw new Error("Already purchased");
    if (currentBalance < item.price) throw new Error("Insufficient coins");
    purchasedIds.add(itemId);
    return { newBalance: currentBalance - item.price };
  },
};
