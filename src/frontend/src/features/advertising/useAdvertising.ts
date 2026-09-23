/**
 * useAdvertising.ts — React Query hooks for the advertising feature.
 * Queries map to backend read functions; mutations wrap write functions
 * and invalidate relevant query keys on success.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CompanyPitch,
  MonthlyInsights,
  NdunaRecommendationV2,
  OutcomeStats,
  PitchStatus,
  RecommendationOutcomeV2,
} from "../../features/advertising/types";
import { useActor } from "../../hooks/useActor";
import { analytics } from "../../services/analyticsService";

// ─── Query key factory ────────────────────────────────────────────────────────

export const advertisingKeys = {
  pitches: (driverId: string) => ["pitches", driverId] as const,
  pitchesByStatus: (driverId: string, status: PitchStatus) =>
    ["pitches", driverId, status] as const,
  followUpReminders: (driverId: string) =>
    ["followUpReminders", driverId] as const,
  outcomeStats: (driverId: string, year: number, month: number) =>
    ["outcomeStats", driverId, year, month] as const,
  monthlyAnalysis: (driverId: string, year: number, month: number) =>
    ["monthlyAnalysis", driverId, year, month] as const,
  outcomes: (driverId: string) => ["outcomes", driverId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all pitches for a driver. */
export function useDriverPitches(driverId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<CompanyPitch[]>({
    queryKey: advertisingKeys.pitches(driverId),
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getDriverPitches(driverId);
      return result as CompanyPitch[];
    },
    enabled: !!actor && !isFetching && !!driverId,
  });
}

/** Fetch pitches filtered by status. */
export function usePitchesByStatus(driverId: string, status: PitchStatus) {
  const { actor, isFetching } = useActor();
  return useQuery<CompanyPitch[]>({
    queryKey: advertisingKeys.pitchesByStatus(driverId, status),
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getPitchesByStatus(
        driverId,
        status as import("../../backend.d.ts").PitchStatus,
      );
      return result as CompanyPitch[];
    },
    enabled: !!actor && !isFetching && !!driverId,
  });
}

/** Fetch Nduna-generated follow-up reminder strings for a driver. */
export function useFollowUpReminders(driverId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: advertisingKeys.followUpReminders(driverId),
    queryFn: async () => {
      if (!actor) return [];
      return actor.generateFollowUpReminders(driverId);
    },
    enabled: !!actor && !isFetching && !!driverId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Fetch outcome stats for a driver for a given year/month. */
export function useOutcomeStats(driverId: string, year: number, month: number) {
  const { actor, isFetching } = useActor();
  return useQuery<OutcomeStats>({
    queryKey: advertisingKeys.outcomeStats(driverId, year, month),
    queryFn: async () => {
      if (!actor) {
        return {
          totalRecommendations: BigInt(0),
          triedCount: BigInt(0),
          skippedCount: BigInt(0),
          partialCount: BigInt(0),
          totalRevenueTracked: BigInt(0),
          avgRevenuePerTried: BigInt(0),
          surgeAccuracy: 0,
        } satisfies OutcomeStats;
      }
      const result = await actor.getOutcomeStats(
        driverId,
        BigInt(year),
        BigInt(month),
      );
      return result as OutcomeStats;
    },
    enabled: !!actor && !isFetching && !!driverId,
  });
}

/** Fetch Nduna monthly learning insights for a driver. */
export function useMonthlyAnalysis(
  driverId: string,
  year: number,
  month: number,
) {
  const { actor, isFetching } = useActor();
  return useQuery<MonthlyInsights>({
    queryKey: advertisingKeys.monthlyAnalysis(driverId, year, month),
    queryFn: async () => {
      if (!actor)
        return {
          driverId,
          year: BigInt(year),
          month: BigInt(month),
          surgeAccuracy: 0,
          topSurgeRecommendations: [],
          productConversions: [],
          advertisingStats: {
            pitchesSent: BigInt(0),
            companiesInterested: [],
            dealsNegotiating: [],
            dealsClosed: [],
          },
          suggestedSystemPromptUpdate: "",
        } satisfies MonthlyInsights;
      const result = await actor.monthlyAnalysis(
        driverId,
        BigInt(year),
        BigInt(month),
      );
      return result as MonthlyInsights;
    },
    enabled: !!actor && !isFetching && !!driverId,
    staleTime: 30 * 60 * 1000, // 30 minutes — monthly data changes rarely
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Create a new company pitch and invalidate driver pitches cache. */
export function useCreatePitch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<string, Error, CompanyPitch>({
    mutationFn: async (pitch) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPitch(
        pitch as import("../../backend.d.ts").CompanyPitch,
      );
    },
    onSuccess: (_id, pitch) => {
      queryClient.invalidateQueries({
        queryKey: advertisingKeys.pitches(pitch.driverId),
      });
      queryClient.invalidateQueries({
        queryKey: advertisingKeys.followUpReminders(pitch.driverId),
      });
    },
  });
}

/** Update an existing pitch and refresh caches. */
export function useUpdatePitch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, { id: string; updated: CompanyPitch }>({
    mutationFn: async ({ id, updated }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePitch(
        id,
        updated as import("../../backend.d.ts").CompanyPitch,
      );
    },
    onSuccess: (_ok, { updated }) => {
      queryClient.invalidateQueries({
        queryKey: advertisingKeys.pitches(updated.driverId),
      });
    },
  });
}

/** Delete a pitch. */
export function useDeletePitch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, { id: string; driverId: string }>({
    mutationFn: async ({ id }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePitch(id);
    },
    onSuccess: (_ok, { driverId }) => {
      queryClient.invalidateQueries({
        queryKey: advertisingKeys.pitches(driverId),
      });
    },
  });
}

/** Update only the status of a pitch. */
export function useUpdatePitchStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    boolean,
    Error,
    { id: string; status: PitchStatus; driverId: string; companyName?: string }
  >({
    mutationFn: async ({ id, status }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePitchStatus(
        id,
        status as import("../../backend.d.ts").PitchStatus,
      );
    },
    onSuccess: (_ok, { driverId, status, companyName }) => {
      queryClient.invalidateQueries({
        queryKey: advertisingKeys.pitches(driverId),
      });
      // Fire-and-forget analytics
      analytics.track({
        category: "deal_event",
        action: "pitch_status_changed",
        metadata: {
          newStatus: status,
          companyName: companyName ?? "unknown",
        },
      });
    },
  });
}

/** Record a driver's outcome against a Nduna recommendation. */
export function useRecordOutcome() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, RecommendationOutcomeV2>({
    mutationFn: async (outcome) => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordOutcomeV2(
        outcome as import("../../backend.d.ts").RecommendationOutcomeV2,
      );
    },
    onSuccess: (_ok, outcome) => {
      queryClient.invalidateQueries({
        queryKey: advertisingKeys.outcomes(outcome.driverId),
      });
    },
  });
}

/** Log a new Nduna recommendation (called by AI assistant after sending a rec). */
export function useLogRecommendation() {
  const { actor } = useActor();
  return useMutation<string, Error, NdunaRecommendationV2>({
    mutationFn: async (rec) => {
      if (!actor) throw new Error("Actor not available");
      return actor.logRecommendationV2(
        rec as import("../../backend.d.ts").NdunaRecommendationV2,
      );
    },
  });
}
