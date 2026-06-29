"""
LRIP core pipeline library.

Generates physically-plausible, internally-consistent synthetic outputs for the
Faustini F2 ice survey, calibrated so that the headline statistics match the
PRL 2026 reference values (DOI 10.1038/s44453-026-00038-9) and the LRIP PRD
critical-numbers table (PRD section 17.4).

This is the single source of truth consumed by the React frontend. Everything is
seeded (seed=42) and fully deterministic. The four pipeline step scripts in
pipelines/pipelineN_*/ are thin wrappers around the functions defined here.

Design intent (PRD section 17.3):
  * The 220x220 rasters drive the on-screen heatmaps (visual plausibility).
  * The aggregate statistics objects carry the exact PRD/PRL numbers.
  * Downstream scores (MRI, RUS, confidences, volume) are DERIVED from these,
    never independently typed in.
"""
from __future__ import annotations

import json
import math
import os
from typing import Any

import numpy as np

# --------------------------------------------------------------------------- #
# Constants (PRD Appendix A / section 17.4)
# --------------------------------------------------------------------------- #
SEED = 42
W = 220
H = 220
PIXEL_M = 5.0
AOI_M = W * PIXEL_M  # 1100 m

CPR_THRESHOLD = 1.0
DOP_THRESHOLD = 0.13
COLD_TRAP_K = 110.0

# Crater geometry in pixel space. Faustini F2 modelled as a ~1.1 km crater whose
# floor fills most of the AOI. Interior = inside this radius.
CX, CY = 108.0, 112.0          # crater centre (note peak P(ice) at (112,108))
R_INTERIOR = 86.0              # interior radius in px
R_RIM = 96.0                   # rim radius

OUT_GENERATED = None  # set by configure_paths
OUT_DATASET = None


def configure_paths(repo_root: str) -> None:
    # repo_root is the project root; the React app lives under frontend/.
    global OUT_GENERATED, OUT_DATASET
    OUT_GENERATED = os.path.join(repo_root, "frontend", "src", "data", "generated")
    OUT_DATASET = os.path.join(repo_root, "datasets", "sample_outputs", "faustini_f2")
    os.makedirs(OUT_GENERATED, exist_ok=True)
    os.makedirs(OUT_DATASET, exist_ok=True)


def rng() -> np.random.Generator:
    return np.random.default_rng(SEED)


# --------------------------------------------------------------------------- #
# Geometry helpers
# --------------------------------------------------------------------------- #
def _grids():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    r = np.sqrt((xx - CX) ** 2 + (yy - CY) ** 2)
    return xx, yy, r


def _interior_mask(r: np.ndarray) -> np.ndarray:
    return r < R_INTERIOR


def _smooth(a: np.ndarray, passes: int = 2) -> np.ndarray:
    """Cheap separable box blur — keeps rasters coherent without scipy."""
    out = a.copy()
    for _ in range(passes):
        out = (
            out
            + np.roll(out, 1, 0)
            + np.roll(out, -1, 0)
            + np.roll(out, 1, 1)
            + np.roll(out, -1, 1)
        ) / 5.0
    return out


def _round(a: np.ndarray, nd: int = 3) -> list:
    return [round(float(v), nd) for v in a.ravel()]


# --------------------------------------------------------------------------- #
# Pipeline 2 first (terrain) — terrain & thermal fields are inputs to fusion.
# --------------------------------------------------------------------------- #
def terrain_fields(g: np.random.Generator) -> dict[str, np.ndarray]:
    xx, yy, r = _grids()

    # Elevation: bowl-shaped crater floor with a lobate rim bump and texture.
    bowl = -240.0 * np.clip(1.0 - (r / R_RIM) ** 2, 0, 1)
    rim = 180.0 * np.exp(-((r - R_RIM) ** 2) / (2 * 9.0 ** 2))
    texture = _smooth(g.normal(0, 18, (H, W)), 3)
    elev = bowl + rim + texture
    elev = elev - elev.min() - 234.0  # range roughly [-234, +248]

    # Slope from Horn-style gradient (deg).
    gy, gx = np.gradient(elev, PIXEL_M)
    slope = np.degrees(np.arctan(np.sqrt(gx ** 2 + gy ** 2)))
    slope = np.clip(_smooth(slope, 1), 0, 38.4)

    # Roughness: RMS slope at 5 m baseline — low on the smooth floor.
    rough = np.clip(_smooth(np.abs(g.normal(0, 1.0, (H, W))) + slope * 0.18, 1), 0.2, 12.0)
    rough[_interior_mask(r)] *= 0.55  # smooth crater floor

    # Boulder hazard (binary) via shadow-length proxy: rare, clustered near rim.
    boulder_p = np.clip(0.02 + 0.18 * np.exp(-((r - R_RIM) ** 2) / (2 * 14.0 ** 2)), 0, 1)
    boulder = (g.random((H, W)) < boulder_p).astype(np.float64)

    # Illumination fraction over a synodic cycle. Crater floor is a PSR (illum=0);
    # a sunlit annulus just outside the rim reaches ~0.82.
    illum = np.clip(0.92 * (r - R_INTERIOR) / (R_RIM - R_INTERIOR + 1e-6), 0, 0.95)
    illum = np.where(r < R_INTERIOR, 0.0, illum)
    illum = np.clip(_smooth(illum, 1) + g.normal(0, 0.02, (H, W)), 0, 0.95)
    illum[r < R_INTERIOR - 6] = 0.0  # hard PSR core

    # Diviner max-annual-temperature. Cold trap on the shadowed floor (~25 K),
    # warm on the sunlit exterior (up to ~210 K).
    t_max = 25.0 + 200.0 * np.clip(illum / 0.6, 0, 1) + g.normal(0, 4, (H, W))
    t_max = np.clip(_smooth(t_max, 1), 23.7, 240.0)

    # Diviner rock abundance. Low on the icy floor, higher in the boulder-rich rim.
    rock = np.clip(0.02 + 0.5 * boulder_p + g.normal(0, 0.01, (H, W)), 0.0, 0.6)
    rock = _smooth(rock, 1)

    return {
        "elevation": elev,
        "slope": slope,
        "roughness": rough,
        "boulder": boulder,
        "illumination": illum,
        "t_max": t_max,
        "rock": rock,
        "r": r,
    }


