import { useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine,
} from "recharts";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { validation as val } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { CheckCircle2 } from "lucide-react";

export default function Validation() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();

  useEffect(() => {
    setNode(<Panel />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Computing validation metrics" />;

  // Merge ROC series by index for a single chart.
  const roc = val.roc.naive.map((d, i) => ({
    fpr: d.fpr,
    naive: d.tpr,
    calibrated: val.roc.calibrated[i]?.tpr,
  }));
  const calib = val.calibration.before.map((d, i) => ({
    pred: d.pred,
    before: d.obs,
    after: val.calibration.after[i]?.obs,
  }));

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Validation Suite"
        subtitle="ROC, calibration, ablation, and cross-sensor agreement — the science, proven"
        right={<Badge color="#22c55e">AUC 0.921 · ECE 0.031</Badge>}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* ROC */}
        <Card title="ROC Curve" pad>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={roc} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#1e1e3a" strokeDasharray="3 3" />
              <XAxis dataKey="fpr" type="number" domain={[0, 1]} stroke="#8888aa" fontSize={11} label={{ value: "False positive rate", position: "insideBottom", offset: -4, fill: "#8888aa", fontSize: 11 }} />
              <YAxis domain={[0, 1]} stroke="#8888aa" fontSize={11} label={{ value: "True positive rate", angle: -90, position: "insideLeft", fill: "#8888aa", fontSize: 11 }} />
              <Tooltip contentStyle={tip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="naive" name={`CPR only (AUC ${val.roc.auc_naive})`} stroke="#ff7043" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="calibrated" name={`Full fusion (AUC ${val.roc.auc_calibrated})`} stroke="#00e5ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-2xs font-mono text-confidence-high mt-1">ΔAUC = +{val.roc.delta_auc}</div>
        </Card>

        {/* Calibration */}
        <Card title="Calibration (Reliability Diagram)" pad>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={calib} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#1e1e3a" strokeDasharray="3 3" />
              <XAxis dataKey="pred" type="number" domain={[0, 1]} stroke="#8888aa" fontSize={11} label={{ value: "Predicted probability", position: "insideBottom", offset: -4, fill: "#8888aa", fontSize: 11 }} />
              <YAxis domain={[0, 1]} stroke="#8888aa" fontSize={11} label={{ value: "Observed frequency", angle: -90, position: "insideLeft", fill: "#8888aa", fontSize: 11 }} />
              <Tooltip contentStyle={tip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#555577" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="before" name={`Before (ECE ${val.calibration.ece_before})`} stroke="#ff7043" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="after" name={`After (ECE ${val.calibration.ece_after})`} stroke="#00e5ff" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Ablation table */}
        <Card title="Dataset Ablation (ΔAUC per evidence layer)" pad>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-text-muted text-2xs uppercase">
                <th className="text-left font-medium py-1">Evidence layer</th>
                <th className="text-right font-medium">AUC</th>
                <th className="text-right font-medium">ΔAUC</th>
                <th className="text-right font-medium">FPR</th>
                <th className="text-right font-medium">ECE</th>
              </tr>
            </thead>
            <tbody>
              {val.ablation.map((a) => (
                <tr key={a.layer} className="border-t border-border-subtle/60">
                  <td className="py-1.5 text-text-secondary">{a.layer}</td>
                  <td className="text-right text-text-primary">{a.auc.toFixed(3)}</td>
                  <td className="text-right text-confidence-high">{a.delta_auc != null ? `+${a.delta_auc.toFixed(3)}` : "—"}</td>
                  <td className="text-right text-text-primary">{a.fpr}%</td>
                  <td className="text-right text-text-primary">{a.ece.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-2xs text-text-muted mt-2">★ Thermal gate is the single largest FPR reduction. ★★ Calibration converts scores to valid probabilities.</p>
        </Card>

        {/* Cross-sensor */}
        <Card title="Cross-sensor Validation — DFSAR vs Mini-RF" pad>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-text-muted text-2xs uppercase">
                <th className="text-left font-medium py-1">Crater</th>
                <th className="text-right font-medium">DFSAR CPR</th>
                <th className="text-right font-medium">Mini-RF CPR</th>
                <th className="text-right font-medium">Δ</th>
                <th className="text-right font-medium">Agree</th>
              </tr>
            </thead>
            <tbody>
              {val.cross_sensor.map((c) => (
                <tr key={c.crater} className="border-t border-border-subtle/60">
                  <td className="py-1.5 text-text-secondary">{c.crater}</td>
                  <td className="text-right text-text-primary">{c.dfsar.toFixed(2)}</td>
                  <td className="text-right text-text-primary">{c.minirf.toFixed(2)}</td>
                  <td className="text-right text-text-primary">{c.delta.toFixed(2)}</td>
                  <td className="text-right">{c.agree && <CheckCircle2 size={12} className="text-confidence-high inline" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-2xs text-text-muted mt-2">DFSAR and Mini-RF agree within measurement uncertainty on all tested craters — cross-sensor consistency supports the ice-likelihood interpretation.</p>
        </Card>
      </div>
    </div>
  );
}

const tip = { background: "#1a1a2e", border: "1px solid #252545", borderRadius: 6, fontFamily: "JetBrains Mono", fontSize: 12 };

function Panel() {
  return (
    <div>
      <div className="label mb-2">Validation Summary</div>
      <L k="AUC (naive)" v={`${val.roc.auc_naive}`} />
      <L k="AUC (calibrated)" v={`${val.roc.auc_calibrated}`} color="#22c55e" />
      <L k="ΔAUC" v={`+${val.roc.delta_auc}`} color="#22c55e" />
      <L k="ECE before" v={`${val.calibration.ece_before}`} />
      <L k="ECE after" v={`${val.calibration.ece_after}`} color="#22c55e" />
      <div className="mt-3 text-2xs text-text-muted leading-relaxed">
        Weak labels: 4 PRL-2026 positive craters (F2, F3, H3, S1) vs 5 negative controls.
        Isotonic calibration converts fusion scores into valid probabilities (ECE 0.241 → 0.031).
      </div>
    </div>
  );
}
function L({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border-subtle/60 text-sm">
      <span className="text-text-secondary">{k}</span>
      <span className="font-mono" style={{ color: color ?? "var(--text-primary)" }}>{v}</span>
    </div>
  );
}
