/**
 * types.ts — Advertising feature TypeScript interfaces.
 * Mirrors Motoko types from the backend advertising-api mixin.
 * Enums use string union types for easy serialisation.
 */

// ─── Recommendation types ────────────────────────────────────────────────────

export type RecommendationType = "surge" | "product" | "advertising";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type DriverAction = "tried" | "skipped" | "partial";

export interface NdunaRecommendationV2 {
  id: string;
  driverId: string;
  content: string;
  recommendationType: RecommendationType;
  /** Unix nanoseconds */
  timestamp: bigint;
  confidence: ConfidenceLevel;
}

export interface RecommendationOutcomeV2 {
  recommendationId: string;
  driverId: string;
  action: DriverAction;
  /** Revenue in ZAR cents (optional — only if action === "tried") */
  revenue?: bigint;
  notes?: string;
  /** Unix nanoseconds */
  recordedAt: bigint;
}

// ─── Company pitch / advertising pipeline ────────────────────────────────────

export type PitchStatus =
  | "sent"
  | "viewed"
  | "interested"
  | "negotiating"
  | "closed"
  | "rejected"
  | "abandoned";

export interface CompanyPitch {
  id: string;
  driverId: string;
  companyName: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** Unix nanoseconds */
  pitchDate: bigint;
  status: PitchStatus;
  /** Expected deal value in ZAR cents */
  expectedValue?: bigint;
  notes?: string;
  /** Unix nanoseconds — last follow-up attempt */
  lastFollowUp?: bigint;
  /** Unix nanoseconds */
  createdAt: bigint;
  /** Unix nanoseconds */
  updatedAt: bigint;
}

// ─── Analytics / insights ────────────────────────────────────────────────────

export interface OutcomeStats {
  totalRecommendations: bigint;
  triedCount: bigint;
  skippedCount: bigint;
  partialCount: bigint;
  totalRevenueTracked: bigint;
  avgRevenuePerTried: bigint;
  surgeAccuracy: number;
}

export interface MonthlyInsights {
  driverId: string;
  year: bigint;
  month: bigint;
  surgeAccuracy: number;
  topSurgeRecommendations: string[];
  productConversions: string[];
  advertisingStats: {
    pitchesSent: bigint;
    companiesInterested: string[];
    dealsNegotiating: string[];
    dealsClosed: string[];
  };
  suggestedSystemPromptUpdate: string;
}
