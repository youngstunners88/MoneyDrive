/**
 * useGeolocation.ts — React Query hooks for driver geolocation & exposure metrics.
 * Calls backend canister methods for route opt-in and traffic intelligence.
 * Falls back to FALLBACK_EXPOSURE if backend method is unavailable.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "../../hooks/useActor";
import {
  type ExposureMetrics,
  FALLBACK_EXPOSURE,
  type RouteOptIn,
  SAZone,
} from "./types";

// ─── Query key factory ────────────────────────────────────────────────────────

export const geolocationKeys = {
  routeOptIn: (driverId?: string) =>
    ["geolocation", "optIn", driverId ?? "me"] as const,
  exposureMetrics: (zone?: SAZone) =>
    ["geolocation", "exposure", zone ?? "default"] as const,
};

// ─── Normalizer (bigint → number) ─────────────────────────────────────────────

function normalizeExposureMetrics(
  raw: Record<string, unknown>,
): ExposureMetrics {
  const factors = Array.isArray(raw.factors)
    ? (raw.factors as Record<string, unknown>[]).map((f) => ({
        name: String(f.name ?? ""),
        weight: Number(f.weight ?? 0),
        reason: String(f.reason ?? ""),
      }))
    : [];
  return {
    routeName: String(raw.routeName ?? ""),
    dailyVehicles: Number(raw.dailyVehicles ?? 0),
    dailyPedestrians: Number(raw.dailyPedestrians ?? 0),
    monthlyExposure: Number(raw.monthlyExposure ?? 0),
    confidenceScore: Number(raw.confidenceScore ?? 0),
    factors,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch the driver's current route opt-in from the backend. */
export function useRouteOptIn() {
  const { actor, isFetching } = useActor();

  return useQuery<RouteOptIn | null>({
    queryKey: geolocationKeys.routeOptIn(),
    queryFn: async () => {
      if (!actor) return null;
      try {
        const extended = actor as typeof actor & {
          getRouteOptIn?: () => Promise<Record<string, unknown> | null>;
        };
        const result = await extended.getRouteOptIn?.();
        if (!result) return null;
        return {
          primaryRoute: String(result.primaryRoute ?? SAZone.Generic) as SAZone,
          secondaryRoute: result.secondaryRoute
            ? (String(result.secondaryRoute) as SAZone)
            : undefined,
          optedInAt: Number(result.optedInAt ?? 0),
        };
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Fetch exposure metrics for the given SA zone.
 * Returns isUsingFallback flag so callers can show a confidence indicator.
 * staleTime: 24 hours — traffic data refreshes daily.
 */
export function useExposureMetrics(zone?: SAZone): {
  data: ExposureMetrics | undefined;
  isLoading: boolean;
  isError: boolean;
  isUsingFallback: boolean;
} {
  const { actor, isFetching } = useActor();

  const query = useQuery<{ metrics: ExposureMetrics; usingFallback: boolean }>({
    queryKey: geolocationKeys.exposureMetrics(zone),
    queryFn: async (): Promise<{
      metrics: ExposureMetrics;
      usingFallback: boolean;
    }> => {
      if (!actor) {
        return { metrics: FALLBACK_EXPOSURE, usingFallback: true };
      }
      try {
        const extended = actor as typeof actor & {
          getExposureMetrics?: (zone: string) => Promise<unknown>;
        };
        if (!extended.getExposureMetrics) {
          return { metrics: FALLBACK_EXPOSURE, usingFallback: true };
        }
        const result = await extended.getExposureMetrics(
          zone ?? SAZone.Generic,
        );
        return {
          metrics: normalizeExposureMetrics(
            result as unknown as Record<string, unknown>,
          ),
          usingFallback: false,
        };
      } catch {
        return { metrics: FALLBACK_EXPOSURE, usingFallback: true };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  return {
    data: query.data?.metrics,
    isLoading: query.isLoading,
    isError: query.isError,
    isUsingFallback: query.data?.usingFallback ?? true,
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Set or update the driver's primary (and optional secondary) route. */
export function useUpdateRouteOptIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, Omit<RouteOptIn, "optedInAt">>({
    mutationFn: async ({ primaryRoute, secondaryRoute }) => {
      if (!actor) throw new Error("Actor not available");
      const extended = actor as typeof actor & {
        updateRouteOptIn?: (
          primary: string,
          secondary?: string,
        ) => Promise<boolean>;
      };
      if (!extended.updateRouteOptIn) {
        throw new Error("updateRouteOptIn not available on actor");
      }
      return extended.updateRouteOptIn(primaryRoute, secondaryRoute);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: geolocationKeys.routeOptIn(),
      });
      queryClient.invalidateQueries({
        queryKey: ["geolocation", "exposure"],
      });
    },
  });
}
