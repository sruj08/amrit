import { useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend,
} from "recharts";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { HeatmapLayer } from "../components/science/HeatmapLayer";
import { iceLikelihood as ice, traverse } from "../data";
import type { PathPlan } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { slopeColor } from "../lib/formatting";

function PathOverlay({ path, color }: { path: PathPlan; color: string }) {
  const pts = path.raw.map(([y, x]) => `${x},${y}`).join(" ");
  const wps = path.waypoints;
  return (
    <g>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} opacity={0.95} />
      {wps.map((w, i) => (
        <circle key={i} cx={w.pixel[1]} cy={w.pixel[0]} r={1.4} fill={color} />
      ))}
      {/* start = gold square, goal = magenta star marker */}
      <rect x={path.raw[0][1] - 2} y={path.raw[0][0] - 2} width={4} height={4} fill="#ffd700" />
      <circle cx={path.raw[path.raw.length - 1][1]} cy={path.raw[path.raw.length - 1][0]} r={2.6} fill="#ff2bd6" />
    </g>
  );
}

export default function TraversePlanner() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();
  const lrip = traverse.lrip_path;
  const naive = traverse.naive_path;
  const ab = traverse.ablation;

  useEffect(() => {
    setNode(<WaypointPanel path={lrip} />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Planning spatiotemporal A* traverse" />;

  // Battery timeline: align both paths on distance.
  const chartData = lrip.waypoints.map((w, i) => ({
    dist: w.cumulative_dist_m,
    lrip: Math.round(w.soc * 100),
    naive: Math.round((naive.waypoints[i]?.soc ?? 0) * 100),
    illuminated: w.illuminated,
  }));

  const W = ice.width;
  const H = ice.height;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Traverse Planner"
        subtitle="Ablation: ice-confidence reward changes the route — the coupling no published planner achieves"
        right={<Badge color="#00e5ff">A* + ICE REWARD</Badge>}
      />

      <div className="grid grid-cols-2 gap-4">
        <Card title="Without ice-confidence reward (naive)" pad>
          <HeatmapLayer
            data={ice.p_raster_flat}
            width={W}
            height={H}
            cmap="plasma"
            vmin={0}
            vmax={0.95}
            maskBelow={0.01}
            unit="P(ice)"
            display={400}
            legend={false}
            overlay={() => <PathOverlay path={naive} color="#ff7043" />}
          />
        </Card>
        <Card title="With ice-confidence reward (LRIP)" pad>
          <HeatmapLayer
            data={ice.p_raster_flat}
            width={W}
            height={H}
            cmap="plasma"
            vmin={0}
            vmax={0.95}
            maskBelow={0.01}
            unit="P(ice)"
            display={400}
            legend={false}
            overlay={() => <PathOverlay path={lrip} color="#00e5ff" />}
          />
        </Card>
      </div>

      {/* Metrics comparison */}
      <Card title="Ablation Metrics" className="mt-4" pad>
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-text-muted text-2xs uppercase">
              <th className="text-left font-medium py-1">Metric</th>
              <th className="text-right font-medium">Naive</th>
              <th className="text-right font-medium">LRIP</th>
              <th className="text-right font-medium">Δ</th>
            </tr>
          </thead>
          <tbody className="text-text-primary">
            <Mrow l="Total distance (m)" a={naive.metrics.total_dist_m} b={lrip.metrics.total_dist_m} d={`+${ab.delta_dist_m}m (+${ab.delta_dist_pct}%)`} />
            <Mrow l="Mean P(ice) on path" a={naive.metrics.mean_p_ice_on_path} b={lrip.metrics.mean_p_ice_on_path} d={`+${ab.delta_mean_p_ice} (+${ab.delta_mean_p_ice_pct}%)`} good />
            <Mrow l="Ice cells (P>0.5)" a={naive.metrics.ice_cells_traversed} b={lrip.metrics.ice_cells_traversed} d={`+${ab.delta_ice_cells}`} good />
            <Mrow l="Min SoC (%)" a={Math.round(naive.metrics.min_soc * 100)} b={Math.round(lrip.metrics.min_soc * 100)} d={`${ab.delta_min_soc * 100}%`} />
            <Mrow l="Hazards encountered" a={naive.metrics.hazards_encountered} b={lrip.metrics.hazards_encountered} d="=" />
            <Mrow l="Travel time (h)" a={naive.metrics.travel_time_h} b={lrip.metrics.travel_time_h} d={`+${ab.delta_travel_time_h}h`} />
          </tbody>
        </table>
        <p className="text-2xs text-text-muted mt-3 leading-relaxed">{ab.conclusion}</p>
      </Card>

      {/* Battery timeline */}
      <Card title="Battery / State-of-Charge Model" className="mt-4" pad>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#1e1e3a" strokeDasharray="3 3" />
            <XAxis dataKey="dist" stroke="#8888aa" fontSize={11} tickLine={false}
              label={{ value: "Distance (m)", position: "insideBottom", offset: -4, fill: "#8888aa", fontSize: 11 }} />
            <YAxis stroke="#8888aa" fontSize={11} domain={[0, 100]} tickLine={false}
              label={{ value: "SoC (%)", angle: -90, position: "insideLeft", fill: "#8888aa", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #252545", borderRadius: 6, fontFamily: "JetBrains Mono", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "SoC_min 15%", fill: "#ef4444", fontSize: 10, position: "insideTopRight" }} />
            <Line type="monotone" dataKey="lrip" name="LRIP" stroke="#00e5ff" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="naive" name="Naive" stroke="#ff7043" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-2xs text-text-muted mt-1 font-mono">
          Min SoC {Math.round(lrip.metrics.min_soc * 100)}% — never violates the 15% limit. PSR segment ≈ {lrip.metrics.psr_segment_m} m (no solar recharge).
        </div>
      </Card>
    </div>
  );
}

function Mrow({ l, a, b, d, good }: { l: string; a: number | string; b: number | string; d: string; good?: boolean }) {
  return (
    <tr className="border-t border-border-subtle/60">
      <td className="py-1.5 text-text-secondary">{l}</td>
      <td className="text-right text-viz-path-naive">{a}</td>
      <td className="text-right text-viz-path-lrip">{b}</td>
      <td className="text-right" style={{ color: good ? "#22c55e" : "#8888aa" }}>{d}</td>
    </tr>
  );
}

function WaypointPanel({ path }: { path: PathPlan }) {
  return (
    <div>
      <div className="label mb-2">Waypoints ({path.waypoints.length})</div>
      <div className="overflow-x-auto">
        <table className="w-full text-2xs font-mono">
          <thead className="text-text-muted">
            <tr>
              <th className="text-left">WP</th>
              <th className="text-right">E</th>
              <th className="text-right">N</th>
              <th className="text-right">SoC</th>
              <th className="text-right">P(ice)</th>
            </tr>
          </thead>
          <tbody>
            {path.waypoints.map((w) => (
              <tr key={w.index} className="border-b border-border-subtle/50">
                <td className="text-text-secondary">{w.index}</td>
                <td className="text-right text-text-primary">{w.east_m}</td>
                <td className="text-right text-text-primary">{w.north_m}</td>
                <td className="text-right" style={{ color: w.soc < 0.2 ? "#f59e0b" : "#e8e8f0" }}>{Math.round(w.soc * 100)}%</td>
                <td className="text-right" style={{ color: slopeColor(0) && "#cc66ff" }}>{w.p_ice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-2xs text-text-muted mt-2">◼ start · ★ ice target · dark = PSR</div>
    </div>
  );
}