# --------------------------------------------------------------------------- #
# Pipeline 1 — DFSAR polarimetry (CPR, DOP, mv) and per-pixel sigmas.
# --------------------------------------------------------------------------- #
def polarimetry_fields(g: np.random.Generator, terr: dict[str, np.ndarray]) -> dict[str, np.ndarray]:
    r = terr["r"]
    interior = _interior_mask(r)
    cold = terr["t_max"] <= COLD_TRAP_K

    # CPR: ice-bearing cold floor shows CPR > 1 (volumetric/CBOE scattering);
    # exterior regolith ~0.7. Calibrated to interior mean 1.47, exterior 0.71.
    base = np.where(interior, 1.47, 0.71)
    # Concentrate the strongest signal in the cold, ice-consistent core.
    core = np.exp(-((r) ** 2) / (2 * 52.0 ** 2))
    cpr_L = base + 0.55 * core * cold + _smooth(g.normal(0, 0.20, (H, W)), 1)
    cpr_L = np.clip(cpr_L, 0.05, 2.6)
    # S-band slightly lower (PRD: interior mean 1.38).
    cpr_S = np.clip(cpr_L * 0.93 + g.normal(0, 0.06, (H, W)), 0.05, 2.5)

    # DOP: low where volumetric ice scattering dominates (<0.13), high on
    # surface-scattering exterior (~0.44).
    dop_L = np.where(interior, 0.108, 0.442) + (-0.05) * core * cold
    dop_L = np.clip(dop_L + _smooth(g.normal(0, 0.025, (H, W)), 1), 0.01, 0.85)
    dop_S = np.clip(dop_L * 1.02 + g.normal(0, 0.012, (H, W)), 0.01, 0.85)

    # m-chi volume fraction: high (ice-consistent) in the cold core.
    mv = np.clip(0.30 + 0.50 * core * cold + 0.10 * interior + _smooth(g.normal(0, 0.05, (H, W)), 1), 0, 0.98)

    # Per-pixel uncertainties (multi-look error propagation, ENL=49).
    sigma_cpr = np.clip(0.10 + 0.06 * (cpr_L / 1.5) + g.normal(0, 0.01, (H, W)), 0.03, 0.4)
    sigma_dop = np.clip(0.006 + 0.02 * dop_L + g.normal(0, 0.001, (H, W)), 0.003, 0.06)

    return {
        "cpr_L": cpr_L,
        "cpr_S": cpr_S,
        "dop_L": dop_L,
        "dop_S": dop_S,
        "mv": mv,
        "sigma_cpr": sigma_cpr,
        "sigma_dop": sigma_dop,
    }


# --------------------------------------------------------------------------- #
# Pipeline 3 — Bayesian log-odds fusion + thermal gate + calibration + MC sigma.
# --------------------------------------------------------------------------- #
# Physics-seeded weights (PRD ice_likelihood.ModelWeights).
WEIGHTS = {"cpr": 0.30, "dop": 0.30, "mv": 0.20, "thermal": 0.15, "ls": 0.05}
BIAS = -1.5


def _logit_terms(pol, terr):
    """Standardised evidence contributions to the log-odds, per pixel."""
    cpr = pol["cpr_L"]
    dop = pol["dop_L"]
    mv = pol["mv"]
    t = terr["t_max"]
    rock = terr["rock"]
    ls_delta = np.abs(pol["cpr_L"] - pol["cpr_S"])

    # Each term centred so 0 ~ neutral, scaled to a few logits at the extremes.
    z_cpr = (cpr - 1.0) * 2.6
    z_dop = (DOP_THRESHOLD - dop) * 11.0
    z_mv = (mv - 0.45) * 3.0
    z_thermal = (COLD_TRAP_K - t) / 30.0
    z_rock = -(rock - 0.05) * 6.0          # blocky terrain down-weighted
    z_ls = -(ls_delta - 0.1) * 2.0          # cross-frequency consistency
    return dict(cpr=z_cpr, dop=z_dop, mv=z_mv, thermal=z_thermal, rock=z_rock, ls=z_ls)


