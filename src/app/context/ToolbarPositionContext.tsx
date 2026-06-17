import { createContext, useContext, useState, type ReactNode } from "react";

export type ToolbarPosition = "bottom" | "left" | "right";

interface ToolbarPositionCtx {
  position: ToolbarPosition;
  setPosition: (p: ToolbarPosition) => void;
}

const Ctx = createContext<ToolbarPositionCtx>({ position: "bottom", setPosition: () => {} });

export function ToolbarPositionProvider({ children }: { children: ReactNode }) {
  const [position, _setPosition] = useState<ToolbarPosition>(
    () => (localStorage.getItem("toolbarPosition") as ToolbarPosition) ?? "bottom",
  );

  const setPosition = (p: ToolbarPosition) => {
    _setPosition(p);
    localStorage.setItem("toolbarPosition", p);
  };

  return <Ctx.Provider value={{ position, setPosition }}>{children}</Ctx.Provider>;
}

export const useToolbarPosition = () => useContext(Ctx);
