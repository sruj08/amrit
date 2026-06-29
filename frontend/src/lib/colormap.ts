// Matplotlib-style colormaps as RGB anchor stops, linearly interpolated.
// Approximations faithful enough for scientific reading (PRD Rule 4).

type RGB = [number, number, number];
type Stops = RGB[];

const STOPS: Record<string, Stops> = {
  // plasma: black-blue -> purple -> orange -> yellow
  plasma: [
    [13, 8, 135], [84, 2, 163], [139, 10, 165], [185, 50, 137],
    [219, 92, 104], [244, 136, 73], [254, 188, 43], [240, 249, 33],
  ],
  // hot: black -> red -> yellow -> white
  hot: [
    [0, 0, 0], [120, 0, 0], [230, 30, 0], [255, 120, 0],
    [255, 200, 0], [255, 245, 120], [255, 255, 255],
  ],
  // viridis reversed: high value = dark, low value = bright yellow
  viridis_r: [
    [253, 231, 37], [122, 209, 81], [53, 183, 121], [33, 145, 140],
    [49, 104, 142], [68, 57, 131], [68, 1, 84],
  ],
  // magma: black -> purple -> red -> orange -> cream
  magma: [
    [0, 0, 4], [40, 11, 84], [101, 21, 110], [159, 42, 99],
    [212, 72, 66], [245, 125, 21], [252, 194, 99], [252, 253, 191],
  ],
  // YlOrRd: pale yellow -> orange -> deep red
  YlOrRd: [
    [255, 255, 204], [255, 237, 160], [254, 178, 76], [253, 141, 60],
    [240, 59, 32], [189, 0, 38], [128, 0, 38],
  ],
  // greens (m-chi volume / ice channel)
  greens: [
    [0, 20, 8], [0, 68, 27], [35, 139, 69], [116, 196, 118], [199, 233, 192],
  ],
};

export type ColormapName = keyof typeof STOPS;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Sample a colormap at normalised t in [0,1] -> [r,g,b] 0-255. */
export function sampleColormap(name: ColormapName, t: number): RGB {
  const stops = STOPS[name] ?? STOPS.plasma;
  const tt = Math.max(0, Math.min(1, t));
  const seg = tt * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(seg));
  const f = seg - i;
  const a = stops[i];
  const b = stops[i + 1];
  return [
    Math.round(lerp(a[0], b[0], f)),
    Math.round(lerp(a[1], b[1], f)),
    Math.round(lerp(a[2], b[2], f)),
  ];
}

/**
 * Render a flat row-major float array onto a canvas ImageData buffer.
 * Values <= maskBelow render fully transparent (PRD: P(ice) masked below 0.01).
 */
export function renderRaster(
  data: number[],
  width: number,
  height: number,
  cmap: ColormapName,
  vmin: number,
  vmax: number,
  opts: { maskBelow?: number; alpha?: number } = {}
): ImageData {
  const { maskBelow = -Infinity, alpha = 255 } = opts;
  const img = new ImageData(width, height);
  const span = vmax - vmin || 1;
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    const o = i * 4;
    if (v <= maskBelow) {
      img.data[o + 3] = 0;
      continue;
    }
    const t = (v - vmin) / span;
    const [r, g, b] = sampleColormap(cmap, t);
    img.data[o] = r;
    img.data[o + 1] = g;
    img.data[o + 2] = b;
    img.data[o + 3] = alpha;
  }
  return img;
}

/**
 * Render three flat channels into an RGB ImageData (m-χ composite:
 * R=double-bounce, G=volume, B=surface). Each channel normalised to [0,1].
 */
export function renderRGB(
  r: number[],
  g: number[],
  b: number[],
  width: number,
  height: number,
  gain = 1.6
): ImageData {
  const img = new ImageData(width, height);
  for (let i = 0; i < r.length; i++) {
    const o = i * 4;
    img.data[o] = Math.min(255, Math.round(r[i] * 255 * gain));
    img.data[o + 1] = Math.min(255, Math.round(g[i] * 255 * gain));
    img.data[o + 2] = Math.min(255, Math.round(b[i] * 255 * gain));
    img.data[o + 3] = 255;
  }
  return img;
}

/** CSS gradient string for a colormap legend bar. */
export function colormapGradient(name: ColormapName): string {
  const stops = STOPS[name] ?? STOPS.plasma;
  const parts = stops.map((c, i) => {
    const pct = Math.round((i / (stops.length - 1)) * 100);
    return `rgb(${c[0]},${c[1]},${c[2]}) ${pct}%`;
  });
  return `linear-gradient(90deg, ${parts.join(", ")})`;
}
