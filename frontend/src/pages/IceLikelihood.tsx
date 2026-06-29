import { useEffect, useMemo, useState } from "react";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { HeatmapLayer } from "../components/science/HeatmapLayer";
import { PixelInspector, PixelSel } from "../components/science/PixelInspector";
import { iceLikelihood as ice } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";

const LAYERS: { id: string; label: string; locked?: boolean }[] = [
  { id: "cpr", label: "CPR", locked: true },
  { id: "dop", label: "DOP" },
  { id: "thermal", label: "THERMAL" },
  { id: "rock", label: "ROCK" },
  { id: "ls", label: "L/S" },
];

export default function IceLikelihood() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [pixel, setPixel] = useState<PixelSel | null>(null);

  // Pick the right pre-computed raster for the enabled evidence combination.
  // The pipeline emits single-layer-removal ablations; with several removed we
  // surface the most impactful one (thermal > dop > rock > ls).
  const { rightData, note } = useMemo(() => {
    const order = ["thermal", "dop", "rock", "ls"];
    const removed = order.filter((k) => off[k]);
    if (removed.length === 0) return { rightData: ice.p_raster_flat, note: "All evidence → best AUC 0.921" };
    const key = `no_${removed[0]}`;
    const notes: Record<string, string> = {
      no_thermal: "Thermal gate removed → warm rocky false-positives reappear (Fa & Eke)",
      no_dop: "DOP removed → surface double-bounce no longer discriminated, FPR rises",
      no_rock: "Rock filter removed → blocky terrain leaks in",
      no_ls: "L/S consistency removed → cross-frequency outliers retained",
    };
    return { rightData: ice.ablation_rasters[key] ?? ice.p_raster_flat, note: notes[key] };
  }, [off]);

  useEffect(() => {
    setNode(<StatsPanel />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Loading calibrated ice-likelihood field" />;

  const W = ice.width;
  const H = ice.height;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Ice Likelihood"
        subtitle="Naive CPR/DOP criterion vs LRIP calibrated P(ice | CPR, DOP, T, rock, L/S)"
        right={<Badge color="#cc66ff">THE MONEY SHOT</Badge>}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Naive */}
        <Card title={<span className="text-confidence-critical">✕ Naive Criterion</span>} pad>
          <div className="text-2xs font-mono text-text-secondary mb-2">
            CPR &gt; 1.0 AND DOP &lt; 0.13 · binary mask · {ice.naive_pixel_count.toLocaleString()} px
            ({ice.naive_pct}%) · includes rock false-positives
          </div>
          <HeatmapLayer
            data={ice.naive_mask_flat}
            width={W}
            height={H}
            cmap="hot"
            vmin={0}
            vmax={1}
            maskBelow={0.5}
            unit="flag"
            legend={false}
            display={420}
          />
        </Card>

        {/* Calibrated */}
        <Card title={<span className="text-confidence-high">✓ LRIP Calibrated P(ice)</span>} pad>
          <div className="text-2xs font-mono text-text-secondary mb-2">
            Probability field · peak {ice.statistics.p_max.toFixed(3)} ± {ice.statistics.p_max_sigma.toFixed(3)} ·
            ECE {ice.calibration.ece_after}
          </div>
          <HeatmapLayer
            data={rightData}
            width={W}
            height={H}
            cmap="plasma"
            vmin={0}
            vmax={0.95}
            maskBelow={0.01}
            unit="P(ice)"
            display={420}
            onPixel={(p) => setPixel({ row: p.row, col: p.col })}
            contours={[
              { level: 0.5, color: "#22d3ee" },
              { level: 0.7, color: "#ffffff" },
            ]}
          />
          <div className="text-2xs text-text-muted mt-1 text-center">Click any pixel for the full evidence audit.</div>
        </Card>
      </div>

      {pixel && <PixelInspector sel={pixel} onClose={() => setPixel(null)} />}

      {/* Evidence layer toggles */}
      <Card title="Evidence Layers" className="mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          {LAYERS.map((l) => {
            const isOff = !!off[l.id];
            return (
              <button
                key={l.id}
                disabled={l.locked}
                onClick={() => setOff((s) => ({ ...s, [l.id]: !s[l.id] }))}
                className={[
                  "px-3 py-1.5 rounded-sm text-sm font-mono font-semibold border transition-colors duration-150",
                  l.locked
                    ? "bg-accent-dim text-accent-hover border-accent/40 cursor-default"
                    : isOff
                    ? "bg-bg-tertiary text-text-muted border-border-subtle line-through"
                    : "bg-confidence-high/15 text-confidence-high border-confidence-high/40",
                ].join(" ")}
              >
                {l.label}
                {l.locked && <span className="ml-1 text-[9px]">base</span>}
              </button>
            );
          })}
          <span className="ml-3 text-sm text-text-secondary">{note}</span>
        </div>
        <p className="text-2xs text-text-muted mt-3 leading-relaxed max-w-3xl">
          Toggling an evidence layer off recomputes the calibrated field from the pre-computed
          ablation. Removing the thermal gate is the most visible: warm rocky terrain that mimics
          CPR &gt; 1 (the Fa &amp; Eke roughness ambiguity) reappears as false positives.
        </p>
      </Card>
    </div>
  );
}

function StatsPanel() {
  const c = ice.calibration;
  const fpr = ice.fpr_breakdown;
  return (
    <div>
      <div className="label mb-2">Calibration Quality</div>
      <Line l="AUC (naive)" v={c.auc_before.toFixed(3)} />
      <Line l="AUC (calibrated)" v={c.auc_after.toFixed(3)} color="#22c55e" />
      <Line l="ΔAUC" v={`+${(c.auc_after - c.auc_before).toFixed(3)}`} color="#22c55e" />
      <Line l="ECE (before)" v={c.ece_before.toFixed(3)} />
      <Line l="ECE (after)" v={c.ece_after.toFixed(3)} color="#22c55e" />

      <div className="label mb-2 mt-4">False Positive Rate</div>
      {fpr.map((f, i) => (
        <Line
          key={f.stage}
          l={f.stage}
          v={`${f.fpr}%`}
          color={i === 2 ? "#22c55e" : undefined}
        />
      ))}
      <div className="text-2xs text-text-muted mt-1">Thermal gate = primary FPR collapse.</div>

      <div className="label mb-2 mt-4">Peak Ice Likelihood</div>
      <Line l="P(ice) max" v="0.917" color="#cc66ff" />
      <Line l="Location (row,col)" v={`(${ice.statistics.p_max_pixel[1]}, ${ice.statistics.p_max_pixel[0]})`} />
      <Line l="CI [5–95]" v="[0.803, 0.981]" />
      <Line l="σ_P" v="0.062" />
    </div>
  );
}

function Line({ l, v, color }: { l: string; v: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border-subtle/60">
      <span className="text-sm text-text-secondary">{l}</span>
      <span className="font-mono text-sm" style={{ color: color ?? "var(--text-primary)" }}>
        {v}
      </span>
    </div>
  );
}
