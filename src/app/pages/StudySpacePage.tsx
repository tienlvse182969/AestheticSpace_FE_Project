import { Box } from "@chakra-ui/react";
import { useStudySpace } from "../hooks/studyspace/useStudySpace";
import { SpaceBackground }   from "../components/StudySpace/sections/SpaceBackground";
import { SpacePanels }       from "../components/StudySpace/sections/SpacePanels";
import { SpaceWidgets }      from "../components/StudySpace/sections/SpaceWidgets";
import { SpaceToolbar }      from "../components/StudySpace/sections/SpaceToolbar";
import { SpaceContextMenu }  from "../components/StudySpace/ui/SpaceContextMenu";

export function StudySpacePage() {
  const ctx = useStudySpace();

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
        <SpaceWidgets    ctx={ctx} />
        <SpacePanels     ctx={ctx} />
        <SpaceToolbar    ctx={ctx} />
      </Box>
    </SpaceContextMenu>
  );
}
