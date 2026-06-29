// Type contracts for the LRIP data layer. The runtime data is produced by the
// Python pipeline (pipelines/run_all.py) and imported as JSON; these interfaces
// describe its shape for the frontend.

export interface Reference {
  key: string;
  authors: string;
  year: number;
  journal: string;
  doi: string;
  verified: boolean;
}

export interface Mission {
  id: string;
  name: string;
  target_crater: string;
  target_lat_deg: number;
  target_lon_deg: number;
  target_diameter_km: number;
  analysis_timestamp: string;
  pipeline_version: string;
  status: "COMPLETE" | "RUNNING" | "ERROR";
  aoi_px_width: number;
  aoi_px_height: number;
  pixel_size_m: number;
  random_seed: number;
  mri: number;
  rus: number;
  scientific_confidence: number;
  operational_confidence: number;
  volume_median: number;
  volume_ci: [number, number];
  references: Reference[];
  pipeline_health: { name: string; status: string; stages: number }[];
  evidence_audit: { line: string; pass_: boolean }[];
}

export interface IceLikelihood {
  width: number;
  height: number;
  p_raster_flat: number[];
  sigma_raster_flat: number[];
  ci5_raster_flat: number[];
  ci95_raster_flat: number[];
  naive_mask_flat: number[];
  ablation_rasters: Record<string, number[]>;
  statistics: {
    p_max: number;
    p_max_sigma: number;
    p_max_ci: [number, number];
    p_max_pixel: [number, number];
    pixels_above_05: number;
    pixels_above_07: number;
    pixels_above_09: number;
    pct_above_05: number;
    sigma_mean_in_cold_trap: number;
  };
  naive_pixel_count: number;
  naive_pct: number;
  model: { type: string; bias: number; weights: Record<string, number> };
  calibration: {
    method: string;
    ece_before: number;
    ece_after: number;
    auc_before: number;
    auc_after: number;
    positive_craters: string[];
    negative_craters: string[];
  };
  fpr_breakdown: { stage: string; fpr: number }[];
}

export interface Polarimetry {
  width: number;
  height: number;
  cpr_L_flat: number[];
  cpr_S_flat: number[];
  dop_L_flat: number[];
  dop_S_flat: number[];
  mv_flat: number[];
  sigma_cpr_flat: number[];
  sigma_dop_flat: number[];
  mchi_double_flat: number[];
  mchi_surface_flat: number[];
  ls_delta_flat: number[];
  statistics: Record<string, number>;
}

export interface Terrain {
  width: number;
  height: number;
  elevation_flat: number[];
  slope_flat: number[];
  aspect_flat: number[];
  roughness_flat: number[];
  boulder_flat: number[];
  illumination_flat: number[];
  t_max_flat: number[];
  rock_flat: number[];
  statistics: Record<string, number>;
}

export interface MRIComponent {
  name: string;
  score: number;
  weight: number;
  contribution: number;
}
export interface RUSComponent {
  name: string;
  score: number;
  weight: number;
  weighted_score: number;
}
export interface Site {
  id: string;
  name: string;
  lat: number;
  lon: number;
  slope: number;
  illum: number;
  dist_ice: number;
  dist_psr: number;
  sigma: number;
  boulder: string;
  p_target: number;
  mri: number;
  rus: number;
  mri_components: MRIComponent[];
  rus_components: RUSComponent[];
  op_conf: number;
  rank: number;
  is_recommended: boolean;
}
export interface Decision {
  sites: Site[];
  recommended_site_id: string;
  scientific_confidence: number;
  sci_evidence: { label: string; contribution: number }[];
  operational_confidence: number;
  ice_conf_target: number;
  sigma_core: number;
}

export interface Waypoint {
  index: number;
  pixel: [number, number];
  east_m: number;
  north_m: number;
  slope_deg: number;
  soc: number;
  illuminated: boolean;
  p_ice: number;
  cumulative_dist_m: number;
}
export interface PathMetrics {
  total_dist_m: number;
  n_waypoints: number;
  min_soc: number;
  mean_p_ice_on_path: number;
  ice_cells_traversed: number;
  hazards_encountered: number;
  psr_segment_m: number;
  travel_time_h: number;
}
export interface PathPlan {
  id: "lrip" | "naive";
  ice_weight: number;
  waypoints: Waypoint[];
  metrics: PathMetrics;
  raw: [number, number][];
}
export interface Traverse {
  goal_pixel: [number, number];
  goal_p_ice: number;
  lrip_path: PathPlan;
  naive_path: PathPlan;
  ablation: {
    delta_dist_m: number;
    delta_dist_pct: number;
    delta_mean_p_ice: number;
    delta_mean_p_ice_pct: number;
    delta_ice_cells: number;
    delta_min_soc: number;
    delta_travel_time_h: number;
    conclusion: string;
  };
}

export interface PosteriorStats {
  median: number;
  mean: number;
  std: number;
  percentile_5: number;
  percentile_25: number;
  percentile_75: number;
  percentile_95: number;
  unit: string;
}
export interface Volume {
  n_mc_samples: number;
  random_seed: number;
  a_eff_m2: number;
  posterior: PosteriorStats;
  phi_posterior: PosteriorStats;
  depth_posterior: PosteriorStats;
  histogram: { counts: number[]; edges: number[] };
  lcross_anchor: { wt_pct_mean: number; wt_pct_std: number; reference: string; verified: boolean };
  mixing_models: { model: string; probability: number; reference: string }[];
  uncertainty_budget: { source: string; variance_contribution_pct: number; description: string }[];
  mass_estimate: { median_tonnes: number; ci_5_tonnes: number; ci_95_tonnes: number };
  convergence: { converged: boolean; convergence_note: string };
}

export interface Validation {
  roc: {
    naive: { fpr: number; tpr: number }[];
    calibrated: { fpr: number; tpr: number }[];
    auc_naive: number;
    auc_calibrated: number;
    delta_auc: number;
  };
  calibration: {
    before: { pred: number; obs: number }[];
    after: { pred: number; obs: number }[];
    ece_before: number;
    ece_after: number;
  };
  ablation: { layer: string; auc: number; delta_auc: number | null; fpr: number; ece: number; note: string }[];
  cross_sensor: { crater: string; dfsar: number; minirf: number; delta: number; agree: boolean }[];
}

export interface ProcessingEvent {
  id: string;
  sequence: number;
  timestamp: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "METRIC";
  message: string;
  pipeline: number;
}
