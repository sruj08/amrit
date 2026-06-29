import { mission } from "../../data";
import { confidenceColor } from "../../lib/formatting";
import { Satellite } from "lucide-react";

export function TopHeader() {
  const statusColor =
    mission.status === "COMPLETE" ? "#22c55e" : mission.status === "RUNNING" ? "#3b82f6" : "#ef4444";
  return (
    <header className="h-14 shrink-0 bg-bg-secondary border-b border-border-subtle flex items-center px-4 gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-accent/20 border border-accent/40 flex items-center justify-center">
          <Satellite size={16} className="text-accent-hover" />
        </div>
        <div className="leading-tight">
          <div className="text-md font-bold tracking-wide text-text-primary">LRIP</div>
          <div className="text-[9px] text-text-muted uppercase tracking-[0.15em]">
            Lunar Resource Intelligence
          </div>
        </div>
      </div>

      <div className="h-7 w-px bg-border-subtle" />

      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-text-muted">MISSION</span>
        <span className="font-mono text-text-primary">{mission.id}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-text-muted">TARGET</span>
        <span className="font-mono text-text-primary">
          {mission.target_lat_deg.toFixed(2)}°, {mission.target_lon_deg.toFixed(2)}°
        </span>
      </div>

      <div className="ml-auto flex items-center gap-5">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
          <span className="font-mono" style={{ color: statusColor }}>
            {mission.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="label text-[10px]">MRI</span>
          <span className="font-mono text-md font-bold" style={{ color: confidenceColor(mission.mri) }}>
            {mission.mri}
          </span>
          <span className="text-text-muted text-xs">/100</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="label text-[10px]">RUS</span>
          <span className="font-mono text-md font-bold" style={{ color: confidenceColor(mission.rus) }}>
            {mission.rus}
          </span>
          <span className="text-text-muted text-xs">/100</span>
        </div>
        <span className="font-mono text-2xs text-text-muted">v{mission.pipeline_version}</span>
      </div>
    </header>
  );
}
