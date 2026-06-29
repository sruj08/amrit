import { mission } from "../../data";
import { usePanel } from "./PanelContext";
import { confidenceColor, fmtVolume, fmtCI } from "../../lib/formatting";

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border-subtle/60">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="font-mono text-sm" style={{ color: color ?? "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

/** Default panel content — shown when a page provides nothing (never empty). */
export function MissionSummaryPanel() {
  return (
    <div>
      <div className="label mb-2">Mission Summary</div>
      <Row label="MRI" value={`${mission.mri} / 100`} color={confidenceColor(mission.mri)} />
      <Row label="RUS" value={`${mission.rus} / 100`} color={confidenceColor(mission.rus)} />
      <Row
        label="Scientific Conf."
        value={`${mission.scientific_confidence.toFixed(1)}%`}
        color={confidenceColor(mission.scientific_confidence)}
      />
      <Row
        label="Operational Conf."
        value={`${mission.operational_confidence.toFixed(1)}%`}
        color={confidenceColor(mission.operational_confidence)}
      />
      <div className="h-3" />
      <div className="label mb-2">Key Estimates</div>
      <Row label="Peak P(ice)" value="0.917 ± 0.062" color="#cc66ff" />
      <Row label="Volume (median)" value={fmtVolume(mission.volume_median)} color="#3366ff" />
      <Row
        label="Volume CI [5–95]"
        value={fmtCI(mission.volume_ci[0], mission.volume_ci[1], 0)}
      />
      <div className="mt-4 p-2.5 rounded-md bg-bg-tertiary border border-border-subtle">
        <div className="text-2xs text-text-muted leading-relaxed">
          Every output is a calibrated likelihood with bounded uncertainty — never a
          detection claim. Estimates reflect the seed=42 pipeline run.
        </div>
      </div>
    </div>
  );
}

export function ContextPanel() {
  const { node } = usePanel();
  return (
    <aside className="w-[320px] shrink-0 bg-bg-secondary border-l border-border-subtle overflow-y-auto p-4">
      {node ?? <MissionSummaryPanel />}
    </aside>
  );
}
