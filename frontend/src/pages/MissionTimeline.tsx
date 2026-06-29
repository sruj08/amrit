import { useEffect, useState } from "react";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { processingLog } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { MissionSummaryPanel } from "../components/layout/ContextPanel";
import { CheckCircle2, ChevronRight } from "lucide-react";

const PIPELINE_LABEL: Record<number, string> = {
  1: "DFSAR Polarimetry",
  2: "Terrain Intelligence",
  3: "Evidence Fusion",
  4: "Decision Intelligence",
};
const PIPELINE_COLOR: Record<number, string> = {
  1: "#ff6b35",
  2: "#88c057",
  3: "#cc66ff",
  4: "#3b5bdb",
};

export default function MissionTimeline() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    setNode(<MissionSummaryPanel />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Reconstructing mission timeline" />;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Mission Timeline"
        subtitle="Chronological record of the full processing pipeline — the mission audit trail"
        right={<Badge color="#22c55e">{processingLog.length} EVENTS · COMPLETE</Badge>}
      />

      <div className="relative pl-6">
        {/* vertical rail */}
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
        {processingLog.map((e) => {
          const isOpen = open === e.id;
          return (
            <div key={e.id} className="relative mb-2">
              <span
                className="absolute -left-[22px] top-2 w-3.5 h-3.5 rounded-full border-2 border-bg-primary"
                style={{ background: PIPELINE_COLOR[e.pipeline] }}
              />
              <button
                onClick={() => setOpen(isOpen ? null : e.id)}
                className="w-full text-left bg-surface-2 border border-border-subtle rounded-md px-3 py-2 hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChevronRight
                    size={13}
                    className={`text-text-muted transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                  <span className="font-mono text-2xs text-text-muted shrink-0">
                    {e.timestamp.slice(11)}
                  </span>
                  <Badge color={PIPELINE_COLOR[e.pipeline]}>P{e.pipeline}</Badge>
                  <span className="text-sm text-text-primary truncate flex-1">{e.message}</span>
                  {e.type === "SUCCESS" && <CheckCircle2 size={13} className="text-confidence-high shrink-0" />}
                </div>
                {isOpen && (
                  <div className="mt-2 ml-7 grid grid-cols-3 gap-3 text-2xs font-mono">
                    <Field label="Event ID" value={e.id} />
                    <Field label="Pipeline" value={PIPELINE_LABEL[e.pipeline]} />
                    <Field label="Type" value={e.type} />
                    <Field label="Sequence" value={`#${e.sequence}`} />
                    <Field label="Timestamp" value={e.timestamp} />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-text-muted">{label}</div>
      <div className="text-text-primary">{value}</div>
    </div>
  );
}
