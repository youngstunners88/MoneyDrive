/**
 * campaign/useCampaign.ts — React Query hooks for all Campaign Engine operations.
 * All backend calls go through useActor() — never touch localStorage or context directly.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "../../shared/hooks/useActor";
import type {
  AbTestResult,
  Campaign,
  CampaignConfig,
  CampaignFailureLog,
  CampaignMetrics,
  CampaignStatus,
  WeeklyReport,
} from "./types";

// ── Typed actor extension ─────────────────────────────────────────────────────
// The backend actor types — cast via unknown to get campaign-specific methods.

interface CampaignActor {
  proposeCampaign(): Promise<{ ok?: Campaign; err?: string }>;
  listCampaigns(status: CampaignStatus | null): Promise<Campaign[]>;
  approveCampaign(
    id: string,
    scheduledFor: bigint | null,
  ): Promise<{ ok?: Campaign; err?: string }>;
  rejectCampaign(
    id: string,
    reason: string,
  ): Promise<{ ok?: Campaign; err?: string }>;
  requestChanges(
    id: string,
    notes: string,
  ): Promise<{ ok?: Campaign; err?: string }>;
  getCampaignMetrics(
    campaignId: string,
  ): Promise<{ ok?: CampaignMetrics; err?: string }>;
  getCampaignConfig(): Promise<CampaignConfig>;
  setCampaignConfig(config: CampaignConfig): Promise<boolean>;
  pauseAllCampaigns(): Promise<boolean>;
  resumeAllCampaigns(): Promise<boolean>;
  generateWeeklyReport(): Promise<WeeklyReport>;
  getCampaignFailureLog(): Promise<CampaignFailureLog[]>;
  checkAbTestResults(): Promise<AbTestResult[]>;
}

function useCampaignActor(): CampaignActor | null {
  const { actor } = useActor();
  if (!actor) return null;
  return actor as unknown as CampaignActor;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useListCampaigns(status?: CampaignStatus) {
  const campaignActor = useCampaignActor();
  return useQuery<Campaign[]>({
    queryKey: ["campaigns", status ?? "all"],
    queryFn: async () => {
      if (!campaignActor) return [];
      try {
        return await campaignActor.listCampaigns(status ?? null);
      } catch {
        return [];
      }
    },
    enabled: !!campaignActor,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useCampaignMetrics(campaignId: string) {
  const campaignActor = useCampaignActor();
  return useQuery<CampaignMetrics | null>({
    queryKey: ["campaign", "metrics", campaignId],
    queryFn: async () => {
      if (!campaignActor || !campaignId) return null;
      try {
        const result = await campaignActor.getCampaignMetrics(campaignId);
        return result.ok ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!campaignActor && !!campaignId,
    staleTime: 30_000,
  });
}

export function useCampaignConfig() {
  const campaignActor = useCampaignActor();
  return useQuery<CampaignConfig | null>({
    queryKey: ["campaign", "config"],
    queryFn: async () => {
      if (!campaignActor) return null;
      try {
        return await campaignActor.getCampaignConfig();
      } catch {
        return null;
      }
    },
    enabled: !!campaignActor,
    staleTime: 60_000,
  });
}

export function useCampaignFailureLog() {
  const campaignActor = useCampaignActor();
  return useQuery<CampaignFailureLog[]>({
    queryKey: ["campaign", "failureLog"],
    queryFn: async () => {
      if (!campaignActor) return [];
      try {
        return await campaignActor.getCampaignFailureLog();
      } catch {
        return [];
      }
    },
    enabled: !!campaignActor,
    staleTime: 30_000,
  });
}

export function useCheckAbTests() {
  const campaignActor = useCampaignActor();
  return useQuery<AbTestResult[]>({
    queryKey: ["campaign", "abTests"],
    queryFn: async () => {
      if (!campaignActor) return [];
      try {
        return await campaignActor.checkAbTestResults();
      } catch {
        return [];
      }
    },
    enabled: !!campaignActor,
    staleTime: 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useProposeCampaign() {
  const campaignActor = useCampaignActor();
  const qc = useQueryClient();
  return useMutation<Campaign, Error>({
    mutationFn: async () => {
      if (!campaignActor) throw new Error("Actor not ready");
      const result = await campaignActor.proposeCampaign();
      if (result.err) throw new Error(result.err);
      if (!result.ok) throw new Error("No campaign returned");
      return result.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useApproveCampaign() {
  const campaignActor = useCampaignActor();
  const qc = useQueryClient();
  return useMutation<Campaign, Error, { id: string; scheduledFor?: bigint }>({
    mutationFn: async ({ id, scheduledFor }) => {
      if (!campaignActor) throw new Error("Actor not ready");
      const result = await campaignActor.approveCampaign(
        id,
        scheduledFor ?? null,
      );
      if (result.err) throw new Error(result.err);
      if (!result.ok) throw new Error("Approval failed");
      return result.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useRejectCampaign() {
  const campaignActor = useCampaignActor();
  const qc = useQueryClient();
  return useMutation<Campaign, Error, { id: string; reason: string }>({
    mutationFn: async ({ id, reason }) => {
      if (!campaignActor) throw new Error("Actor not ready");
      const result = await campaignActor.rejectCampaign(id, reason);
      if (result.err) throw new Error(result.err);
      if (!result.ok) throw new Error("Rejection failed");
      return result.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useRequestChanges() {
  const campaignActor = useCampaignActor();
  const qc = useQueryClient();
  return useMutation<Campaign, Error, { id: string; notes: string }>({
    mutationFn: async ({ id, notes }) => {
      if (!campaignActor) throw new Error("Actor not ready");
      const result = await campaignActor.requestChanges(id, notes);
      if (result.err) throw new Error(result.err);
      if (!result.ok) throw new Error("Request failed");
      return result.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useSetCampaignConfig() {
  const campaignActor = useCampaignActor();
  const qc = useQueryClient();
  return useMutation<boolean, Error, CampaignConfig>({
    mutationFn: async (config) => {
      if (!campaignActor) throw new Error("Actor not ready");
      return await campaignActor.setCampaignConfig(config);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaign", "config"] });
    },
  });
}

export function usePauseAllCampaigns() {
  const campaignActor = useCampaignActor();
  const qc = useQueryClient();
  return useMutation<boolean, Error>({
    mutationFn: async () => {
      if (!campaignActor) throw new Error("Actor not ready");
      return await campaignActor.pauseAllCampaigns();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useResumeAllCampaigns() {
  const campaignActor = useCampaignActor();
  const qc = useQueryClient();
  return useMutation<boolean, Error>({
    mutationFn: async () => {
      if (!campaignActor) throw new Error("Actor not ready");
      return await campaignActor.resumeAllCampaigns();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useGenerateWeeklyReport() {
  const campaignActor = useCampaignActor();
  return useMutation<WeeklyReport, Error>({
    mutationFn: async () => {
      if (!campaignActor) throw new Error("Actor not ready");
      return await campaignActor.generateWeeklyReport();
    },
  });
}
