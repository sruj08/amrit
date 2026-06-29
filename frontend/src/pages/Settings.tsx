import { useEffect, useState } from "react";
import { PageHeader, Card } from "../components/ui/Primitives";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { MissionSummaryPanel } from "../components/layout/ContextPanel";
import { iceLikelihood as ice } from "../data";

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-2 border-b border-border-subtle/60">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${on ? "bg-accent" : "bg-bg-tertiary"}`}>
        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

export default function Settings() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();
  const [layers, setLayers] = useState<Record<string, boolean>>({ pice: true, sites: true, traverse: true, psr: true, contours: true });
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ mono: true, uncertainty: true, loading: true });
  const [weights] = useState(ice.model.weights);

  useEffect(() => {
    setNode(<MissionSummaryPanel />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Loading preferences" />;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Settings" subtitle="Layer visibility, fusion weight reference, and display preferences" />

      <div className="grid grid-cols-3 gap-4">
        <Card title="Layer Visibility" pad>
          <Toggle label="P(ice) heatmap" on={layers.pice} onClick={() => setLayers((s) => ({ ...s, pice: !s.pice }))} />
          <Toggle label="Landing sites" on={layers.sites} onClick={() => setLayers((s) => ({ ...s, sites: !s.sites }))} />
          <Toggle label="Traverse path" on={layers.traverse} onClick={() => setLayers((s) => ({ ...s, traverse: !s.traverse }))} />
          <Toggle label="PSR boundary" on={layers.psr} onClick={() => setLayers((s) => ({ ...s, psr: !s.psr }))} />
          <Toggle label="Probability contours" on={layers.contours} onClick={() => setLayers((s) => ({ ...s, contours: !s.contours }))} />
          <p className="text-2xs text-text-muted mt-2">Display preferences are session-local in this prototype.</p>
        </Card>

        <Card title="Fusion Weights (physics-seeded)" pad>
          {Object.entries(weights).map(([k, v]) => (
            <div key={k} className="py-1.5 border-b border-border-subtle/60">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary uppercase font-mono">{k}</span>
                <span className="font-mono text-text-primary">{(v as number).toFixed(2)}</span>
              </div>
              <div className="h-1.5 rounded-sm bg-bg-tertiary mt-1 overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${(v as number) * 100 / 0.3 * 0.8}%` }} />
              </div>
            </div>
          ))}
          <p className="text-2xs text-text-muted mt-2">Bias {ice.model.bias}. Weights are seeded from physics, not fit — see Decision Layer for the live MRI weight sliders.</p>
        </Card>

        <Card title="Display Preferences" pad>
          <Toggle label="Monospace data values" on={prefs.mono} onClick={() => setPrefs((s) => ({ ...s, mono: !s.mono }))} />
          <Toggle label="Always show uncertainty" on={prefs.uncertainty} onClick={() => setPrefs((s) => ({ ...s, uncertainty: !s.uncertainty }))} />
          <Toggle label="Pipeline loading animation" on={prefs.loading} onClick={() => setPrefs((s) => ({ ...s, loading: !s.loading }))} />
          <div className="mt-3 text-2xs text-text-muted leading-relaxed">
            LRIP is always dark-mode. Uncertainty display is a first-class principle — disabling it is for
            comparison only and is not recommended for committee review.
          </div>
        </Card>
      </div>
    </div>
  );
}
