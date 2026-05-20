import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { BACKGROUNDS } from "../StudySpace/constants";
import type { BackgroundItem } from "../StudySpace/types";

interface AdminBg extends BackgroundItem {
  active: boolean;
  category: string;
}

const CATEGORIES = ["nature", "nature", "nature", "urban", "nature", "nature", "indoor", "urban", "indoor"];

const INITIAL_BG: AdminBg[] = BACKGROUNDS.map((bg, i) => ({
  ...bg,
  active: true,
  category: CATEGORIES[i] ?? "nature",
}));

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  nature: { color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  urban:  { color: "#38bdf8", bg: "rgba(56,189,248,0.12)"  },
  indoor: { color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
};

export function BackgroundsSection() {
  const [bgs, setBgs]           = useState<AdminBg[]>(INITIAL_BG);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletedId, setDeletedId] = useState<string | null>(null);

  const toggleActive = (id: string) =>
    setBgs(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));

  const handleDelete = (id: string) => {
    setDeletedId(id);
    setTimeout(() => {
      setBgs(prev => prev.filter(b => b.id !== id));
      setDeletedId(null);
    }, 300);
  };

  const activeCount   = bgs.filter(b => b.active).length;
  const inactiveCount = bgs.filter(b => !b.active).length;

  return (
    <Box>
      {/* Header row */}
      <Flex align="center" justify="space-between" mb={5}>
        <Flex gap={3}>
          {[
            { label: "Total",    value: bgs.length,    color: "rgba(255,255,255,0.6)" },
            { label: "Active",   value: activeCount,   color: "#4ade80" },
            { label: "Inactive", value: inactiveCount, color: "#94a3b8" },
          ].map(s => (
            <Box
              key={s.label}
              borderRadius="9px"
              px={4}
              py="10px"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Text style={{ fontSize: "1.1rem", color: s.color, fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>{s.value}</Text>
              <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{s.label}</Text>
            </Box>
          ))}
        </Flex>

        <Box
          as="button"
          display="flex"
          alignItems="center"
          gap={2}
          px={4}
          py="10px"
          borderRadius="9px"
          border="none"
          cursor="pointer"
          transition="all 0.2s"
          style={{
            background: "rgba(78,124,106,0.18)",
            border: "1px solid rgba(78,124,106,0.35)",
            color: "#4e7c6a",
          }}
        >
          <Plus size={15} />
          <Text style={{ fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "#4e7c6a" }}>
            Add Background
          </Text>
        </Box>
      </Flex>

      {/* Grid */}
      <Box
        display="grid"
        style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}
      >
        {bgs.map(bg => {
          const cat = CATEGORY_COLORS[bg.category] ?? CATEGORY_COLORS.nature;
          const isHovered  = hoveredId === bg.id;
          const isDeleting = deletedId === bg.id;

          return (
            <Box
              key={bg.id}
              borderRadius="12px"
              overflow="hidden"
              position="relative"
              onMouseEnter={() => setHoveredId(bg.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                opacity: isDeleting ? 0 : bg.active ? 1 : 0.5,
                transition: "opacity 0.3s",
                filter: bg.active ? "none" : "grayscale(60%)",
              }}
            >
              {/* Thumbnail */}
              <Box
                position="relative"
                style={{ paddingBottom: "56%", background: "#111" }}
              >
                <Box
                  position="absolute"
                  inset={0}
                  style={{
                    backgroundImage: `url(${bg.thumb})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

                {/* Hover overlay with actions */}
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
                  <Box
                    as="button"
                    onClick={() => toggleActive(bg.id)}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    w="34px"
                    h="34px"
                    borderRadius="8px"
                    border="none"
                    cursor="pointer"
                    transition="all 0.15s"
                    title={bg.active ? "Deactivate" : "Activate"}
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      color: bg.active ? "#4ade80" : "#94a3b8",
                    }}
                  >
                    {bg.active ? <Eye size={15} /> : <EyeOff size={15} />}
                  </Box>
                  <Box
                    as="button"
                    onClick={() => handleDelete(bg.id)}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    w="34px"
                    h="34px"
                    borderRadius="8px"
                    border="none"
                    cursor="pointer"
                    transition="all 0.15s"
                    title="Delete"
                    style={{ background: "rgba(248,113,113,0.18)", color: "#f87171" }}
                  >
                    <Trash2 size={15} />
                  </Box>
                </Box>

                {/* Active badge */}
                <Box
                  position="absolute"
                  top={2}
                  right={2}
                  borderRadius="full"
                  px={2}
                  py="2px"
                  style={{
                    background: bg.active ? "rgba(74,222,128,0.2)" : "rgba(148,163,184,0.15)",
                    border: `1px solid ${bg.active ? "rgba(74,222,128,0.4)" : "rgba(148,163,184,0.3)"}`,
                  }}
                >
                  <Flex align="center" gap="4px">
                    <Box w="5px" h="5px" borderRadius="full" style={{ background: bg.active ? "#4ade80" : "#94a3b8" }} />
                    <Text style={{ fontSize: "0.6rem", color: bg.active ? "#4ade80" : "#94a3b8", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {bg.active ? "Active" : "Off"}
                    </Text>
                  </Flex>
                </Box>
              </Box>

              {/* Info row */}
              <Box
                px={3}
                py="10px"
                style={{ background: "rgba(10,15,20,0.85)" }}
              >
                <Flex align="center" justify="space-between">
                  <Text style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {bg.label}
                  </Text>
                  <Box
                    borderRadius="full"
                    px={2}
                    py="1px"
                    ml={2}
                    flexShrink={0}
                    style={{ background: cat.bg }}
                  >
                    <Text style={{ fontSize: "0.6rem", color: cat.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {bg.category}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
