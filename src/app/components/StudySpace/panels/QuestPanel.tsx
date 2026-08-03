import { useEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion } from "motion/react";
import { Trophy, Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LoadingRing } from "../../ui/LoadingRing";
import { PanelCloseBtn } from "../ui/PanelCloseBtn";
import { useCenteredPanel } from "../hooks/useCenteredPanel";
import { questService, getPremiumBonusReward, type Quest, type QuestCategory } from "../../../../services/quest.service";
import { coinService } from "../../../../services/coin.service";
import { useAuth } from "../../../../context/AuthContext";

const MotionBox = motion.create(Box);

const PANEL_W = 420;
const PANEL_H = 540;

const CATEGORY_KEYS: Record<QuestCategory, string> = {
  daily: "quest.daily",
  weekly: "quest.weekly",
  achievement: "quest.achievement",
};

const TABS: QuestCategory[] = ["daily", "weekly", "achievement"];

function ProgressBar({ progress, target, color }: { progress: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((progress / target) * 100));
  return (
    <Box
      w="100%"
      h="4px"
      borderRadius="full"
      style={{ background: "rgba(255,255,255,0.08)" }}
      mt="6px"
    >
      <Box
        h="100%"
        borderRadius="full"
        style={{
          width: `${pct}%`,
          background: color,
          transition: "width 0.4s ease",
        }}
      />
    </Box>
  );
}

