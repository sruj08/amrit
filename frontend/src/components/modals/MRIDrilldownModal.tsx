import { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import type { Site } from "../../data";
import { confidenceColor } from "../../lib/formatting";

// M02 — MRI drill-down with live weight sliders. Weights always sum to 1.0;
// adjusting one rebalances the others proportionally and MRI recomputes live.
export function MRIDrilldownModal({ site, onClose }: { site: Site; onClose: () => void }) {
  const names = site.mri_components.map((c) => c.name);
  const scores = Object.fromEntries(site.mri_components.map((c) => [c.name, c.score]));
  const defaults = Object.fromEntries(site.mri_components.map((c) => [c.name, c.weight]));
  const [weights, setWeights] = useState<Record<string, number>>({ ...defaults });

  function setWeight(name: string, v: number) {
    const others = names.filter((n) => n !== name);
    const remaining = 1 - v;
    const othersSum = others.reduce((a, n) => a + weights[n], 0) || 1;
    const next: Record<string, number> = { [name]: v };
    others.forEach((n) => (next[n] = (weights[n] / othersSum) * remaining));
    setWeights(next);
  }

  const mri = names.reduce((a, n) => a + scores[n] * weights[n], 0) * 100;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-[520px] bg-surface-1 border border-border-strong rounded-lg shadow-e4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <span className="label">Mission Readiness Index — {site.name}</span>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="p-4">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-mono text-4xl font-bold" style={{ color: confidenceColor(mri) }}>{mri.toFixed(1)}</span>
            <span className="text-text-muted text-md">/ 100</span>
            {Math.abs(mri - site.mri) > 0.1 && (
              <button onClick={() => setWeights({ ...defaults })} className="ml-auto flex items-center gap-1.5 text-2xs text-accent-hover">
                <RotateCcw size={12} /> Reset to defaults
              </button>
            )}
          </div>

          <table className="w-full text-sm font-mono mb-4">
            <thead>
              <tr className="text-text-muted text-2xs uppercase">
                <th className="text-left font-medium py-1">Component</th>
                <th className="text-right font-medium">Score</th>
                <th className="text-right font-medium">Weight</th>
                <th className="text-right font-medium">Contrib</th>
              </tr>
            </thead>
            <tbody>
              {names.map((n) => (
                <tr key={n} className="border-t border-border-subtle/60">
                  <td className="py-1 text-text-secondary">{n}</td>
                  <td className="text-right text-text-primary">{scores[n].toFixed(3)}</td>
                  <td className="text-right text-text-primary">{(weights[n] * 100).toFixed(0)}%</td>
                  <td className="text-right text-text-primary">{(scores[n] * weights[n] * 100).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-2.5">
            {names.map((n) => (
              <div key={n}>
                <div className="flex items-center justify-between text-2xs mb-0.5">
                  <span className="text-text-secondary">{n}</span>
                  <span className="font-mono text-text-primary">{(weights[n] * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={weights[n]}
                  onChange={(e) => setWeight(n, parseFloat(e.target.value))}
                  className="w-full accent-[#3b5bdb]"
                />
              </div>
            ))}
          </div>

          <p className="text-2xs text-text-muted mt-3 leading-relaxed">
            Weights always sum to 1.00; adjusting one rebalances the others proportionally. MRI is a
            display of the planning decision — changing weights here does not alter the physics
            (P(ice), traverse, volume remain fixed).
          </p>
        </div>
      </div>
    </div>
  );
}
