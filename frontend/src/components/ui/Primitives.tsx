import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  title,
  right,
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  right?: ReactNode;
  pad?: boolean;
}) {
  return (
    <div
      className={`bg-surface-2 border border-border-subtle rounded-md shadow-e1 ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
          <div className="text-md font-semibold text-text-primary">{title}</div>
          {right}
        </div>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Badge({
  children,
  color = "#8888aa",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-2xs font-mono font-semibold"
      style={{ color, background: `${color}1f`, border: `1px solid ${color}40` }}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  color?: string;
}) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="font-mono text-2xl font-bold mt-0.5" style={{ color: color ?? "var(--text-primary)" }}>
        {value}
      </div>
      {sub && <div className="font-mono text-xs text-text-secondary mt-0.5">{sub}</div>}
    </div>
  );
}
