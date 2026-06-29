import { useEffect } from "react";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { HeatmapLayer } from "../components/science/HeatmapLayer";
import { RGBHeatmap } from "../components/science/RGBHeatmap";
import { polarimetry as pol } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";

export default function Polarimetry() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();
  const W = pol.width;
  const H = pol.height;

  useEffect(() => {
    setNode(<StatsPanel />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Rendering polarimetric evidence stack" />;

  const cell = 260;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Polarimetry"
        subtitle="DFSAR L-band polarimetric outputs — the radar scientist's evidence view"
        right={<Badge color="#ff6b35">L-BAND · 1.25 GHz</Badge>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Tile title="CPR (σ_SC/σ_OC)">
          <HeatmapLayer data={pol.cpr_L_flat} width={W} height={H} cmap="hot" vmin={0} vmax={2.2} unit="CPR" display={cell} contours={[{ level: 1.0, color: "#22d3ee" }]} />
        </Tile>
        <Tile title="DOP">
          <HeatmapLayer data={pol.dop_L_flat} width={W} height={H} cmap="viridis_r" vmin={0} vmax={0.6} unit="DOP" display={cell} contours={[{ level: 0.13, color: "#ff2bd6" }]} />
        </Tile>
        <Tile title="m-χ Volume Fraction">
          <HeatmapLayer data={pol.mv_flat} width={W} height={H} cmap="greens" vmin={0} vmax={0.95} unit="mv" display={cell} />
        </Tile>
        <Tile title="σ_CPR (uncertainty)">
          <HeatmapLayer data={pol.sigma_cpr_flat} width={W} height={H} cmap="magma" vmin={0} vmax={0.4} unit="σ" display={cell} />
        </Tile>
        <Tile title="σ_DOP (uncertainty)">
          <HeatmapLayer data={pol.sigma_dop_flat} width={W} height={H} cmap="magma" vmin={0} vmax={0.06} unit="σ" display={cell} />
        </Tile>
        <Tile title="m-χ RGB Composite" foot="R=double · G=volume · B=surface · ice=green">
          <RGBHeatmap r={pol.mchi_double_flat} g={pol.mv_flat} b={pol.mchi_surface_flat} width={W} height={H} display={cell} />
        </Tile>
      </div>
    </div>
  );
}

function Tile({ title, children, foot }: { title: string; children: React.ReactNode; foot?: string }) {
  return (
    <Card title={title} pad>
      <div className="flex justify-center">{children}</div>
      {foot && <p className="text-2xs text-text-muted mt-2 text-center font-mono">{foot}</p>}
    </Card>
  );
}

function StatsPanel() {
  const s = pol.statistics;
  return (
    <div>
      <div className="label mb-2">CPR Statistics</div>
      <L k="Interior mean" v={`${s.cpr_interior_mean} ± ${s.cpr_interior_std}`} />
      <L k="Interior >1.0" v={`${s.cpr_interior_pct_above_1}%`} />
      <L k="Exterior mean" v={`${s.cpr_exterior_mean}`} />
      <L k="Δ(int−ext)" v={`+${(s.cpr_interior_mean - s.cpr_exterior_mean).toFixed(2)}`} color="#22c55e" />
      <L k="PRL 2026 peak" v={`≈ ${s.prl_peak_cpr} ✓`} />

      <div className="label mb-2 mt-4">DOP Statistics</div>
      <L k="Interior mean" v={`${s.dop_interior_mean} ± ${s.dop_interior_std}`} />
      <L k="Interior <0.13" v={`${s.dop_interior_pct_below}%`} />
      <L k="Exterior mean" v={`${s.dop_exterior_mean}`} />

      <div className="label mb-2 mt-4">Combined Criterion</div>
      <L k="CPR>1 ∧ DOP<0.13" v={`${s.combined_criterion_pct}%`} color="#cc66ff" />
      <L k="PRL 2026 reports" v={`~${s.prl_reference_pct}% ✓`} />
      <L k="|ΔCPR(L−S)|" v={`${s.ls_delta_cpr} (consistent)`} />
      <div className="mt-3 text-2xs text-text-muted leading-relaxed">
        The m-χ RGB composite is the canonical polarimetric view: green (volumetric) scattering
        in the cold-trap floor is the ice-consistent signature.
      </div>
    </div>
  );
}
function L({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border-subtle/60 text-sm">
      <span className="text-text-secondary">{k}</span>
      <span className="font-mono text-sm" style={{ color: color ?? "var(--text-primary)" }}>{v}</span>
    </div>
  );
}
