"""
Render publication-quality figures of the actual LRIP outputs for the README.

Reads the pipeline JSON in frontend/src/data/generated/ and renders the real
rasters, posteriors and curves with the same scientific colormaps the UI uses
(plasma / hot / viridis_r / magma). Output: docs/assets/*.png (dark theme, high DPI).

    py -3.12 docs/generate_figures.py
"""
from __future__ import annotations
import json, os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN = os.path.join(ROOT, "frontend", "src", "data", "generated")
OUT = os.path.join(ROOT, "docs", "assets")
os.makedirs(OUT, exist_ok=True)

BG = "#0a0a0f"
PANEL = "#0f0f1a"
FG = "#e8e8f0"
MUTED = "#8888aa"
ACCENT = "#3b5bdb"

plt.rcParams.update({
    "figure.facecolor": BG, "axes.facecolor": PANEL, "savefig.facecolor": BG,
    "text.color": FG, "axes.labelcolor": FG, "axes.edgecolor": "#252545",
    "xtick.color": MUTED, "ytick.color": MUTED, "grid.color": "#1e1e3a",
    "font.family": "monospace", "font.size": 12, "axes.titleweight": "bold",
    "axes.titlecolor": FG, "figure.dpi": 110,
})


def load(name):
    with open(os.path.join(GEN, name)) as f:
        return json.load(f)


mission = load("mission.json")
ice = load("ice_likelihood.json")
pol = load("polarimetry.json")
terr = load("terrain.json")
trav = load("traverse.json")
vol = load("volume.json")
val = load("validation.json")
dec = load("decision.json")

W = ice["width"]; H = ice["height"]


def grid(flat):
    return np.array(flat, dtype=float).reshape(H, W)


def save(fig, name):
    path = os.path.join(OUT, name)
    fig.savefig(path, bbox_inches="tight", pad_inches=0.15)
    plt.close(fig)
    print("  wrote", os.path.relpath(path, ROOT))


def raster(ax, flat, cmap, vmin, vmax, mask_below=None, title=None, contours=None, ckw=None):
    a = grid(flat)
    if mask_below is not None:
        a = np.ma.masked_less_equal(a, mask_below)
    im = ax.imshow(a, cmap=cmap, vmin=vmin, vmax=vmax, origin="upper", interpolation="nearest")
    if contours:
        cs = ax.contour(grid(flat), levels=contours, colors=(ckw or "#22d3ee"),
                        linewidths=0.9, alpha=0.9)
    ax.set_xticks([]); ax.set_yticks([])
    if title:
        ax.set_title(title, fontsize=13, pad=8)
    for s in ax.spines.values():
        s.set_edgecolor("#252545")
    return im


# 1 — Money shot: naive mask vs calibrated P(ice)
fig, ax = plt.subplots(1, 2, figsize=(15, 7.6))
raster(ax[0], ice["naive_mask_flat"], "hot", 0, 1, mask_below=0.5,
       title="NAIVE CRITERION  ·  CPR>1 ∧ DOP<0.13")
ax[0].set_facecolor("#05050a")
im = raster(ax[1], ice["p_raster_flat"], "plasma", 0, 0.95, mask_below=0.01,
            title="LRIP CALIBRATED  ·  P(ice | CPR,DOP,T,rock,L/S)",
            contours=[0.5, 0.7], ckw="#22d3ee")
ax[1].set_facecolor("#05050a")
cb = fig.colorbar(im, ax=ax[1], fraction=0.046, pad=0.02)
cb.set_label("P(ice)", color=FG); cb.ax.yaxis.set_tick_params(color=MUTED)
fig.suptitle("Fa & Eke roughness false-positives collapse under physics-informed fusion   "
             "(AUC 0.783 → 0.921 · ECE 0.241 → 0.031)", fontsize=13, color=MUTED, y=0.02)
save(fig, "money_shot.png")

