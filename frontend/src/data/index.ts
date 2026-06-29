// Central data access for LRIP. All values are imported (never fetched) from
// the pipeline output in src/data/generated/ — Rule 1, PRD section 17.2.
import missionJson from "./generated/mission.json";
import iceJson from "./generated/ice_likelihood.json";
import polarimetryJson from "./generated/polarimetry.json";
import terrainJson from "./generated/terrain.json";
import decisionJson from "./generated/decision.json";
import traverseJson from "./generated/traverse.json";
import volumeJson from "./generated/volume.json";
import validationJson from "./generated/validation.json";
import logsJson from "./generated/processing_logs.json";

import type {
  Mission,
  IceLikelihood,
  Polarimetry,
  Terrain,
  Decision,
  Traverse,
  Volume,
  Validation,
  ProcessingEvent,
  Site,
} from "./types";

export const mission = missionJson as unknown as Mission;
export const iceLikelihood = iceJson as unknown as IceLikelihood;
export const polarimetry = polarimetryJson as unknown as Polarimetry;
export const terrain = terrainJson as unknown as Terrain;
export const decision = decisionJson as unknown as Decision;
export const traverse = traverseJson as unknown as Traverse;
export const volume = volumeJson as unknown as Volume;
export const validation = validationJson as unknown as Validation;
export const processingLog = logsJson as unknown as ProcessingEvent[];

export const recommendedSite: Site =
  decision.sites.find((s) => s.is_recommended) ?? decision.sites[0];

export * from "./types";
