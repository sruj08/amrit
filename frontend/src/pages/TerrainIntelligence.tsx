import { useEffect, useState } from "react";
import { PageHeader, Card, Badge } from "../components/ui/Primitives";
import { HeatmapLayer } from "../components/science/HeatmapLayer";
import { ColormapName } from "../lib/colormap";
import { terrain as terr } from "../data";
import { usePageLoad } from "../hooks/usePageLoad";
import { PipelineLoadingScreen } from "../components/layout/PipelineLoadingScreen";
import { usePanel } from "../components/layout/PanelContext";
import { Mountain } from "lucide-react";

interface Layer {
  id: string;
  label: string;
  data: number[];
  cmap: ColormapName;
  vmin: number;
  vmax: number;
  unit: string;
  contours?: { level: number; color: string }[];
  note: string;
}

export default function TerrainIntelligence() {
  const loaded = usePageLoad();
  const { setNode } = usePanel();

  const LAYERS: Layer[] = [
    { id: "elevation", label: "Elevation", data: terr.elevation_flat, cmap: "plasma", vmin: terr.statistics.elev_min, vmax: terr.statistics.elev_max, unit: "m", note: "LOLA LDEM_87S_5M, bowl-shaped crater floor with lobate rim." },
    { id: "slope", label: "Slope", data: terr.slope_flat, cmap: "YlOrRd", vmin: 0, vmax: 38.4, unit: "°", contours: [{ level: 15, color: "#ef4444" }], note: "Horn gradient. Red contour = 15° rover limit." },
    { id: "aspect", label: "Aspect", data: terr.aspect_flat, cmap: "viridis_r", vmin: 0, vmax: 360, unit: "°", note: "Compass direction of steepest descent." },
    { id: "roughness", label: "Roughness", data: terr.roughness_flat, cmap: "magma", vmin: 0, vmax: 12, unit: "°", note: "RMS slope at 5 m baseline; crater floor is smooth." },
    { id: "boulder", label: "Boulder Hazard", data: terr.boulder_flat, cmap: "hot", vmin: 0, vmax: 1, unit: "flag", note: "Shadow-length method; clustered near the rim." },
    { id: "illumination", label: "Illumination", data: terr.illumination_flat, cmap: "viridis_r", vmin: 0, vmax: 0.95, unit: "frac", contours: [{ level: 0.01, color: "#ef4444" }], note: "Synodic cycle. Red contour = PSR boundary." },
    { id: "t_max", label: "Max Temperature", data: terr.t_max_flat, cmap: "magma", vmin: 23.7, vmax: 240, unit: "K", contours: [{ level: 110, color: "#22d3ee" }], note: "Diviner T_max. Cyan contour = 110 K cold-trap threshold." },
  ];

  const [active, setActive] = useState("elevation");
  const layer = LAYERS.find((l) => l.id === active)!;

  useEffect(() => {
    setNode(<Panel />);
    return () => setNode(null);
  }, [setNode]);

  if (!loaded) return <PipelineLoadingScreen stage="Computing LOLA terrain intelligence" />;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Terrain Intelligence"
        subtitle="LOLA-derived terrain feeding landing safety and traverse planning"
        right={<Badge color="#88c057">12 LAYERS · 5 m/px</Badge>}
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <Card title={<span className="flex items-center gap-2"><Mountain size={14} /> Layers</span>} pad={false}>
            <div className="py-1">
              {LAYERS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setActive(l.id)}
                  className={`w-full text-left px-3 py-2 text-sm border-l-2 transition-colors ${
                    active === l.id ? "bg-accent-dim border-accent text-text-primary" : "border-transparent text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-6">
          <Card title={layer.label} pad>
            <div className="flex justify-center">
              <HeatmapLayer
                data={layer.data}
                width={terr.width}
                height={terr.height}
                cmap={layer.cmap}
                vmin={layer.vmin}
                vmax={layer.vmax}
                unit={layer.unit}
                display={460}
                contours={layer.contours}
              />
            </div>
            <p className="text-2xs text-text-muted mt-2">{layer.note}</p>
          </Card>
        </div>

        <div className="col-span-3">
          <Card title="Layer Statistics" pad>
            <Stat k="Max slope" v="38.4°" />
            <Stat k="Mean slope" v="8.2°" />
            <Stat k="Slope > 15°" v="28.4%" />
            <Stat k="Boulder flagged" v="12.3%" />
            <Stat k="PSR (illum=0)" v="61.4%" />
            <Stat k="Cold trap ≤110K" v="38.7%" />
            <Stat k="T min" v="23.7 K" />
            <Stat k="Roughness mean" v="2.3°" />
            <Stat k="Rock (interior)" v="0.051" />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border-subtle/60 text-sm">
      <span className="text-text-secondary">{k}</span>
      <span className="font-mono text-text-primary">{v}</span>
    </div>
  );
}

function Panel() {
  return (
    <div>
      <div className="label mb-2">Terrain Provenance</div>
      <div className="text-2xs text-text-muted leading-relaxed space-y-2">
        <p>DEM: LOLA LDEM_87S_5M, 5 m/pixel, Faustini tile.</p>
        <p>Thermal: Diviner GDR L4 max-annual-temperature.</p>
        <p>Rock abundance: Diviner derived product.</p>
        <p>
          Every layer feeds the operational confidence model and the A* traverse cost surface.
          Slope and boulder hazard drive landing safety; illumination drives the battery model.
        </p>
      </div>
    </div>
  );
}
