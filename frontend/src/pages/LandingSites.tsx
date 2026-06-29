import { useEffect, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { HeatmapLayer } from "../components/science/HeatmapLayer";
import { iceLikelihood as ice, decision, traverse } from "../data";
import type { Site } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { confidenceColor, slopeColor } from "../lib/formatting";
import { CheckCircle2, XCircle } from "lucide-react";

// Approximate marker pixels for each candidate site on the AOI grid.
const SITE_PX: Record<string, [number, number]> = {
  F2_Site_B: [200, 178],
  F2_Site_A: [96, 104],
  H3_Site_B: [60, 60],
};
const MEDAL = ["#ffd700", "#c0c0c0", "#cd7f32"];

export default function LandingSites() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();
  const sites = decision.sites;
  const [sel, setSel] = useState(sites[0].id);

  useEffect(() => {
    setNode(<Panel site={sites.find((s) => s.id === sel)!} />);
    return () => setNode(null);
  }, [setNode, sel]);

  if (!loaded) return <PipelineLoadingScreen stage="Ranking candidate landing sites" />;

  const pareto = sites.map((s) => ({
    name: s.id,
    op: s.op_conf,
    sci: Math.round(s.p_target * 100),
    rus: s.rus,
    mri: s.mri,
  }));

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Landing Sites"
        subtitle="Top-3 candidates with full criteria and Pareto analysis"
        right={<Badge color="#ffd700">RECOMMENDED: {decision.recommended_site_id}</Badge>}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Map */}
        <div className="col-span-7">
          <Card title="Candidate Sites on P(ice) Field" pad>
            <div className="flex justify-center">
              <HeatmapLayer
                data={ice.p_raster_flat}
                width={ice.width}
                height={ice.height}
                cmap="plasma"
                vmin={0}
                vmax={0.95}
                maskBelow={0.01}
                unit="P(ice)"
                display={460}
                contours={[{ level: 0.5, color: "#22d3ee" }]}
                overlay={() => (
                  <g>
                    {/* LRIP traverse to ice target */}
                    <polyline points={traverse.lrip_path.raw.map(([y, x]) => `${x},${y}`).join(" ")} fill="none" stroke="#00e5ff" strokeWidth={1} opacity={0.6} />
                    {sites.map((s, i) => {
                      const [y, x] = SITE_PX[s.id];
                      return (
                        <g key={s.id} onClick={() => setSel(s.id)} style={{ cursor: "pointer" }}>
                          {s.id === sel && <circle cx={x} cy={y} r={7} fill="none" stroke="#fff" strokeWidth={0.8} />}
                          <polygon points={star(x, y, 5)} fill={MEDAL[i]} stroke="#000" strokeWidth={0.3} />
                          <text x={x + 6} y={y + 2} fontSize={7} fill="#fff" className="font-mono">{s.id.replace("_Site_", "-")}</text>
                        </g>
                      );
                    })}
                  </g>
                )}
              />
            </div>
            <div className="text-2xs font-mono text-text-muted mt-2 text-center">
              ★ gold = recommended · silver/bronze = alternates · cyan = P=0.50 contour
            </div>
          </Card>

          {/* Pareto */}
          <Card title="Pareto Front — Science vs Operation" className="mt-4" pad>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 8, right: 16, bottom: 12, left: 0 }}>
                <CartesianGrid stroke="#1e1e3a" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="op" name="Op conf" domain={[0, 100]} stroke="#8888aa" fontSize={11}
                  label={{ value: "Operational confidence (%)", position: "insideBottom", offset: -4, fill: "#8888aa", fontSize: 11 }} />
                <YAxis type="number" dataKey="sci" name="Sci proxy" domain={[0, 100]} stroke="#8888aa" fontSize={11}
                  label={{ value: "Science (P_target %)", angle: -90, position: "insideLeft", fill: "#8888aa", fontSize: 11 }} />
                <ZAxis type="number" dataKey="rus" range={[120, 500]} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #252545", borderRadius: 6, fontFamily: "JetBrains Mono", fontSize: 12 }} />
                <Scatter data={pareto}>
                  {pareto.map((p, i) => (
                    <Cell key={i} fill={confidenceColor(p.mri)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-2xs text-text-muted mt-1">
              Bubble size = RUS, colour = MRI. Site B is Pareto-optimal — no site is better on both
              science and operation simultaneously.
            </p>
          </Card>
        </div>

        {/* Site cards */}
        <div className="col-span-5 space-y-3">
          {sites.map((s, i) => (
            <SiteCard key={s.id} s={s} medal={i} selected={s.id === sel} onSelect={() => setSel(s.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SiteCard({ s, medal, selected, onSelect }: { s: Site; medal: number; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`w-full text-left bg-surface-2 border rounded-md p-4 transition-colors ${selected ? "border-accent" : "border-border-subtle hover:bg-bg-hover"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-md text-text-primary">
          {s.name} {s.is_recommended && <span className="text-confidence-high text-2xs ml-1">RECOMMENDED</span>}
        </span>
        <span className="font-mono font-bold text-lg" style={{ color: confidenceColor(s.mri) }}>{Math.round(s.mri)}<span className="text-xs text-text-muted"> MRI</span></span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
        <Crit label="Slope" value={`${s.slope}°`} ok={s.slope < 15} color={slopeColor(s.slope)} />
        <Crit label="Illum" value={`${Math.round(s.illum * 100)}%`} ok={s.illum > 0.3} />
        <Crit label="Boulder" value={s.boulder} ok={s.boulder === "LOW"} />
        <Crit label="P(ice)" value={s.p_target.toFixed(2)} ok={s.p_target > 0.5} />
        <Crit label="Dist→ice" value={`${s.dist_ice}m`} ok={s.dist_ice < 800} />
        <Crit label="RUS" value={`${Math.round(s.rus)}`} ok={s.rus > 70} />
      </div>
    </button>
  );
}

function Crit({ label, value, ok, color }: { label: string; value: string; ok: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="flex items-center gap-1.5">
        <span style={{ color: color ?? "var(--text-primary)" }}>{value}</span>
        {ok ? <CheckCircle2 size={11} className="text-confidence-high" /> : <XCircle size={11} className="text-confidence-critical" />}
      </span>
    </div>
  );
}

function Panel({ site }: { site: Site }) {
  return (
    <div>
      <div className="label mb-2">{site.name}</div>
      <KV k="Coordinates" v={`${site.lat.toFixed(3)}°, ${site.lon.toFixed(3)}°`} />
      <KV k="Dist to PSR rim" v={`${site.dist_psr} m`} />
      <KV k="Dist to ice core" v={`${site.dist_ice} m`} />
      <KV k="Slope" v={`${site.slope}°`} />
      <KV k="Illumination" v={`${Math.round(site.illum * 100)}%`} />
      <KV k="Boulder density" v={site.boulder} />
      <KV k="σ_P" v={`${site.sigma.toFixed(3)}`} />
      <div className="label mb-2 mt-3">Scores</div>
      <KV k="MRI" v={`${site.mri}`} color={confidenceColor(site.mri)} />
      <KV k="RUS" v={`${site.rus}`} color={confidenceColor(site.rus)} />
      <KV k="Op. confidence" v={`${site.op_conf}%`} color={confidenceColor(site.op_conf)} />
    </div>
  );
}
function KV({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border-subtle/60 text-sm">
      <span className="text-text-secondary">{k}</span>
      <span className="font-mono" style={{ color: color ?? "var(--text-primary)" }}>{v}</span>
    </div>
  );
}

function star(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r / 2.3;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}
