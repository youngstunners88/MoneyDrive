/**
 * useOpportunities.ts — React Query hooks for Nduna's autonomous opportunity scanner.
 * Includes VPS-based and Browserbase cloud hunt triggers.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "../../shared/hooks/useActor";
import type {
  OpportunityCategory,
  OpportunityFinding,
  OpportunityHunterStatus,
} from "../../types/opportunities";

// Re-export types so components that import from this module directly continue to work
export type {
  OpportunityCategory,
  OpportunityFinding,
  OpportunityHunterStatus,
};

const FINDINGS_KEY = ["opportunities"] as const;
const STATUS_KEY = ["opportunityHunterStatus"] as const;
const BROWSERBASE_CONFIGURED_KEY = ["isBrowserbaseConfigured"] as const;

function mapFinding(r: {
  id: string;
  driverId: string;
  category: string;
  title: string;
  description: string;
  relevanceScore: bigint;
  source: string;
  discoveredAt: bigint;
  expiresAt: bigint;
  dismissed: boolean;
}): OpportunityFinding {
  return {
    id: r.id,
    driverId: r.driverId,
    category: r.category as OpportunityFinding["category"],
    title: r.title,
    description: r.description,
    relevanceScore: r.relevanceScore,
    source: r.source,
    discoveredAt: r.discoveredAt,
    expiresAt: r.expiresAt,
    dismissed: r.dismissed,
  };
}

// Actor extension for Browserbase methods
type BrowserbaseActorExt = {
  isBrowserbaseConfigured?: () => Promise<boolean>;
  triggerBrowserbaseHunt?: (
    driverPrincipal: string,
  ) => Promise<
    { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
  >;
};

export function useOpportunities(limit = 50) {
  const { actor, isFetching: actorFetching } = useActor();
  const qc = useQueryClient();

  const {
    data: findings = [],
    isLoading,
    error,
  } = useQuery<OpportunityFinding[]>({
    queryKey: [...FINDINGS_KEY, limit],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.getDriverOpportunities(BigInt(limit));
      return (raw as typeof raw).map(mapFinding);
    },
    enabled: !!actor && !actorFetching,
  });

  const { data: hunterStatus } = useQuery<OpportunityHunterStatus>({
    queryKey: STATUS_KEY,
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      const s = await actor.getOpportunityHunterStatus();
      return {
        configured: s.configured,
        lastRun: BigInt(s.lastRun),
        lastError: s.lastError,
      };
    },
    enabled: !!actor && !actorFetching,
    staleTime: 60_000,
  });

  const dismissMut = useMutation({
    mutationFn: async (findingId: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.dismissOpportunity(findingId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINDINGS_KEY });
      toast.success("Opportunity dismissed.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to dismiss."),
  });

  const triggerHuntMut = useMutation({
    mutationFn: async (driverId: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.triggerOpportunityHunt(driverId);
      if ("err" in result) throw new Error(result.err as string);
      return result.ok as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINDINGS_KEY });
      qc.invalidateQueries({ queryKey: STATUS_KEY });
    },
  });

  return {
    findings,
    isLoading: isLoading || actorFetching,
    error,
    hunterStatus,
    dismissOpportunity: dismissMut.mutateAsync,
    isDismissing: dismissMut.isPending,
    dismissingId: dismissMut.variables,
    triggerHunt: triggerHuntMut.mutateAsync,
    isHunting: triggerHuntMut.isPending,
  };
}

// ─── Browserbase-specific hooks ─────────────────────────────────────────────────

export function useIsBrowserbaseConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: [...BROWSERBASE_CONFIGURED_KEY],
    queryFn: async () => {
      if (!actor) return false;
      const ext = actor as typeof actor & BrowserbaseActorExt;
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
      const ext = actor as typeof actor & BrowserbaseActorExt;
      if (!ext.triggerBrowserbaseHunt)
        throw new Error("triggerBrowserbaseHunt not available");
      const result = await ext.triggerBrowserbaseHunt(driverPrincipal);
      if (result.__kind__ === "err")
        throw new Error((result as { __kind__: "err"; err: string }).err);
      return (result as { __kind__: "ok"; ok: string }).ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINDINGS_KEY });
      qc.invalidateQueries({ queryKey: STATUS_KEY });
    },
    onError: (err: Error) => toast.error(err.message || "Cloud hunt failed."),
  });
}
