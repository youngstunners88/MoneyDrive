// React Query hooks for gateway server state.
// All canister interactions go through here — never call actor directly from components.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { useActor } from "../../shared/hooks/useActor";
import type {
  GatewayMetricEntry,
  GatewayMetricsSummary,
  GatewayStatus,
} from "./types";

// ── Status ─────────────────────────────────────────────────────────────────────

export function useGatewayStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<GatewayStatus>({
    queryKey: queryKeys.gateway.status(),
    queryFn: async (): Promise<GatewayStatus> => {
      if (!actor) return { configured: false, url: null };
      const result = await actor.getAIGatewayStatus();
      return {
        configured: result.configured,
        url: result.url ?? null,
      };
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ── Metrics summary ────────────────────────────────────────────────────────────

export function useGatewayMetrics() {
  const { actor, isFetching } = useActor();
  return useQuery<GatewayMetricsSummary | null>({
    queryKey: queryKeys.gateway.metrics(),
    queryFn: async (): Promise<GatewayMetricsSummary | null> => {
      if (!actor) return null;
      const result = await actor.getGatewayMetricsSummary();
      return {
        totalRequests: result.totalRequests,
        gatewayRequests: result.gatewayRequests,
        directRequests: result.directRequests,
        cacheHits: result.cacheHits,
        avgGatewayMs: result.avgGatewayMs,
        avgDirectMs: result.avgDirectMs,
        errorCount: result.errorCount,
      };
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// ── Recent entries ─────────────────────────────────────────────────────────────

export function useGatewayEntries(limit = 20) {
  const { actor, isFetching } = useActor();
  return useQuery<GatewayMetricEntry[]>({
    queryKey: queryKeys.gateway.entries(limit),
    queryFn: async (): Promise<GatewayMetricEntry[]> => {
      if (!actor) return [];
      const entries = await actor.getGatewayRecentEntries(BigInt(limit));
      return entries.map((e) => ({
        timestamp: e.timestamp,
        durationMs: e.durationMs,
        isGateway: e.isGateway,
        wasCached: e.wasCached,
        model: e.model,
        error: e.error ?? null,
      }));
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useSetGatewayConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      url,
      apiKey,
    }: {
      url: string;
      apiKey: string;
    }): Promise<void> => {
      if (!actor) throw new Error("Not connected");
      await actor.setAIGatewayConfig(url, apiKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gateway.status() });
      queryClient.invalidateQueries({ queryKey: queryKeys.gateway.metrics() });
    },
  });
}

export function useClearGatewayConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!actor) throw new Error("Not connected");
      await actor.clearAIGatewayConfig();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gateway.status() });
      queryClient.invalidateQueries({ queryKey: queryKeys.gateway.metrics() });
    },
  });
}

// ── Remaining queries ──────────────────────────────────────────────────────────

export function useRemainingNdunaQueries() {
  const { actor, isFetching } = useActor();
  return useQuery<number | null>({
    queryKey: queryKeys.nduna.remaining(),
    queryFn: async (): Promise<number | null> => {
      if (!actor) return null;
      const result = await actor.getRemainingNdunaQueries();
      return Number(result);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

// ── Re-export legacy key constant for any files still using it ─────────────────
/** @deprecated Use queryKeys.gateway.* from lib/queryKeys instead. */
export const GATEWAY_QUERY_KEYS = {
  status: queryKeys.gateway.status(),
  metrics: queryKeys.gateway.metrics(),
  entries: (limit: number) => queryKeys.gateway.entries(limit),
} as const;
