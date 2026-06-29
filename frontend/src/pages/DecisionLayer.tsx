import { useEffect, useState } from "react";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { ConfidenceGauge, ScoreGauge } from "../components/gauges/Gauges";
import { MRIDrilldownModal } from "../components/modals/MRIDrilldownModal";
import { decision, recommendedSite } from "../data";
import type { Site } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { confidenceColor } from "../lib/formatting";
import { CheckCircle2, Trophy } from "lucide-react";

export default function DecisionLayer() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();
  const sci = decision.scientific_confidence;
  const op = decision.operational_confidence;
  const best = recommendedSite;
  const siteA = decision.sites.find((s) => s.id === "F2_Site_A")!;
  const [mriOpen, setMriOpen] = useState(false);

  useEffect(() => {
    setNode(<DecisionGate sci={sci} op={op} />);
    return () => setNode(null);
  }, [setNode, sci, op]);

  if (!loaded) return <PipelineLoadingScreen stage="Computing decision intelligence layer" />;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Decision Layer"
        subtitle="Beyond detection — Mission Readiness, Resource Utility, and dual confidence"
        right={<Badge color="#3b5bdb">PROPRIETARY</Badge>}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Dual confidence */}
        <div className="col-span-4 space-y-4">
          <Card title="Scientific Confidence" pad>
            <ConfidenceGauge label="ice-signature genuine" value={sci} />
            <div className="mt-3 space-y-1">
              {decision.sci_evidence.map((e) => (
                <div key={e.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <CheckCircle2 size={12} className="text-confidence-high" />
                    {e.label}
                  </span>
                  <span className="font-mono text-confidence-high">+{e.contribution.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-muted mt-3 leading-relaxed">
              Confidence the multi-line evidence is consistent with the ice hypothesis and
              inconsistent with the roughness alternative — not the probability ice exists.
              This is ice-likelihood, not a detection claim (PRL 2026: “potential ice”).
            </p>
          </Card>

          <Card title="Operational Confidence" pad>
            <ConfidenceGauge label="mission executable" value={op} />
            <div className="mt-3 space-y-1 text-sm">
              <OpRow l="Slope < 15° at landing" v="✓" ok />
              <OpRow l="Illumination > 30%" v="✓" ok />
              <OpRow l="Boulder density LOW" v="✓" ok />
              <OpRow l="SoC stays ≥ 15% on path" v="✓" ok />
              <OpRow l="PSR segment (battery-bounded)" v="⚠ mitigated" />
            </div>
          </Card>
        </div>

        {/* MRI center */}
        <div className="col-span-4">
          <Card title="Mission Readiness Index" pad>
            <div className="text-center text-sm font-mono text-text-secondary mb-2">{best.name}</div>
            <button onClick={() => setMriOpen(true)} className="w-full flex justify-center cursor-pointer" title="Open MRI drill-down with weight sliders">
              <ScoreGauge label="MRI" value={best.mri} recommended />
            </button>
            <div className="mt-4">
              <ComponentTable site={best} kind="mri" />
            </div>
            <div className="mt-3 p-2.5 rounded-md bg-bg-tertiary border border-border-subtle">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">vs Site A (naive highest-CPR)</span>
                <span className="font-mono" style={{ color: confidenceColor(siteA.mri) }}>{siteA.mri}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-text-secondary">Δ MRI (B vs A)</span>
                <span className="font-mono text-confidence-high">+{(best.mri - siteA.mri).toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                Site B wins despite lower peak ice likelihood — superior terrain, accessibility,
                and prediction confidence. Site A’s 22° slope collapses its terrain score.
              </p>
            </div>
          </Card>
        </div>

        {/* RUS right */}
        <div className="col-span-4">
          <Card title="Resource Utility Score" pad>
            <div className="space-y-1.5 mb-3">
              {decision.sites.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-text-muted w-5">#{i + 1}</span>
                  {i === 0 && <Trophy size={13} className="text-confidence-mod" />}
                  <span className="text-text-primary flex-1">{s.id}</span>
                  <span className="font-mono text-text-secondary">RUS</span>
                  <span className="font-mono font-bold" style={{ color: confidenceColor(s.rus) }}>{Math.round(s.rus)}</span>
                  <span className="font-mono text-text-muted">MRI {Math.round(s.mri)}</span>
                </div>
              ))}
            </div>
            <div className="text-center my-3">
              <ScoreGauge label="RUS" value={best.rus} size={170} recommended />
            </div>
            <ComponentTable site={best} kind="rus" />
            <p className="text-[10px] text-text-muted mt-3 leading-relaxed">
              The resource with the highest utility is not the one with the most ice — it is the
              one that can actually be reached and used. Site A holds more ice but RUS {Math.round(siteA.rus)} (steep,
              boulder field).
            </p>
          </Card>
        </div>
      </div>

      {mriOpen && <MRIDrilldownModal site={best} onClose={() => setMriOpen(false)} />}
    </div>
  );
}

function ComponentTable({ site, kind }: { site: Site; kind: "mri" | "rus" }) {
  const comps = kind === "mri" ? site.mri_components : site.rus_components;
  const total = kind === "mri" ? site.mri : site.rus;
  return (
    <table className="w-full text-sm font-mono">
      <tbody>
        {comps.map((c) => (
          <tr key={c.name} className="border-b border-border-subtle/50">
            <td className="py-1 text-text-secondary">{c.name}</td>
            <td className="text-right text-text-primary">{kind === "mri" ? (c as any).score.toFixed(2) : ((c as any).score / 100).toFixed(2)}</td>
            <td className="text-right text-text-muted">×{(c.weight * 100).toFixed(0)}%</td>
            <td className="text-right text-text-primary w-12">{(kind === "mri" ? (c as any).contribution : (c as any).weighted_score).toFixed(1)}</td>
          </tr>
        ))}
        <tr>
          <td className="py-1 font-semibold text-text-primary" colSpan={3}>{kind.toUpperCase()}</td>
          <td className="text-right font-bold" style={{ color: confidenceColor(total) }}>{total.toFixed(1)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function OpRow({ l, v, ok }: { l: string; v: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{l}</span>
      <span className="font-mono" style={{ color: ok ? "#22c55e" : "#f59e0b" }}>{v}</span>
    </div>
  );
}

function DecisionGate({ sci, op }: { sci: number; op: number }) {
  const proceed = sci >= 80 && op >= 80;
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1200);
    return () => clearInterval(id);
  }, []);
  void t;
  const color = proceed ? "#22c55e" : "#f59e0b";
  return (
    <div>
      <div className="label mb-2">Decision Matrix</div>
      <div className="p-3 rounded-md border" style={{ borderColor: `${color}55`, background: `${color}12` }}>
        <div className="font-mono text-lg font-bold" style={{ color }}>
          {proceed ? "PROCEED" : "REVIEW"}
        </div>
        <div className="text-2xs text-text-secondary mt-1">
          Sci {sci.toFixed(1)}% {sci >= 80 ? "≥" : "<"} 80% AND Op {op.toFixed(1)}% {op >= 80 ? "≥" : "<"} 80%
        </div>
      </div>
      <div className="mt-3 space-y-1 text-2xs font-mono text-text-muted">
        <div>Sci≥80 ∧ Op≥80 → PROCEED</div>
        <div>Sci≥80 ∧ Op&lt;80 → OP REVIEW</div>
        <div>Sci&lt;80 ∧ Op≥80 → MORE SCIENCE</div>
        <div>else → DO NOT PROCEED</div>
      </div>
    </div>
  );
}
