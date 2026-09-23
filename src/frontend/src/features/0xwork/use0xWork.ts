/**
 * use0xWork.ts — React Query hooks for Nduna's 0xWork agent marketplace integration.
 * Server state only — no UI state here. Follows the same pattern as useIntelligence.ts.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "../../shared/hooks/useActor";

// ─── Query Keys ────────────────────────────────────────────────────────────────

const ZEROX_STATUS_KEY = ["zeroXWorkStatus"] as const;
const ZEROX_EARNINGS_KEY = ["zeroXWorkEarnings"] as const;
const ZEROX_TASKS_KEY = ["zeroXWorkTasks"] as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ZeroXWorkStatus {
  registered: boolean;
  walletAddress: string | null;
  tasksCompleted: number;
  activeTaskId: string | null;
}

export interface ZeroXWorkEarnings {
  totalUSDCEarned: number;
  tasksCompleted: number;
}

export interface ZeroXWorkTask {
  id: string;
  title: string;
  category: "Writing" | "Research" | "Data" | "Creative";
  bountyUSDC: number;
  deadline: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
}

// ─── Actor extension type ──────────────────────────────────────────────────────

type ZeroXWorkActorExt = {
  get0xWorkStatus?: () => Promise<{
    registered: boolean;
    walletAddress?: string;
    tasksCompleted: bigint;
    activeTaskId?: string;
  }>;
  get0xWorkEarnings?: () => Promise<{
    totalUSDCEarned: number;
    tasksCompleted: bigint;
  }>;
  trigger0xWorkRegistration?: () => Promise<
    { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
  >;
  triggerTaskDiscovery?: () => Promise<
    { __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string }
  >;
  getAvailableTasks?: () => Promise<
    {
      id: string;
      title: string;
      category: string;
      bountyUSDC: number;
      deadline: string;
      description: string;
      difficulty: string;
    }[]
  >;
  claimTask?: (
    taskId: string,
  ) => Promise<
    { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
  >;
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useZeroXWorkStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<ZeroXWorkStatus>({
    queryKey: [...ZEROX_STATUS_KEY],
    queryFn: async () => {
      if (!actor) {
        return {
          registered: false,
          walletAddress: null,
          tasksCompleted: 0,
          activeTaskId: null,
        };
      }
      const ext = actor as typeof actor & ZeroXWorkActorExt;
      if (!ext.get0xWorkStatus) {
        return {
          registered: false,
          walletAddress: null,
          tasksCompleted: 0,
          activeTaskId: null,
        };
      }
      const raw = await ext.get0xWorkStatus();
      return {
        registered: raw.registered,
        walletAddress: raw.walletAddress ?? null,
        tasksCompleted: Number(raw.tasksCompleted),
        activeTaskId: raw.activeTaskId ?? null,
      };
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useZeroXWorkEarnings() {
  const { actor, isFetching } = useActor();
  return useQuery<ZeroXWorkEarnings>({
    queryKey: [...ZEROX_EARNINGS_KEY],
    queryFn: async () => {
      if (!actor) return { totalUSDCEarned: 0, tasksCompleted: 0 };
      const ext = actor as typeof actor & ZeroXWorkActorExt;
      if (!ext.get0xWorkEarnings)
        return { totalUSDCEarned: 0, tasksCompleted: 0 };
      const raw = await ext.get0xWorkEarnings();
      return {
        totalUSDCEarned: raw.totalUSDCEarned,
        tasksCompleted: Number(raw.tasksCompleted),
      };
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useAvailableTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<ZeroXWorkTask[]>({
    queryKey: [...ZEROX_TASKS_KEY],
    queryFn: async () => {
      if (!actor) return [];
      const ext = actor as typeof actor & ZeroXWorkActorExt;
      if (!ext.getAvailableTasks) return [];
      const raw = await ext.getAvailableTasks();
      return raw.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category as ZeroXWorkTask["category"],
        bountyUSDC: t.bountyUSDC,
        deadline: t.deadline,
        description: t.description,
        difficulty: t.difficulty as ZeroXWorkTask["difficulty"],
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useTrigger0xWorkRegistration() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const ext = actor as typeof actor & ZeroXWorkActorExt;
      if (!ext.trigger0xWorkRegistration) {
        throw new Error("trigger0xWorkRegistration not available on actor");
      }
      const result = await ext.trigger0xWorkRegistration();
      if (result.__kind__ === "err") {
        throw new Error((result as { __kind__: "err"; err: string }).err);
      }
      return (result as { __kind__: "ok"; ok: string }).ok;
    },
    onSuccess: () => {
      toast.success("Nduna registered on 0xWork! Wallet address saved.");
      qc.invalidateQueries({ queryKey: ZEROX_STATUS_KEY });
      qc.invalidateQueries({ queryKey: ZEROX_EARNINGS_KEY });
    },
    onError: (err: Error) =>
      toast.error(err.message || "0xWork registration failed."),
  });
}

export function useTriggerTaskDiscovery() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const ext = actor as typeof actor & ZeroXWorkActorExt;
      if (!ext.triggerTaskDiscovery) {
        throw new Error("triggerTaskDiscovery not available on actor");
      }
      const result = await ext.triggerTaskDiscovery();
      if (result.__kind__ === "err") {
        throw new Error((result as { __kind__: "err"; err: string }).err);
      }
      const count = (result as { __kind__: "ok"; ok: bigint }).ok;
      return `${Number(count)} tasks found`;
    },
    onSuccess: (msg) => {
      toast.success(msg || "Task discovery complete.");
      qc.invalidateQueries({ queryKey: ZEROX_TASKS_KEY });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Task discovery failed."),
  });
}

export function useClaimTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!actor) throw new Error("Not connected");
      const ext = actor as typeof actor & ZeroXWorkActorExt;
      if (!ext.claimTask) {
        throw new Error("claimTask not available on actor");
      }
      const result = await ext.claimTask(taskId);
      if (result.__kind__ === "err") {
        throw new Error((result as { __kind__: "err"; err: string }).err);
      }
      return (result as { __kind__: "ok"; ok: string }).ok;
    },
    onSuccess: () => {
      toast.success("Task claimed — Nduna is on it.");
      qc.invalidateQueries({ queryKey: ZEROX_STATUS_KEY });
      qc.invalidateQueries({ queryKey: ZEROX_TASKS_KEY });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to claim task."),
  });
}
