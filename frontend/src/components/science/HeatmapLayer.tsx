import { useEffect, useMemo, useRef, useState } from "react";
import { renderRaster, colormapGradient, ColormapName } from "../../lib/colormap";

export interface Contour {
  level: number;
  color: string;
  label?: string;
}
export interface Overlay {
  // SVG drawn on top, in pixel coordinates of the raster grid
  render: (scale: number) => React.ReactNode;
}

interface Props {
  data: number[];
  width: number;
  height: number;
  cmap: ColormapName;
  vmin: number;
  vmax: number;
  maskBelow?: number;
  display?: number; // rendered px size (square)
  unit?: string;
  contours?: Contour[];
  overlay?: (scale: number) => React.ReactNode;
  onPixel?: (info: { row: number; col: number; value: number }) => void;
  legend?: boolean;
}

// Canvas-rendered heatmap (PRD Rule 3). The float raster is drawn at native
// resolution onto an offscreen canvas, then scaled up crisply.
export function HeatmapLayer({
  data,
  width,
  height,
  cmap,
  vmin,
  vmax,
  maskBelow,
  display = 460,
  unit,
  contours = [],
  overlay,
  onPixel,
  legend = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; row: number; col: number; v: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = renderRaster(data, width, height, cmap, vmin, vmax, { maskBelow });
    ctx.putImageData(img, 0, 0);
  }, [data, width, height, cmap, vmin, vmax, maskBelow]);

  const scale = display / width;

  function handleMove(e: React.MouseEvent) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * width);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * height);
    if (row < 0 || row >= height || col < 0 || col >= width) return;
    const v = data[row * width + col];
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, row, col, v });
  }

  function handleClick(e: React.MouseEvent) {
    if (!onPixel) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * width);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * height);
    if (row < 0 || row >= height || col < 0 || col >= width) return;
    onPixel({ row, col, value: data[row * width + col] });
  }

  return (
    <div className="relative inline-block">
      <div
        className="relative"
        style={{ width: display, height: display, cursor: onPixel ? "crosshair" : "default" }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        onClick={handleClick}
      >
        <canvas
          ref={canvasRef}
          className="block"
          style={{
            width: display,
            height: display,
            imageRendering: "pixelated",
            background: "#05050a",
          }}
        />
        {/* Contour + custom overlays in SVG */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={display}
          height={display}
          viewBox={`0 0 ${width} ${height}`}
        >
          {contours.map((c, i) => (
            <ContourPath key={i} data={data} width={width} height={height} {...c} />
          ))}
          {overlay?.(scale)}
        </svg>
        {/* North arrow + scale bar */}
        <div className="absolute top-1.5 right-1.5 text-2xs font-mono text-white/70 select-none">N ↑</div>
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 text-2xs font-mono text-white/70">
          <span className="inline-block h-[2px] bg-white/70" style={{ width: scale * 40 }} />
          200 m
        </div>
        {hover && (
          <div
            className="absolute z-20 pointer-events-none bg-surface-3 border border-border rounded-md px-2 py-1.5 shadow-e3 text-2xs font-mono"
            style={{
              left: Math.min(hover.x + 12, display - 150),
              top: Math.min(hover.y + 12, display - 60),
              width: 140,
            }}
          >
            <div className="text-text-muted">
              px ({hover.row}, {hover.col})
            </div>
            <div className="text-text-primary">
              {unit ?? "value"}: {hover.v.toFixed(3)}
            </div>
          </div>
        )}
      </div>
      {legend && (
        <div className="mt-2 flex items-center gap-2" style={{ width: display }}>
          <span className="font-mono text-2xs text-text-muted">{vmin.toFixed(2)}</span>
          <div
            className="flex-1 h-2 rounded-sm border border-border-subtle"
            style={{ background: colormapGradient(cmap) }}
          />
          <span className="font-mono text-2xs text-text-muted">{vmax.toFixed(2)}</span>
          {unit && <span className="font-mono text-2xs text-text-secondary ml-1">{unit}</span>}
        </div>
      )}
    </div>
  );
}

// Marching-squares-free contour: draw cell edges where the field crosses level.
function ContourPath({
  data,
  width,
  height,
  level,
  color,
}: {
  data: number[];
  width: number;
  height: number;
  level: number;
  color: string;
}) {
  // Memoised: the O(W·H) crossing scan must not re-run on every hover repaint.
  const d = useMemo(() => {
    const segs: string[] = [];
    for (let r = 0; r < height - 1; r++) {
      for (let c = 0; c < width - 1; c++) {
        const a = data[r * width + c];
        const b = data[r * width + c + 1];
        const dn = data[(r + 1) * width + c];
        const above = (v: number) => v >= level;
        if (above(a) !== above(b)) segs.push(`M${c + 0.5} ${r}L${c + 0.5} ${r + 1}`);
        if (above(a) !== above(dn)) segs.push(`M${c} ${r + 0.5}L${c + 1} ${r + 0.5}`);
      }
    }
    return segs.join("");
  }, [data, width, height, level]);
  return <path d={d} stroke={color} strokeWidth={0.6} fill="none" opacity={0.9} />;
}
