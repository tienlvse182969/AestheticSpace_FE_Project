import { useState } from "react";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { Search, ShieldBan, ShieldCheck, MoreHorizontal, UserX, UserCheck } from "lucide-react";

type UserStatus = "active" | "inactive" | "banned";
type UserPlan = "free" | "pro";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  plan: UserPlan;
  status: UserStatus;
  joined: string;
  lastSeen: string;
}

const MOCK_USERS: AdminUser[] = [
  { id: 1, name: "Nguyen Van An",    email: "van.an@gmail.com",        plan: "free", status: "active",   joined: "2025-12-01", lastSeen: "2 hours ago"  },
  { id: 2, name: "Tran Thi Bich",   email: "bich.tran@outlook.com",   plan: "pro",  status: "active",   joined: "2026-01-15", lastSeen: "1 day ago"    },
  { id: 3, name: "Le Minh Duc",     email: "minhduc@gmail.com",       plan: "free", status: "inactive", joined: "2025-11-20", lastSeen: "5 days ago"   },
  { id: 4, name: "Pham Thu Ha",     email: "thuha.pham@gmail.com",    plan: "pro",  status: "active",   joined: "2026-02-08", lastSeen: "30 min ago"   },
  { id: 5, name: "Hoang Van Long",  email: "vanlong@yahoo.com",       plan: "free", status: "active",   joined: "2026-03-11", lastSeen: "Just now"     },
  { id: 6, name: "Vo Thi Mai",      email: "mai.vo@gmail.com",        plan: "free", status: "banned",   joined: "2025-10-05", lastSeen: "2 weeks ago"  },
  { id: 7, name: "Dang Quoc Hung",  email: "quochung@gmail.com",      plan: "pro",  status: "active",   joined: "2026-01-22", lastSeen: "3 hours ago"  },
  { id: 8, name: "Ly Thi Kim",      email: "kimly@gmail.com",         plan: "free", status: "active",   joined: "2026-04-14", lastSeen: "15 min ago"   },
  { id: 9, name: "Bui Thanh Tung",  email: "buithanhtung@gmail.com",  plan: "pro",  status: "active",   joined: "2025-09-30", lastSeen: "4 hours ago"  },
  { id: 10, name: "Cao Minh Tri",   email: "caoминhtri@gmail.com",    plan: "free", status: "inactive", joined: "2025-08-17", lastSeen: "3 weeks ago"  },
];

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; bg: string; border: string }> = {
  active:   { label: "Active",    color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)"  },
  inactive: { label: "Inactive",  color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
  banned:   { label: "Banned",    color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)" },
};

const AVATAR_COLORS = ["#4e7c6a", "#1a3a8a", "#a78bfa", "#fb923c", "#38bdf8", "#f97316", "#4ade80", "#c084fc", "#fbbf24", "#60a5fa"];

function initials(name: string) {
  return name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
}

export function UsersSection() {
  const [query, setQuery]     = useState("");
  const [users, setUsers]     = useState<AdminUser[]>(MOCK_USERS);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  const toggleBan = (id: number) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === "banned" ? "active" : "banned" } : u
    ));
    setOpenMenu(null);
  };

  const stats = {
    total:    users.length,
    active:   users.filter(u => u.status === "active").length,
    inactive: users.filter(u => u.status === "inactive").length,
    banned:   users.filter(u => u.status === "banned").length,
    pro:      users.filter(u => u.plan === "pro").length,
  };

  return (
    <Box>
      {/* Top stats */}
      <Flex gap={3} mb={5}>
        {[
          { label: "Total",    value: stats.total,    color: "rgba(255,255,255,0.6)" },
          { label: "Active",   value: stats.active,   color: "#4ade80" },
          { label: "Inactive", value: stats.inactive, color: "#94a3b8" },
          { label: "Banned",   value: stats.banned,   color: "#f87171" },
          { label: "Pro Plan", value: stats.pro,      color: "#a78bfa" },
        ].map(s => (
          <Box
            key={s.label}
            borderRadius="10px"
            px={4}
            py={3}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              flex: 1,
            }}
          >
            <Text style={{ fontSize: "1.3rem", color: s.color, fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>
              {s.value}
            </Text>
            <Text style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {s.label}
            </Text>
          </Box>
        ))}
      </Flex>

      {/* Search */}
      <Box mb={4} position="relative">
        <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" pointerEvents="none">
          <Search size={15} style={{ color: "rgba(255,255,255,0.3)" }} />
        </Box>
        <Input
          placeholder="Search by name or email..."
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            color: "rgba(255,255,255,0.85)",
            fontSize: "0.85rem",
            paddingLeft: "38px",
            height: "42px",
            outline: "none",
            width: "100%",
            fontFamily: "'HarmonyOS Sans', sans-serif",
          }}
          _placeholder={{ color: "rgba(255,255,255,0.2)" }}
          _focus={{ borderColor: "rgba(78,124,106,0.6)", boxShadow: "0 0 0 2px rgba(78,124,106,0.15)" } as any}
        />
      </Box>

      {/* Table */}
      <Box borderRadius="14px" overflow="hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Header */}
        <Flex
          px={5}
          py={3}
          style={{
            background: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {["User", "Email", "Plan", "Status", "Joined", "Last Seen", "Actions"].map((h, i) => (
            <Text
              key={h}
              style={{
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.1em",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                flex: [2, 2.5, 1, 1, 1.2, 1.2, 0.8][i],
              }}
            >
              {h.toUpperCase()}
            </Text>
          ))}
        </Flex>

        {/* Rows */}
        {filtered.length === 0 ? (
          <Flex align="center" justify="center" py={12}>
            <Text style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              No users found
            </Text>
          </Flex>
        ) : (
          filtered.map((u, i) => {
            const st = STATUS_CONFIG[u.status];
            return (
              <Flex
                key={u.id}
                align="center"
                px={5}
                py="14px"
                position="relative"
                style={{
                  background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  transition: "background 0.15s",
                }}
                _hover={{ background: "rgba(255,255,255,0.04)" } as any}
              >
                {/* User */}
                <Flex align="center" gap={2} style={{ flex: 2 }}>
                  <Flex
                    align="center"
                    justify="center"
                    w="30px"
                    h="30px"
                    borderRadius="full"
                    flexShrink={0}
                    style={{ background: AVATAR_COLORS[(u.id - 1) % AVATAR_COLORS.length] }}
                  >
                    <Text style={{ fontSize: "0.6rem", color: "white", fontFamily: "'HarmonyOS Sans', sans-serif", fontWeight: 600 }}>
                      {initials(u.name)}
                    </Text>
                  </Flex>
                  <Text style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.82)", fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.name}
                  </Text>
                </Flex>

                {/* Email */}
                <Text style={{ flex: 2.5, fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", fontFamily: "'HarmonyOS Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                  {u.email}
                </Text>

                {/* Plan */}
                <Box style={{ flex: 1 }}>
                  <Box
                    display="inline-flex"
                    borderRadius="full"
                    px={2}
                    py="2px"
                    style={{
                      background: u.plan === "pro" ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${u.plan === "pro" ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <Text style={{ fontSize: "0.65rem", color: u.plan === "pro" ? "#a78bfa" : "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {u.plan.toUpperCase()}
                    </Text>
                  </Box>
                </Box>

                {/* Status */}
                <Box style={{ flex: 1 }}>
                  <Flex
                    align="center"
                    gap="5px"
                    display="inline-flex"
                    borderRadius="full"
                    px={2}
                    py="2px"
                    style={{ background: st.bg, border: `1px solid ${st.border}` }}
                  >
                    <Box w="5px" h="5px" borderRadius="full" style={{ background: st.color, flexShrink: 0 }} />
                    <Text style={{ fontSize: "0.65rem", color: st.color, fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                      {st.label}
                    </Text>
                  </Flex>
                </Box>

                {/* Joined */}
                <Text style={{ flex: 1.2, fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {u.joined}
                </Text>

                {/* Last seen */}
                <Text style={{ flex: 1.2, fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
                  {u.lastSeen}
                </Text>

                {/* Actions */}
                <Box style={{ flex: 0.8 }} position="relative">
                  <Box
                    as="button"
                    onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    w="28px"
                    h="28px"
                    borderRadius="7px"
                    border="none"
                    cursor="pointer"
                    transition="all 0.15s"
                    style={{
                      background: openMenu === u.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    <MoreHorizontal size={14} />
                  </Box>

                  {openMenu === u.id && (
                    <Box
                      position="absolute"
                      right={0}
                      top="34px"
                      zIndex={50}
                      borderRadius="10px"
                      overflow="hidden"
                      style={{
                        background: "rgba(15,22,30,0.96)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                        minWidth: 160,
                      }}
                    >
                      <Box
                        as="button"
                        w="full"
                        textAlign="left"
                        onClick={() => toggleBan(u.id)}
                        display="flex"
                        alignItems="center"
                        gap={2}
                        px={4}
                        py="10px"
                        border="none"
                        cursor="pointer"
                        transition="background 0.15s"
                        style={{
                          background: "transparent",
                          color: u.status === "banned" ? "#4ade80" : "#f87171",
                        }}
                        _hover={{ background: "rgba(255,255,255,0.05)" } as any}
                      >
                        {u.status === "banned"
                          ? <><UserCheck size={13} /><Text style={{ fontSize: "0.8rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "#4ade80" }}>Unban User</Text></>
                          : <><UserX size={13} /><Text style={{ fontSize: "0.8rem", fontFamily: "'HarmonyOS Sans', sans-serif", color: "#f87171" }}>Ban User</Text></>
                        }
                      </Box>
                    </Box>
                  )}
                </Box>
              </Flex>
            );
          })
        )}
      </Box>

      <Text mt={3} style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
        Showing {filtered.length} of {users.length} users
      </Text>
    </Box>
  );
}
