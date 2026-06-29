# 🛰️ LRIP — Lunar Resource Intelligence Platform

> **Detection → Decision → Traverse → Confidence**
>
> Couples a physics-informed, calibrated subsurface ice-likelihood field with
> power-aware rover traverse planning and a Monte-Carlo ice-volume posterior —
> for Chandrayaan-2 DFSAR over the lunar south pole.
>
> Bharatiya Antariksh Hackathon 2026 · Problem Statement 8

LRIP begins where the PRL 2026 paper (Sinha, Bharti et al., *npj Space Exploration*,
DOI `10.1038/s44453-026-00038-9`) ends. That paper establishes the
`CPR > 1 ∧ DOP < 0.13` detection criterion but produces no volume estimate,
propagates no uncertainty, and makes no mission recommendation. LRIP fills
exactly those gaps.

Every output is a **calibrated likelihood with bounded uncertainty** — never
"confirmed ice".

---

## This build — all 16 pages

| Route | Page | What it shows |
|-------|------|---------------|
| `/` | **Mission Overview** | Status board: MRI 87, RUS 91, P(ice) map, traverse, evidence audit |
| `/mission/timeline` | **Mission Timeline** | Expandable chronological audit trail of all processing events |
| `/pipeline/dfsar` | **DFSAR Processing** | 13 polarimetric pipeline stage cards with formulas + statistics |
| `/pipeline/terrain` | **Terrain Intelligence** | Layer-switchable LOLA terrain (elevation, slope, illumination, T_max…) |
| `/polarimetry` | **Polarimetry** | CPR, DOP, mv, σ maps + m-χ RGB composite; click a pixel for the audit |
| `/likelihood` | **Ice Likelihood** | The money shot — naive CPR/DOP mask vs calibrated P(ice) + evidence ablation |
| `/decision` | **Decision Layer** | Dual confidence, MRI (click for weight-slider drill-down), RUS |
| `/landing` | **Landing Sites** | Top-3 candidates, criteria cards, Pareto front |
| `/traverse` | **Traverse Planner** | A* ablation + SoC battery model |
| `/resources` | **Resource Intelligence** | LCROSS-anchored Monte-Carlo volume posterior + uncertainty budget |
| `/validation` | **Validation Suite** | ROC, calibration, ablation table, cross-sensor agreement |
| `/report` | **Mission Report** | Structured document, export JSON / print PDF |
| `/settings` | **Settings** | Layer visibility, fusion weights, display preferences |
| `/logs` | **Activity Logs** | Terminal replay animation of all 41 processing events |
| `/dev` | **Developer Mode** | Raw JSON inspector + future API contracts |
| `/diagnostics` | **System Diagnostics** | Pipeline health, data freshness, consistency checks |

**Interactions:** pixel-evidence inspector drawer (click any P(ice)/polarimetry pixel),
MRI weight-slider drill-down, evidence-layer ablation toggles, and the pipeline replay animation.

---

## Project layout

```
ISRO/
├── package.json            ← workspace root (delegates to frontend/)
├── README.md
│
├── backend/                ← Python data pipelines (seed=42)
│   ├── run_all.py            orchestrator — runs Pipelines 1–4, writes JSON
│   ├── lrip_core.py          terrain · polarimetry · Bayesian fusion
│   ├── processing_log_data.py 41 processing-log events
│   └── requirements.txt      numpy
│
├── frontend/               ← React 18 + Vite + TS + Tailwind app
│   ├── package.json
│   ├── index.html, vite.config.ts, tailwind.config.ts, tsconfig*.json
│   └── src/
│       ├── data/             typed wrappers + generated/*.json (imported, never fetched)
│       ├── components/       shell · heatmaps · gauges · charts · modals
│       ├── pages/            all 16 pages (P01–P16)
│       ├── lib/              matplotlib colormaps, formatting
│       └── hooks/
│
└── datasets/
    └── sample_outputs/faustini_f2/*.json   provenance copies of the pipeline output
```

Data flow: `backend/run_all.py` → writes JSON → `frontend/src/data/generated/*.json` →
imported by the React app. The pipeline produces physically-plausible 220×220 rasters whose
**headline statistics are calibrated to the PRL 2026 / PRD reference numbers**, and derives
every downstream score (MRI, RUS, confidences, volume) from them.

---

## How to launch

Prerequisites: **Node 18+** and **Python 3.12** (Windows: the `py` launcher). From the
project root (`ISRO/`):

```bash
# 1 — install frontend dependencies (workspace install)
npm install

# 2 — generate the data (deterministic, seed=42)
pip install -r backend/requirements.txt        # numpy
npm run pipelines                               # → frontend/src/data/generated/*.json
                                                #   (Windows runs: py -3.12 backend/run_all.py)

# 3 — launch the app
npm run dev                                     # http://localhost:5173
```

The data is already committed under `frontend/src/data/generated/`, so for a quick start you
can skip step 2 and just run `npm install && npm run dev`.

| Command (from root) | What it does |
|---------------------|--------------|
| `npm install`       | Install frontend deps (npm workspace) |
| `npm run dev`       | Start the Vite dev server on :5173 |
| `npm run build`     | Type-check + production build (`frontend/dist`) |
| `npm run preview`   | Serve the production build |
| `npm run pipelines` | Regenerate all data via the Python backend |

> Run `npm run dev` from the **root** — the workspace forwards it to `frontend/`. To work inside
> the app directly instead, `cd frontend && npm run dev`.

---

## Key numbers (seed=42)

| | |
|---|---|
| Peak P(ice) | 0.917 ± 0.062, CI [0.803, 0.981] |
| AUC | 0.783 (naive) → 0.921 (calibrated), ΔAUC +0.138 |
| ECE | 0.241 → 0.031 |
| Mission Readiness Index | 87 / 100 (Faustini F2 Site B) |
| Resource Utility Score | 91 / 100 |
| Scientific / Operational confidence | 91.4% / 84.2% |
| Ice volume (median) | ~7,900 m³, 5–95% posterior |
| Reference anchor | LCROSS 5.6 ± 2.9 wt% (Colaprete 2010) |

---

## Tech stack

React 18 · TypeScript · Vite 5 · Tailwind CSS · Recharts · Lucide · HTML5 Canvas
(matplotlib-style colormaps) · NumPy (`backend/` pipelines).

The `backend/` is an **offline data generator**, not a running server — at runtime the app
makes no network calls; every value is a local TypeScript/JSON import.
