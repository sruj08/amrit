import { mission } from "../../data";
import { CheckCircle2 } from "lucide-react";

function Item({ label, value, ok = true }: { label: string; value: string; ok?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-text-muted">{label}:</span>
      <span className="font-mono text-text-secondary">{value}</span>
      {ok && <CheckCircle2 size={11} className="text-status-complete" />}
    </span>
  );
}

export function StatusBar() {
  const ts = mission.analysis_timestamp.replace("T", " ").replace("Z", "");
  return (
    <footer className="h-8 shrink-0 bg-bg-secondary border-t border-border-subtle flex items-center px-4 gap-4 text-2xs">
      <Item label="DFSAR" value="L+S" />
      <Item label="LOLA" value="5m" />
      <Item label="Diviner" value="GDR L4" />
      <span className="flex items-center gap-1.5">
        <span className="text-text-muted">Pipeline:</span>
        <span className="font-mono text-status-complete">{mission.status}</span>
      </span>
      <div className="ml-auto flex items-center gap-4">
        <span className="font-mono text-text-muted">Seed: {mission.random_seed}</span>
        <span className="font-mono text-text-muted">AOI: Faustini F2</span>
        <span className="font-mono text-text-muted">
          Pixels: {mission.aoi_px_width}×{mission.aoi_px_height}
        </span>
        <span className="font-mono text-text-muted">Run: {ts}</span>
      </div>
    </footer>
  );
}
