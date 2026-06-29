import { Card, Badge } from "../components/ui/Primitives";
import { MetricCard } from "../components/mission/MetricCard";
import { HeatmapLayer } from "../components/science/HeatmapLayer";
import {
  mission, iceLikelihood as ice, traverse, recommendedSite, processingLog,
} from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { confidenceColor, fmtVolume, fmtCI } from "../lib/formatting";
import { CheckCircle2 } from "lucide-react";

export default function MissionOverview() {
  const loaded = usePageLoad();
  if (!loaded) return <PipelineLoadingScreen stage="Loading mission overview" />;

  const lrip = traverse.lrip_path;
  const W = ice.width;
  const H = ice.height;
  const tail = processingLog.slice(-6);

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mission Overview</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {mission.name} · {mission.target_crater} · analysis complete {mission.analysis_timestamp.slice(0, 10)}
          </p>
        </div>
        <Badge color="#22c55e">5 / 5 EVIDENCE LINES CONVERGE</Badge>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: key metrics */}
        <div className="col-span-3 space-y-3">
          <MetricCard label="Mission Readiness" value={String(mission.mri)} unit="/100"
            interpretation="RECOMMENDED" interpColor={confidenceColor(mission.mri)} />
          <MetricCard label="Resource Utility" value={String(mission.rus)} unit="/100"
            interpretation="HIGH VALUE" interpColor={confidenceColor(mission.rus)} />
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Sci. Conf." value={`${mission.scientific_confidence.toFixed(1)}`} unit="%" />
            <MetricCard label="Op. Conf." value={`${mission.operational_confidence.toFixed(1)}`} unit="%" />
          </div>
          <MetricCard label="Ice Likelihood Peak" value="0.917" sigma="± 0.062"
            ci="[0.803, 0.981]" interpretation="VERY HIGH" interpColor="#cc66ff" />
        </div>

        {/* Center: overview map */}
        <div className="col-span-6">
          <Card title="Faustini F2 — Ice Likelihood & Mission Plan" pad>
            <div className="flex justify-center">
              <HeatmapLayer
                data={ice.p_raster_flat}
                width={W}
                height={H}
                cmap="plasma"
                vmin={0}
                vmax={0.95}
                maskBelow={0.01}
                unit="P(ice)"
                display={460}
                contours={[{ level: 0.5, color: "#22d3ee" }]}
                overlay={() => (
                  <g>
                    {/* LRIP traverse */}
                    <polyline
                      points={lrip.raw.map(([y, x]) => `${x},${y}`).join(" ")}
                      fill="none" stroke="#00e5ff" strokeWidth={1.4} opacity={0.9}
                    />
                    {/* Landing site B (start) */}
                    <g>
                      <rect x={lrip.raw[0][1] - 3} y={lrip.raw[0][0] - 3} width={6} height={6} fill="#ffd700" stroke="#000" strokeWidth={0.4} />
                    </g>
                    {/* Ice target */}
                    <circle cx={traverse.goal_pixel[1]} cy={traverse.goal_pixel[0]} r={3} fill="#ff2bd6" />
                  </g>
                )}
              />
            </div>
            <div className="flex gap-4 text-2xs font-mono text-text-secondary mt-2 justify-center">
              <span>◼ <span className="text-[#ffd700]">Landing Site B</span></span>
              <span>━ <span className="text-viz-path-lrip">LRIP traverse {lrip.metrics.total_dist_m}m</span></span>
              <span>● <span className="text-[#ff2bd6]">Ice target</span></span>
              <span>━ <span className="text-[#22d3ee]">P=0.50 contour</span></span>
            </div>
          </Card>
        </div>

        {/* Right: evidence audit + pipeline + log */}
        <div className="col-span-3 space-y-3">
          <Card title="Evidence Audit" pad>
            {mission.evidence_audit.map((e) => (
              <div key={e.line} className="flex items-center justify-between py-1 text-sm">
                <span className="text-text-secondary">{e.line}</span>
                <CheckCircle2 size={14} className="text-confidence-high" />
              </div>
            ))}
            <div className="text-2xs text-text-muted mt-2">All five independent streams converge.</div>
          </Card>

          <Card title="Volume Estimate" pad>
            <div className="font-mono text-2xl font-bold text-viz-volume">{fmtVolume(mission.volume_median)}</div>
            <div className="font-mono text-xs text-text-secondary mt-0.5">
              5–95% {fmtCI(mission.volume_ci[0], mission.volume_ci[1], 0)}
            </div>
            <div className="text-2xs text-text-muted mt-1">LCROSS-anchored MC posterior</div>
          </Card>

          <Card title="Pipeline Status" pad>
            {mission.pipeline_health.map((p) => (
              <div key={p.name} className="flex items-center justify-between py-1 text-sm">
                <span className="text-text-secondary">{p.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className="font-mono text-2xs text-text-muted">{p.stages}</span>
                  <CheckCircle2 size={13} className="text-confidence-high" />
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Processing log tail */}
      <Card title="Processing Log — tail" className="mt-4" pad>
        <div className="font-mono text-2xs space-y-0.5">
          {tail.map((e) => (
            <div key={e.id} className="flex gap-3">
              <span className="text-text-muted shrink-0">{e.timestamp.slice(11)}</span>
              <span className="shrink-0 w-16" style={{ color: e.type === "SUCCESS" ? "#22c55e" : e.type === "METRIC" ? "#3b82f6" : "#8888aa" }}>{e.type}</span>
              <span className="text-text-secondary truncate">{e.message}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