# 2 — P(ice) standalone
fig, ax = plt.subplots(figsize=(8, 8))
im = raster(ax, ice["p_raster_flat"], "plasma", 0, 0.95, mask_below=0.01,
            title="Calibrated subsurface ice-likelihood  ·  Faustini F2",
            contours=[0.5, 0.7], ckw="#22d3ee")
pk = ice["statistics"]["p_max_pixel"]  # [col,row]
ax.plot(pk[0], pk[1], marker="+", ms=16, mec="#ffffff", mew=1.5)
ax.text(pk[0] + 4, pk[1], f"peak {ice['statistics']['p_max']:.3f}±{ice['statistics']['p_max_sigma']:.3f}",
        color="#ffffff", fontsize=10)
fig.colorbar(im, ax=ax, fraction=0.046, pad=0.02).set_label("P(ice)", color=FG)
save(fig, "p_ice.png")

# 3 — Polarimetry quad: CPR, DOP, mv, sigma_P
fig, ax = plt.subplots(2, 2, figsize=(13, 13))
raster(ax[0][0], pol["cpr_L_flat"], "hot", 0, 2.2, title="CPR (σ_SC/σ_OC) · L-band", contours=[1.0], ckw="#22d3ee")
raster(ax[0][1], pol["dop_L_flat"], "viridis_r", 0, 0.6, title="DOP · L-band", contours=[0.13], ckw="#ff2bd6")
raster(ax[1][0], pol["mv_flat"], "Greens", 0, 0.95, title="m-χ volume fraction")
raster(ax[1][1], ice["sigma_raster_flat"], "magma", 0, 0.22, title="σ_P (per-pixel uncertainty)")
save(fig, "polarimetry.png")

# 4 — m-chi RGB composite
fig, ax = plt.subplots(figsize=(8, 8))
rgb = np.clip(np.stack([grid(pol["mchi_double_flat"]), grid(pol["mv_flat"]),
                        grid(pol["mchi_surface_flat"])], axis=-1) * 1.6, 0, 1)
ax.imshow(rgb, origin="upper", interpolation="nearest")
ax.set_xticks([]); ax.set_yticks([])
ax.set_title("Raney m-χ decomposition  ·  R=double  G=volume(ice)  B=surface", fontsize=13, pad=8)
save(fig, "mchi_rgb.png")

# 5 — Terrain quad
fig, ax = plt.subplots(2, 2, figsize=(13, 13))
raster(ax[0][0], terr["elevation_flat"], "plasma", terr["statistics"]["elev_min"], terr["statistics"]["elev_max"], title="LOLA elevation (m)")
raster(ax[0][1], terr["slope_flat"], "YlOrRd", 0, 38.4, title="Slope (deg) · 15° rover limit", contours=[15], ckw="#ef4444")
raster(ax[1][0], terr["illumination_flat"], "viridis_r", 0, 0.95, title="Illumination fraction · PSR boundary", contours=[0.01], ckw="#ef4444")
raster(ax[1][1], terr["t_max_flat"], "magma", 23.7, 240, title="Diviner T_max (K) · 110 K cold-trap", contours=[110], ckw="#22d3ee")
save(fig, "terrain.png")

# 6 — Traverse ablation over P(ice)
fig, ax = plt.subplots(1, 2, figsize=(15, 7.6))
for a, path, color, label in [(ax[0], trav["naive_path"], "#ff7043", "Naive (terrain-optimal)"),
                              (ax[1], trav["lrip_path"], "#00e5ff", "LRIP (+ ice reward)")]:
    raster(a, ice["p_raster_flat"], "plasma", 0, 0.95, mask_below=0.01, contours=[0.5], ckw="#22d3ee")
    a.set_facecolor("#05050a")
    raw = np.array(path["raw"])
    a.plot(raw[:, 1], raw[:, 0], color=color, lw=2.2, label=label)
    s = path["raw"][0]; a.plot(s[1], s[0], marker="s", ms=10, color="#ffd700", mec="#000")
    g = trav["goal_pixel"]; a.plot(g[1], g[0], marker="*", ms=16, color="#ff2bd6", mec="#000")
    m = path["metrics"]
    a.set_title(f"{label}\n{m['total_dist_m']} m · mean P(ice) {m['mean_p_ice_on_path']:.3f} · "
                f"min SoC {round(m['min_soc']*100)}%", fontsize=12, pad=8)
