import { useState, useId } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Check, X } from "lucide-react";

interface ThemeColors {
  primary: string;
  accent:  string;
  surface: string;
  text:    string;
}

interface AdminTheme {
  id:      string;
  name:    string;
  colors:  ThemeColors;
  active:  boolean;
  usedBy:  number;
  isDefault?: boolean;
}

const INITIAL_THEMES: AdminTheme[] = [
  { id: "forest-dark", name: "Forest Dark",    colors: { primary: "#4e7c6a", accent: "#1a3c34", surface: "#0c1210", text: "#ffffff" }, active: true,  usedBy: 534, isDefault: true },
  { id: "ocean-blue",  name: "Ocean Blue",     colors: { primary: "#0ea5e9", accent: "#0369a1", surface: "#07111e", text: "#ffffff" }, active: true,  usedBy: 312 },
  { id: "lavender",    name: "Lavender Night", colors: { primary: "#a78bfa", accent: "#7c3aed", surface: "#0f0a1e", text: "#ffffff" }, active: true,  usedBy: 287 },
  { id: "sunset",      name: "Warm Sunset",    colors: { primary: "#fb923c", accent: "#c2410c", surface: "#160a03", text: "#ffffff" }, active: false, usedBy: 98  },
  { id: "cherry",      name: "Cherry Blossom", colors: { primary: "#f472b6", accent: "#be185d", surface: "#160610", text: "#ffffff" }, active: true,  usedBy: 203 },
  { id: "mint",        name: "Mint Fresh",     colors: { primary: "#34d399", accent: "#047857", surface: "#03120d", text: "#ffffff" }, active: false, usedBy: 156 },
];

const COLOR_FIELDS: { key: keyof ThemeColors; label: string; hint: string }[] = [
  { key: "primary", label: "Primary",  hint: "Main accent & interactive elements" },
  { key: "accent",  label: "Accent",   hint: "Buttons, highlights"                },
  { key: "surface", label: "Surface",  hint: "Panel & card background"            },
  { key: "text",    label: "Text",     hint: "Primary text color"                 },
];

const EMPTY_FORM = { name: "", colors: { primary: "#4e7c6a", accent: "#1a3c34", surface: "#0c1210", text: "#ffffff" } };

