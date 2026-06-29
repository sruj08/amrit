import { useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from "recharts";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { volume as vol } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { fmtInt } from "../lib/formatting";

export default function ResourceIntelligence() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();

  useEffect(() => {
    setNode(<SummaryPanel />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Sampling Monte-Carlo volume posterior" />;

  const p = vol.posterior;
  const hist = vol.histogram.counts.map((c, i) => ({
    x: Math.round((vol.histogram.edges[i] + vol.histogram.edges[i + 1]) / 2),
    c,
    inCI: vol.histogram.edges[i] >= p.percentile_5 && vol.histogram.edges[i] <= p.percentile_95,
  }));

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Resource Intelligence"
        subtitle="LCROSS-anchored Monte-Carlo ice volume posterior — a distribution, never a point estimate"
        right={<Badge color="#3366ff">N = {fmtInt(vol.n_mc_samples)}</Badge>}
      />

      <div className="grid grid-cols-3 gap-4">
        {/* Posterior histogram */}
        <Card title="Volume Posterior" className="col-span-2" pad>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hist} margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
              <CartesianGrid stroke="#1e1e3a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="x" stroke="#8888aa" fontSize={11} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                label={{ value: "Ice volume (m³)", position: "insideBottom", offset: -4, fill: "#8888aa", fontSize: 11 }} />
              <YAxis stroke="#8888aa" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #252545", borderRadius: 6, fontFamily: "JetBrains Mono", fontSize: 12 }}
                formatter={(v) => [v as number, "samples"]}
                labelFormatter={(v) => `${fmtInt(v as number)} m³`}
              />
              <ReferenceLine x={p.median} stroke="#facc15" strokeWidth={2}
                label={{ value: "median", fill: "#facc15", fontSize: 10, position: "top" }} />
              <Bar dataKey="c" isAnimationActive>
                {hist.map((h, i) => (
                  <Cell key={i} fill={h.inCI ? "#3366ff" : "#26305c"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 text-2xs font-mono text-text-secondary mt-1">
            <span>Median: <span className="text-text-primary">{fmtInt(p.median)} m³</span></span>
            <span>5–95% CI: <span className="text-viz-volume">[{fmtInt(p.percentile_5)}, {fmtInt(p.percentile_95)}]</span></span>
            <span>LCROSS anchor: <span className="text-text-primary">{vol.lcross_anchor.wt_pct_mean} ± {vol.lcross_anchor.wt_pct_std} wt%</span></span>
          </div>
        </Card>

        {/* Uncertainty budget */}
        <Card title="Uncertainty Budget" pad>
          <div className="space-y-3">
            {vol.uncertainty_budget.map((u) => (
              <div key={u.source}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{u.source}</span>
                  <span className="font-mono text-text-primary">{u.variance_contribution_pct}%</span>
                </div>
                <div className="h-2 rounded-sm bg-bg-tertiary mt-1 overflow-hidden">
                  <div className="h-full bg-viz-volume" style={{ width: `${u.variance_contribution_pct}%`, transition: "width 400ms ease-out" }} />
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">{u.description}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Parameter posteriors */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <ParamCard title="Ice fraction φ" stats={vol.phi_posterior} fmt={(v) => `${(v * 100).toFixed(1)}%`} />
        <ParamCard title="Column depth" stats={vol.depth_posterior} fmt={(v) => `${v.toFixed(1)} m`} />
        <Card title="Mixing Models (priors)" pad>
          {vol.mixing_models.map((m) => (
            <div key={m.model} className="flex items-center justify-between py-1.5 border-b border-border-subtle/60 text-sm">
              <span className="text-text-secondary">{m.model}</span>
              <span className="font-mono text-text-primary">{(m.probability * 100).toFixed(0)}%</span>
            </div>
          ))}
          <div className="text-[10px] text-text-muted mt-2">Non-uniqueness across these models is the dominant uncertainty source — which is why PRL 2026 omits volume entirely.</div>
        </Card>
      </div>
    </div>
  );
}

function ParamCard({ title, stats, fmt }: { title: string; stats: typeof vol.phi_posterior; fmt: (v: number) => string }) {
  return (
    <Card title={title} pad>
      <div className="grid grid-cols-2 gap-y-1.5 text-sm font-mono">
        <span className="text-text-secondary">Mean</span><span className="text-right text-text-primary">{fmt(stats.mean)}</span>
        <span className="text-text-secondary">Median</span><span className="text-right text-text-primary">{fmt(stats.median)}</span>
        <span className="text-text-secondary">5th pct</span><span className="text-right text-text-primary">{fmt(stats.percentile_5)}</span>
        <span className="text-text-secondary">95th pct</span><span className="text-right text-text-primary">{fmt(stats.percentile_95)}</span>
      </div>
    </Card>
  );
}

function SummaryPanel() {
  const p = vol.posterior;
  const m = vol.mass_estimate;
  return (
    <div>
      <div className="label mb-2">Ice Resource Summary</div>
      <div className="text-2xs text-text-muted mb-2">Faustini F2 — top ≤5 m column</div>
      <L l="Volume median" v={`${fmtInt(p.median)} m³`} color="#3366ff" />
      <L l="5th percentile" v={`${fmtInt(p.percentile_5)} m³`} />
      <L l="95th percentile" v={`${fmtInt(p.percentile_95)} m³`} />
      <div className="h-2" />
      <L l="Mass (median)" v={`~${m.median_tonnes} t`} />
      <L l="Mass 5–95%" v={`[${m.ci_5_tonnes}–${m.ci_95_tonnes}] t`} />
      <div className="h-2" />
      <L l="Effective area" v={`${fmtInt(vol.a_eff_m2)} m²`} />
      <L l="Convergence" v={vol.convergence.converged ? "stable ✓" : "—"} color="#22c55e" />
      <div className="mt-3 p-2.5 rounded-md bg-bg-tertiary border border-border-subtle text-[10px] text-text-muted leading-relaxed">
        Reference: LCROSS {vol.lcross_anchor.wt_pct_mean} ± {vol.lcross_anchor.wt_pct_std} wt% (Colaprete 2010, Cabeus). This volume is a posterior distribution, not a point estimate.
      </div>
    </div>
  );
}
function L({ l, v, color }: { l: string; v: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border-subtle/60">
      <span className="text-sm text-text-secondary">{l}</span>
      <span className="font-mono text-sm" style={{ color: color ?? "var(--text-primary)" }}>{v}</span>
    </div>
  );
}
