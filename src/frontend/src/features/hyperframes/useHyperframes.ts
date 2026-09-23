/**
 * useHyperframes.ts — React Query hooks for the Hyperframes AI Video Studio.
 * Uses real backend.d.ts types via the generated actor.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";
import type {
  GenerateSlideshowInput,
  HyperframesJob,
  HyperframesRenderStatus,
} from "./types";

// ─── Query key factory ────────────────────────────────────────────────────────

export const hyperframesKeys = {
  jobs: () => ["hyperframes-jobs"] as const,
  job: (id: string) => ["hyperframes-job", id] as const,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapStatus(raw: string): HyperframesRenderStatus {
  return raw as HyperframesRenderStatus;
}

type RawJob = {
  id: string;
  driverId: string;
  topic: string;
  compositionHtml: string;
  renderStatus: string;
  mp4Url?: string;
  errorMsg?: string;
  createdAt: bigint;
};

function mapBackendJob(raw: RawJob): HyperframesJob {
  return {
    id: raw.id,
    driverId: raw.driverId,
    topic: raw.topic,
    compositionHtml: raw.compositionHtml,
    renderStatus: mapStatus(raw.renderStatus),
    mp4Url: raw.mp4Url,
    errorMsg: raw.errorMsg,
    createdAt: raw.createdAt,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all Hyperframes jobs for the caller (job history). */
export function useHyperframesJobs() {
  const { actor, isFetching } = useActor();
  return useQuery<HyperframesJob[]>({
    queryKey: hyperframesKeys.jobs(),
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getHyperframesJobs();
      return result.map((j) => mapBackendJob(j as unknown as RawJob));
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Poll a single Hyperframes job every 5 seconds.
 * Stops polling once status is 'ready' or 'failed'.
 */
export function useHyperframesJob(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<HyperframesJob | null>({
    queryKey: hyperframesKeys.job(id),
    queryFn: async () => {
      if (!actor || !id) return null;
      const result = await actor.getHyperframesJob(id);
      if (!result) return null;
      return mapBackendJob(result as unknown as RawJob);
    },
    enabled: !!actor && !isFetching && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.renderStatus;
      if (status === "ready" || status === "failed") return false;
      return 5_000;
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Generate a new Hyperframes slideshow via Nduna + VPS render pipeline. */
export function useGenerateSlideshow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<HyperframesJob, Error, GenerateSlideshowInput>({
    mutationFn: async ({ topic }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.generateHyperframesSlideshow(topic);
      if (result.__kind__ === "err") throw new Error(result.err);
      return mapBackendJob(result.ok as unknown as RawJob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hyperframesKeys.jobs() });
    },
    onError: (err) => {
      toast.error(`Failed to generate video: ${err.message}`);
    },
  });
}
