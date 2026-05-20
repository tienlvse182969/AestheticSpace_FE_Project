import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { SAMPLE_STICKERS } from "../StudySpace/constants";

interface AdminSticker {
  id: string;
  src: string;
  label: string;
  pack: string;
  active: boolean;
  uses: number;
}

const INITIAL_STICKERS: AdminSticker[] = [
  ...SAMPLE_STICKERS.map((s, i) => ({
    ...s,
    pack: "Default Pack",
    active: true,
    uses: [142, 87][i] ?? 0,
  })),
  { id: "star",    src: "https://em-content.zobj.net/source/apple/354/star_2b50.png",             label: "Gold Star",      pack: "Emoji Pack",   active: true,  uses: 234 },
  { id: "heart",   src: "https://em-content.zobj.net/source/apple/354/red-heart_2764-fe0f.png",   label: "Red Heart",      pack: "Emoji Pack",   active: true,  uses: 311 },
  { id: "flower",  src: "https://em-content.zobj.net/source/apple/354/cherry-blossom_1f338.png",  label: "Cherry Blossom", pack: "Nature Pack",  active: false, uses: 59  },
  { id: "moon",    src: "https://em-content.zobj.net/source/apple/354/crescent-moon_1f319.png",   label: "Crescent Moon",  pack: "Night Pack",   active: true,  uses: 178 },
  { id: "cloud",   src: "https://em-content.zobj.net/source/apple/354/cloud_2601-fe0f.png",       label: "Cloud",          pack: "Nature Pack",  active: true,  uses: 93  },
  { id: "coffee",  src: "https://em-content.zobj.net/source/apple/354/hot-beverage_2615.png",     label: "Hot Coffee",     pack: "Life Pack",    active: true,  uses: 267 },
];

const PACK_COLORS: Record<string, { color: string; bg: string }> = {
  "Default Pack": { color: "#4e7c6a", bg: "rgba(78,124,106,0.12)" },
  "Emoji Pack":   { color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  "Nature Pack":  { color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
  "Night Pack":   { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  "Life Pack":    { color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
};

export function StickersSection() {
  const [stickers, setStickers]   = useState<AdminSticker[]>(INITIAL_STICKERS);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletedId, setDeletedId] = useState<string | null>(null);

  const toggleActive = (id: string) =>
    setStickers(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));

  const handleDelete = (id: string) => {
    setDeletedId(id);
    setTimeout(() => {
      setStickers(prev => prev.filter(s => s.id !== id));
      setDeletedId(null);
    }, 300);
  };

  const packs = [...new Set(stickers.map(s => s.pack))];
  const activeCount = stickers.filter(s => s.active).length;

  return (
    <Box>
      {/* Header row */}
      <Flex align="center" justify="space-between" mb={5}>
        <Flex gap={3}>
          {[
            { label: "Total",   value: stickers.length, color: "rgba(255,255,255,0.6)" },
            { label: "Active",  value: activeCount,      color: "#4ade80"               },
            { label: "Packs",   value: packs.length,     color: "#fb923c"               },
          ].map(s => (
            <Box key={s.label} borderRadius="9px" px={4} py="10px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Text style={{ fontSize: "1.1rem", color: s.color, fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>{s.value}</Text>
              <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{s.label}</Text>
            </Box>
          ))}
        </Flex>

        <Box as="button" display="flex" alignItems="center" gap={2} px={4} py="10px"
          borderRadius="9px" cursor="pointer" transition="all 0.2s" border="none"
          style={{ background: "rgba(78,124,106,0.18)", border: "1px solid rgba(78,124,106,0.35)", color: "#4e7c6a" }}>
          <Plus size={15} />
          <Text style={{ fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "#4e7c6a" }}>Add Sticker</Text>
        </Box>
      </Flex>

      {/* Grid */}
      <Box display="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {stickers.map(s => {
          const pc = PACK_COLORS[s.pack] ?? PACK_COLORS["Default Pack"];
          const isHovered  = hoveredId === s.id;
          const isDeleting = deletedId === s.id;

          return (
            <Box
              key={s.id}
              borderRadius="12px"
              overflow="hidden"
              position="relative"
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                opacity: isDeleting ? 0 : s.active ? 1 : 0.5,
                transition: "opacity 0.3s, border-color 0.2s",
                filter: s.active ? "none" : "grayscale(70%)",
              }}
            >
              {/* Sticker preview */}
              <Box
                position="relative"
                display="flex"
                alignItems="center"
                justifyContent="center"
                style={{ height: 100, background: "rgba(255,255,255,0.02)" }}
              >
                <Box
                  as="img"
                  src={s.src}
                  alt={s.label}
                  style={{ width: 64, height: 64, objectFit: "contain" }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                {/* Hover overlay */}
                <Box
                  position="absolute"
                  inset={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    opacity: isHovered ? 1 : 0,
                    transition: "opacity 0.2s",
                  }}
                >
                  <Box as="button" onClick={() => toggleActive(s.id)}
                    display="flex" alignItems="center" justifyContent="center"
                    w="30px" h="30px" borderRadius="7px" border="none" cursor="pointer" transition="all 0.15s"
                    style={{ background: "rgba(255,255,255,0.12)", color: s.active ? "#4ade80" : "#94a3b8" }}>
                    {s.active ? <Eye size={13} /> : <EyeOff size={13} />}
                  </Box>
                  <Box as="button" onClick={() => handleDelete(s.id)}
                    display="flex" alignItems="center" justifyContent="center"
                    w="30px" h="30px" borderRadius="7px" border="none" cursor="pointer" transition="all 0.15s"
                    style={{ background: "rgba(248,113,113,0.18)", color: "#f87171" }}>
                    <Trash2 size={13} />
                  </Box>
                </Box>

                {/* Active dot */}
                <Box position="absolute" top={2} right={2} w="7px" h="7px" borderRadius="full"
                  style={{ background: s.active ? "#4ade80" : "#94a3b8", boxShadow: s.active ? "0 0 6px #4ade80" : "none" }} />
              </Box>

              {/* Info */}
              <Box px={3} py="10px" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <Text style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.label}
                </Text>
                <Flex align="center" justify="space-between" mt={1}>
                  <Box borderRadius="full" px={2} py="1px" style={{ background: pc.bg }}>
                    <Text style={{ fontSize: "0.6rem", color: pc.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {s.pack}
                    </Text>
                  </Box>
                  <Text style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {s.uses} uses
                  </Text>
                </Flex>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
