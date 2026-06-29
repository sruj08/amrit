import { createContext, useContext, useState, ReactNode } from "react";

// Lets each page populate the right context panel without prop drilling.
// The panel is never empty — it falls back to the mission summary.
interface PanelState {
  node: ReactNode | null;
  setNode: (n: ReactNode | null) => void;
}

const Ctx = createContext<PanelState>({ node: null, setNode: () => {} });

export function PanelProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<ReactNode | null>(null);
  return <Ctx.Provider value={{ node, setNode }}>{children}</Ctx.Provider>;
}

export function usePanel() {
  return useContext(Ctx);
}