def _fuse(terms, terr, layers: set[str]) -> np.ndarray:
    """Return calibrated P(ice) for the subset of evidence `layers` enabled."""
    logit = np.full((H, W), BIAS)
    if "cpr" in layers:
        logit += WEIGHTS["cpr"] * terms["cpr"]
    if "dop" in layers:
        logit += WEIGHTS["dop"] * terms["dop"]
    # mv always rides with the polarimetric stack
    logit += WEIGHTS["mv"] * terms["mv"]
    if "thermal" in layers:
        logit += WEIGHTS["thermal"] * terms["thermal"]
        gate = terr["t_max"] <= COLD_TRAP_K  # hard cold-trap gate
    else:
        gate = np.ones((H, W), dtype=bool)
    if "rock" in layers:
        logit += 0.12 * terms["rock"]
    if "ls" in layers:
        logit += WEIGHTS["ls"] * terms["ls"]

    p = 1.0 / (1.0 + np.exp(-logit))
    # Light isotonic-style calibration sharpening (monotonic), then gate.
    p = np.clip((p - 0.18) / 0.74, 0, 1)
    p = np.where(gate, p, 0.0)
    return p


def fusion_fields(g, pol, terr) -> dict[str, Any]:
    terms = _logit_terms(pol, terr)
    full_layers = {"cpr", "dop", "thermal", "rock", "ls"}

    p_full = _fuse(terms, terr, full_layers)
    # Concentrate the calibrated likelihood into a compact ice lobe around the
    # documented peak (row=108, col=112). This is the clean blob that makes the
    # P06 money shot read against the scattered naive mask, and gives the
    # traverse ablation a real high-P target to detour into.
    _, _, _ = _grids()
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    r_peak = np.sqrt((xx - 112.0) ** 2 + (yy - 108.0) ** 2)
    env = np.exp(-(r_peak ** 2) / (2 * 30.0 ** 2))
    p_full = _smooth(p_full * env, 1)
    # Pin the documented peak P(ice)=0.917 at pixel (row=108, col=112).
    p_full = p_full / max(p_full.max(), 1e-6) * 0.917
    p_full = np.clip(p_full, 0, 0.917)

    # MC uncertainty: sigma rises near the cold-trap boundary (gate transition).
    grad = np.abs(np.gradient(p_full)[0]) + np.abs(np.gradient(p_full)[1])
    sigma_p = np.clip(0.035 + 0.6 * grad + 0.02 * (1 - p_full), 0.02, 0.22)
    sigma_p = _smooth(sigma_p, 1)
    ci5 = np.clip(p_full - 1.64 * sigma_p, 0, 1)
    ci95 = np.clip(p_full + 1.64 * sigma_p, 0, 1)

    # Naive criterion mask: CPR>1 AND DOP<0.13 (binary, includes rock FPs).
    naive = ((pol["cpr_L"] > CPR_THRESHOLD) & (pol["dop_L"] < DOP_THRESHOLD)).astype(np.float64)

    # Ablation rasters for the P06 evidence-layer toggle.
    ablation = {
        "no_thermal": _smooth(_fuse(terms, terr, full_layers - {"thermal"}), 1),
        "no_dop": _smooth(_fuse(terms, terr, full_layers - {"dop"}), 1),
        "no_rock": _smooth(_fuse(terms, terr, full_layers - {"rock"}), 1),
        "no_ls": _smooth(_fuse(terms, terr, full_layers - {"ls"}), 1),
    }
    for k in ablation:
        ablation[k] = _smooth(ablation[k] * env, 1)
        m = ablation[k].max()
        if m > 0:
            ablation[k] = ablation[k] / m * 0.95
    # Removing the thermal gate lets warm rocky exterior pixels reappear
    # (the Fa & Eke false positives) — add them back so the toggle is visible.
    rocky_fp = ((pol["cpr_L"] > 1.05) & (terr["t_max"] > COLD_TRAP_K)).astype(np.float64)
    ablation["no_thermal"] = np.clip(ablation["no_thermal"] + 0.55 * _smooth(rocky_fp, 1), 0, 0.95)

    return {
        "p_ice": p_full,
        "sigma_p": sigma_p,
        "ci5": ci5,
        "ci95": ci95,
        "naive": naive,
        "ablation": ablation,
        "terms": terms,
    }


# --------------------------------------------------------------------------- #
# Statistics — exact PRD/PRL headline numbers attached to plausible rasters.
# --------------------------------------------------------------------------- #
def zone_stats(a: np.ndarray, mask: np.ndarray) -> dict:
    v = a[mask]
    return {
        "mean": round(float(v.mean()), 3),
        "std": round(float(v.std()), 3),
        "min": round(float(v.min()), 3),
        "max": round(float(v.max()), 3),
        "count": int(mask.sum()),
    }
