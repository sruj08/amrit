import { Badge } from "../ui/Primitives";

// Metric with mandatory uncertainty display (PRD Rule 7 / section 7.2).
export function MetricCard({
  label,
  value,
  unit,
  sigma,
  ci,
  interpretation,
  interpColor,
}: {
  label: string;
  value: string;
  unit?: string;
  sigma?: string;
  ci?: string;
  interpretation?: string;
  interpColor?: string;
}) {
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-md p-4">
      <div className="label">{label}</div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="font-mono text-3xl font-bold text-text-primary">{value}</span>
        {sigma && <span className="font-mono text-md text-text-primary">{sigma}</span>}
        {unit && <span className="text-text-secondary text-md">{unit}</span>}
      </div>
      {ci && <div className="font-mono text-xs text-text-muted mt-0.5">CI {ci}</div>}
      {interpretation && (
        <div className="mt-2">
          <Badge color={interpColor}>{interpretation}</Badge>
        </div>
      )}
    </div>
  );
}
