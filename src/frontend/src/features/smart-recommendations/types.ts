/**
 * types.ts — Smart recommendations feature TypeScript interfaces.
 * Nduna proactively surfaces high-probability advertising opportunities
 * based on driver profile, routes, and historical network data.
 */

// ─── Company scoring ──────────────────────────────────────────────────────────

export interface CompanyScore {
  companyName: string;
  /** 0–100 */
  matchScore: number;
  reason: string;
  /** Estimated deal value in ZAR */
  estimatedDealValue: number;
  /** 1 = highest priority */
  priority: number;
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export interface SmartRecommendation {
  companyName: string;
  score: CompanyScore;
  /** Pre-written pitch opening line for this company */
  pitch: string;
  /** e.g. "high" | "medium" | "low" */
  urgency: string;
  /** Supporting data point e.g. "3 drivers in Sandton closed this company last month" */
  dataPoint: string;
}