fig.suptitle("Removing the ice-confidence reward straightens the path — detection changes the traverse",
             fontsize=13, color=MUTED, y=0.02)
save(fig, "traverse.png")

# 7 — Battery / SoC model
fig, ax = plt.subplots(figsize=(12, 5.5))
for path, color, label in [(trav["naive_path"], "#ff7043", "Naive"), (trav["lrip_path"], "#00e5ff", "LRIP")]:
    wp = path["waypoints"]
    ax.plot([w["cumulative_dist_m"] for w in wp], [w["soc"]*100 for w in wp],
            color=color, lw=2.2, marker="o", ms=4, label=label)
ax.axhline(15, color="#ef4444", ls="--", lw=1.2)
ax.text(5, 17, "SoC_min = 15%", color="#ef4444", fontsize=10)
ax.set_xlabel("Traverse distance (m)"); ax.set_ylabel("State of charge (%)")
ax.set_ylim(0, 105); ax.grid(True, ls="--", alpha=0.5)
ax.set_title("Power-aware battery model — SoC over the planned traverse", fontsize=13)
ax.legend(facecolor=PANEL, edgecolor="#252545", labelcolor=FG)
save(fig, "battery.png")

# 8 — Volume posterior
fig, ax = plt.subplots(figsize=(12, 6))
counts = np.array(vol["histogram"]["counts"]); edges = np.array(vol["histogram"]["edges"])
centers = (edges[:-1] + edges[1:]) / 2
p5, p95, med = vol["posterior"]["percentile_5"], vol["posterior"]["percentile_95"], vol["posterior"]["median"]
colors = ["#3366ff" if p5 <= c <= p95 else "#26305c" for c in centers]
ax.bar(centers, counts, width=(edges[1]-edges[0])*0.95, color=colors)
ax.axvline(med, color="#facc15", lw=2)
ax.text(med, counts.max()*0.92, f" median {med:,.0f} m³", color="#facc15", fontsize=11)
ax.set_xlabel("Ice volume (m³)"); ax.set_ylabel("Monte-Carlo samples")
ax.set_title(f"LCROSS-anchored volume posterior  ·  N={vol['n_mc_samples']:,}  ·  "
             f"5–95% CI [{p5:,.0f}, {p95:,.0f}] m³", fontsize=12)
ax.grid(True, axis="y", ls="--", alpha=0.4)
save(fig, "volume_posterior.png")

# 9 — ROC + calibration
fig, ax = plt.subplots(1, 2, figsize=(14, 6))
r = val["roc"]
ax[0].plot([d["fpr"] for d in r["naive"]], [d["tpr"] for d in r["naive"]], color="#ff7043", lw=2.2, label=f"CPR only (AUC {r['auc_naive']})")
ax[0].plot([d["fpr"] for d in r["calibrated"]], [d["tpr"] for d in r["calibrated"]], color="#00e5ff", lw=2.2, label=f"Full fusion (AUC {r['auc_calibrated']})")
ax[0].plot([0, 1], [0, 1], color="#555577", ls="--")
ax[0].set_xlabel("False positive rate"); ax[0].set_ylabel("True positive rate")
ax[0].set_title("ROC  ·  ΔAUC +0.138", fontsize=13); ax[0].legend(facecolor=PANEL, edgecolor="#252545", labelcolor=FG)
c = val["calibration"]
ax[1].plot([0, 1], [0, 1], color="#555577", ls="--")
ax[1].plot([d["pred"] for d in c["before"]], [d["obs"] for d in c["before"]], color="#ff7043", lw=2.2, marker="o", ms=4, label=f"Before (ECE {c['ece_before']})")
ax[1].plot([d["pred"] for d in c["after"]], [d["obs"] for d in c["after"]], color="#00e5ff", lw=2.2, marker="o", ms=4, label=f"After (ECE {c['ece_after']})")
ax[1].set_xlabel("Predicted probability"); ax[1].set_ylabel("Observed frequency")
ax[1].set_title("Calibration (reliability diagram)", fontsize=13); ax[1].legend(facecolor=PANEL, edgecolor="#252545", labelcolor=FG)
for a in ax: a.grid(True, ls="--", alpha=0.4)
save(fig, "validation.png")