function ThemePreview({ colors, size = "md" }: { colors: ThemeColors; size?: "sm" | "md" }) {
  const h = size === "sm" ? 80 : 120;
  return (
    <Box
      borderRadius={size === "sm" ? "8px" : "10px"}
      overflow="hidden"
      style={{
        height: h,
        background: colors.surface,
        border: `1px solid ${colors.primary}30`,
        position: "relative",
      }}
    >
      {/* Simulated widget panel */}
      <Box
        position="absolute"
        top={size === "sm" ? 8 : 12}
        left={size === "sm" ? 8 : 12}
        borderRadius="6px"
        style={{
          width: size === "sm" ? 48 : 72,
          height: size === "sm" ? 28 : 42,
          background: `${colors.primary}22`,
          border: `1px solid ${colors.primary}40`,
        }}
      />
      {/* Simulated second widget */}
      <Box
        position="absolute"
        top={size === "sm" ? 8 : 12}
        right={size === "sm" ? 8 : 12}
        borderRadius="6px"
        style={{
          width: size === "sm" ? 36 : 54,
          height: size === "sm" ? 28 : 42,
          background: `${colors.accent}18`,
          border: `1px solid ${colors.accent}35`,
        }}
      />
      {/* Simulated toolbar */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        style={{
          height: size === "sm" ? 18 : 26,
          background: `${colors.surface}ee`,
          borderTop: `1px solid ${colors.primary}25`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        {[colors.primary, colors.accent, colors.primary, colors.accent, colors.primary].map((c, i) => (
          <Box
            key={i}
            borderRadius="full"
            style={{ width: size === "sm" ? 5 : 7, height: size === "sm" ? 5 : 7, background: i % 2 === 0 ? `${c}90` : `${c}50`, flexShrink: 0 }}
          />
        ))}
      </Box>
    </Box>
  );
}

export function ThemesSection() {
  const uid = useId();
  const [themes, setThemes]       = useState<AdminTheme[]>(INITIAL_THEMES);
  const [formMode, setFormMode]   = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName]   = useState("");
  const [formColors, setFormColors] = useState<ThemeColors>(EMPTY_FORM.colors);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => {
    setFormName("");
    setFormColors(EMPTY_FORM.colors);
    setEditingId(null);
    setFormMode("create");
  };

  const openEdit = (theme: AdminTheme) => {
    setFormName(theme.name);
    setFormColors({ ...theme.colors });
    setEditingId(theme.id);
    setFormMode("edit");
  };

  const closeForm = () => { setFormMode(null); setEditingId(null); };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (formMode === "create") {
      const newTheme: AdminTheme = {
        id:     `theme-${Date.now()}`,
        name:   formName.trim(),
        colors: { ...formColors },
        active: true,
        usedBy: 0,
      };
      setThemes(prev => [newTheme, ...prev]);
    } else if (formMode === "edit" && editingId) {
      setThemes(prev => prev.map(t =>
        t.id === editingId ? { ...t, name: formName.trim(), colors: { ...formColors } } : t
      ));
    }
    closeForm();
  };

  const toggleActive = (id: string) =>
    setThemes(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      setThemes(prev => prev.filter(t => t.id !== id));
      setDeletingId(null);
    }, 280);
  };

  const setColor = (key: keyof ThemeColors, value: string) =>
    setFormColors(prev => ({ ...prev, [key]: value }));

  const activeCount = themes.filter(t => t.active).length;
  const totalUsers  = themes.reduce((s, t) => s + t.usedBy, 0);

  return (
    <Box>
      {/* ── Header stats ── */}
      <Flex align="center" justify="space-between" mb={5}>
        <Flex gap={3}>
          {[
            { label: "Total Themes", value: themes.length, color: "rgba(255,255,255,0.6)" },
            { label: "Active",       value: activeCount,   color: "#4ade80"               },
            { label: "Users Using",  value: totalUsers,    color: "#a78bfa"               },
          ].map(s => (
            <Box key={s.label} borderRadius="9px" px={4} py="10px"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Text style={{ fontSize: "1.1rem", color: s.color, fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>{s.value}</Text>
              <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>{s.label}</Text>
            </Box>
          ))}
        </Flex>

        <Box as="button" onClick={openCreate} display="flex" alignItems="center" gap={2}
          px={4} py="10px" borderRadius="9px" border="none" cursor="pointer" transition="all 0.2s"
          style={{ background: "rgba(78,124,106,0.18)", outline: "1px solid rgba(78,124,106,0.35)", color: "#4e7c6a" }}>
          <Plus size={15} />
          <Text style={{ fontSize: "0.82rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "#4e7c6a" }}>Add Theme</Text>
        </Box>
      </Flex>

      {/* ── Create / Edit form ── */}
      {formMode && (
        <Box
          mb={5}
          borderRadius="14px"
          p={5}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(78,124,106,0.3)",
            boxShadow: "0 0 0 1px rgba(78,124,106,0.1)",
          }}
        >
          <Flex align="center" justify="space-between" mb={4}>
            <Text style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {formMode === "create" ? "Create New Theme" : "Edit Theme"}
            </Text>
            <Box as="button" onClick={closeForm} display="flex" alignItems="center" justifyContent="center"
              w="26px" h="26px" borderRadius="6px" border="none" cursor="pointer"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
              <X size={13} />
            </Box>
          </Flex>

          <Flex gap={5} align="flex-start">
            {/* Left: inputs */}
            <Box flex={1}>
              {/* Name */}
              <Box mb={4}>
                <Text mb={2} style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  THEME NAME
                </Text>
                <Input
                  value={formName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
                  placeholder="e.g. Midnight Blue"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "8px",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: "0.85rem",
                    height: "40px",
                    outline: "none",
                    width: "100%",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    paddingLeft: 12,
                  }}
                  _placeholder={{ color: "rgba(255,255,255,0.2)" }}
                  _focus={{ borderColor: "rgba(78,124,106,0.6)" } as any}
                />
              </Box>

              {/* Color pickers */}
              <Text mb={2} style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                COLOR PALETTE
              </Text>
              <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {COLOR_FIELDS.map(field => (
                  <Box
                    key={field.key}
                    borderRadius="9px"
                    p={3}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <Flex align="center" justify="space-between" mb="6px">
                      <Box>
                        <Text style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                          {field.label}
                        </Text>
                        <Text style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.22)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                          {field.hint}
                        </Text>
                      </Box>
                      {/* Color swatch + picker */}
                      <Box position="relative">
                        <Box
                          as="label"
                          htmlFor={`${uid}-${field.key}`}
                          display="flex"
                          alignItems="center"
                          gap={2}
                          borderRadius="7px"
                          px={2}
                          py="5px"
                          cursor="pointer"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <Box
                            w="18px"
                            h="18px"
                            borderRadius="4px"
                            style={{
                              background: formColors[field.key],
                              border: "1px solid rgba(255,255,255,0.15)",
                              flexShrink: 0,
                            }}
                          />
                          <Text style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", fontFamily: "'HarmonyOS Sans', sans-serif", letterSpacing: "0.04em" }}>
                            {formColors[field.key].toUpperCase()}
                          </Text>
                        </Box>
                        <Box
                          as="input"
                          id={`${uid}-${field.key}`}
                          type="color"
                          value={formColors[field.key]}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColor(field.key, e.target.value)}
                          position="absolute"
                          inset={0}
                          opacity={0}
                          cursor="pointer"
                          style={{ width: "100%", height: "100%" }}
                        />
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Right: live preview */}
            <Box w="200px" flexShrink={0}>
              <Text mb={2} style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                LIVE PREVIEW
              </Text>
              <ThemePreview colors={formColors} size="md" />
              <Box mt={2} borderRadius="8px" p="10px"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Flex gap={2} flexWrap="wrap">
                  {COLOR_FIELDS.map(field => (
                    <Flex key={field.key} align="center" gap="5px">
                      <Box w="8px" h="8px" borderRadius="2px" style={{ background: formColors[field.key], flexShrink: 0 }} />
                      <Text style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                        {field.label}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </Box>
            </Box>
          </Flex>

          {/* Actions */}
          <Flex justify="flex-end" gap={2} mt={4} pt={4}
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Box as="button" onClick={closeForm} display="flex" alignItems="center" gap={2}
              px={4} py="8px" borderRadius="8px" border="none" cursor="pointer" transition="all 0.15s"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>
              <X size={13} />
              <Text style={{ fontSize: "0.8rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "rgba(255,255,255,0.45)" }}>Cancel</Text>
            </Box>
            <Box
              as="button"
              onClick={handleSave}
              display="flex" alignItems="center" gap={2}
              px={4} py="8px" borderRadius="8px" border="none" cursor="pointer" transition="all 0.2s"
              style={{
                background: formName.trim() ? "rgba(78,124,106,0.25)" : "rgba(255,255,255,0.04)",
                outline: `1px solid ${formName.trim() ? "rgba(78,124,106,0.5)" : "rgba(255,255,255,0.08)"}`,
                color: formName.trim() ? "#4e7c6a" : "rgba(255,255,255,0.2)",
                cursor: formName.trim() ? "pointer" : "not-allowed",
              }}
            >
              <Check size={13} />
              <Text style={{ fontSize: "0.8rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "inherit" }}>
                {formMode === "create" ? "Create Theme" : "Save Changes"}
              </Text>
            </Box>
          </Flex>
        </Box>
      )}

      {/* ── Theme grid ── */}
      <Box display="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {themes.map(theme => {
          const isDeleting = deletingId === theme.id;
          const isEditing  = editingId === theme.id;
          return (
            <Box
              key={theme.id}
              borderRadius="13px"
              overflow="hidden"
              style={{
                border: `1px solid ${isEditing ? "rgba(78,124,106,0.4)" : "rgba(255,255,255,0.08)"}`,
                background: "rgba(255,255,255,0.03)",
                opacity: isDeleting ? 0 : theme.active ? 1 : 0.5,
                transition: "opacity 0.28s, border-color 0.2s",
                filter: theme.active ? "none" : "grayscale(60%)",
              }}
            >
              {/* Preview */}
              <Box p={3} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <ThemePreview colors={theme.colors} size="sm" />
              </Box>

              {/* Info */}
              <Box px={3} pt={3} pb="10px">
                <Flex align="center" justify="space-between" mb={2}>
                  <Flex align="center" gap={2} minW={0}>
                    <Text style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.88)", fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {theme.name}
                    </Text>
                    {theme.isDefault && (
                      <Box borderRadius="full" px={2} py="1px" flexShrink={0}
                        style={{ background: "rgba(78,124,106,0.15)", border: "1px solid rgba(78,124,106,0.3)" }}>
                        <Text style={{ fontSize: "0.58rem", color: "#4e7c6a", fontFamily: "'HarmonyOS Sans', sans-serif" }}>DEFAULT</Text>
                      </Box>
                    )}
                  </Flex>
                  <Flex align="center" gap={2} ml={1} flexShrink={0}>
                    <Box w="6px" h="6px" borderRadius="full"
                      style={{ background: theme.active ? "#4ade80" : "#94a3b8", boxShadow: theme.active ? "0 0 5px #4ade80" : "none" }} />
                  </Flex>
                </Flex>

                {/* Color swatches */}
                <Flex gap="5px" mb={3}>
                  {Object.entries(theme.colors).map(([key, val]) => (
                    <Box
                      key={key}
                      w="18px"
                      h="18px"
                      borderRadius="4px"
                      title={`${key}: ${val}`}
                      style={{
                        background: val,
                        border: "1px solid rgba(255,255,255,0.12)",
                        flexShrink: 0,
                      }}
                    />
                  ))}
                  <Text ml={1} style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.22)", fontFamily: "'HarmonyOS Sans', sans-serif", alignSelf: "center" }}>
                    {theme.usedBy} users
                  </Text>
                </Flex>

                {/* Actions */}
                <Flex gap={2}>
                  <Box
                    as="button"
                    onClick={() => openEdit(theme)}
                    flex={1}
                    display="flex" alignItems="center" justifyContent="center" gap="5px"
                    py="6px" borderRadius="7px" border="none" cursor="pointer" transition="all 0.15s"
                    style={{
                      background: isEditing ? "rgba(78,124,106,0.2)" : "rgba(255,255,255,0.05)",
                      outline: isEditing ? "1px solid rgba(78,124,106,0.4)" : "none",
                      color: isEditing ? "#4e7c6a" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    <Edit2 size={12} />
                    <Text style={{ fontSize: "0.72rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "inherit" }}>Edit</Text>
                  </Box>
                  <Box
                    as="button"
                    onClick={() => toggleActive(theme.id)}
                    display="flex" alignItems="center" justifyContent="center"
                    w="30px" h="28px" borderRadius="7px" border="none" cursor="pointer" transition="all 0.15s"
                    title={theme.active ? "Deactivate" : "Activate"}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: theme.active ? "#4ade80" : "#94a3b8",
                    }}
                  >
                    {theme.active ? <Eye size={13} /> : <EyeOff size={13} />}
                  </Box>
                  {!theme.isDefault && (
                    <Box
                      as="button"
                      onClick={() => handleDelete(theme.id)}
                      display="flex" alignItems="center" justifyContent="center"
                      w="30px" h="28px" borderRadius="7px" border="none" cursor="pointer" transition="all 0.15s"
                      title="Delete"
                      style={{ background: "rgba(248,113,113,0.07)", color: "rgba(248,113,113,0.45)" }}
                      _hover={{ background: "rgba(248,113,113,0.15)", color: "#f87171" } as any}
                    >
                      <Trash2 size={13} />
                    </Box>
                  )}
                </Flex>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
