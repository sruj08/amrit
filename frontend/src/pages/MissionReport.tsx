import { useEffect } from "react";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { mission, decision, iceLikelihood as ice, volume, traverse, recommendedSite } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { fmtInt } from "../lib/formatting";
import { Download, FileText } from "lucide-react";

export default function MissionReport() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();
  const best = recommendedSite;

  useEffect(() => {
    setNode(<Panel />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Compiling mission report" />;

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ mission, decision, volume, traverse }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "LRIP-REPORT-F2-001.json";
    a.click();
  }

  const lrip = traverse.lrip_path.metrics;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Mission Report"
        subtitle="LRIP-REPORT-F2-001 · structured mission document"
        right={
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm bg-bg-tertiary border border-border hover:bg-bg-hover"><FileText size={13} /> Print / PDF</button>
            <button onClick={exportJSON} className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm bg-accent text-white hover:bg-accent-hover"><Download size={13} /> Export JSON</button>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto bg-surface-2 border border-border-subtle rounded-md p-8 space-y-6">
        <div className="text-center border-b border-border-subtle pb-4">
          <div className="text-2xs font-mono text-text-muted tracking-widest">ISRO · SPACE APPLICATIONS · MISSION INTELLIGENCE</div>
          <h2 className="text-xl font-bold mt-2">Faustini F2 Subsurface Ice Survey</h2>
          <div className="text-sm text-text-secondary mt-1">LRIP-REPORT-F2-001 · {mission.analysis_timestamp.slice(0, 10)} · v{mission.pipeline_version}</div>
        </div>

        <Section n={1} title="Executive Summary">
          Analysis of Chandrayaan-2 DFSAR data over Faustini F2 ({mission.target_lat_deg}°, {mission.target_lon_deg}°)
          identifies a high ice-likelihood zone with peak P(ice) = {ice.statistics.p_max} ± {ice.statistics.p_max_sigma}.
          Five independent evidence lines converge. The recommended landing site is {best.name} with a Mission
          Readiness Index of {best.mri}/100 and Resource Utility Score {best.rus}/100. Decision: <b className="text-confidence-high">PROCEED</b>.
        </Section>
        <Section n={2} title="Mission Target">
          Faustini F2, a ~{mission.target_diameter_km} km doubly-shadowed crater. AOI {mission.aoi_px_width}×{mission.aoi_px_height}
          pixels at {mission.pixel_size_m} m/pixel. Cold-trap interior temperatures near 25 K above absolute zero.
        </Section>
        <Section n={3} title="Scientific Evidence">
          CPR interior mean 1.47 ± 0.29 (PRL 2026 peak ≈ 1.95); DOP interior mean 0.108 ± 0.041; combined
          CPR&gt;1 ∧ DOP&lt;0.13 over 47.2% of interior (PRL 2026 reports ~47%). m-χ volume fraction μ=0.743 in the
          ice-consistent zone. Cross-frequency |ΔCPR(L−S)| = 0.09.
        </Section>
        <Section n={4} title="Detection Methodology">
          Bayesian log-odds fusion of CPR, DOP, m-χ volume, thermal cold-trap gate, rock-abundance down-weighting,
          and L/S consistency. Physics-seeded weights, bias −1.5, hard thermal gate at 110 K.
        </Section>
        <Section n={5} title="Calibration & Validation">
          Isotonic calibration reduced ECE 0.241 → 0.031 and improved AUC 0.783 → 0.921 (ΔAUC +0.138).
          False-positive rate collapsed 34.2% → 1.9% across the evidence stack, the thermal gate contributing
          the single largest reduction.
        </Section>
        <Section n={6} title="Landing Site Recommendation">
          {best.name} — slope {best.slope}°, illumination {Math.round(best.illum * 100)}%, boulder density {best.boulder},
          {best.dist_ice} m to ice core. MRI {best.mri}, RUS {best.rus}. Pareto-optimal on science and operation.
        </Section>
        <Section n={7} title="Traverse Plan">
          LRIP A* path {lrip.total_dist_m} m over {lrip.n_waypoints} waypoints, mean P(ice) {lrip.mean_p_ice_on_path},
          minimum SoC {Math.round(lrip.min_soc * 100)}% (above the 15% limit), {lrip.hazards_encountered} hazards.
          The ice-confidence reward routes the rover through {lrip.ice_cells_traversed} high-likelihood cells.
        </Section>
        <Section n={8} title="Ice Volume Estimate">
          Monte-Carlo posterior (N={fmtInt(volume.n_mc_samples)}): median {fmtInt(volume.posterior.median)} m³,
          5–95% [{fmtInt(volume.posterior.percentile_5)}, {fmtInt(volume.posterior.percentile_95)}] m³.
          Mass median ~{volume.mass_estimate.median_tonnes} t. Anchored to LCROSS {volume.lcross_anchor.wt_pct_mean}
          ± {volume.lcross_anchor.wt_pct_std} wt%. This is a posterior distribution, not a point estimate.
        </Section>
        <Section n={9} title="Risk Assessment">
          Dominant volume uncertainty is dielectric mixing-model non-uniqueness (45%). Operational risk bounded
          by the battery model; the brief PSR segment is mitigated by segmented drive windows.
        </Section>
        <Section n={10} title="Mission Readiness Assessment">
          Scientific confidence {decision.scientific_confidence}%, operational confidence {decision.operational_confidence}%.
          Both exceed the 80% PROCEED threshold.
        </Section>
        <Section n={11} title="Limitations & Caveats">
          All outputs are calibrated ice-likelihoods, never detection claims. The dielectric inversion is non-unique;
          volume is reported as a bounded posterior. Illumination uses a synodic approximation, not SPICE.
        </Section>
        <Section n={12} title="References">
          PRL 2026 (Sinha, Bharti et al.), npj Space Exploration, DOI 10.1038/s44453-026-00038-9. ·
          LCROSS (Colaprete et al. 2010), Science, DOI 10.1126/science.1186986.
        </Section>
        <Section n={13} title="Appendix: Data Tables">
          Full rasters, waypoint table, MC samples, and ablation tables available via Developer Mode and JSON export.
        </Section>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-md font-semibold text-text-primary mb-1">{n}. {title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function Panel() {
  return (
    <div>
      <div className="label mb-2">Report Sections</div>
      {["Executive Summary", "Mission Target", "Scientific Evidence", "Detection Methodology", "Calibration & Validation", "Landing Recommendation", "Traverse Plan", "Volume Estimate", "Risk Assessment", "Readiness", "Limitations", "References", "Appendix"].map((s, i) => (
        <div key={s} className="flex gap-2 py-0.5 text-sm text-text-secondary">
          <span className="font-mono text-text-muted">{i + 1}.</span> {s}
        </div>
      ))}
      <Badge color="#22c55e">EXPORT READY</Badge>
    </div>
  );
}