function QuestCard({
  quest,
  onClaim,
  claiming,
  isPremiumUser,
}: {
  quest: Quest;
  onClaim: (id: string) => void;
  claiming: boolean;
  isPremiumUser?: boolean;
}) {
  const { t } = useTranslation();
  const isClaimed = quest.status === "claimed";
  const isClaimable = quest.status === "claimable";
  const isActive = quest.status === "active";
  const hasBonus = !isClaimed && isPremiumUser && quest.reward > 0;
  const bonusReward = hasBonus ? getPremiumBonusReward(quest.reward) : null;

  const barColor = isClaimed
    ? "rgba(255,255,255,0.2)"
    : isClaimable
    ? "#4ade80"
    : quest.category === "daily"
    ? "#60a5fa"
    : quest.category === "weekly"
    ? "#a78bfa"
    : "#fbbf24";

  return (
    <Box
      borderRadius="12px"
      px="12px"
      py="10px"
      style={{
        background: isClaimed
          ? "rgba(255,255,255,0.02)"
          : isClaimable
          ? "rgba(74,222,128,0.06)"
          : "rgba(255,255,255,0.04)",
        border: isClaimable
          ? "1px solid rgba(74,222,128,0.25)"
          : "1px solid rgba(255,255,255,0.07)",
        opacity: isClaimed ? 0.5 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <Flex align="flex-start" gap={3}>
        {/* Icon */}
        <Box
          flexShrink={0}
          style={{
            width: 28,
            height: 28,
            borderRadius: "8px",
            background: `${barColor}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <quest.icon size={15} color={barColor} />
        </Box>

        {/* Content */}
        <Box flex={1} minW={0}>
          <Flex align="center" justify="space-between" gap={2}>
            <Text
              style={{
                fontSize: "0.82rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                color: isClaimed ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.9)",
                fontWeight: 600,
              }}
            >
              {quest.title}
            </Text>

            {/* Reward badge */}
            <Flex align="center" gap="4px" flexShrink={0} wrap="wrap" justify="flex-end">
              {hasBonus && (
                <Text
                  style={{
                    fontSize: "0.62rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.35)",
                    textDecoration: "line-through",
                  }}
                >
                  {quest.reward.toLocaleString("vi-VN")}₫
                </Text>
              )}
              <Flex
                align="center"
                gap="3px"
                style={{
                  padding: "2px 7px",
                  borderRadius: "20px",
                  fontSize: "0.68rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  fontWeight: 600,
                  background: isClaimed ? "rgba(255,255,255,0.06)" : "rgba(250,204,21,0.12)",
                  border: isClaimed ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(250,204,21,0.3)",
                  color: isClaimed ? "rgba(255,255,255,0.3)" : "#facc15",
                }}
              >
                <Coins size={9} />
                {hasBonus ? bonusReward!.toLocaleString("vi-VN") : quest.reward.toLocaleString("vi-VN")}₫
              </Flex>
            </Flex>
          </Flex>

          <Text
            mt="2px"
            style={{
              fontSize: "0.72rem",
              fontFamily: "'HarmonyOS Sans', sans-serif",
              color: "rgba(255,255,255,0.38)",
              lineHeight: 1.4,
            }}
          >
            {quest.description}
          </Text>

          {/* Progress */}
          {!isClaimed && (
            <>
              <Flex align="center" justify="space-between" mt="8px">
                <Text
                  style={{
                    fontSize: "0.68rem",
                    fontFamily: "'HarmonyOS Sans', sans-serif",
                    color: isClaimable ? "#4ade80" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {isClaimable ? t("quest.claimable") : `${quest.progress} / ${quest.target}`}
                </Text>

                {isClaimable && (
                  <Box
                    as="button"
                    onClick={() => !claiming && onClaim(quest.id)}
                    style={{
                      padding: "3px 10px",
                      borderRadius: "8px",
                      fontSize: "0.7rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      fontWeight: 700,
                      background: claiming ? "rgba(74,222,128,0.15)" : "rgba(74,222,128,0.2)",
                      border: "1px solid rgba(74,222,128,0.4)",
                      color: "#4ade80",
                      cursor: claiming ? "not-allowed" : "pointer",
                      transition: "opacity 0.15s",
                      opacity: claiming ? 0.6 : 1,
                    }}
                  >
                    {claiming ? "…" : t("quest.claim")}
                  </Box>
                )}

                {isActive && (
                  <Text
                    style={{
                      fontSize: "0.65rem",
                      fontFamily: "'HarmonyOS Sans', sans-serif",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    {Math.round((quest.progress / quest.target) * 100)}%
                  </Text>
                )}
              </Flex>

              <ProgressBar progress={quest.progress} target={quest.target} color={barColor} />
            </>
          )}

          {isClaimed && (
            <Text
              mt="4px"
              style={{
                fontSize: "0.68rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                color: "rgba(255,255,255,0.22)",
              }}
            >
              {t("quest.completed")}
            </Text>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

export function QuestPanel({
  onClose,
  onBalanceChange,
  currentCoinBalance = 0,
}: {
  onClose: () => void;
  onBalanceChange?: (newBalance: number) => void;
  currentCoinBalance?: number;
}) {
  const { x, y, ref } = useCenteredPanel(PANEL_W, PANEL_H);
  const { user } = useAuth();
  const { t } = useTranslation();
  const isPremiumUser = user?.accountTier?.toLowerCase() === "premium";

  const [tab, setTab] = useState<QuestCategory>("daily");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    questService.getQuests().then((data) => {
      setQuests(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handleClaim = async (questId: string) => {
    if (claimingId) return;
    setClaimingId(questId);
    try {
      await questService.claimReward(questId);
      setQuests(prev =>
        prev.map(q => q.id === questId ? { ...q, status: "claimed" } : q)
      );
      const { balance } = await coinService.getBalance();
      onBalanceChange?.(balance);
    } catch {
      // ignore errors silently
    } finally {
      setClaimingId(null);
    }
  };

  const visibleQuests = quests.filter(q => q.category === tab);
  const claimableCount = quests.filter(q => q.status === "claimable").length;

  return (
    <MotionBox
      ref={ref as any}
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 24, mass: 0.9 } } as any}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } } as any}
      position="fixed"
      top={0}
      left={0}
      zIndex={50}
      style={{
        x, y,
        width: PANEL_W,
        height: PANEL_H,
        borderRadius: "16px",
        background: "rgba(12,18,22,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        cursor: "grab",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <Box pl="18px" pr="56px" pt="18px" pb="14px" flexShrink={0}>
        <PanelCloseBtn onClose={onClose} />

        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Trophy size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
            <Text
              style={{
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.1em",
                fontFamily: "'HarmonyOS Sans', sans-serif",
              }}
            >
              {t("quest.title").toUpperCase()}
            </Text>
          </Flex>

          {claimableCount > 0 && (
            <Flex
              align="center"
              style={{
                padding: "2px 8px",
                borderRadius: "20px",
                fontSize: "0.65rem",
                fontFamily: "'HarmonyOS Sans', sans-serif",
                fontWeight: 700,
                background: "rgba(74,222,128,0.15)",
                border: "1px solid rgba(74,222,128,0.35)",
                color: "#4ade80",
              }}
            >
              {t("quest.canClaim", { count: claimableCount })}
            </Flex>
          )}
        </Flex>

        {/* ── Tabs ── */}
        <Flex gap={1} mt="12px" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "10px" }}>
          {TABS.map((cat) => {
            const count = quests.filter(q => q.category === cat && q.status === "claimable").length;
            const active = tab === cat;
            return (
              <Box
                key={cat}
                as="button"
                onClick={() => setTab(cat)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.76rem",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : "rgba(255,255,255,0.45)",
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  border: "none",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {t(CATEGORY_KEYS[cat])}
                {count > 0 && (
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#4ade80",
                      flexShrink: 0,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Flex>
      </Box>

      {/* ── Quest list ── */}
      <Box
        flex={1}
        px="18px"
        pb="18px"
        style={{ overflowY: "auto" }}
      >
        {loading ? (
          <Flex h="100%" align="center" justify="center" direction="column" gap="12px">
            <LoadingRing size={28} />
            <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
              {t("quest.loading")}
            </Text>
          </Flex>
        ) : (
          <Flex direction="column" gap={2}>
            {visibleQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onClaim={handleClaim}
                claiming={claimingId === quest.id}
                isPremiumUser={isPremiumUser}
              />
            ))}
          </Flex>
        )}
      </Box>
    </MotionBox>
  );
}