# 10 — Ablation: AUC up, FPR down per evidence layer
fig, ax = plt.subplots(figsize=(13, 6))
abl = val["ablation"]
labels = [a["layer"].replace("+ ", "+").replace(" (baseline)", "") for a in abl]
x = np.arange(len(abl))
ax.bar(x - 0.2, [a["auc"] for a in abl], 0.4, color="#00e5ff", label="AUC")
ax2 = ax.twinx()
ax2.bar(x + 0.2, [a["fpr"] for a in abl], 0.4, color="#ff7043", label="FPR %")
ax.set_xticks(x); ax.set_xticklabels(labels, rotation=18, ha="right", fontsize=9)
ax.set_ylabel("AUC", color="#00e5ff"); ax2.set_ylabel("False-positive rate (%)", color="#ff7043")
ax.set_ylim(0.7, 0.95); ax2.set_ylim(0, 38)
ax.set_title("Dataset ablation — each evidence layer's contribution (thermal gate = largest FPR drop)", fontsize=12)
save(fig, "ablation.png")

# 11 — Decision: MRI/RUS per site + Pareto
fig, ax = plt.subplots(1, 2, figsize=(15, 6))
sites = dec["sites"]
ids = [s["id"] for s in sites]
x = np.arange(len(sites))
ax[0].bar(x - 0.2, [s["mri"] for s in sites], 0.4, color="#3b5bdb", label="MRI")
ax[0].bar(x + 0.2, [s["rus"] for s in sites], 0.4, color="#22c55e", label="RUS")
ax[0].set_xticks(x); ax[0].set_xticklabels(ids, fontsize=10)
ax[0].set_ylim(0, 100); ax[0].set_title("Mission Readiness vs Resource Utility", fontsize=13)
ax[0].legend(facecolor=PANEL, edgecolor="#252545", labelcolor=FG); ax[0].grid(True, axis="y", ls="--", alpha=0.4)
sc = ax[1].scatter([s["op_conf"] for s in sites], [s["p_target"]*100 for s in sites],
                   s=[s["rus"]*6 for s in sites], c=[s["mri"] for s in sites],
                   cmap="viridis", vmin=60, vmax=95, edgecolors="#fff", linewidths=0.6)
for s in sites:
    ax[1].annotate(s["id"], (s["op_conf"], s["p_target"]*100), color=FG, fontsize=9,
                   xytext=(6, 6), textcoords="offset points")
ax[1].set_xlabel("Operational confidence (%)"); ax[1].set_ylabel("Science (P_target %)")
ax[1].set_title("Pareto front — bubble=RUS, colour=MRI", fontsize=13); ax[1].grid(True, ls="--", alpha=0.4)
fig.colorbar(sc, ax=ax[1], fraction=0.046, pad=0.02).set_label("MRI", color=FG)
save(fig, "decision.png")

# 12 — Uncertainty budget
fig, ax = plt.subplots(figsize=(11, 4.6))
ub = vol["uncertainty_budget"]
names = [u["source"] for u in ub][::-1]
vals = [u["variance_contribution_pct"] for u in ub][::-1]
ax.barh(names, vals, color="#3366ff")
for i, v in enumerate(vals):
    ax.text(v + 0.6, i, f"{v}%", color=FG, va="center", fontsize=11)
ax.set_xlim(0, 52); ax.set_xlabel("Variance contribution (%)")
ax.set_title("Volume uncertainty budget — mixing-model non-uniqueness dominates", fontsize=12)
save(fig, "uncertainty_budget.png")

print("DONE — figures in docs/assets/")
