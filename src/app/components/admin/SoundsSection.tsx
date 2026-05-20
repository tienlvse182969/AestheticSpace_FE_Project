import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Coffee, Waves, Wind, TreePine, Music2, CloudRain, Flame, Radio, Eye, EyeOff, Trash2, Plus } from "lucide-react";

interface AdminSound {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  active: boolean;
  uses: number;
  duration: string;
}

const ADMIN_SOUNDS: AdminSound[] = [
  { id: "cafe",       label: "Café Ambience",   category: "indoor",  icon: Coffee,    color: "#fb923c", active: true,  uses: 892,  duration: "∞ loop" },
  { id: "rain",       label: "Rainy Night",      category: "nature",  icon: CloudRain, color: "#60a5fa", active: true,  uses: 1204, duration: "∞ loop" },
  { id: "ocean",      label: "Ocean Waves",      category: "nature",  icon: Waves,     color: "#38bdf8", active: true,  uses: 631,  duration: "∞ loop" },
  { id: "forest",     label: "Forest Birds",     category: "nature",  icon: TreePine,  color: "#4ade80", active: true,  uses: 758,  duration: "∞ loop" },
  { id: "wind",       label: "Gentle Wind",      category: "nature",  icon: Wind,      color: "#a3e635", active: false, uses: 214,  duration: "∞ loop" },
  { id: "fireplace",  label: "Fireplace",        category: "indoor",  icon: Flame,     color: "#f97316", active: true,  uses: 543,  duration: "∞ loop" },
  { id: "lofi",       label: "Lo-Fi Study",      category: "music",   icon: Music2,    color: "#c084fc", active: true,  uses: 1087, duration: "∞ loop" },
  { id: "whiteNoise", label: "White Noise",      category: "ambient", icon: Radio,     color: "#94a3b8", active: false, uses: 329,  duration: "∞ loop" },
];

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  nature:  { color: "#4ade80", bg: "rgba(74,222,128,0.1)"  },
  indoor:  { color: "#fb923c", bg: "rgba(251,146,60,0.1)"  },
  music:   { color: "#c084fc", bg: "rgba(192,132,252,0.1)" },
  ambient: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

export function SoundsSection() {
  const [sounds, setSounds]   = useState<AdminSound[]>(ADMIN_SOUNDS);
  const [deletedId, setDeletedId] = useState<string | null>(null);

  const toggleActive = (id: string) =>
    setSounds(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));

  const handleDelete = (id: string) => {
    setDeletedId(id);
    setTimeout(() => {
      setSounds(prev => prev.filter(s => s.id !== id));
      setDeletedId(null);
    }, 300);
  };

  const activeCount = sounds.filter(s => s.active).length;
  const totalUses   = sounds.reduce((acc, s) => acc + s.uses, 0);

  return (
    <Box>
      {/* Header */}
      <Flex align="center" justify="space-between" mb={5}>
        <Flex gap={3}>
          {[
            { label: "Total Sounds", value: sounds.length, color: "rgba(255,255,255,0.6)" },
            { label: "Active",       value: activeCount,   color: "#4ade80"               },
            { label: "Total Uses",   value: totalUses.toLocaleString(), color: "#38bdf8"  },
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
          <Text style={{ fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "#4e7c6a" }}>Add Sound</Text>
        </Box>
      </Flex>

      {/* Table header */}
      <Box borderRadius="14px" overflow="hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <Flex px={5} py={3}
          style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {["Sound", "Category", "Duration", "Total Uses", "Status", "Actions"].map((h, i) => (
            <Text key={h} style={{
              fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              flex: [3, 1.2, 1, 1, 1, 0.8][i],
            }}>
              {h.toUpperCase()}
            </Text>
          ))}
        </Flex>

        {sounds.map((s, i) => {
          const Icon = s.icon;
          const cat  = CATEGORY_COLORS[s.category] ?? CATEGORY_COLORS.ambient;
          const isDeleting = deletedId === s.id;

          return (
            <Flex
              key={s.id}
              align="center"
              px={5}
              py={4}
              style={{
                background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                borderBottom: i < sounds.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                opacity: isDeleting ? 0 : 1,
                transition: "opacity 0.3s, background 0.15s",
              }}
              _hover={{ background: "rgba(255,255,255,0.04)" } as any}
            >
              {/* Sound name + icon */}
              <Flex align="center" gap={3} style={{ flex: 3 }}>
                <Flex align="center" justify="center" w="36px" h="36px" borderRadius="10px" flexShrink={0}
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                  <Icon size={16} style={{ color: s.color }} />
                </Flex>
                <Box>
                  <Text style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {s.label}
                  </Text>
                  <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.28)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    ID: {s.id}
                  </Text>
                </Box>
              </Flex>

              {/* Category */}
              <Box style={{ flex: 1.2 }}>
                <Box display="inline-flex" borderRadius="full" px={2} py="2px"
                  style={{ background: cat.bg }}>
                  <Text style={{ fontSize: "0.65rem", color: cat.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {s.category}
                  </Text>
                </Box>
              </Box>

              {/* Duration */}
              <Text style={{ flex: 1, fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                {s.duration}
              </Text>

              {/* Uses */}
              <Box style={{ flex: 1 }}>
                <Text style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {s.uses.toLocaleString()}
                </Text>
                <Box mt="3px" borderRadius="full" h="3px" w="80px"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  <Box borderRadius="full" h="3px"
                    style={{
                      width: `${Math.round((s.uses / 1300) * 100)}%`,
                      background: s.color,
                      transition: "width 0.3s",
                    }}
                  />
                </Box>
              </Box>

              {/* Status toggle */}
              <Box style={{ flex: 1 }}>
                <Box
                  as="button"
                  onClick={() => toggleActive(s.id)}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  px={3}
                  py="6px"
                  borderRadius="full"
                  border="none"
                  cursor="pointer"
                  transition="all 0.2s"
                  style={{
                    background: s.active ? "rgba(74,222,128,0.12)" : "rgba(148,163,184,0.08)",
                    border: `1px solid ${s.active ? "rgba(74,222,128,0.3)" : "rgba(148,163,184,0.2)"}`,
                  }}
                >
                  {s.active ? <Eye size={12} style={{ color: "#4ade80" }} /> : <EyeOff size={12} style={{ color: "#94a3b8" }} />}
                  <Text style={{ fontSize: "0.68rem", color: s.active ? "#4ade80" : "#94a3b8", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                    {s.active ? "Active" : "Off"}
                  </Text>
                </Box>
              </Box>

              {/* Delete */}
              <Box style={{ flex: 0.8 }}>
                <Box
                  as="button"
                  onClick={() => handleDelete(s.id)}
                  display="flex" alignItems="center" justifyContent="center"
                  w="30px" h="30px" borderRadius="7px" border="none" cursor="pointer" transition="all 0.2s"
                  style={{ background: "rgba(248,113,113,0.08)", color: "rgba(248,113,113,0.5)" }}
                  _hover={{ background: "rgba(248,113,113,0.18)", color: "#f87171" } as any}
                >
                  <Trash2 size={13} />
                </Box>
              </Box>
            </Flex>
          );
        })}
      </Box>
    </Box>
  );
}
