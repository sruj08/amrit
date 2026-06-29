import { X } from "lucide-react";
import { iceLikelihood as ice, polarimetry as pol, terrain as terr, mission } from "../../data";

export interface PixelSel {
  row: number;
  col: number;
}

function Line({ label, value, threshold, pass }: { label: string; value: string; threshold?: string; pass?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-2xs font-mono">
      <span className="text-text-secondary">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-text-primary">{value}</span>
        {threshold && <span className="text-text-muted">{threshold}</span>}
        {pass !== undefined && <span style={{ color: pass ? "#22c55e" : "#ef4444" }}>{pass ? "✓" : "✕"}</span>}
      </span>
    </div>
  );
}

// M04 — full per-pixel evidence audit drawer (PRD section 3.3).
export function PixelInspector({ sel, onClose }: { sel: PixelSel; onClose: () => void }) {
  const i = sel.row * ice.width + sel.col;
  const cprL = pol.cpr_L_flat[i];
  const cprS = pol.cpr_S_flat[i];
  const dopL = pol.dop_L_flat[i];
  const dopS = pol.dop_S_flat[i];
  const mv = pol.mv_flat[i];
  const lsDelta = pol.ls_delta_flat[i];
  const tMax = terr.t_max_flat[i];
  const rock = terr.rock_flat[i];
  const rough = terr.roughness_flat[i];
  const p = ice.p_raster_flat[i];
  const sp = ice.sigma_raster_flat[i];
  const ci5 = ice.ci5_raster_flat[i];
  const ci95 = ice.ci95_raster_flat[i];
  const cold = tMax <= 110;

  // approximate lat/lon from pixel (display only)
  const lat = (mission.target_lat_deg + (sel.row - 108) * 0.0001).toFixed(4);
  const lon = (mission.target_lon_deg + (sel.col - 112) * 0.0001).toFixed(4);

  const interp = p > 0.8 ? ["VERY HIGH", "#22c55e"] : p > 0.5 ? ["HIGH", "#84cc16"] : p > 0.2 ? ["MODERATE", "#f59e0b"] : ["LOW", "#ef4444"];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <aside
        className="relative w-[420px] h-full bg-surface-1 border-l border-border-strong shadow-e4 overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle sticky top-0 bg-surface-1">
          <span className="label">Pixel Evidence Audit</span>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <Line label="Coordinates" value={`${lat}°N, ${lon}°E`} />
            <Line label="Pixel index" value={`(${sel.row}, ${sel.col})`} />
            <Line label="AOI band" value="L-band (1.25 GHz)" />
          </div>

          <Group title="Polarimetric Evidence">
            <Line label="CPR (L)" value={cprL.toFixed(2)} threshold=">1.0" pass={cprL > 1} />
            <Line label="CPR (S)" value={cprS.toFixed(2)} threshold=">1.0" pass={cprS > 1} />
            <Line label="DOP (L)" value={dopL.toFixed(3)} threshold="<0.13" pass={dopL < 0.13} />
            <Line label="DOP (S)" value={dopS.toFixed(3)} threshold="<0.13" pass={dopS < 0.13} />
            <Line label="mv (volume)" value={mv.toFixed(3)} pass={mv > 0.4} />
            <Line label="L/S Δ CPR" value={lsDelta.toFixed(2)} pass={lsDelta < 0.3} />
          </Group>

          <Group title="Thermal Evidence">
            <Line label="T_max" value={`${tMax.toFixed(1)} K`} threshold="<110 K" pass={cold} />
            <Line label="Cold-trap" value={cold ? "YES" : "NO"} pass={cold} />
          </Group>

          <Group title="Physical Evidence">
            <Line label="Rock abundance" value={rock.toFixed(3)} threshold="<0.05" pass={rock < 0.05} />
            <Line label="Roughness" value={`${rough.toFixed(1)}°`} pass={rough < 4} />
          </Group>

          <Group title="Fusion Output">
            <Line label="P(ice)" value={`${p.toFixed(3)} ± ${sp.toFixed(3)}`} />
            <Line label="CI [5–95]" value={`[${ci5.toFixed(3)}, ${ci95.toFixed(3)}]`} />
          </Group>

          <div className="rounded-md border p-3" style={{ borderColor: `${interp[1]}55`, background: `${interp[1]}12` }}>
            <div className="text-2xs text-text-secondary">Ice-likelihood</div>
            <div className="font-mono text-lg font-bold" style={{ color: interp[1] }}>{interp[0]}</div>
            <div className="text-2xs text-text-muted mt-1">
              {cold ? "Thermally stable cold trap." : "Warm — thermal gate suppresses ice likelihood here."}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label mb-1">{title}</div>
      <div className="bg-bg-tertiary border border-border-subtle rounded-sm px-2.5 py-1.5">{children}</div>
    </div>
  );
}
