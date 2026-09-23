/**
 * types.ts — Competitive intelligence feature TypeScript interfaces.
 * Provides anonymous leaderboard data, company responsiveness stats,
 * and driver competitive profiling for Layer 3 amplification.
 */

// ─── Leaderboard & network ────────────────────────────────────────────────────

export interface CityLeaderEntry {
  city: string;
  dealsClosed: number;
  avgDealValue: number;
  topCompany: string;
  /** e.g. "2026-04" */
  month: string;
}

export interface CompanyResponsiveness {
  companyName: string;
  /** 0.0–1.0 */
  responseRate: number;
  avgDealValue: number;
  totalPitches: number;
  successfulDeals: number;
}

export interface CompetitiveStats {
  cityLeaderboard: CityLeaderEntry[];
  topCompanies: CompanyResponsiveness[];
  /** Network-wide average surge accuracy 0.0–1.0 */
  networkSurgeAccuracy: number;
  totalDriversInNetwork: number;
  /** e.g. "2026-04" */
  month: string;
}

// ─── Driver profile ───────────────────────────────────────────────────────────

export interface DriverCompetitiveProfile {
  city: string;
  /** 0.0–1.0 */
  surgeAccuracy: number;
  dealsClosedCount: number;
  avgDealValue: number;
  /** 1-indexed rank within city */
  rank: number;
  totalInCity: number;
}
