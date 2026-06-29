import { confidenceColor, CONFIDENCE_LABEL, confidenceTier } from "../../lib/formatting";

// Semicircular arc gauge for confidence values (0-100).
export function ConfidenceGauge({
  label,
  value,
  size = 180,
}: {
  label: string;
  value: number;
  size?: number;
}) {
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circ = Math.PI * r; // half circle
  const frac = Math.max(0, Math.min(1, value / 100));
  const color = confidenceColor(value);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 18} viewBox={`0 0 ${size} ${size / 2 + 18}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#1e1e3a"
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0,0,0.2,1)" }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" className="font-mono" fontSize={26} fontWeight={700} fill={color}>
          {value.toFixed(1)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#8888aa">
          PERCENT
        </text>
      </svg>
      <div className="label mt-1">{label}</div>
    </div>
  );
}

// Large circular gauge for MRI / RUS (0-100).
export function ScoreGauge({
  label,
  value,
  size = 220,
  recommended = false,
}: {
  label: string;
  value: number;
  size?: number;
  recommended?: boolean;
}) {
  const stroke = 16;
  const r = size / 2 - stroke;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value / 100));
  const color = confidenceColor(value);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1e1e3a" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0,0,0.2,1)" }}
        />
        <text x={cx} y={cx - 2} textAnchor="middle" className="font-mono" fontSize={44} fontWeight={700} fill={color}>
          {Math.round(value)}
        </text>
        <text x={cx} y={cx + 22} textAnchor="middle" fontSize={11} fill="#8888aa" letterSpacing={1.5}>
          {label}
        </text>
      </svg>
      <div
        className="text-2xs font-mono font-semibold px-2 py-0.5 rounded-sm mt-1"
        style={{ color, background: `${color}1f`, border: `1px solid ${color}40` }}
      >
        {recommended ? "RECOMMENDED" : CONFIDENCE_LABEL[confidenceTier(value)]}
      </div>
    </div>
  );
}
