import { useEffect, useRef } from "react";
import { renderRGB } from "../../lib/colormap";

// m-χ RGB composite: R=double-bounce, G=volume (ice), B=surface.
export function RGBHeatmap({
  r,
  g,
  b,
  width,
  height,
  display = 300,
}: {
  r: number[];
  g: number[];
  b: number[];
  width: number;
  height: number;
  display?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(renderRGB(r, g, b, width, height), 0, 0);
  }, [r, g, b, width, height]);
  return (
    <canvas
      ref={ref}
      style={{ width: display, height: display, imageRendering: "pixelated", background: "#05050a" }}
    />
  );
}
