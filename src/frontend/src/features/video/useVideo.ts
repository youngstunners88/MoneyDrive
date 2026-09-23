/**
 * useVideo.ts — React Query hooks for the video automation feature.
 * Wraps all backend video APIs: uploads, clips, posts, analytics, config.
 *
 * Upload flow:
 *   1. Read file bytes → create ExternalBlob
 *   2. actor._uploadFile uploads to object-storage, returns Uint8Array ref
 *   3. Decode ref to get storageRef URL string
 *   4. Call actor.createVideoUpload(storageRef, ...) to register in canister
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import { useActor } from "../../hooks/useActor";
import type {
  BrandingConfig,
  ClipStatus,
  CreateVideoPostInput,
  CreateVideoUploadInput,
  PostStatus,
  PostingSchedule,
  SocialPlatform,
  UploadStatus,
  VideoAnalytics,
  VideoClip,
  VideoJobStatus,
  VideoPost,
  VideoUpload,
} from "./types";

// ─── Query key factory ────────────────────────────────────────────────────────

export const videoKeys = {
  uploads: () => ["video-uploads"] as const,
  upload: (id: string) => ["video-upload", id] as const,
  clips: (uploadId: string) => ["video-clips", uploadId] as const,
  clip: (clipId: string) => ["video-clip", clipId] as const,
  posts: (clipId: string) => ["video-posts", clipId] as const,
  analytics: (postId: string) => ["video-analytics", postId] as const,
  jobStatus: (uploadId: string) => ["video-job-status", uploadId] as const,
  isConfigured: () => ["video-uploadpost-configured"] as const,
  brandingConfig: () => ["video-branding-config"] as const,
  postingSchedule: () => ["video-posting-schedule"] as const,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toUploadStatus(raw: string): UploadStatus {
  return raw as UploadStatus;
}

function toClipStatus(raw: string): ClipStatus {
  return raw as ClipStatus;
}

function toPostStatus(raw: string): PostStatus {
  return raw as PostStatus;
}

function toSocialPlatform(raw: string): SocialPlatform {
  return raw as SocialPlatform;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all video uploads for the caller. */
export function useVideoUploads() {
  const { actor, isFetching } = useActor();
  return useQuery<VideoUpload[]>({
    queryKey: videoKeys.uploads(),
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getVideoUploads();
      return result.map((u) => ({
        ...u,
        processingStatus: toUploadStatus(u.processingStatus as string),
      })) as VideoUpload[];
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch a single video upload by ID. */
export function useVideoUpload(uploadId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoUpload | null>({
    queryKey: videoKeys.upload(uploadId),
    queryFn: async () => {
      if (!actor || !uploadId) return null;
      const result = await actor.getVideoUpload(uploadId);
      if (!result) return null;
      return {
        ...result,
        processingStatus: toUploadStatus(result.processingStatus as string),
      } as VideoUpload;
    },
    enabled: !!actor && !isFetching && !!uploadId,
  });
}

/** Fetch all clips for a given upload. */
export function useVideoClips(uploadId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoClip[]>({
    queryKey: videoKeys.clips(uploadId),
    queryFn: async () => {
      if (!actor || !uploadId) return [];
      const result = await actor.getVideoClips(uploadId);
      return result.map((c) => ({
        ...c,
        processingStatus: toClipStatus(c.processingStatus as string),
      })) as VideoClip[];
    },
    enabled: !!actor && !isFetching && !!uploadId,
  });
}

/** Fetch all posts for a given clip. */
export function useVideoPosts(clipId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoPost[]>({
    queryKey: videoKeys.posts(clipId),
    queryFn: async () => {
      if (!actor || !clipId) return [];
      const result = await actor.getVideoPosts(clipId);
      return result.map((p) => ({
        ...p,
        status: toPostStatus(p.status as string),
        platform: toSocialPlatform(p.platform as string),
      })) as VideoPost[];
    },
    enabled: !!actor && !isFetching && !!clipId,
  });
}

/** Fetch analytics for a given post. */
export function useVideoAnalytics(postId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoAnalytics[]>({
    queryKey: videoKeys.analytics(postId),
    queryFn: async () => {
      if (!actor || !postId) return [];
      const result = await actor.getVideoAnalytics(postId);
      return result.map((a) => ({
        ...a,
        platform: toSocialPlatform(a.platform as string),
      })) as VideoAnalytics[];
    },
    enabled: !!actor && !isFetching && !!postId,
    staleTime: 5 * 60_000,
  });
}

/**
 * Poll job status every 5s while processing is active.
 * Stops polling once all clips reach a terminal state.
 */
export function useVideoJobStatus(uploadId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoJobStatus | null>({
    queryKey: videoKeys.jobStatus(uploadId),
    queryFn: async () => {
      if (!actor || !uploadId) return null;
      return actor.getVideoJobStatus(
        uploadId,
      ) as Promise<VideoJobStatus | null>;
    },
    enabled: !!actor && !isFetching && !!uploadId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5_000;
      // Stop polling when all generated clips are settled (ready + failed)
      const total = Number(data.clipsGenerated);
      const settled = Number(data.clipsReady) + Number(data.clipsFailed);
      if (total > 0 && settled >= total) return false;
      return 5_000;
    },
  });
}

/** Check whether Upload-Post API is configured (admin-set). */
export function useIsUploadPostConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: videoKeys.isConfigured(),
    queryFn: async () => {
      if (!actor) return false;
      return actor.isUploadPostConfigured();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60_000,
  });
}

