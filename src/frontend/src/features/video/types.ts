/**
 * types.ts — Video automation feature TypeScript types.
 * Mirrors Motoko backend types for video uploads, clips, posts, and analytics.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UploadStatus = "pending" | "processing" | "ready" | "failed";

export type ClipStatus =
  | "pending"
  | "captioning"
  | "branding"
  | "ready"
  | "failed";

export type PostStatus = "scheduled" | "posted" | "failed";

export type SocialPlatform = "tiktok" | "instagram" | "youtube" | "linkedin";

// ─── Core video types ─────────────────────────────────────────────────────────

export interface VideoUpload {
  id: string;
  driverId: string;
  storageRef: string;
  fileName: string;
  fileSizeBytes: bigint;
  contentType: string;
  processingStatus: UploadStatus;
  uploadedAt: bigint;
  errorMsg?: string;
}

export interface VideoClip {
  id: string;
  uploadId: string;
  driverId: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  storageRef: string;
  brandedStorageRef?: string;
  captionsVttRef?: string;
  title?: string;
  processingStatus: ClipStatus;
  errorMsg?: string;
}

export interface VideoPost {
  id: string;
  clipId: string;
  driverId: string;
  platform: SocialPlatform;
  status: PostStatus;
  platformPostId?: string;
  scheduledAt?: bigint;
  postedAt?: bigint;
  errorMsg?: string;
}

export interface VideoAnalytics {
  postId: string;
  platform: SocialPlatform;
  views: bigint;
  likes: bigint;
  comments: bigint;
  shares: bigint;
  engagementRate: number;
  fetchedAt: bigint;
}

export interface VideoJobStatus {
  uploadId: string;
  clipsGenerated: bigint;
  clipsReady: bigint;
  clipsFailed: bigint;
  postsScheduled: bigint;
  postsPosted: bigint;
  lastUpdatedAt: bigint;
}

// ─── Config types ─────────────────────────────────────────────────────────────

export interface BrandingConfig {
  driverName: string;
  accentColor: string;
  callToAction: string;
  musicPreference: string;
  showMoneyDriveLogo: boolean;
}

export interface PostingSchedule {
  driverId: string;
  enabled: boolean;
  postsPerWeek: bigint;
  preferredDays: bigint[];
  preferredHourUtc: bigint;
  platformsEnabled: SocialPlatform[];
}

// ─── Input types for mutations ────────────────────────────────────────────────

export interface CreateVideoUploadInput {
  file: File;
  onProgress?: (pct: number) => void;
}

export interface CreateVideoPostInput {
  clipId: string;
  platform: SocialPlatform;
  scheduledAt?: bigint;
}
