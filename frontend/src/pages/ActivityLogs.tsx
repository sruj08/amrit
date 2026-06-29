import { useEffect, useRef, useState } from "react";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { processingLog } from "../data";
import type { ProcessingEvent } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { Play, RotateCcw } from "lucide-react";

const TYPE_COLOR: Record<string, string> = {
  INFO: "#8888aa",
  SUCCESS: "#22c55e",
  METRIC: "#3b82f6",
  WARNING: "#f59e0b",
};

export default function ActivityLogs() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();
  const [shown, setShown] = useState(processingLog.length);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);

  function replay() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlaying(true);
    setShown(0);
    processingLog.forEach((_, i) => {
      const t = window.setTimeout(() => {
        setShown(i + 1);
        if (i === processingLog.length - 1) setPlaying(false);
      }, 60 * (i + 1));
      timers.current.push(t);
    });
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    setNode(<LogStatsPanel />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Loading operational replay log" />;

  const pct = Math.round((shown / processingLog.length) * 100);
  const visible = processingLog.slice(0, shown);

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Activity Logs"
        subtitle="Operational replay — 41 processing events, seed=42, fully deterministic"
        right={
          <button
            onClick={replay}
            disabled={playing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {playing ? <RotateCcw size={14} className="animate-spin" /> : <Play size={14} />}
            {playing ? "Replaying…" : "Replay Pipeline"}
          </button>
        }
      />

      <Card pad={false}>
        <div className="h-1 bg-bg-tertiary">
          <div className="h-full bg-accent transition-all duration-75" style={{ width: `${pct}%` }} />
        </div>
        <div className="p-4 font-mono text-xs max-h-[calc(100vh-260px)] overflow-y-auto bg-[#06060c]">
          {visible.map((e) => (
            <LogLine key={e.id} e={e} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function LogLine({ e }: { e: ProcessingEvent }) {
  const isFinal = e.message.startsWith("ANALYSIS COMPLETE");
  return (
    <div className={`flex gap-3 py-0.5 animate-log-line ${isFinal ? "mt-1" : ""}`}>
      <span className="text-text-muted shrink-0">[{e.timestamp}]</span>
      <span className="shrink-0 w-16 font-semibold" style={{ color: TYPE_COLOR[e.type] }}>
        {e.type}
      </span>
      <span className="text-text-muted shrink-0">{e.id}</span>
      <span className={isFinal ? "text-confidence-high font-bold" : "text-text-secondary"}>
        {e.message}
      </span>
    </div>
  );
}

function LogStatsPanel() {
  const counts = processingLog.reduce<Record<string, number>>((a, e) => {
    a[e.type] = (a[e.type] ?? 0) + 1;
    return a;
  }, {});
  const byPipeline = [1, 2, 3, 4].map((p) => ({
    p,
    n: processingLog.filter((e) => e.pipeline === p).length,
  }));
  return (
    <div>
      <div className="label mb-2">Log Summary</div>
      {Object.entries(counts).map(([t, n]) => (
        <div key={t} className="flex items-center justify-between py-1 text-sm">
          <Badge color={TYPE_COLOR[t]}>{t}</Badge>
          <span className="font-mono text-text-primary">{n}</span>
        </div>
      ))}
      <div className="label mb-2 mt-4">Events per Pipeline</div>
      {byPipeline.map((b) => (
        <div key={b.p} className="flex items-center justify-between py-1 text-sm">
          <span className="text-text-secondary">Pipeline {b.p}</span>
          <span className="font-mono text-text-primary">{b.n}</span>
        </div>
      ))}
      <div className="mt-3 text-2xs text-text-muted leading-relaxed">
        Press “Replay Pipeline” to re-animate the full processing chain line by line — the
        end-to-end run from DFSAR ingest to mission recommendation.
      </div>
    </div>
  );
}