/** Fetch the driver's video branding config. */
export function useBrandingConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<BrandingConfig | null>({
    queryKey: videoKeys.brandingConfig(),
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVideoBrandingConfig() as Promise<BrandingConfig | null>;
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch the driver's video posting schedule. */
export function usePostingSchedule() {
  const { actor, isFetching } = useActor();
  return useQuery<PostingSchedule | null>({
    queryKey: videoKeys.postingSchedule(),
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getPostingSchedule();
      if (!result) return null;
      return {
        ...result,
        platformsEnabled: result.platformsEnabled.map((p) =>
          toSocialPlatform(p as string),
        ),
      } as PostingSchedule;
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Upload a video file via object-storage, then register in the canister.
 * Flow: File → ExternalBlob → actor._uploadFile → storageRef → createVideoUpload
 */
export function useCreateVideoUpload() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<string, Error, CreateVideoUploadInput>({
    mutationFn: async ({ file, onProgress }) => {
      if (!actor) throw new Error("Actor not available");

      // Read file bytes
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Create ExternalBlob — the backend's _uploadFile will handle object-storage
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }

      // Upload to object-storage and receive a storage reference (URL bytes)
      const refBytes = await (
        actor as unknown as {
          _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>;
        }
      )._uploadFile(blob);

      // Decode the storage ref bytes to a URL string
      const storageRef = new TextDecoder().decode(refBytes);

      // Register the upload in the canister
      const result = await actor.createVideoUpload(
        storageRef,
        file.name,
        BigInt(file.size),
        file.type || "video/mp4",
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.uploads() });
      toast.success("Video uploaded — Nduna is processing your clips");
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });
}

/** Trigger video processing for an uploaded video. */
export function useTriggerVideoProcessing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: async (uploadId) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.triggerVideoProcessing(uploadId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_msg, uploadId) => {
      queryClient.invalidateQueries({
        queryKey: videoKeys.jobStatus(uploadId),
      });
      queryClient.invalidateQueries({ queryKey: videoKeys.clips(uploadId) });
      toast.success("Processing started — check back in a few minutes");
    },
    onError: (err) => {
      toast.error(`Processing failed: ${err.message}`);
    },
  });
}

/** Create a video post (schedule or post now) for a clip. */
export function useCreateVideoPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<string, Error, CreateVideoPostInput>({
    mutationFn: async ({ clipId, platform, scheduledAt }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.createVideoPost(
        clipId,
        platform as import("../../backend.d.ts").SocialPlatform,
        scheduledAt ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_id, { clipId }) => {
      queryClient.invalidateQueries({ queryKey: videoKeys.posts(clipId) });
      toast.success("Clip queued for posting");
    },
    onError: (err) => {
      toast.error(`Failed to post clip: ${err.message}`);
    },
  });
}

/** Save the driver's video branding config. */
export function useSaveVideoBrandingConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, BrandingConfig>({
    mutationFn: async (config) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveVideoBrandingConfig(
        config as import("../../backend.d.ts").BrandingConfig,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.brandingConfig() });
      toast.success("Branding config saved");
    },
    onError: (err) => {
      toast.error(`Failed to save branding: ${err.message}`);
    },
  });
}

/** Save the driver's posting schedule. */
export function useSavePostingSchedule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, PostingSchedule>({
    mutationFn: async (schedule) => {
      if (!actor) throw new Error("Actor not available");
      await actor.savePostingSchedule(
        schedule as import("../../backend.d.ts").PostingSchedule,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.postingSchedule() });
      toast.success("Posting schedule saved");
    },
    onError: (err) => {
      toast.error(`Failed to save schedule: ${err.message}`);
    },
  });
}

/** Fetch and store fresh analytics from social platforms (triggers backend job). */
export function useFetchAndStoreAnalytics() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.fetchAndStoreAnalytics();
    },
    onSuccess: () => {
      // Invalidate all analytics queries
      queryClient.invalidateQueries({ queryKey: ["video-analytics"] });
      toast.success("Analytics refreshed");
    },
    onError: (err) => {
      toast.error(`Analytics refresh failed: ${err.message}`);
    },
  });
}
