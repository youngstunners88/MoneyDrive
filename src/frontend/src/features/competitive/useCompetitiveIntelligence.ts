/**
 * useCompetitiveIntelligence.ts — React Query hooks for anonymous competitive stats.
 * Provides leaderboard, company responsiveness, and driver profile queries
 * to power the Layer 3 competitive intelligence dashboard.
 */

import { useQuery } from "@tanstack/react-query";
import { useActor } from "../../hooks/useActor";
import type { CompetitiveStats, DriverCompetitiveProfile } from "./types";

// ─── Query key factory ────────────────────────────────────────────────────────

export const competitiveKeys = {
  all: ["competitive"] as const,
  stats: () => [...competitiveKeys.all, "stats"] as const,
  myProfile: () => [...competitiveKeys.all, "myProfile"] as const,
};

// ─── Default empty states ─────────────────────────────────────────────────────

const EMPTY_STATS: CompetitiveStats = {
  cityLeaderboard: [],
  topCompanies: [],
  networkSurgeAccuracy: 0,
  totalDriversInNetwork: 0,
  month: "",
};

const EMPTY_PROFILE: DriverCompetitiveProfile = {
  city: "",
  surgeAccuracy: 0,
  dealsClosedCount: 0,
  avgDealValue: 0,
  rank: 0,
  totalInCity: 0,
};

// ─── Normalizers (bigint → number) ────────────────────────────────────────────

function normalizeStats(raw: Record<string, unknown>): CompetitiveStats {
  return {
    cityLeaderboard: Array.isArray(raw.cityLeaderboard)
      ? (raw.cityLeaderboard as Record<string, unknown>[]).map((entry) => ({
          city: String(entry.city ?? ""),
          dealsClosed: Number(entry.dealsClosed ?? 0),
          avgDealValue: Number(entry.avgDealValue ?? 0),
          topCompany: String(entry.topCompany ?? ""),
          month: String(entry.month ?? ""),
        }))
      : [],
    topCompanies: Array.isArray(raw.topCompanies)
      ? (raw.topCompanies as Record<string, unknown>[]).map((c) => ({
          companyName: String(c.companyName ?? ""),
          responseRate: Number(c.responseRate ?? 0),
          avgDealValue: Number(c.avgDealValue ?? 0),
          totalPitches: Number(c.totalPitches ?? 0),
          successfulDeals: Number(c.successfulDeals ?? 0),
        }))
      : [],
    networkSurgeAccuracy: Number(raw.networkSurgeAccuracy ?? 0),
    totalDriversInNetwork: Number(raw.totalDriversInNetwork ?? 0),
    month: String(raw.month ?? ""),
  };
}

function normalizeProfile(
  raw: Record<string, unknown>,
): DriverCompetitiveProfile {
  return {
    city: String(raw.city ?? ""),
    surgeAccuracy: Number(raw.surgeAccuracy ?? 0),
    dealsClosedCount: Number(raw.dealsClosedCount ?? 0),
    avgDealValue: Number(raw.avgDealValue ?? 0),
    rank: Number(raw.rank ?? 0),
    totalInCity: Number(raw.totalInCity ?? 0),
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch anonymised network-wide competitive stats.
 * staleTime: 1 hour — leaderboard refreshes hourly.
 */
export function useCompetitiveStats() {
  const { actor, isFetching } = useActor();

  return useQuery<CompetitiveStats>({
    queryKey: competitiveKeys.stats(),
    queryFn: async (): Promise<CompetitiveStats> => {
      if (!actor) return EMPTY_STATS;
      try {
        const extended = actor as typeof actor & {
          getCompetitiveStats?: () => Promise<unknown>;
        };
        const result = await extended.getCompetitiveStats?.();
        return result
          ? normalizeStats(result as unknown as Record<string, unknown>)
          : EMPTY_STATS;
      } catch {
        return EMPTY_STATS;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Fetch the authenticated driver's own competitive profile.
 * Includes city rank, surge accuracy, and deal count.
 */
export function useDriverCompetitiveProfile() {
  const { actor, isFetching } = useActor();

  return useQuery<DriverCompetitiveProfile>({
    queryKey: competitiveKeys.myProfile(),
    queryFn: async (): Promise<DriverCompetitiveProfile> => {
      if (!actor) return EMPTY_PROFILE;
      try {
        const extended = actor as typeof actor & {
          getMyCompetitiveProfile?: () => Promise<unknown>;
        };
        const result = await extended.getMyCompetitiveProfile?.();
        return result
          ? normalizeProfile(result as unknown as Record<string, unknown>)
          : EMPTY_PROFILE;
      } catch {
        return EMPTY_PROFILE;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
