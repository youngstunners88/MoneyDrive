/**
 * useForum.ts — Data layer for eTavern community forum.
 * Wraps backend forum methods with React Query.
 * The Backend class in backend.ts already normalises all Candid types —
 * ForumChannel is already a string enum, bigints are bigints, Options are
 * optional fields. We just need to convert bigints to numbers and handle
 * missing optional fields.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ForumChannel as BackendForumChannel,
  ForumPage as BackendForumPage,
  ForumPost as BackendForumPost,
} from "../backend";
import { useActor } from "../shared/hooks/useActor";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ForumChannel = "whatILove" | "whatNeedsWork" | "featureRequests";

export interface ForumPost {
  id: string;
  channel: ForumChannel;
  authorId: string;
  isAnonymous: boolean;
  displayName: string;
  tier: number;
  text: string;
  voiceNoteKey: string | null;
  timestamp: number; // ms
  replyCount: number;
  likeCount: number;
  flagCount: number;
  parentId: string | null;
  deleted: boolean;
}

export interface ForumPage {
  posts: ForumPost[];
  total: number;
  nextOffset: number | null;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const forumKeys = {
  all: ["forum"] as const,
  posts: (channel: ForumChannel) => ["forum", "posts", channel] as const,
  post: (id: string) => ["forum", "post", id] as const,
  replies: (parentId: string) => ["forum", "replies", parentId] as const,
  liked: (postId: string) => ["forum", "liked", postId] as const,
};

// ─── Normalise backend ForumPost → frontend ForumPost ────────────────────────
// The Backend class already handles Candid variant decoding.
// ForumChannel is a string enum matching our ForumChannel type.
// voiceNoteKey and parentId are optional string fields (undefined = absent).
// likeCount/replyCount/flagCount/timestamp are bigint from Candid.

function normalisePost(p: BackendForumPost): ForumPost {
  return {
    id: p.id,
    channel: p.channel as unknown as ForumChannel,
    authorId: typeof p.authorId === "string" ? p.authorId : String(p.authorId),
    isAnonymous: p.isAnonymous,
    displayName: p.isAnonymous ? "Anonymous" : "Driver",
    tier: 1,
    text: p.text,
    voiceNoteKey: p.voiceNoteKey ?? null,
    timestamp: Number(p.timestamp),
    replyCount: Number(p.replyCount),
    likeCount: Number(p.likeCount),
    flagCount: Number(p.flagCount),
    parentId: p.parentId ?? null,
    deleted: p.deleted,
  };
}

function normalisePage(p: BackendForumPage): ForumPage {
  return {
    posts: (p.posts ?? []).map(normalisePost),
    total: Number(p.total),
    nextOffset: p.nextOffset != null ? Number(p.nextOffset) : null,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useForumPosts(channel: ForumChannel, offset = 0) {
  const { actor, isFetching } = useActor();
  return useQuery<ForumPage>({
    queryKey: [...forumKeys.posts(channel), offset],
    queryFn: async () => {
      if (!actor?.getForumPosts)
        return { posts: [], total: 0, nextOffset: null };
      try {
        const res = await actor.getForumPosts(
          channel as unknown as BackendForumChannel,
          BigInt(offset),
          BigInt(25),
        );
        return normalisePage(res);
      } catch {
        return { posts: [], total: 0, nextOffset: null };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useForumPost(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<ForumPost | null>({
    queryKey: forumKeys.post(id),
    queryFn: async () => {
      if (!actor?.getForumPost) return null;
      try {
        const res = await actor.getForumPost(id);
        return res ? normalisePost(res) : null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useForumReplies(parentId: string, offset = 0) {
  const { actor, isFetching } = useActor();
  return useQuery<ForumPage>({
    queryKey: [...forumKeys.replies(parentId), offset],
    queryFn: async () => {
      if (!actor?.getForumReplies)
        return { posts: [], total: 0, nextOffset: null };
      try {
        const res = await actor.getForumReplies(
          parentId,
          BigInt(offset),
          BigInt(25),
        );
        return normalisePage(res);
      } catch {
        return { posts: [], total: 0, nextOffset: null };
      }
    },
    enabled: !!actor && !isFetching && !!parentId,
  });
}

export function useHasLikedPost(postId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: forumKeys.liked(postId),
    queryFn: async () => {
      if (!actor?.hasLikedForumPost) return false;
      try {
        return await actor.hasLikedForumPost(postId);
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching && !!postId,
    staleTime: 60_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<
    ForumPost,
    Error,
    {
      channel: ForumChannel;
      text: string;
      isAnonymous: boolean;
      voiceNoteKey: string | null;
      parentId: string | null;
    }
  >({
    mutationFn: async ({
      channel,
      text,
      isAnonymous,
      voiceNoteKey,
      parentId,
    }) => {
      if (!actor?.createForumPost) throw new Error("Forum not available yet");
      const res = await actor.createForumPost(
        channel as unknown as BackendForumChannel,
        text,
        isAnonymous,
        voiceNoteKey,
        parentId,
      );
      if (res.__kind__ === "err") throw new Error(res.err as string);
      return normalisePost(res.ok);
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({
        queryKey: forumKeys.posts(post.channel),
      });
      if (post.parentId) {
        queryClient.invalidateQueries({
          queryKey: forumKeys.replies(post.parentId),
        });
        queryClient.invalidateQueries({
          queryKey: forumKeys.post(post.parentId),
        });
      }
    },
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<number, Error, { postId: string; channel: ForumChannel }>({
    mutationFn: async ({ postId }) => {
      if (!actor?.likeForumPost) throw new Error("Forum not available");
      const res = await actor.likeForumPost(postId);
      if (res.__kind__ === "err") throw new Error(res.err as string);
      return Number(res.ok);
    },
    onSuccess: (_data, { postId, channel }) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.posts(channel) });
      queryClient.invalidateQueries({ queryKey: forumKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: forumKeys.liked(postId) });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { postId: string; channel: ForumChannel }>({
    mutationFn: async ({ postId }) => {
      if (!actor?.deleteForumPost) throw new Error("Forum not available");
      const res = await actor.deleteForumPost(postId);
      if (res.__kind__ === "err") throw new Error(res.err as string);
    },
    onSuccess: (_data, { channel }) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.posts(channel) });
    },
  });
}

export function useFlagPost() {
  const { actor } = useActor();

  return useMutation<void, Error, { postId: string; reason: string }>({
    mutationFn: async ({ postId, reason }) => {
      if (!actor?.flagForumPost) throw new Error("Forum not available");
      const res = await actor.flagForumPost(postId, reason);
      if (res.__kind__ === "err") throw new Error(res.err as string);
    },
  });
}
