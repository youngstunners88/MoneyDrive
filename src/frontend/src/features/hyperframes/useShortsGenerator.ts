/**
 * useShortsGenerator.ts — React Query hooks for the "Clip to Short" feature.
 * Wraps submitShortsJob / getShortsJob / listShortsJobs backend calls.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";
import type { ShortsJob, ShortsStatus } from "./shorts-types";

// ─── Query key factory ────────────────────────────────────────────────────────

export const shortsKeys = {
  jobs: () => ["shorts-jobs"] as const,
  job: (id: string | null) => ["shorts-job", id] as const,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapShortsStatus(raw: Record<string, null>): ShortsStatus {
  const key = Object.keys(raw)[0] as ShortsStatus;
  return key;
}

type RawShortsJob = {
  id: string;
  driverId: { toText?: () => string } | string;
  sourceUrl: string;
  sourceType: Record<string, null>;
  clipStatus: Record<string, null>;
  outputMp4Url?: string[] | string;
  selectedSegmentStart?: bigint[] | bigint;
  selectedSegmentEnd?: bigint[] | bigint;
  errorMsg?: string[] | string;
  createdAt: bigint;
};

function mapShortsJob(raw: RawShortsJob): ShortsJob {
  const sourceTypeKey = Object.keys(raw.sourceType)[0] as "youtube" | "upload";
  // Motoko optionals come as arrays or plain values
  const unwrapOpt = <T>(v: T[] | T | undefined): T | undefined => {
    if (Array.isArray(v)) return v[0];
    return v as T | undefined;
  };

  return {
    id: raw.id,
    driverId:
      typeof raw.driverId === "string"
        ? raw.driverId
        : ((raw.driverId as { toText?: () => string }).toText?.() ?? ""),
    sourceUrl: raw.sourceUrl,
    sourceType: sourceTypeKey,
    clipStatus: mapShortsStatus(raw.clipStatus),
    outputMp4Url: unwrapOpt(raw.outputMp4Url as string[] | undefined),
    selectedSegmentStart: unwrapOpt(
      raw.selectedSegmentStart as bigint[] | undefined,
    ),
    selectedSegmentEnd: unwrapOpt(
      raw.selectedSegmentEnd as bigint[] | undefined,
    ),
    errorMsg: unwrapOpt(raw.errorMsg as string[] | undefined),
    createdAt: raw.createdAt,
  };
}

const TERMINAL_STATUSES: ShortsStatus[] = ["ready", "failed"];

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all ShortsJobs for the caller (history). */
export function useShortsJobs() {
  const { actor, isFetching } = useActor();
  return useQuery<ShortsJob[]>({
    queryKey: shortsKeys.jobs(),
    queryFn: async () => {
      if (!actor) return [];
      const result = await (
        actor as unknown as { listShortsJobs: () => Promise<RawShortsJob[]> }
      ).listShortsJobs();
      return result
        .map(mapShortsJob)
        .sort((a, b) => Number(b.createdAt - a.createdAt));
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Poll a single ShortsJob every 5 s until status is ready/failed.
 * Pass null to disable.
 */
export function useShortsJob(jobId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ShortsJob | null>({
    queryKey: shortsKeys.job(jobId),
    queryFn: async () => {
      if (!actor || !jobId) return null;
      const result = await (
        actor as unknown as {
          getShortsJob: (id: string) => Promise<RawShortsJob | undefined>;
        }
      ).getShortsJob(jobId);
      if (!result) return null;
      return mapShortsJob(result);
    },
    enabled: !!actor && !isFetching && !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.clipStatus;
      if (!status || TERMINAL_STATUSES.includes(status)) return false;
      return 5_000;
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface ShortsRequest {
  sourceUrl: string;
  sourceType: "youtube" | "upload";
}

/** Submit a new Clip-to-Short job. */
export function useSubmitShortsJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<string, Error, ShortsRequest>({
    mutationFn: async (req) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          submitShortsJob: (r: {
            sourceUrl: string;
            sourceType: Record<string, null>;
          }) => Promise<{ ok?: string; err?: string }>;
        }
      ).submitShortsJob({
        sourceUrl: req.sourceUrl,
        sourceType: { [req.sourceType]: null },
      });
      if (result.err !== undefined) throw new Error(result.err);
      return result.ok!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortsKeys.jobs() });
    },
    onError: (err) => {
      toast.error(`Couldn't start the clip: ${err.message}`);
    },
  });
}
