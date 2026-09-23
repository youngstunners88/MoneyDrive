/**
 * useSmartRecommendations.ts — React Query hooks for Nduna smart recommendations.
 * Proactively surfaces high-probability advertising targets for the driver
 * based on their profile, routes, and network deal history.
 *
 * Uses optional chaining against the actor to gracefully handle the case
 * where the backend method has not yet been deployed.
 */

import { useQuery } from "@tanstack/react-query";
import { useActor } from "../../hooks/useActor";
import type { SmartRecommendation } from "./types";

// ─── Query key factory ────────────────────────────────────────────────────────

export const smartRecommendationKeys = {
  all: ["smartRecommendations"] as const,
  list: () => [...smartRecommendationKeys.all, "list"] as const,
};

// ─── Normalizer (bigint → number) ─────────────────────────────────────────────

function normalizeRecommendation(
  raw: Record<string, unknown>,
): SmartRecommendation {
  const score = (raw.score ?? {}) as Record<string, unknown>;
  return {
    companyName: String(raw.companyName ?? ""),
    score: {
      companyName: String(score.companyName ?? ""),
      matchScore: Number(score.matchScore ?? 0),
      reason: String(score.reason ?? ""),
      estimatedDealValue: Number(score.estimatedDealValue ?? 0),
      priority: Number(score.priority ?? 0),
    },
    pitch: String(raw.pitch ?? ""),
    urgency: String(raw.urgency ?? "medium"),
    dataPoint: String(raw.dataPoint ?? ""),
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch Nduna's smart company recommendations for the authenticated driver.
 * staleTime: 24 hours — suggestions update weekly / on profile change.
 * Returns empty array gracefully if backend method not yet available.
 */
export function useSmartRecommendations() {
  const { actor, isFetching } = useActor();

  return useQuery<SmartRecommendation[]>({
    queryKey: smartRecommendationKeys.list(),
    queryFn: async () => {
      if (!actor) return [];
      try {
        const extended = actor as typeof actor & {
          getSmartRecommendations?: () => Promise<unknown[]>;
        };
        const result = await extended.getSmartRecommendations?.();
        return (result ?? []).map((r) =>
          normalizeRecommendation(r as unknown as Record<string, unknown>),
        );
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
