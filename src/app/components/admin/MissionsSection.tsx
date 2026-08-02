import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text, Input, Spinner } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  RefreshCw, X, MoreHorizontal, Coins,
} from "lucide-react";
import {
  adminMissionsService,
  type AdminMissionDto,
  type MissionFormData,
} from "../../../services/admin/mission.admin.service";
import { useAdminTheme } from "./AdminThemeContext";

const MotionBox = motion.create(Box);

const FREQ_OPTIONS = ["daily", "weekly", "once"];
const FREQ_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  daily:  { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)"  },
  weekly: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
  once:   { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"  },
};
const DEFAULT_FREQ_STYLE = { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" };

const DEFAULT_FORM: MissionFormData = {
  code: "", name: "", description: "",
  rewardCoins: 100, triggerKey: "",
  targetValue: null, frequency: "daily", isActive: true,
};

// Table: Name | Reward | Frequency | Target | Status | Created | Actions
const COL_FLEX = [2.5, 1, 1.3, 0.8, 1.1, 1.2, 0.7];

export function MissionsSection() {
  const { c, isDark } = useAdminTheme();
  const { t } = useTranslation();

  const modalBg = isDark ? "rgba(14,20,28,0.97)" : "rgba(238,243,248,0.97)";

  const getFreqLabel = (freq: string | null) => {
    if (freq === "daily")    return t("admin.missions.freqDaily");
    if (freq === "weekly")   return t("admin.missions.freqWeekly");
    if (freq === "once")     return t("admin.missions.freqOneTime");
    return freq ?? "—";
  };

  const [missions,      setMissions]      = useState<AdminMissionDto[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalCount,    setTotalCount]    = useState(0);
  const [hasNext,       setHasNext]       = useState(false);
  const [hasPrev,       setHasPrev]       = useState(false);
  const [includeInactive, setIncludeInactive] = useState(true);

  const [showForm,      setShowForm]      = useState(false);
  const [editTarget,    setEditTarget]    = useState<AdminMissionDto | null>(null);
  const [form,          setForm]          = useState<MissionFormData>(DEFAULT_FORM);
  const [formLoading,   setFormLoading]   = useState(false);
  const [formError,     setFormError]     = useState<string | null>(null);

  const [viewMission,   setViewMission]   = useState<AdminMissionDto | null>(null);
  const [openMenu,      setOpenMenu]      = useState<string | null>(null);
  const [hoveredRow,    setHoveredRow]    = useState<string | null>(null);
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMissions = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminMissionsService.getMissions(p, 20, includeInactive);
      setMissions(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setHasNext(result.hasNext);
      setHasPrev(result.hasPrevious);
    } catch {
      setError(t("admin.missions.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [t, includeInactive]);

  useEffect(() => { fetchMissions(page); }, [page, fetchMissions]);

  useEffect(() => {
    if (!openMenu) return;
    const handler = () => setOpenMenu(null);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenu]);

  const handleToggleInactive = () => {
    setPage(1);
    setIncludeInactive(prev => !prev);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (m: AdminMissionDto) => {
    setEditTarget(m);
    setForm({
      code:        m.code        ?? "",
      name:        m.name        ?? "",
      description: m.description ?? "",
      rewardCoins: m.rewardCoins,
      triggerKey:  m.triggerKey  ?? "",
      targetValue: m.targetValue,
      frequency:   m.frequency   ?? "daily",
      isActive:    m.isActive,
    });
    setFormError(null);
    setShowForm(true);
    setOpenMenu(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setFormLoading(true);
    setFormError(null);
    try {
      if (editTarget) {
        const updated = await adminMissionsService.updateMission(editTarget.id, form);
        setMissions(prev => prev.map(m => m.id === editTarget.id ? updated : m));
      } else {
        const created = await adminMissionsService.createMission(form);
        setMissions(prev => [created, ...prev]);
        setTotalCount(prev => prev + 1);
      }
      setShowForm(false);
    } catch {
      setFormError(t("admin.missions.saveError"));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await adminMissionsService.deleteMission(deleteId);
      setMissions(prev => prev.filter(m => m.id !== deleteId));
      setTotalCount(prev => prev - 1);
    } catch {
      fetchMissions(page);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const pageActive   = missions.filter(m => m.isActive).length;
  const pageInactive = missions.filter(m => !m.isActive).length;

  const inputStyle = {
    background: c.cardBg, border: `1px solid ${c.cardBorder}`,
    borderRadius: "8px", color: c.cardText, fontSize: "0.85rem",
    height: "38px", paddingLeft: "12px", outline: "none", width: "100%",
  };

  return (
    <Box>
      {/* Stats */}
      <Flex gap={3} mb={5}>
        {[
          { label: t("admin.missions.statTotal"),    value: totalCount,   color: c.cardText },
          { label: t("admin.missions.statActive"),   value: pageActive,   color: "#4ade80"  },
          { label: t("admin.missions.statInactive"), value: pageInactive, color: "#94a3b8"  },
        ].map(s => (
          <Box key={s.label} borderRadius="10px" px={4} py={3} flexShrink={0}
            style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, minWidth: 110, transition: "background 0.3s" }}>
            <Text style={{ fontSize: "1.3rem", color: s.color, fontWeight: 600 }}>{s.value}</Text>
            <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted }}>{s.label}</Text>
          </Box>
        ))}
      </Flex>

      {/* Toolbar */}
      <Flex align="center" gap={3} mb={4}>
        {/* Inactive toggle */}
        <Flex
          as="button"
          align="center"
          gap={2}
          onClick={handleToggleInactive}
          px={3} py="8px" borderRadius="9px" border="none" cursor="pointer"
          style={{
            background: includeInactive ? "rgba(78,124,106,0.12)" : c.cardBg,
            border: includeInactive ? "1px solid rgba(78,124,106,0.35)" : `1px solid ${c.cardBorder}`,
            color: includeInactive ? "#4e7c6a" : c.textMuted,
            fontSize: "0.8rem", transition: "all 0.18s", flexShrink: 0,
          }}
        >
          <Box w="8px" h="8px" borderRadius="full" flexShrink={0}
            style={{ background: includeInactive ? "#4e7c6a" : c.textDim }} />
          {t("admin.missions.showInactive")}
        </Flex>

        {/* Refresh */}
        <Box
          as="button"
          onClick={() => fetchMissions(page)}
          display="flex" alignItems="center" justifyContent="center"
          w="38px" h="38px" borderRadius="9px" border="none" cursor="pointer" flexShrink={0}
          style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, color: c.textMuted }}
          _hover={{ background: c.navActive } as any}
        >
          <RefreshCw size={14} />
        </Box>

        <Box flex={1} />

        {/* Create button */}
        <Box
          as="button"
          onClick={openCreate}
          display="flex" alignItems="center" gap={2}
          px={4} py="8px" borderRadius="9px" border="none" cursor="pointer" flexShrink={0}
          style={{
            background: "rgba(78,124,106,0.18)",
            border: "1px solid rgba(78,124,106,0.4)",
            color: "#4e7c6a", fontSize: "0.82rem", fontWeight: 600,
          }}
          _hover={{ background: "rgba(78,124,106,0.28)" } as any}
        >
          <Plus size={14} />
          {t("admin.missions.createNew")}
        </Box>
      </Flex>

      {/* Table */}
      <Box borderRadius="14px" style={{ border: `1px solid ${c.cardBorder}`, overflow: "visible" }}>
        {/* Header */}
        <Flex px={5} py={3} style={{ background: c.cardBg, borderBottom: `1px solid ${c.cardBorder}`, borderRadius: "14px 14px 0 0" }}>
          {[
            t("admin.missions.colName"), t("admin.missions.colReward"),
            t("admin.missions.colFrequency"), t("admin.missions.colTarget"),
            t("admin.missions.colStatus"), t("admin.missions.colCreated"),
            t("admin.missions.colActions"),
          ].map((h, i) => (
            <Text key={h} style={{
              fontSize: "0.63rem", color: c.cardTextMuted, letterSpacing: "0.1em",
              flex: COL_FLEX[i],
            }}>
              {h.toUpperCase()}
            </Text>
          ))}
        </Flex>

        {/* Rows */}
        {loading ? (
          <Flex align="center" justify="center" py={16} gap={3}>
            <Spinner size="sm" style={{ color: "#4e7c6a" }} />
            <Text style={{ fontSize: "0.85rem", color: c.cardTextMuted }}>{t("admin.missions.loading")}</Text>
          </Flex>
        ) : error ? (
          <Flex direction="column" align="center" justify="center" py={12} gap={3}>
            <Text style={{ fontSize: "0.85rem", color: "#f87171" }}>{error}</Text>
            <Box as="button" onClick={() => fetchMissions(page)}
              style={{ fontSize: "0.8rem", color: "#4e7c6a", background: "transparent", border: "1px solid rgba(78,124,106,0.4)", borderRadius: 8, padding: "6px 16px", cursor: "pointer" }}>
              {t("admin.missions.retry")}
            </Box>
          </Flex>
        ) : missions.length === 0 ? (
          <Flex align="center" justify="center" py={12}>
            <Text style={{ fontSize: "0.85rem", color: c.cardTextMuted }}>{t("admin.missions.noData")}</Text>
          </Flex>
        ) : (
          missions.map((m, i) => {
            const freqStyle = FREQ_STYLE[m.frequency ?? ""] ?? DEFAULT_FREQ_STYLE;
            return (
              <Flex
                key={m.id} align="center" px={5} py="13px" position="relative"
                cursor="pointer"
                style={{
                  background: hoveredRow === m.id ? "rgba(78,124,106,0.1)" : "transparent",
                  borderBottom: i < missions.length - 1 ? `1px solid ${c.rowDivider}` : "none",
                  transition:   "background 0.15s",
                }}
                onClick={() => { setViewMission(m); setHoveredRow(null); }}
                onMouseEnter={() => setHoveredRow(m.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Name + Code */}
                <Box style={{ flex: COL_FLEX[0], minWidth: 0, paddingRight: 12 }}>
                  <Text style={{ fontSize: "0.82rem", color: c.cardText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.name ?? "—"}
                  </Text>
                  {m.code && (
                    <Text style={{ fontSize: "0.68rem", color: c.cardTextMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.code}
                    </Text>
                  )}
                </Box>

                {/* Reward */}
                <Flex align="center" gap="4px" style={{ flex: COL_FLEX[1] }}>
                  <Coins size={11} style={{ color: "#facc15", flexShrink: 0 }} />
                  <Text style={{ fontSize: "0.8rem", color: "#facc15", fontWeight: 600 }}>
                    {m.rewardCoins.toLocaleString()}
                  </Text>
                </Flex>

                {/* Frequency */}
                <Box style={{ flex: COL_FLEX[2] }}>
                  <Box display="inline-flex" borderRadius="full" px={2} py="1px"
                    style={{ background: freqStyle.bg, border: `1px solid ${freqStyle.border}` }}>
                    <Text style={{ fontSize: "0.63rem", color: freqStyle.color }}>
                      {getFreqLabel(m.frequency)}
                    </Text>
                  </Box>
                </Box>

                {/* Target */}
                <Text style={{ flex: COL_FLEX[3], fontSize: "0.8rem", color: c.cardTextMuted }}>
                  {m.targetValue ?? "—"}
                </Text>

                {/* Status */}
                <Box style={{ flex: COL_FLEX[4] }}>
                  <Flex align="center" gap="5px" display="inline-flex" borderRadius="full" px={2} py="1px"
                    style={{
                      background: m.isActive ? "rgba(74,222,128,0.1)"  : "rgba(148,163,184,0.1)",
                      border:     m.isActive ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(148,163,184,0.2)",
                    }}>
                    <Box w="5px" h="5px" borderRadius="full" flexShrink={0}
                      style={{ background: m.isActive ? "#4ade80" : "#94a3b8" }} />
                    <Text style={{ fontSize: "0.63rem", color: m.isActive ? "#4ade80" : "#94a3b8" }}>
                      {m.isActive ? t("admin.missions.statusActive") : t("admin.missions.statusInactive")}
                    </Text>
                  </Flex>
                </Box>

                {/* Created */}
                <Text style={{ flex: COL_FLEX[5], fontSize: "0.72rem", color: c.cardTextMuted }}>
                  {m.createdAt.split("T")[0]}
                </Text>

                {/* Actions */}
                <Box style={{ flex: COL_FLEX[6] }} position="relative"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <Box
                    as="button"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpenMenu(openMenu === m.id ? null : m.id); }}
                    display="flex" alignItems="center" justifyContent="center"
                    w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer"
                    style={{ background: openMenu === m.id ? c.navActive : "transparent", color: c.textMuted }}
                    _hover={{ background: c.navActive } as any}
                  >
                    <MoreHorizontal size={14} />
                  </Box>

                  <AnimatePresence>
                    {openMenu === m.id && (
                      <MotionBox
                        position="absolute" right={0} top="34px" zIndex={100}
                        borderRadius="10px" overflow="hidden"
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 } as any}
                        style={{
                          background: "rgba(15,22,30,0.97)", backdropFilter: "blur(16px)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.6)", minWidth: 130,
                        }}
                        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <Box as="button" w="full" textAlign="left" onClick={() => openEdit(m)}
                          display="flex" alignItems="center" gap={2} px={4} py="10px"
                          border="none" cursor="pointer"
                          style={{ background: "transparent", color: "rgba(255,255,255,0.78)" }}
                          _hover={{ background: "rgba(255,255,255,0.06)" } as any}>
                          <Pencil size={13} />
                          <Text style={{ fontSize: "0.8rem" }}>{t("admin.missions.actionEdit")}</Text>
                        </Box>
                        <Box as="button" w="full" textAlign="left"
                          onClick={() => { setDeleteId(m.id); setOpenMenu(null); }}
                          display="flex" alignItems="center" gap={2} px={4} py="10px"
                          border="none" cursor="pointer"
                          style={{ background: "transparent", color: "#f87171" }}
                          _hover={{ background: "rgba(248,113,113,0.08)" } as any}>
                          <Trash2 size={13} />
                          <Text style={{ fontSize: "0.8rem", color: "#f87171" }}>{t("admin.missions.actionDelete")}</Text>
                        </Box>
                      </MotionBox>
                    )}
                  </AnimatePresence>
                </Box>
              </Flex>
            );
          })
        )}
      </Box>

      {/* Footer */}
      <Flex align="center" justify="space-between" mt={3}>
        <Text style={{ fontSize: "0.72rem", color: c.cardTextMuted }}>
          {loading ? t("admin.missions.loading") : t("admin.missions.showing", { shown: missions.length, total: totalCount })}
        </Text>
        {totalPages > 1 && (
          <Flex align="center" gap={2}>
            <Box as="button" onClick={() => hasPrev && setPage(p => p - 1)}
              display="flex" alignItems="center" justifyContent="center"
              w="30px" h="30px" borderRadius="8px" border="none"
              cursor={hasPrev ? "pointer" : "not-allowed"}
              style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, color: hasPrev ? c.textMuted : c.textSub, opacity: hasPrev ? 1 : 0.4 }}
              _hover={hasPrev ? { background: c.navActive } as any : {}}>
              <ChevronLeft size={14} />
            </Box>
            <Text style={{ fontSize: "0.78rem", color: c.textMuted, minWidth: "60px", textAlign: "center" }}>
              {page} / {totalPages}
            </Text>
            <Box as="button" onClick={() => hasNext && setPage(p => p + 1)}
              display="flex" alignItems="center" justifyContent="center"
              w="30px" h="30px" borderRadius="8px" border="none"
              cursor={hasNext ? "pointer" : "not-allowed"}
              style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, color: hasNext ? c.textMuted : c.textSub, opacity: hasNext ? 1 : 0.4 }}
              _hover={hasNext ? { background: c.navActive } as any : {}}>
              <ChevronRight size={14} />
            </Box>
          </Flex>
        )}
      </Flex>

      {/* ── Create / Edit Form Modal ── */}
      <AnimatePresence>
        {showForm && (
          <MotionBox
            position="fixed" inset={0} zIndex={200}
            display="flex" alignItems="center" justifyContent="center" px={4}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 } as any}
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => !formLoading && setShowForm(false)}
          >
            <MotionBox
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] } as any}
              style={{
                width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto",
                background: modalBg, border: `1px solid ${c.cardBorder}`,
                borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.75)",
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Box p={6}>
                {/* Modal header */}
                <Flex align="center" justify="space-between" mb={5}>
                  <Text style={{ fontSize: "1rem", color: c.cardText, fontWeight: 600 }}>
                    {editTarget ? t("admin.missions.editMission") : t("admin.missions.createNew")}
                  </Text>
                  <Box as="button" onClick={() => !formLoading && setShowForm(false)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: c.textMuted, display: "flex" }}>
                    <X size={18} />
                  </Box>
                </Flex>

                {/* Fields */}
                <Flex direction="column" gap={4}>
                  {/* Code + Name */}
                  <Flex gap={3}>
                    <Box flex={1}>
                      <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                        {t("admin.missions.fieldCode")}
                      </Text>
                      <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                        style={inputStyle} _focus={{ borderColor: "rgba(78,124,106,0.6)" } as any} />
                    </Box>
                    <Box flex={1.4}>
                      <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                        {t("admin.missions.fieldName")} *
                      </Text>
                      <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        style={inputStyle} _focus={{ borderColor: "rgba(78,124,106,0.6)" } as any} />
                    </Box>
                  </Flex>

                  {/* Description */}
                  <Box>
                    <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                      {t("admin.missions.fieldDescription")}
                    </Text>
                    <Box as="textarea" value={form.description} rows={2}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, description: e.target.value }))}
                      style={{
                        width: "100%", background: c.cardBg, border: `1px solid ${c.cardBorder}`,
                        borderRadius: 8, color: c.cardText, fontSize: "0.85rem",
                        padding: "8px 12px", resize: "vertical", outline: "none",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                      }} />
                  </Box>

                  {/* Reward + Target */}
                  <Flex gap={3}>
                    <Box flex={1}>
                      <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                        {t("admin.missions.fieldReward")} *
                      </Text>
                      <Input type="number" value={form.rewardCoins}
                        onChange={e => setForm(f => ({ ...f, rewardCoins: Number(e.target.value) }))}
                        style={inputStyle} _focus={{ borderColor: "rgba(78,124,106,0.6)" } as any} />
                    </Box>
                    <Box flex={1}>
                      <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                        {t("admin.missions.fieldTarget")}
                      </Text>
                      <Input type="number" value={form.targetValue ?? ""}
                        onChange={e => setForm(f => ({ ...f, targetValue: e.target.value === "" ? null : Number(e.target.value) }))}
                        style={inputStyle} _focus={{ borderColor: "rgba(78,124,106,0.6)" } as any} />
                    </Box>
                  </Flex>

                  {/* Trigger Key + Frequency */}
                  <Flex gap={3}>
                    <Box flex={1.5}>
                      <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                        {t("admin.missions.fieldTrigger")}
                      </Text>
                      <Input value={form.triggerKey} placeholder={t("admin.missions.fieldTriggerPlaceholder")}
                        onChange={e => setForm(f => ({ ...f, triggerKey: e.target.value }))}
                        style={inputStyle}
                        _placeholder={{ color: c.textSub } as any}
                        _focus={{ borderColor: "rgba(78,124,106,0.6)" } as any} />
                    </Box>
                    <Box flex={1}>
                      <Text mb="5px" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.06em" }}>
                        {t("admin.missions.fieldFrequency")}
                      </Text>
                      <Box as="select" value={form.frequency}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm(f => ({ ...f, frequency: e.target.value }))}
                        style={{
                          width: "100%", height: 38, background: c.cardBg, border: `1px solid ${c.cardBorder}`,
                          borderRadius: 8, color: c.cardText, fontSize: "0.85rem", padding: "0 12px", outline: "none",
                        }}>
                        {FREQ_OPTIONS.map(fo => (
                          <option key={fo} value={fo}>{fo}</option>
                        ))}
                      </Box>
                    </Box>
                  </Flex>

                  {/* Is Active toggle */}
                  <Flex align="center" gap={3}>
                    <Box as="button"
                      onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                      w="36px" h="20px" borderRadius="full" border="none" cursor="pointer"
                      style={{
                        background: form.isActive ? "rgba(74,222,128,0.4)" : c.cardBorder,
                        border: form.isActive ? "1px solid rgba(74,222,128,0.55)" : `1px solid ${c.cardBorder}`,
                        position: "relative", transition: "all 0.2s", flexShrink: 0,
                      }}>
                      <Box position="absolute" w="14px" h="14px" borderRadius="full" top="2px"
                        style={{
                          left: form.isActive ? "18px" : "2px",
                          background: form.isActive ? "#4ade80" : c.textDim,
                          transition: "left 0.2s",
                        }} />
                    </Box>
                    <Text style={{ fontSize: "0.82rem", color: c.cardText }}>
                      {t("admin.missions.fieldIsActive")}
                    </Text>
                  </Flex>
                </Flex>

                {formError && (
                  <Text mt={3} style={{ fontSize: "0.78rem", color: "#f87171" }}>{formError}</Text>
                )}

                {/* Modal footer */}
                <Flex mt={5} gap={3} justify="flex-end">
                  <Box as="button" onClick={() => setShowForm(false)}
                    px={4} py="8px" borderRadius="9px" border="none" cursor="pointer"
                    style={{ background: c.cardBorder, color: c.cardTextMuted, fontSize: "0.83rem" }}
                    _hover={{ opacity: 0.8 } as any}>
                    {t("admin.missions.cancel")}
                  </Box>
                  <Box as="button" onClick={handleSave}
                    px={5} py="8px" borderRadius="9px" border="none" cursor="pointer"
                    style={{
                      background: "rgba(78,124,106,0.22)", border: "1px solid rgba(78,124,106,0.4)",
                      color: "#4e7c6a", fontSize: "0.83rem", fontWeight: 600,
                      opacity: formLoading ? 0.6 : 1,
                    }}
                    _hover={{ background: "rgba(78,124,106,0.32)" } as any}>
                    {formLoading ? <Spinner size="xs" /> : t("admin.missions.save")}
                  </Box>
                </Flex>
              </Box>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteId && (
          <MotionBox
            position="fixed" inset={0} zIndex={200}
            display="flex" alignItems="center" justifyContent="center" px={4}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 } as any}
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={() => !deleteLoading && setDeleteId(null)}
          >
            <MotionBox
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 } as any}
              style={{
                width: "100%", maxWidth: 340, background: modalBg,
                border: `1px solid ${c.cardBorder}`,
                borderRadius: 14, boxShadow: "0 16px 48px rgba(0,0,0,0.65)",
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Box p={5}>
                <Text style={{ fontSize: "0.9rem", color: c.cardText, fontWeight: 600, marginBottom: 6 }}>
                  {t("admin.missions.deleteConfirm")}
                </Text>
                <Text style={{ fontSize: "0.78rem", color: c.cardTextMuted, marginBottom: 20 }}>
                  {t("admin.missions.deleteNote")}
                </Text>
                <Flex gap={3} justify="flex-end">
                  <Box as="button" onClick={() => setDeleteId(null)}
                    px={4} py="7px" borderRadius="8px" border="none" cursor="pointer"
                    style={{ background: c.cardBorder, color: c.cardTextMuted, fontSize: "0.8rem" }}
                    _hover={{ opacity: 0.8 } as any}>
                    {t("admin.missions.cancel")}
                  </Box>
                  <Box as="button" onClick={handleDelete}
                    px={4} py="7px" borderRadius="8px" border="none" cursor="pointer"
                    style={{
                      background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)",
                      color: "#f87171", fontSize: "0.8rem", opacity: deleteLoading ? 0.6 : 1,
                    }}
                    _hover={{ background: "rgba(248,113,113,0.25)" } as any}>
                    {deleteLoading ? "…" : t("admin.missions.delete")}
                  </Box>
                </Flex>
              </Box>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {viewMission && (
          <MotionBox
            position="fixed" inset={0} zIndex={200}
            display="flex" alignItems="center" justifyContent="center" px={4}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 } as any}
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={() => setViewMission(null)}
          >
            <MotionBox
              initial={{ scale: 0.96, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 14 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] } as any}
              style={{
                width: "100%", maxWidth: 460,
                background: modalBg, border: `1px solid ${c.cardBorder}`,
                borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Box p={6}>
                {/* Header */}
                <Flex align="flex-start" justify="space-between" mb={5} gap={3}>
                  <Box minW={0}>
                    <Text style={{ fontSize: "1.05rem", color: c.cardText, fontWeight: 700, lineHeight: 1.3 }}>
                      {viewMission.name ?? "—"}
                    </Text>
                    {viewMission.code && (
                      <Text mt="3px" style={{ fontSize: "0.72rem", color: c.cardTextMuted, fontFamily: "monospace" }}>
                        {viewMission.code}
                      </Text>
                    )}
                  </Box>
                  <Flex align="center" gap={2} flexShrink={0}>
                    {/* Edit button */}
                    <Box as="button"
                      onClick={() => { setViewMission(null); openEdit(viewMission); }}
                      display="flex" alignItems="center" gap="5px"
                      px={3} py="6px" borderRadius="8px" border="none" cursor="pointer"
                      style={{
                        background: "rgba(78,124,106,0.15)", border: "1px solid rgba(78,124,106,0.35)",
                        color: "#4e7c6a", fontSize: "0.78rem",
                      }}
                      _hover={{ background: "rgba(78,124,106,0.25)" } as any}>
                      <Pencil size={12} />
                      {t("admin.missions.actionEdit")}
                    </Box>
                    <Box as="button" onClick={() => setViewMission(null)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: c.textMuted, display: "flex" }}>
                      <X size={18} />
                    </Box>
                  </Flex>
                </Flex>

                {/* Description */}
                {viewMission.description && (
                  <Box mb={4} px={3} py="10px" borderRadius="8px"
                    style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
                    <Text style={{ fontSize: "0.82rem", color: c.cardTextSub, lineHeight: 1.6 }}>
                      {viewMission.description}
                    </Text>
                  </Box>
                )}

                {/* Detail grid */}
                <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: t("admin.missions.fieldTrigger"), value: viewMission.triggerKey ?? "—", mono: true },
                    { label: t("admin.missions.fieldFrequency"), value: getFreqLabel(viewMission.frequency), mono: false },
                    { label: t("admin.missions.fieldReward"), value: `${viewMission.rewardCoins.toLocaleString()} xu`, mono: false },
                    { label: t("admin.missions.fieldTarget"), value: viewMission.targetValue?.toString() ?? "—", mono: false },
                  ].map(item => (
                    <Box key={item.label} px={3} py="10px" borderRadius="8px"
                      style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
                      <Text style={{ fontSize: "0.62rem", color: c.cardTextMuted, letterSpacing: "0.08em", marginBottom: 4 }}>
                        {item.label.toUpperCase()}
                      </Text>
                      <Text style={{
                        fontSize: "0.85rem", color: c.cardText, fontWeight: 600,
                        fontFamily: item.mono ? "monospace" : "inherit",
                      }}>
                        {item.value}
                      </Text>
                    </Box>
                  ))}
                </Box>

                {/* Status + dates */}
                <Flex mt={3} align="center" justify="space-between">
                  <Flex align="center" gap="6px" borderRadius="full" px={3} py="4px"
                    style={{
                      background: viewMission.isActive ? "rgba(74,222,128,0.1)" : "rgba(148,163,184,0.1)",
                      border: viewMission.isActive ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(148,163,184,0.2)",
                    }}>
                    <Box w="6px" h="6px" borderRadius="full" flexShrink={0}
                      style={{ background: viewMission.isActive ? "#4ade80" : "#94a3b8" }} />
                    <Text style={{ fontSize: "0.72rem", color: viewMission.isActive ? "#4ade80" : "#94a3b8" }}>
                      {viewMission.isActive ? t("admin.missions.statusActive") : t("admin.missions.statusInactive")}
                    </Text>
                  </Flex>
                  <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted }}>
                    {viewMission.createdAt.split("T")[0]}
                  </Text>
                </Flex>
              </Box>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}
