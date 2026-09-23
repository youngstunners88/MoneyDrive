/**
 * useIntelligence.ts — React Query hooks for Orbis API publisher and Browserbase cloud hunting.
 * Server state only — no UI state here.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "../../shared/hooks/useActor";

// ─── Query Keys ────────────────────────────────────────────────────────────────

const ORBIS_PUBLISHER_STATUS_KEY = ["orbisPublisherStatus"] as const;
const BROWSERBASE_CONFIGURED_KEY = ["isBrowserbaseConfigured"] as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface OrbisListingConfig {
  providerApiKey: string;
  listingName: string;
  pricePerCall: number;
  autoPublish: boolean;
}

export interface OrbisListingStatus {
  listed: boolean;
  listingId: string | null;
  totalCalls: number;
  usdcEarned: number;
}

// ─── Actor extension type ──────────────────────────────────────────────────────

type IntelligenceActorExt = {
  getOrbisPublisherStatus?: () => Promise<{
    listed: boolean;
    listingId?: string;
    totalCalls: bigint;
    usdcEarned: number;
  }>;
  setOrbisPublisherConfig?: (config: {
    providerApiKey: string;
    listingName: string;
    pricePerCall: number;
    autoPublish: boolean;
  }) => Promise<
    { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
  >;
  setBrowserbaseConfig?: (
    apiKey: string,
  ) => Promise<
    { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
  >;
  isBrowserbaseConfigured?: () => Promise<boolean>;
  triggerBrowserbaseHunt?: (
    driverPrincipal: string,
  ) => Promise<
    { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
  >;
  getSAIntelligence?: (query: {
    category: string;
    city: string[];
    limit: bigint;
  }) => Promise<
    | {
        __kind__: "ok";
        ok: {
          category: string;
          city: string;
          generatedAt: bigint;
          data: {
            name: string;
            value: number;
            unit: string;
            sampleSize: bigint;
          }[];
        };
      }
    | { __kind__: "err"; err: string }
  >;
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useOrbisPublisherStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<OrbisListingStatus>({
    queryKey: [...ORBIS_PUBLISHER_STATUS_KEY],
    queryFn: async () => {
      if (!actor)
        return { listed: false, listingId: null, totalCalls: 0, usdcEarned: 0 };
      const ext = actor as typeof actor & IntelligenceActorExt;
      if (!ext.getOrbisPublisherStatus) {
        return { listed: false, listingId: null, totalCalls: 0, usdcEarned: 0 };
      }
      const raw = await ext.getOrbisPublisherStatus();
      return {
        listed: raw.listed,
        listingId: raw.listingId ?? null,
        totalCalls: Number(raw.totalCalls),
        usdcEarned: raw.usdcEarned,
      };
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useSetOrbisPublisherConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: OrbisListingConfig) => {
      if (!actor) throw new Error("Not connected");
      const ext = actor as typeof actor & IntelligenceActorExt;
      if (!ext.setOrbisPublisherConfig)
        throw new Error("setOrbisPublisherConfig not available");
      const result = await ext.setOrbisPublisherConfig({
        providerApiKey: config.providerApiKey,
        listingName: config.listingName,
        pricePerCall: config.pricePerCall,
        autoPublish: config.autoPublish,
      });
      if (result.__kind__ === "err")
        throw new Error((result as { __kind__: "err"; err: string }).err);
      return (result as { __kind__: "ok"; ok: string }).ok;
    },
    onSuccess: () => {
      toast.success("Orbis publisher config saved.");
      qc.invalidateQueries({ queryKey: ORBIS_PUBLISHER_STATUS_KEY });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save Orbis config."),
  });
}

export function useSetBrowserbaseConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (apiKey: string) => {
      if (!actor) throw new Error("Not connected");
      const ext = actor as typeof actor & IntelligenceActorExt;
      if (!ext.setBrowserbaseConfig)
        throw new Error("setBrowserbaseConfig not available");
      const result = await ext.setBrowserbaseConfig(apiKey);
      if (result.__kind__ === "err")
        throw new Error((result as { __kind__: "err"; err: string }).err);
      return (result as { __kind__: "ok"; ok: string }).ok;
    },
    onSuccess: () => {
      toast.success("Browserbase API key saved securely.");
      qc.invalidateQueries({ queryKey: BROWSERBASE_CONFIGURED_KEY });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save Browserbase key."),
  });
}

export function useIsBrowserbaseConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: [...BROWSERBASE_CONFIGURED_KEY],
    queryFn: async () => {
      if (!actor) return false;
      const ext = actor as typeof actor & IntelligenceActorExt;
      if (!ext.isBrowserbaseConfigured) return false;
      return ext.isBrowserbaseConfigured();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useTriggerBrowserbaseHunt() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (driverPrincipal: string) => {
      if (!actor) throw new Error("Not connected");
      const ext = actor as typeof actor & IntelligenceActorExt;
      if (!ext.triggerBrowserbaseHunt)
        throw new Error("triggerBrowserbaseHunt not available");
      const result = await ext.triggerBrowserbaseHunt(driverPrincipal);
      if (result.__kind__ === "err")
        throw new Error((result as { __kind__: "err"; err: string }).err);
      return (result as { __kind__: "ok"; ok: string }).ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["opportunityHunterStatus"] });
    },
    onError: (err: Error) => toast.error(err.message || "Cloud hunt failed."),
  });
}
