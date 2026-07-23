import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text, Input, Spinner } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MoreHorizontal, UserX, UserCheck, Coins, Trash2, X, ChevronLeft, ChevronRight, RefreshCw, FileSpreadsheet, ChevronDown } from "lucide-react";
import { adminUsersService, isDeletedAccount, type AdminUserDto } from "../../../services/admin/user.admin.services";
import { analyticsAdminService } from "../../../services/admin/analytics.admin.service";
import { useAdminTheme } from "./AdminThemeContext";
import { DailyVisitsChart, fillMissingDays } from "./DailyVisitsChart";
import { downloadXlsx } from "../../../utils/exportXlsx";

const MotionBox = motion.create(Box);

const AVATAR_COLORS = ["#4e7c6a", "#1a3a8a", "#a78bfa", "#fb923c", "#38bdf8", "#f97316", "#4ade80", "#c084fc", "#fbbf24", "#60a5fa"];

function ModalBackdrop({ onClose, loading }: { onClose: () => void; loading: boolean }) {
  return (
    <MotionBox position="fixed" inset={0} zIndex={300}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 } as any}
      onClick={() => !loading && onClose()}
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }} />
  );
}

function ModalCenter({ children }: { children: React.ReactNode }) {
  return (
    <Box position="fixed" inset={0} display="flex" alignItems="center" justifyContent="center"
      zIndex={310} style={{ pointerEvents: "none" }}>
      <Box style={{ pointerEvents: "auto" }}>{children}</Box>
    </Box>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string) {
  return iso.split("T")[0];
}

function getStatus(u: AdminUserDto): "active" | "inactive" | "banned" {
  if (u.isBanned) return "banned";
  if (!u.lastLoginAt) return "inactive";
  return "active";
}

const PAGE_SIZE = 20;

const STATUS_STYLE = {
  active:   { color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)"  },
  inactive: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
  banned:   { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)" },
};

export function UsersSection() {
  const { c } = useAdminTheme();
  const { t } = useTranslation();

  const formatLastSeen = useCallback((iso: string | null): string => {
    if (!iso) return t("admin.users.lastSeenNever");
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)     return t("admin.users.lastSeenNow");
    if (diff < 3600)   return t("admin.users.lastSeenMin",  { n: Math.floor(diff / 60) });
    if (diff < 86400)  return t("admin.users.lastSeenHour", { n: Math.floor(diff / 3600) });
    if (diff < 604800) return t("admin.users.lastSeenDay",  { n: Math.floor(diff / 86400) });
    return formatDate(iso);
  }, [t]);

  const [allUsers,     setAllUsers]     = useState<AdminUserDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [page,         setPage]         = useState(1);
  const [query,        setQuery]        = useState("");
  const [openMenu,     setOpenMenu]     = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [hoveredRow,    setHoveredRow]    = useState<string | null>(null);
  const [coinTarget,   setCoinTarget]   = useState<AdminUserDto | null>(null);
  const [coinAmount,   setCoinAmount]   = useState("");
  const [coinLoading,  setCoinLoading]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting,      setExporting]      = useState(false);

  const handleExport = async (days: 30 | 90) => {
    setExportMenuOpen(false);
    setExporting(true);
    try {
      const data = await analyticsAdminService.getUserGrowth(days);
      const filled = fillMissingDays(data, days);

      await downloadXlsx(`admin-export-${days}d-${new Date().toISOString().slice(0, 10)}.xlsx`, [
        {
          name: "Daily Visits",
          headers: [t("admin.users.exportColDate"), t("admin.users.exportColCount")],
          rows: filled.map(d => [d.date, d.count]),
        },
        {
          name: "Users",
          headers: [
            t("admin.users.colUser"), t("admin.users.colEmail"), t("admin.users.colPlan"),
            t("admin.users.colRole"), t("admin.users.colStatus"),
            t("admin.users.colJoined"), t("admin.users.colLastSeen"),
          ],
          rows: allUsers.map(u => {
            const status = getStatus(u);
            return [
              u.username ?? "",
              u.email ?? "",
              u.accountTier === "Premium" ? t("admin.users.planPremium") : t("admin.users.planFree"),
              u.role === "Admin" ? t("admin.users.roleAdmin") : t("admin.users.roleUser"),
              t(`admin.users.status${status.charAt(0).toUpperCase() + status.slice(1)}`),
              formatDate(u.createdAt),
              u.lastLoginAt ? formatDate(u.lastLoginAt) : t("admin.users.lastSeenNever"),
            ];
          }),
        },
      ]);
    } catch {
      // no-op: export failure is non-critical, user can retry
    } finally {
      setExporting(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await adminUsersService.getAllUsers();
      setAllUsers(items.filter(u => !isDeletedAccount(u)));
    } catch {
      setError(t("admin.users.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset to first page when the search query changes
  useEffect(() => { setPage(1); }, [query]);

  // Close action menu when clicking outside
  useEffect(() => {
    if (!openMenu) return;
    const handler = () => setOpenMenu(null);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenu]);

  // Close export menu when clicking outside
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handler = () => setExportMenuOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportMenuOpen]);

  const handleToggleBan = async (u: AdminUserDto) => {
    setActionLoading(u.id);
    setOpenMenu(null);
    try {
      if (u.isBanned) {
        await adminUsersService.unbanUser(u.id);
      } else {
        await adminUsersService.banUser(u.id);
      }
      setAllUsers(prev => prev.map(x => x.id === u.id ? { ...x, isBanned: !x.isBanned } : x));
    } catch {
      fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  const canConfirmCoins = coinAmount.trim() !== "" && Number(coinAmount) > 0;
  const handleAddCoins = async () => {
    if (!coinTarget || !canConfirmCoins) return;
    setCoinLoading(true);
    try {
      const amount = Number(coinAmount);
      await adminUsersService.addCoins(coinTarget.id, amount);
      setAllUsers(prev => prev.map(x => x.id === coinTarget.id ? { ...x, coinsBalance: x.coinsBalance + amount } : x));
      setCoinTarget(null);
    } catch {} finally { setCoinLoading(false); }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminUsersService.deleteUser(deleteTarget.id);
      setAllUsers(prev => prev.filter(x => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      fetchUsers();
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredAll = allUsers.filter(u =>
    (u.username ?? "").toLowerCase().includes(query.toLowerCase()) ||
    (u.email    ?? "").toLowerCase().includes(query.toLowerCase())
  );

  const totalUsersCount = allUsers.length;
  const totalCount  = filteredAll.length;
  const totalPages  = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const filtered    = filteredAll.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasPrev     = safePage > 1;
  const hasNext     = safePage < totalPages;

  const pageBanned   = allUsers.filter(u => u.isBanned).length;
  const pageActive   = allUsers.filter(u => !u.isBanned && !!u.lastLoginAt).length;
  const pageInactive = allUsers.filter(u => !u.isBanned && !u.lastLoginAt).length;
  const pagePremium  = allUsers.filter(u => u.accountTier === "Premium").length;

  return (
    <Box>
      {/* Stats */}
      <Flex gap={3} mb={5}>
        {([
          { label: t("admin.users.statTotal"),    value: totalUsersCount, color: c.cardText },
          { label: t("admin.users.statActive"),   value: pageActive,   color: "#4ade80"  },
          { label: t("admin.users.statInactive"), value: pageInactive, color: "#94a3b8"  },
          { label: t("admin.users.statBanned"),   value: pageBanned,   color: "#f87171"  },
          { label: t("admin.users.statPremium"),  value: pagePremium,  color: "#a78bfa"  },
        ] as { label: string; value: number; color: string }[]).map(s => (
          <Box key={s.label} borderRadius="10px" px={4} py={3}
            style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, flex: 1, transition: "background 0.3s" }}>
            <Text style={{ fontSize: "1.3rem", color: s.color, fontWeight: 600 }}>{s.value}</Text>
            <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted }}>{s.label}</Text>
          </Box>
        ))}
      </Flex>

      {/* Daily visits chart */}
      <DailyVisitsChart />

      {/* Toolbar */}
      <Flex align="center" gap={3} mb={4}>
        <Box flex={1} position="relative">
          <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" pointerEvents="none">
            <Search size={15} style={{ color: c.textDim }} />
          </Box>
          <Input
            placeholder={t("admin.users.searchPlaceholder")}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            style={{
              background:   c.cardBg,
              border:       `1px solid ${c.cardBorder}`,
              borderRadius: "10px",
              color:        c.cardText,
              fontSize:     "0.85rem",
              paddingLeft:  "38px",
              height:       "42px",
              outline:      "none",
              width:        "100%",
            }}
            _placeholder={{ color: c.cardTextMuted } as any}
            _focus={{ borderColor: "rgba(78,124,106,0.6)", boxShadow: "0 0 0 2px rgba(78,124,106,0.15)" } as any}
          />
        </Box>
        <Box
          as="button"
          onClick={() => fetchUsers()}
          display="flex" alignItems="center" justifyContent="center"
          w="42px" h="42px" borderRadius="10px" border="none" cursor="pointer" transition="all 0.18s"
          style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, color: c.textMuted, flexShrink: 0 }}
          _hover={{ background: c.navActive } as any}
        >
          <RefreshCw size={15} />
        </Box>

        {/* Export to Excel */}
        <Box position="relative" flexShrink={0}>
          <Box
            as="button"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setExportMenuOpen(v => !v); }}
            display="flex" alignItems="center" gap={2}
            h="42px" px={4} borderRadius="10px" border="none" cursor={exporting ? "not-allowed" : "pointer"} transition="all 0.18s"
            style={{
              background: exportMenuOpen ? c.navActive : c.cardBg,
              border: `1px solid ${c.cardBorder}`,
              color: c.textMuted,
              opacity: exporting ? 0.6 : 1,
            }}
            _hover={{ background: c.navActive } as any}
          >
            {exporting ? <Spinner size="xs" /> : <FileSpreadsheet size={15} />}
            <Text style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>{t("admin.users.exportExcel")}</Text>
            <ChevronDown size={13} />
          </Box>

          {exportMenuOpen && (
            <Box
              position="absolute" right={0} top="48px" zIndex={50}
              borderRadius="10px" overflow="hidden"
              style={{
                background:    "rgba(15,22,30,0.96)",
                backdropFilter:"blur(16px)",
                border:        "1px solid rgba(255,255,255,0.1)",
                boxShadow:     "0 12px 40px rgba(0,0,0,0.6)",
                minWidth:      170,
              }}
              onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Box
                as="button"
                w="full" textAlign="left"
                onClick={() => handleExport(30)}
                display="flex" alignItems="center" gap={2}
                px={4} py="10px" border="none" cursor="pointer" transition="background 0.15s"
                style={{ background: "transparent", color: c.cardText }}
                _hover={{ background: "rgba(255,255,255,0.05)" } as any}
              >
                <Text style={{ fontSize: "0.8rem" }}>{t("admin.users.exportDays30")}</Text>
              </Box>
              <Box
                as="button"
                w="full" textAlign="left"
                onClick={() => handleExport(90)}
                display="flex" alignItems="center" gap={2}
                px={4} py="10px" border="none" cursor="pointer" transition="background 0.15s"
                style={{ background: "transparent", color: c.cardText }}
                _hover={{ background: "rgba(255,255,255,0.05)" } as any}
              >
                <Text style={{ fontSize: "0.8rem" }}>{t("admin.users.exportDays90")}</Text>
              </Box>
            </Box>
          )}
        </Box>
      </Flex>

      {/* Table */}
      <Box borderRadius="14px" overflow="hidden" style={{ border: `1px solid ${c.cardBorder}` }}>
        {/* Header */}
        <Flex px={5} py={3} style={{ background: c.cardBg, borderBottom: `1px solid ${c.cardBorder}` }}>
          {[
            t("admin.users.colUser"), t("admin.users.colEmail"), t("admin.users.colPlan"),
            t("admin.users.colRole"), t("admin.users.colStatus"), t("admin.users.colJoined"),
            t("admin.users.colLastSeen"), t("admin.users.colActions"),
          ].map((h, i) => (
            <Text key={h} style={{
              fontSize: "0.65rem", color: c.cardTextMuted, letterSpacing: "0.1em",
              flex: [2, 2.5, 1, 1, 1, 1.2, 1.2, 0.8][i],
            }}>
              {h.toUpperCase()}
            </Text>
          ))}
        </Flex>

        {/* Content */}
        {loading ? (
          <Flex align="center" justify="center" py={16} gap={3}>
            <Spinner size="sm" style={{ color: "#4e7c6a" }} />
            <Text style={{ fontSize: "0.85rem", color: c.cardTextMuted }}>{t("admin.users.loading")}</Text>
          </Flex>
        ) : error ? (
          <Flex align="center" justify="center" py={12} direction="column" gap={3}>
            <Text style={{ fontSize: "0.85rem", color: "#f87171" }}>{error}</Text>
            <Box as="button" onClick={() => fetchUsers()} style={{
              fontSize: "0.8rem", color: "#4e7c6a", background: "transparent",
              border: "1px solid rgba(78,124,106,0.4)", borderRadius: "8px",
              padding: "6px 16px", cursor: "pointer",
            }}>
              {t("admin.users.retry")}
            </Box>
          </Flex>
        ) : filtered.length === 0 ? (
          <Flex align="center" justify="center" py={12}>
            <Text style={{ fontSize: "0.85rem", color: c.cardTextMuted }}>
              {query ? t("admin.users.noMatch") : t("admin.users.noData")}
            </Text>
          </Flex>
        ) : (
          filtered.map((u, i) => {
            const status = getStatus(u);
            const st     = STATUS_STYLE[status];
            const isPro  = u.accountTier === "Premium";
            const isAdminRole = u.role === "Admin";
            return (
              <Flex
                key={u.id}
                align="center"
                px={5}
                py="14px"
                position="relative"
                style={{
                  background:   hoveredRow === u.id ? "rgba(78,124,106,0.1)" : "transparent",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${c.rowDivider}` : "none",
                  transition:   "background 0.15s",
                  opacity:      actionLoading === u.id ? 0.5 : 1,
                }}
                onMouseEnter={() => setHoveredRow(u.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* User */}
                <Flex align="center" gap={2} style={{ flex: 2, minWidth: 0 }}>
                  <Flex align="center" justify="center" w="30px" h="30px" borderRadius="full" flexShrink={0}
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    <Text style={{ fontSize: "0.6rem", color: "white", fontWeight: 600 }}>
                      {initials(u.username ?? "?")}
                    </Text>
                  </Flex>
                  <Text style={{ fontSize: "0.82rem", color: c.cardText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.username ?? "—"}
                  </Text>
                </Flex>

                {/* Email */}
                <Text style={{ flex: 2.5, fontSize: "0.78rem", color: c.cardTextMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                  {u.email ?? "—"}
                </Text>

                {/* Plan */}
                <Box style={{ flex: 1 }}>
                  <Box display="inline-flex" borderRadius="full" px={2} py="2px" style={{
                    background: isPro ? "rgba(167,139,250,0.15)" : c.cardBorder,
                    border:     `1px solid ${isPro ? "rgba(167,139,250,0.3)" : c.cardBorder}`,
                  }}>
                    <Text style={{ fontSize: "0.65rem", color: isPro ? "#a78bfa" : c.cardTextMuted }}>
                      {isPro ? t("admin.users.planPremium") : t("admin.users.planFree")}
                    </Text>
                  </Box>
                </Box>

                {/* Role */}
                <Box style={{ flex: 1 }}>
                  {isAdminRole ? (
                    <Box display="inline-flex" borderRadius="full" px={2} py="2px" style={{
                      background: "rgba(78,124,106,0.15)",
                      border:     "1px solid rgba(78,124,106,0.3)",
                    }}>
                      <Text style={{ fontSize: "0.65rem", color: "#4e7c6a" }}>{t("admin.users.roleAdmin")}</Text>
                    </Box>
                  ) : (
                    <Text style={{ fontSize: "0.72rem", color: c.cardTextMuted }}>{t("admin.users.roleUser")}</Text>
                  )}
                </Box>

                {/* Status */}
                <Box style={{ flex: 1 }}>
                  <Flex align="center" gap="5px" display="inline-flex" borderRadius="full" px={2} py="2px"
                    style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                    <Box w="5px" h="5px" borderRadius="full" flexShrink={0} style={{ background: st.color }} />
                    <Text style={{ fontSize: "0.65rem", color: st.color }}>{t(`admin.users.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}</Text>
                  </Flex>
                </Box>

                {/* Joined */}
                <Text style={{ flex: 1.2, fontSize: "0.75rem", color: c.cardTextMuted }}>
                  {formatDate(u.createdAt)}
                </Text>

                {/* Last seen */}
                <Text style={{ flex: 1.2, fontSize: "0.75rem", color: c.cardTextMuted }}>
                  {formatLastSeen(u.lastLoginAt)}
                </Text>

                {/* Actions */}
                <Box style={{ flex: 0.8 }} position="relative">
                  {isAdminRole ? null : (
                    <>
                      <Box
                        as="button"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpenMenu(openMenu === u.id ? null : u.id); }}
                        display="flex" alignItems="center" justifyContent="center"
                        w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer" transition="all 0.15s"
                        style={{
                          background: openMenu === u.id ? c.navActive : c.cardBg,
                          color:      c.textMuted,
                        }}
                        _hover={{ background: c.navActive } as any}
                      >
                        {actionLoading === u.id
                          ? <Spinner size="xs" />
                          : <MoreHorizontal size={14} />
                        }
                      </Box>

                      {openMenu === u.id && (
                        <Box
                          position="absolute" right={0} top="34px" zIndex={50}
                          borderRadius="10px" overflow="hidden"
                          style={{
                            background:    "rgba(15,22,30,0.96)",
                            backdropFilter:"blur(16px)",
                            border:        "1px solid rgba(255,255,255,0.1)",
                            boxShadow:     "0 12px 40px rgba(0,0,0,0.6)",
                            minWidth:      160,
                          }}
                          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <Box
                            as="button"
                            w="full" textAlign="left"
                            onClick={() => { setOpenMenu(null); setCoinTarget(u); setCoinAmount(""); }}
                            display="flex" alignItems="center" gap={2}
                            px={4} py="10px" border="none" cursor="pointer" transition="background 0.15s"
                            style={{ background: "transparent", color: "#facc15" }}
                            _hover={{ background: "rgba(255,255,255,0.05)" } as any}
                          >
                            <Coins size={13} />
                            <Text style={{ fontSize: "0.8rem", color: "#facc15" }}>{t("admin.users.actionAddCoins")}</Text>
                          </Box>
                          <Box
                            as="button"
                            w="full" textAlign="left"
                            onClick={() => handleToggleBan(u)}
                            display="flex" alignItems="center" gap={2}
                            px={4} py="10px" border="none" cursor="pointer" transition="background 0.15s"
                            style={{
                              background: "transparent",
                              color:      u.isBanned ? "#4ade80" : "#f87171",
                            }}
                            _hover={{ background: "rgba(255,255,255,0.05)" } as any}
                          >
                            {u.isBanned
                              ? <><UserCheck size={13} /><Text style={{ fontSize: "0.8rem", color: "#4ade80" }}>{t("admin.users.actionUnban")}</Text></>
                              : <><UserX    size={13} /><Text style={{ fontSize: "0.8rem", color: "#f87171" }}>{t("admin.users.actionBan")}</Text></>
                            }
                          </Box>
                          <Box
                            as="button"
                            w="full" textAlign="left"
                            onClick={() => { setOpenMenu(null); setDeleteTarget(u); }}
                            display="flex" alignItems="center" gap={2}
                            px={4} py="10px" border="none" cursor="pointer" transition="background 0.15s"
                            style={{ background: "transparent", color: "#f87171" }}
                            _hover={{ background: "rgba(255,255,255,0.05)" } as any}
                          >
                            <Trash2 size={13} />
                            <Text style={{ fontSize: "0.8rem", color: "#f87171" }}>{t("admin.users.actionDelete")}</Text>
                          </Box>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </Flex>
            );
          })
        )}
      </Box>

      {/* Footer: count + pagination */}
      <Flex align="center" justify="space-between" mt={3}>
        <Text style={{ fontSize: "0.72rem", color: c.cardTextMuted }}>
          {loading ? t("admin.users.loading") : t("admin.users.showing", { shown: filtered.length, total: totalCount })}
        </Text>

        {totalPages > 1 && (
          <Flex align="center" gap={2}>
            <Box
              as="button"
              onClick={() => hasPrev && setPage(p => p - 1)}
              display="flex" alignItems="center" justifyContent="center"
              w="30px" h="30px" borderRadius="8px" border="none"
              cursor={hasPrev ? "pointer" : "not-allowed"}
              transition="all 0.15s"
              style={{
                background: c.cardBg,
                border:     `1px solid ${c.cardBorder}`,
                color:      hasPrev ? c.textMuted : c.textSub,
                opacity:    hasPrev ? 1 : 0.4,
              }}
              _hover={hasPrev ? { background: c.navActive } as any : {}}
            >
              <ChevronLeft size={14} />
            </Box>

            <Text style={{ fontSize: "0.78rem", color: c.textMuted, minWidth: "60px", textAlign: "center" }}>
              {safePage} / {totalPages}
            </Text>

            <Box
              as="button"
              onClick={() => hasNext && setPage(p => p + 1)}
              display="flex" alignItems="center" justifyContent="center"
              w="30px" h="30px" borderRadius="8px" border="none"
              cursor={hasNext ? "pointer" : "not-allowed"}
              transition="all 0.15s"
              style={{
                background: c.cardBg,
                border:     `1px solid ${c.cardBorder}`,
                color:      hasNext ? c.textMuted : c.textSub,
                opacity:    hasNext ? 1 : 0.4,
              }}
              _hover={hasNext ? { background: c.navActive } as any : {}}
            >
              <ChevronRight size={14} />
            </Box>
          </Flex>
        )}
      </Flex>

      {/* Add Coins modal */}
      <AnimatePresence>
        {coinTarget && (
          <>
            <ModalBackdrop onClose={() => setCoinTarget(null)} loading={coinLoading} />
            <ModalCenter>
              <MotionBox style={{ width: "360px" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] } as any}>
                <Box borderRadius="16px" p={6} style={{
                  background: c.panelBg, backdropFilter: "blur(20px)",
                  border: `1px solid ${c.panelBorder}`, boxShadow: c.panelShadow,
                }}>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Text style={{ fontSize: "0.9rem", color: "#facc15", fontWeight: 600 }}>
                      {t("admin.users.addCoinsTitle")}
                    </Text>
                    <Box as="button" onClick={() => !coinLoading && setCoinTarget(null)}
                      display="flex" alignItems="center" justifyContent="center"
                      w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer"
                      style={{ background: c.cardBg, color: c.textMuted }}>
                      <X size={13} />
                    </Box>
                  </Flex>
                  <Text mb={4} style={{ fontSize: "0.82rem", color: c.cardTextMuted }}>
                    {coinTarget.username ?? coinTarget.email ?? "—"}
                    {" · "}
                    {coinTarget.coinsBalance.toLocaleString("vi-VN")} coin
                  </Text>
                  <Box mb={5}>
                    <Text as="label" style={{ fontSize: "0.7rem", color: c.cardTextMuted, letterSpacing: "0.08em", marginBottom: 6, display: "block" }}>
                      {t("admin.users.addCoinsLabel").toUpperCase()}
                    </Text>
                    <Input
                      value={coinAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoinAmount(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="0"
                      style={{
                        background:   c.cardBg,
                        border:       `1px solid ${c.cardBorder}`,
                        borderRadius: "8px",
                        color:        c.cardText,
                        fontSize:     "0.85rem",
                        height:       "38px",
                        outline:      "none",
                        width:        "100%",
                        paddingLeft:  12,
                        paddingRight: 12,
                      }}
                    />
                  </Box>
                  <Flex justify="flex-end" gap={2}>
                    <Box as="button" onClick={() => !coinLoading && setCoinTarget(null)}
                      style={{
                        background:   c.cardBg,
                        color:        c.textMuted,
                        fontSize:     "0.82rem",
                        border:       `1px solid ${c.cardBorder}`,
                        borderRadius: "8px",
                        cursor:       "pointer",
                        padding:      "8px 16px",
                      }}>
                      {t("admin.users.addCoinsCancel")}
                    </Box>
                    <Box as="button" onClick={() => !(coinLoading || !canConfirmCoins) && handleAddCoins()}
                      display="flex" alignItems="center" gap={2}
                      px={4} py="8px" borderRadius="8px" border="none"
                      cursor={(coinLoading || !canConfirmCoins) ? "not-allowed" : "pointer"}
                      style={{
                        background: "rgba(250,204,21,0.15)",
                        outline: "1px solid rgba(250,204,21,0.4)",
                        color: "#facc15",
                        fontSize: "0.82rem",
                        opacity: (coinLoading || !canConfirmCoins) ? 0.45 : 1,
                      }}>
                      <Coins size={13} />
                      {coinLoading ? "…" : t("admin.users.addCoinsConfirm")}
                    </Box>
                  </Flex>
                </Box>
              </MotionBox>
            </ModalCenter>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <ModalBackdrop onClose={() => setDeleteTarget(null)} loading={deleteLoading} />
            <ModalCenter>
              <MotionBox style={{ width: "340px" }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] } as any}>
                <Box borderRadius="16px" p={6} style={{
                  background: c.panelBg, backdropFilter: "blur(20px)",
                  border: `1px solid ${c.panelBorder}`, boxShadow: c.panelShadow,
                }}>
                  <Text style={{ fontSize: "0.9rem", color: c.cardText, fontWeight: 600, marginBottom: 6 }}>
                    {t("admin.users.deleteConfirm")}
                  </Text>
                  <Text style={{ fontSize: "0.78rem", color: c.cardTextMuted, marginBottom: 20 }}>
                    {deleteTarget.username ?? deleteTarget.email ?? "—"} · {t("admin.users.deleteNote")}
                  </Text>
                  <Flex justify="flex-end" gap={2}>
                    <Box as="button" onClick={() => !deleteLoading && setDeleteTarget(null)}
                      style={{
                        background:   c.cardBg,
                        color:        c.textMuted,
                        fontSize:     "0.82rem",
                        border:       `1px solid ${c.cardBorder}`,
                        borderRadius: "8px",
                        cursor:       "pointer",
                        padding:      "8px 16px",
                      }}>
                      {t("admin.users.cancel")}
                    </Box>
                    <Box as="button" onClick={() => !deleteLoading && handleDeleteUser()}
                      display="flex" alignItems="center" gap={2}
                      px={4} py="8px" borderRadius="8px" border="none"
                      cursor={deleteLoading ? "not-allowed" : "pointer"}
                      style={{
                        background: "rgba(248,113,113,0.15)",
                        outline: "1px solid rgba(248,113,113,0.4)",
                        color: "#f87171",
                        fontSize: "0.82rem",
                        opacity: deleteLoading ? 0.6 : 1,
                      }}>
                      <Trash2 size={13} />
                      {deleteLoading ? "…" : t("admin.users.delete")}
                    </Box>
                  </Flex>
                </Box>
              </MotionBox>
            </ModalCenter>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
}
