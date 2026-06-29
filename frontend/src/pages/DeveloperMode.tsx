import { useEffect, useState } from "react";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { mission, decision, volume, traverse, validation, iceLikelihood } from "../data";

const SOURCES: Record<string, { obj: unknown; api: string; returns: string }> = {
  mission: { obj: mission, api: "GET /api/v1/missions/{mission_id}", returns: "Mission object" },
  ice_likelihood: { obj: { ...iceLikelihood, p_raster_flat: "[…48,400 floats]", sigma_raster_flat: "[…]", ci5_raster_flat: "[…]", ci95_raster_flat: "[…]", naive_mask_flat: "[…]", ablation_rasters: "{…}" }, api: "GET /api/v1/likelihood/{mission_id}/raster", returns: "GeoTIFF float32, south-polar stereographic" },
  decision: { obj: decision, api: "GET /api/v1/decision/{mission_id}", returns: "Decision object (sites, confidences)" },
  traverse: { obj: { ...traverse, lrip_path: { ...traverse.lrip_path, raw: "[…polyline]" }, naive_path: { ...traverse.naive_path, raw: "[…polyline]" } }, api: "GET /api/v1/traverse/{mission_id}", returns: "TraversePlan (lrip + naive + ablation)" },
  volume: { obj: { ...volume, histogram: "{counts:[…], edges:[…]}" }, api: "GET /api/v1/volume/{mission_id}", returns: "VolumeEstimation posterior" },
  validation: { obj: { ...validation, roc: "{naive:[…], calibrated:[…]}" }, api: "GET /api/v1/validation/{mission_id}", returns: "ROC, calibration, ablation, cross-sensor" },
};

export default function DeveloperMode() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();
  const [sel, setSel] = useState("mission");

  useEffect(() => {
    setNode(<Panel />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Loading developer inspector" />;

  const src = SOURCES[sel];

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Developer Mode" subtitle="Raw data inspection and future API contract annotations" right={<Badge color="#3b5bdb">JSON · SCHEMAS</Badge>} />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <Card title="Data Sources" pad={false}>
            <div className="py-1">
              {Object.keys(SOURCES).map((k) => (
                <button key={k} onClick={() => setSel(k)} className={`w-full text-left px-3 py-2 text-sm font-mono border-l-2 transition-colors ${sel === k ? "bg-accent-dim border-accent text-text-primary" : "border-transparent text-text-secondary hover:bg-bg-hover"}`}>
                  {k}.json
                </button>
              ))}
            </div>
          </Card>
        </div>
        <div className="col-span-9 space-y-4">
          <Card title="Future API Contract" pad>
            <div className="font-mono text-sm space-y-1">
              <div><span className="text-text-muted">// endpoint</span></div>
              <div className="text-confidence-high">{src.api}</div>
              <div className="text-text-muted">// returns: {src.returns}</div>
            </div>
          </Card>
          <Card title={`${sel}.json`} pad>
            <pre className="font-mono text-2xs text-text-secondary overflow-auto max-h-[calc(100vh-360px)] bg-[#06060c] p-3 rounded-sm border border-border-subtle">
              {JSON.stringify(src.obj, null, 2)}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Panel() {
  return (
    <div>
      <div className="label mb-2">Architecture</div>
      <div className="text-2xs text-text-muted leading-relaxed space-y-2">
        <p>All data is imported, never fetched (Rule 1). Rasters are produced by the Python pipeline (seed=42) and emitted as JSON under <span className="font-mono">src/data/generated/</span>.</p>
        <p>Each data source maps to a future REST endpoint that would replace the static import in production — shown here as the API contract.</p>
        <p>Large rasters are abbreviated as <span className="font-mono">[…48,400 floats]</span> for readability.</p>
      </div>
    </div>
  );
}
