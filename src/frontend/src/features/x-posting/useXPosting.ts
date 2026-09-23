/**
 * useXPosting.ts — React Query hooks for Nduna's X (Twitter) posting module.
 * Uses generated backend types directly from backend.d.ts.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  XPost as BackendXPost,
  XPostType as BackendXPostType,
  XPostingConfig as BackendXPostingConfig,
} from "../../backend.d";
import { useActor } from "../../shared/hooks/useActor";

// ─── Query Keys ────────────────────────────────────────────────────────────────

const X_STATUS_KEY = ["xPostingStatus"] as const;
const X_POSTS_KEY = ["xPosts"] as const;
const X_CONFIG_KEY = ["xPostingConfig"] as const;

// ─── Re-export backend types ───────────────────────────────────────────────────

export type { BackendXPostType as XPostType };
export type XPostStatus = "pending" | "posted" | "failed" | "scheduled";

export interface XPostingStatus {
  isUnlocked: boolean;
  earningsCents: number;
  thresholdCents: number;
  progressPct: number;
  totalPosts: number;
}

export interface XPost {
  id: number;
  content: string;
  postType: BackendXPostType;
  postedAt: number | null;
  status: XPostStatus;
  xPostId: string | null;
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  impressionsCount: number;
}

// XPostingConfig uses backend field names
export type XPostingConfig = BackendXPostingConfig;

// ─── Helper: decode raw backend XPost ─────────────────────────────────────────

function decodeXPost(p: BackendXPost): XPost {
  return {
    id: Number(p.id),
    content: p.content,
    postType: p.postType,
    postedAt: p.postedAt !== undefined ? Number(p.postedAt) : null,
    status: p.status as XPostStatus,
    xPostId: p.xPostId !== undefined ? p.xPostId : null,
    likesCount: Number(p.likesCount),
    retweetsCount: Number(p.retweetsCount),
    repliesCount: Number(p.repliesCount),
    impressionsCount: Number(p.impressionsCount),
  };
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useXPostingStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<XPostingStatus>({
    queryKey: [...X_STATUS_KEY],
    queryFn: async () => {
      if (!actor)
        return {
          isUnlocked: false,
          earningsCents: 0,
          thresholdCents: 10000,
          progressPct: 0,
          totalPosts: 0,
        };
      const raw = await actor.getXPostingStatus();
      return {
        isUnlocked: raw.isUnlocked,
        earningsCents: Number(raw.earningsCents),
        thresholdCents: Number(raw.thresholdCents),
        progressPct: Number(raw.progressPct),
        totalPosts: Number(raw.totalPosts),
      };
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useXPosts(limit = 10, offset = 0) {
  const { actor, isFetching } = useActor();
  return useQuery<XPost[]>({
    queryKey: [...X_POSTS_KEY, limit, offset],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.getXPosts(BigInt(limit), BigInt(offset));
      return raw.map(decodeXPost);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useXPostingConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<XPostingConfig>({
    queryKey: [...X_CONFIG_KEY],
    queryFn: async () => {
      if (!actor)
        return {
          xApiKey: "",
          xApiSecret: "",
          xAccessToken: "",
          xAccessTokenSecret: "",
          earningsThresholdUsd: BigInt(100),
          monthlyEarningsCents: BigInt(0),
          isUnlocked: false,
          totalPostsPublished: BigInt(0),
          lastPostAt: undefined,
        };
      return actor.getXPostingConfig();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useTriggerXPost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postType: BackendXPostType) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.triggerNdunaXPost(postType);
      if ("err" in result) throw new Error(result.err);
      return decodeXPost(result.ok);
    },
    onSuccess: () => {
      toast.success("Nduna posted on X! Ayeye 🎉");
      qc.invalidateQueries({ queryKey: X_POSTS_KEY });
      qc.invalidateQueries({ queryKey: X_STATUS_KEY });
    },
    onError: (err: Error) =>
      toast.error(err.message || "X post failed. Try again."),
  });
}

export function useSyncXMetrics() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.syncXPostMetrics();
      if ("err" in result) throw new Error(result.err);
      return Number(result.ok);
    },
    onSuccess: (count) => {
      toast.success(
        `Metrics synced for ${count} post${count === 1 ? "" : "s"}.`,
      );
      qc.invalidateQueries({ queryKey: X_POSTS_KEY });
    },
    onError: (err: Error) => toast.error(err.message || "Sync failed."),
  });
}

export function useSaveXApiKeys() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (keys: {
      xApiKey: string;
      xApiSecret: string;
      xAccessToken: string;
      xAccessTokenSecret: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.setXApiKeys(
        keys.xApiKey,
        keys.xApiSecret,
        keys.xAccessToken,
        keys.xAccessTokenSecret,
      );
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      toast.success("X API keys saved. Nduna is ready to post!");
      qc.invalidateQueries({ queryKey: X_CONFIG_KEY });
      qc.invalidateQueries({ queryKey: X_STATUS_KEY });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save keys."),
  });
}
