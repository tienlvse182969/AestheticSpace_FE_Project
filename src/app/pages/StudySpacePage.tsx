import { useState, useEffect } from "react";
import { Box } from "@chakra-ui/react";
import { useLocation } from "react-router";
import { useStudySpace } from "../hooks/studyspace/useStudySpace";
import { SpaceBackground }   from "../components/StudySpace/sections/SpaceBackground";
import { SpacePanels }       from "../components/StudySpace/sections/SpacePanels";
import { SpaceWidgets }      from "../components/StudySpace/sections/SpaceWidgets";
import { SpaceToolbar }      from "../components/StudySpace/sections/SpaceToolbar";
import { SpaceContextMenu }  from "../components/StudySpace/ui/SpaceContextMenu";
import { FirstRoomModal }    from "../components/StudySpace/ui/FirstRoomModal";
import { WelcomeGreeting }  from "../components/StudySpace/WelcomeGreeting";
import { NotificationBannerStack } from "../components/StudySpace/NotificationBannerStack";
import { NotificationBannerProvider } from "../context/NotificationBannerContext";

export function StudySpacePage() {
  const ctx = useStudySpace();
  const [coinBalance, setCoinBalance] = useState<number | undefined>(undefined);
  const [luckyDrawRemaining, setLuckyDrawRemaining] = useState<number | undefined>(undefined);
  const location = useLocation();

  useEffect(() => {
    const panel = (location.state as any)?.openPanel;
    if (panel) ctx.setActivePanel(panel);
  }, []);

  return (
    <SpaceContextMenu ctx={ctx}>
      <Box
        ref={ctx.spaceRef as any}
        position="fixed"
        inset={0}
        overflow="hidden"
        style={{ fontFamily: "'HarmonyOS Sans', sans-serif" }}
      >
        <SpaceBackground ctx={ctx} />
        <NotificationBannerProvider
          onOpenQuest={() => ctx.setActivePanel("quest")}
          onOpenCreatorStore={() => { ctx.setThemeStoreInitialTab("my-themes"); ctx.setActivePanel("theme"); }}
        >
          <SpaceWidgets    ctx={ctx} />
          <SpacePanels     ctx={ctx} coinBalance={coinBalance} onCoinBalanceChange={setCoinBalance} luckyDrawRemaining={luckyDrawRemaining} onLuckyDrawRemainingChange={setLuckyDrawRemaining} />
          <SpaceToolbar    ctx={ctx} coinBalance={coinBalance} onCoinBalanceReady={setCoinBalance} luckyDrawRemaining={luckyDrawRemaining} onLuckyDrawRemainingReady={setLuckyDrawRemaining} />
          {ctx.showFirstRoomModal && (
            <FirstRoomModal onConfirm={ctx.handleFirstRoomCreate} />
          )}
          <WelcomeGreeting />
          <NotificationBannerStack />
        </NotificationBannerProvider>
      </Box>
    </SpaceContextMenu>
  );
}
