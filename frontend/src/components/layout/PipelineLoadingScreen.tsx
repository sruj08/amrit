import { useEffect, useState } from "react";

// Progress-bar loading state with a rotating stage label (PRD section 5.1).
export function PipelineLoadingScreen({ stage }: { stage: string }) {
  const [pct, setPct] = useState(8);
  useEffect(() => {
    const steps = [22, 41, 63, 78, 91, 99];
    const timers = steps.map((p, i) =>
      setTimeout(() => setPct(p), (i + 1) * 110)
    );
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-bg-primary">
      <div className="w-[360px]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-sm text-text-secondary">{stage}</span>
          <span className="font-mono text-sm text-accent-hover">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-150 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 text-2xs text-text-muted font-mono">Assembling evidence layers…</div>
      </div>
    </div>
  );
}
