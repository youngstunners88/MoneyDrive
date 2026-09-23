/**
 * useLeads.ts — React Query hooks for Camofox automated lead research.
 * Uses optional-chained actor cast so the file compiles while the backend
 * methods are being deployed (same pattern as useSmartRecommendations.ts).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "../../hooks/useActor";
import type { ExaCompanyResult, LeadStatus, ScrapedLead } from "./types";

// ─── Actor extension type ─────────────────────────────────────────────────────

type LeadActor = {
  getDriverLeads?: (
    weekNumber?: bigint,
    year?: bigint,
  ) => Promise<ScrapedLead[]>;
  updateLeadStatus?: (
    leadId: string,
    status: string,
  ) => Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  triggerLeadRefresh?: () => Promise<
    { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
  >;
};

// ─── Query key factory ────────────────────────────────────────────────────────

export const leadKeys = {
  all: ["leads"] as const,
  list: (weekNumber?: number, year?: number) =>
    ["leads", "list", weekNumber, year] as const,
};

// ─── Normalizer ───────────────────────────────────────────────────────────────

function normalizeExaEnriched(raw: unknown): ExaCompanyResult | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;

  // Helper: Candid ?Text arrives as [] | [string] — normalise from any shape
  const optText = (val: unknown): [] | [string] => {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string")
      return [val[0]];
    if (typeof val === "string" && val.length > 0) return [val];
    return [];
  };

  return {
    name: String(r.name ?? ""),
    url: String(r.url ?? ""),
    industry: optText(r.industry),
    employeeCount: optText(r.employeeCount),
    founded: optText(r.founded),
    description: optText(r.description),
    contactEmail: optText(r.contactEmail),
    snippet: String(r.snippet ?? ""),
  };
}

function normalizeLead(raw: Record<string, unknown>): ScrapedLead {
  const factors = (raw.scoringFactors ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ""),
    driverId: String(raw.driverId ?? ""),
    companyName: String(raw.companyName ?? ""),
    address: String(raw.address ?? ""),
    website: String(raw.website ?? ""),
    phone: String(raw.phone ?? ""),
    email: String(raw.email ?? ""),
    industry: String(raw.industry ?? ""),
    source: String(raw.source ?? ""),
    compositeScore: Number(raw.compositeScore ?? 0),
    scoringFactors: {
      industryFit: Number(factors.industryFit ?? 0),
      hiringActivity: Number(factors.hiringActivity ?? 0),
      geographicOverlap: Number(factors.geographicOverlap ?? 0),
      companySize: Number(factors.companySize ?? 0),
    },
    weekNumber: Number(raw.weekNumber ?? 0),
    year: Number(raw.year ?? 0),
    scrapedAt: BigInt(String(raw.scrapedAt ?? 0)),
    status: (raw.status as LeadStatus) ?? "pending",
    tavilyHiringSignal: raw.tavilyHiringSignal === true,
    tavilySnippet: raw.tavilySnippet ? String(raw.tavilySnippet) : undefined,
    exaEnriched: normalizeExaEnriched(raw.exaEnriched),
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch scraped leads for the current driver.
 * Optionally filter by weekNumber and year.
 * staleTime: 1 hour — leads refresh weekly.
 */
export function useDriverLeads(weekNumber?: number, year?: number) {
  const { actor, isFetching } = useActor();

  return useQuery<ScrapedLead[]>({
    queryKey: leadKeys.list(weekNumber, year),
    queryFn: async () => {
      if (!actor) return [];
      try {
        const extended = actor as typeof actor & LeadActor;
        const wn = weekNumber != null ? BigInt(weekNumber) : undefined;
        const yr = year != null ? BigInt(year) : undefined;
        const result = await extended.getDriverLeads?.(wn, yr);
        return (result ?? []).map((r) =>
          normalizeLead(r as unknown as Record<string, unknown>),
        );
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Update the status of a single scraped lead. */
export function useUpdateLeadStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { leadId: string; status: LeadStatus }>({
    mutationFn: async ({ leadId, status }) => {
      if (!actor) throw new Error("Actor not available");
      const extended = actor as typeof actor & LeadActor;
      const result = await extended.updateLeadStatus?.(leadId, status);
      if (result && result.__kind__ === "err") {
        throw new Error(result.err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

/**
 * Trigger an immediate Camofox lead refresh for the current driver.
 * Returns the job status message from the backend.
 */
export function useTriggerLeadRefresh() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<string, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const extended = actor as typeof actor & LeadActor;
      const result = await extended.triggerLeadRefresh?.();
      if (!result) return "Refresh triggered";
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      // Allow a moment for data to propagate then refresh
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: leadKeys.all });
      }, 2000);
    },
  });
}
