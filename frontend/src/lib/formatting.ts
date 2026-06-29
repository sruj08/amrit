// Number / coordinate formatting (PRD section 5.1) and confidence colour rules.

export function fmtProb(x: number): string {
  return x.toFixed(3);
}
export function fmtPct(x: number, dp = 1): string {
  return `${x.toFixed(dp)}%`;
}
export function fmtSigma(x: number): string {
  return `± ${x.toFixed(3)}`;
}
export function fmtVolume(x: number): string {
  return `${Math.round(x).toLocaleString("en-US")} m³`;
}
export function fmtInt(x: number): string {
  return Math.round(x).toLocaleString("en-US");
}
export function fmtDist(x: number): string {
  return `${Math.round(x)} m`;
}
export function fmtLat(x: number): string {
  return `${x.toFixed(6)}°`;
}
export function fmtCI(lo: number, hi: number, dp = 3): string {
  return `[${lo.toFixed(dp)}, ${hi.toFixed(dp)}]`;
}

export type ConfidenceTier = "high" | "mod" | "low" | "critical";

/** Map a percentage (0-100) to the LRIP confidence tier + colour token. */
export function confidenceTier(pct: number): ConfidenceTier {
  if (pct >= 85) return "high";
  if (pct >= 70) return "mod";
  if (pct >= 50) return "low";
  return "critical";
}

export const CONFIDENCE_COLOR: Record<ConfidenceTier, string> = {
  high: "#22c55e",
  mod: "#f59e0b",
  low: "#f97316",
  critical: "#ef4444",
};

export function confidenceColor(pct: number): string {
  return CONFIDENCE_COLOR[confidenceTier(pct)];
}

export const CONFIDENCE_LABEL: Record<ConfidenceTier, string> = {
  high: "HIGH",
  mod: "MODERATE",
  low: "LOW",
  critical: "CRITICAL",
};

/** Slope colour: green <=8, amber <=15, red >15 (PRD ResourceRankingTable). */
export function slopeColor(deg: number): string {
  if (deg <= 8) return "#22c55e";
  if (deg <= 15) return "#f59e0b";
  return "#ef4444";
}
