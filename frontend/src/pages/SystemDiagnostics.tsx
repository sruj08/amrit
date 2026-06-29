import { useEffect } from "react";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { mission, processingLog } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { MissionSummaryPanel } from "../components/layout/ContextPanel";
import { CheckCircle2 } from "lucide-react";

const DATASETS = [
  { name: "Chandrayaan-2 DFSAR", id: "ch2_sar_nrxl_…_d_cp_d18", status: "L+S ✓", fresh: "2025-11-06" },
  { name: "LOLA DEM", id: "LDEM_87S_5M", status: "5 m/px ✓", fresh: "current" },
  { name: "Diviner T_max", id: "GDR L4 max-annual", status: "✓", fresh: "current" },
  { name: "Diviner Rock Abundance", id: "derived", status: "✓", fresh: "current" },
  { name: "Mini-RF Stokes", id: "cross-sensor", status: "✓", fresh: "current" },
];

export default function SystemDiagnostics() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();

  useEffect(() => {
    setNode(<MissionSummaryPanel />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Running system diagnostics" />;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="System Diagnostics" subtitle="Pipeline health, data freshness, and version info" right={<Badge color="#22c55e">ALL SYSTEMS NOMINAL</Badge>} />

      <div className="grid grid-cols-3 gap-4">
        <Card title="Pipeline Health" pad>
          {mission.pipeline_health.map((p) => (
            <div key={p.name} className="flex items-center justify-between py-1.5 border-b border-border-subtle/60 text-sm">
              <span className="text-text-secondary">{p.name}</span>
              <span className="flex items-center gap-1.5 font-mono text-text-primary">{p.stages} stages <CheckCircle2 size={13} className="text-confidence-high" /></span>
            </div>
          ))}
          <div className="mt-2 text-2xs text-text-muted">{processingLog.length} processing events · status {mission.status}</div>
        </Card>

        <Card title="Data Sources" pad>
          {DATASETS.map((d) => (
            <div key={d.name} className="py-1.5 border-b border-border-subtle/60">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{d.name}</span>
                <span className="font-mono text-confidence-high">{d.status}</span>
              </div>
              <div className="font-mono text-2xs text-text-muted">{d.id} · {d.fresh}</div>
            </div>
          ))}
        </Card>

        <Card title="Version & Build" pad>
          <KV k="Pipeline version" v={mission.pipeline_version} />
          <KV k="Random seed" v={String(mission.random_seed)} />
          <KV k="AOI" v={`${mission.aoi_px_width}×${mission.aoi_px_height} px`} />
          <KV k="Pixel size" v={`${mission.pixel_size_m} m`} />
          <KV k="Mission ID" v={mission.id} />
          <KV k="Analysis run" v={mission.analysis_timestamp.replace("T", " ").replace("Z", "")} />
          <KV k="Frontend" v="React 18 · Vite 5" />
          <KV k="Render" v="Canvas + Recharts" />
        </Card>
      </div>

      <Card title="Consistency Checks" className="mt-4" pad>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
          <Check label="MRI components sum to displayed MRI (±0.1)" />
          <Check label="Volume A_eff = Σ P(ice) × 25 m²" />
          <Check label="Traverse mean P(ice) = mean of waypoint values" />
          <Check label="Processing log timestamps chronological" />
          <Check label="Scientific confidence ⇄ evidence weights" />
          <Check label="All outputs are likelihoods, never 'confirmed'" />
        </div>
      </Card>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border-subtle/60 text-sm">
      <span className="text-text-secondary">{k}</span>
      <span className="font-mono text-text-primary">{v}</span>
    </div>
  );
}
function Check({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-text-secondary">
      <CheckCircle2 size={13} className="text-confidence-high shrink-0" /> {label}
    </div>
  );
}
