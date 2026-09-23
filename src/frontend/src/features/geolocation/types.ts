/**
 * types.ts — Geolocation feature TypeScript interfaces.
 * Defines South African zones and exposure metrics for
 * driver route intelligence and advertising business case generation.
 */

// ─── SA Zones ─────────────────────────────────────────────────────────────────

export enum SAZone {
  JohannesburgCBD = "JohannesburgCBD",
  Sandton = "Sandton",
  DurbanBeachfront = "DurbanBeachfront",
  PretoriaCBD = "PretoriaCBD",
  CapeTownCBD = "CapeTownCBD",
  Midrand = "Midrand",
  Soweto = "Soweto",
  Umhlanga = "Umhlanga",
  Generic = "Generic",
}

export const SA_ZONE_LABELS: Record<SAZone, string> = {
  [SAZone.JohannesburgCBD]: "Johannesburg CBD",
  [SAZone.Sandton]: "Sandton City Centre",
  [SAZone.DurbanBeachfront]: "Durban Beachfront",
  [SAZone.PretoriaCBD]: "Pretoria CBD",
  [SAZone.CapeTownCBD]: "Cape Town CBD",
  [SAZone.Midrand]: "Midrand",
  [SAZone.Soweto]: "Soweto",
  [SAZone.Umhlanga]: "Umhlanga Rocks",
  [SAZone.Generic]: "General Area",
};

// ─── Exposure types ───────────────────────────────────────────────────────────

export interface ExposureFactor {
  name: string;
  weight: number;
  reason: string;
}

export interface ExposureMetrics {
  routeName: string;
  dailyVehicles: number;
  dailyPedestrians: number;
  monthlyExposure: number;
  /** 0.0–1.0 */
  confidenceScore: number;
  factors: ExposureFactor[];
}

// ─── Driver route opt-in ──────────────────────────────────────────────────────

export interface RouteOptIn {
  primaryRoute: SAZone;
  secondaryRoute?: SAZone;
  /** Unix milliseconds */
  optedInAt: number;
}

// ─── Fallback constant ────────────────────────────────────────────────────────

/** Conservative defaults used when backend/API is unavailable. */
export const FALLBACK_EXPOSURE: ExposureMetrics = {
  routeName: "General South African Route",
  dailyVehicles: 30_000,
  dailyPedestrians: 5_000,
  monthlyExposure: 600_000,
  confidenceScore: 0.4,
  factors: [],
};
