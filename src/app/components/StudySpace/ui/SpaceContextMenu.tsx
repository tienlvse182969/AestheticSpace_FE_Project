import * as ContextMenu from "@radix-ui/react-context-menu";
import { Image as ImageIcon, LayoutGrid, Sticker, AudioWaveform, Wand2, Lock, Unlock, LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StudySpaceCtx } from "../../../hooks/studyspace/useStudySpace";

interface Props {
  ctx: StudySpaceCtx;
  children: React.ReactNode;
}

const menuStyle: React.CSSProperties = {
  minWidth: 200,
  background: "rgba(12, 18, 22, 0.82)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "5px 0",
  boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  zIndex: 9999,
  fontFamily: "'HarmonyOS Sans', sans-serif",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "9px 14px",
  fontSize: "0.85rem",
  color: "rgba(255,255,255,0.82)",
  cursor: "pointer",
  outline: "none",
  borderRadius: 6,
  margin: "1px 4px",
  userSelect: "none",
  letterSpacing: "0.01em",
};

const separatorStyle: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.08)",
  margin: "4px 0",
};

export function SpaceContextMenu({ ctx, children }: Props) {
  const { togglePanel, layoutLocked, toggleLayoutLock } = ctx;
  const { t } = useTranslation();

  const items = [
    { id: "room",    icon: <LayoutDashboard size={15} />, label: t("contextMenu.changeRoom") },
    { id: "image",   icon: <ImageIcon size={15} />,      label: t("contextMenu.changeBackground") },
    { id: "widget",  icon: <LayoutGrid size={15} />,     label: t("contextMenu.addWidget") },
    { id: "sticker", icon: <Sticker size={15} />,        label: t("contextMenu.addSticker") },
    { id: "ambient", icon: <AudioWaveform size={15} />,  label: t("contextMenu.changeAmbient") },
    { id: "effects", icon: <Wand2 size={15} />,          label: t("contextMenu.changeEffect") },
  ] as const;

  const hoverOn = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
    (e.currentTarget as HTMLElement).style.color = "#fff";
  };
  const hoverOff = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.background = "transparent";
    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.82)";
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content style={menuStyle} onCloseAutoFocus={e => e.preventDefault()}>
          <ContextMenu.Label
            style={{
              padding: "5px 14px 7px",
              fontSize: "0.68rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'HarmonyOS Sans', sans-serif",
            }}
          >
            {t("contextMenu.label")}
          </ContextMenu.Label>
          <ContextMenu.Separator style={separatorStyle} />
          {items.map(item => (
            <ContextMenu.Item
              key={item.id}
              style={itemStyle}
              onSelect={() => togglePanel(item.id)}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              <span style={{ opacity: 0.7, display: "flex", alignItems: "center" }}>
                {item.icon}
              </span>
              {item.label}
            </ContextMenu.Item>
          ))}
          <ContextMenu.Separator style={separatorStyle} />
          <ContextMenu.Item
            style={{
              ...itemStyle,
              color: layoutLocked ? "rgba(251,191,36,0.9)" : "rgba(255,255,255,0.82)",
            }}
            onSelect={toggleLayoutLock}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span style={{ opacity: 0.75, display: "flex", alignItems: "center" }}>
              {layoutLocked ? <Unlock size={15} /> : <Lock size={15} />}
            </span>
            {layoutLocked ? t("contextMenu.unlockLayout") : t("contextMenu.lockLayout")}
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
