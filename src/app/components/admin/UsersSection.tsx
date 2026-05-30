import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Text, Input, Spinner } from "@chakra-ui/react";
import { Search, MoreHorizontal, UserX, UserCheck, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { adminUsersService, type AdminUserDto } from "../../../services/admin/user.admin.services";
import { useAdminTheme } from "./AdminThemeContext";

const AVATAR_COLORS = ["#4e7c6a", "#1a3a8a", "#a78bfa", "#fb923c", "#38bdf8", "#f97316", "#4ade80", "#c084fc", "#fbbf24", "#60a5fa"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string) {
  return iso.split("T")[0];
}

function formatLastSeen(iso: string | null): string {
  if (!iso) return "Never";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(iso);
}

function getStatus(u: AdminUserDto): "active" | "inactive" | "banned" {
  if (u.isBanned) return "banned";
  if (!u.lastLoginAt) return "inactive";
  return "active";
}

const STATUS_CFG = {
  active:   { label: "Active",   color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)"  },
  inactive: { label: "Inactive", color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
  banned:   { label: "Banned",   color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)" },
};

export function UsersSection() {
  const { c } = useAdminTheme();

  const [users,        setUsers]        = useState<AdminUserDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);
  const [hasNext,      setHasNext]      = useState(false);
  const [hasPrev,      setHasPrev]      = useState(false);
  const [query,        setQuery]        = useState("");
  const [openMenu,     setOpenMenu]     = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminUsersService.getUsers(p, 20);
      setUsers(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setHasNext(result.hasNext);
      setHasPrev(result.hasPrevious);
    } catch {
      setError("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(page); }, [page, fetchUsers]);

  // Close action menu when clicking outside
  useEffect(() => {
    if (!openMenu) return;
    const handler = () => setOpenMenu(null);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenu]);

  const handleToggleBan = async (u: AdminUserDto) => {
    setActionLoading(u.id);
    setOpenMenu(null);
    try {
      if (u.isBanned) {
        await adminUsersService.unbanUser(u.id);
      } else {
        await adminUsersService.banUser(u.id);
      }
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isBanned: !x.isBanned } : x));
    } catch {
      fetchUsers(page);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(u =>
    (u.username ?? "").toLowerCase().includes(query.toLowerCase()) ||
    (u.email    ?? "").toLowerCase().includes(query.toLowerCase())
  );

  const pageBanned   = users.filter(u => u.isBanned).length;
  const pageActive   = users.filter(u => !u.isBanned && !!u.lastLoginAt).length;
  const pageInactive = users.filter(u => !u.isBanned && !u.lastLoginAt).length;
  const pagePremium  = users.filter(u => u.accountTier === "Premium").length;

  return (
    <Box>
      {/* Stats */}
      <Flex gap={3} mb={5}>
        {[
          { label: "Total",    value: totalCount,   color: c.cardText    },
          { label: "Active",   value: pageActive,   color: "#4ade80"     },
          { label: "Inactive", value: pageInactive, color: "#94a3b8"     },
          { label: "Banned",   value: pageBanned,   color: "#f87171"     },
          { label: "Premium",  value: pagePremium,  color: "#a78bfa"     },
        ].map(s => (
          <Box key={s.label} borderRadius="10px" px={4} py={3}
            style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, flex: 1, transition: "background 0.3s" }}>
            <Text style={{ fontSize: "1.3rem", color: s.color, fontWeight: 600 }}>{s.value}</Text>
            <Text style={{ fontSize: "0.7rem", color: c.cardTextMuted }}>{s.label}</Text>
          </Box>
        ))}
      </Flex>

      {/* Toolbar */}
      <Flex align="center" gap={3} mb={4}>
        <Box flex={1} position="relative">
          <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" pointerEvents="none">
            <Search size={15} style={{ color: c.textDim }} />
          </Box>
          <Input
            placeholder="Search by name or email..."
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
          onClick={() => fetchUsers(page)}
          display="flex" alignItems="center" justifyContent="center"
          w="42px" h="42px" borderRadius="10px" border="none" cursor="pointer" transition="all 0.18s"
          style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, color: c.textMuted, flexShrink: 0 }}
          _hover={{ background: c.navActive } as any}
        >
          <RefreshCw size={15} />
        </Box>
      </Flex>

      {/* Table */}
      <Box borderRadius="14px" overflow="hidden" style={{ border: `1px solid ${c.cardBorder}` }}>
        {/* Header */}
        <Flex px={5} py={3} style={{ background: c.cardBg, borderBottom: `1px solid ${c.cardBorder}` }}>
          {["User", "Email", "Plan", "Role", "Status", "Joined", "Last Seen", "Actions"].map((h, i) => (
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
            <Text style={{ fontSize: "0.85rem", color: c.cardTextMuted }}>Loading users...</Text>
          </Flex>
        ) : error ? (
          <Flex align="center" justify="center" py={12} direction="column" gap={3}>
            <Text style={{ fontSize: "0.85rem", color: "#f87171" }}>{error}</Text>
            <Box as="button" onClick={() => fetchUsers(page)} style={{
              fontSize: "0.8rem", color: "#4e7c6a", background: "transparent",
              border: "1px solid rgba(78,124,106,0.4)", borderRadius: "8px",
              padding: "6px 16px", cursor: "pointer",
            }}>
              Thử lại
            </Box>
          </Flex>
        ) : filtered.length === 0 ? (
          <Flex align="center" justify="center" py={12}>
            <Text style={{ fontSize: "0.85rem", color: c.cardTextMuted }}>
              {query ? "Không tìm thấy người dùng phù hợp" : "Không có dữ liệu"}
            </Text>
          </Flex>
        ) : (
          filtered.map((u, i) => {
            const status = getStatus(u);
            const st     = STATUS_CFG[status];
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
                  background:   i % 2 === 0 ? "transparent" : `${c.cardBg}44`,
                  borderBottom: i < filtered.length - 1 ? `1px solid ${c.rowDivider}` : "none",
                  transition:   "background 0.15s",
                  opacity:      actionLoading === u.id ? 0.5 : 1,
                }}
                _hover={{ background: c.navHover } as any}
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
                      {isPro ? "PREMIUM" : "FREE"}
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
                      <Text style={{ fontSize: "0.65rem", color: "#4e7c6a" }}>ADMIN</Text>
                    </Box>
                  ) : (
                    <Text style={{ fontSize: "0.72rem", color: c.cardTextMuted }}>User</Text>
                  )}
                </Box>

                {/* Status */}
                <Box style={{ flex: 1 }}>
                  <Flex align="center" gap="5px" display="inline-flex" borderRadius="full" px={2} py="2px"
                    style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                    <Box w="5px" h="5px" borderRadius="full" flexShrink={0} style={{ background: st.color }} />
                    <Text style={{ fontSize: "0.65rem", color: st.color }}>{st.label}</Text>
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
                              ? <><UserCheck size={13} /><Text style={{ fontSize: "0.8rem", color: "#4ade80" }}>Unban</Text></>
                              : <><UserX    size={13} /><Text style={{ fontSize: "0.8rem", color: "#f87171" }}>Ban</Text></>
                            }
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
          {loading ? "Loading..." : `Showing ${filtered.length} of ${totalCount} users`}
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
              {page} / {totalPages}
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
    </Box>
  );
}
