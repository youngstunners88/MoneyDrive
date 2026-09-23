/**
 * shorts-types.ts — TypeScript types for the "Clip to Short" feature.
 * Maps to backend ShortsJob / ShortsStatus candid types.
 */

export type ShortsStatus =
  | "pending"
  | "transcribing"
  | "selecting"
  | "rendering"
  | "ready"
  | "failed";

export interface ShortsJob {
  id: string;
  driverId: string;
  sourceUrl: string;
  sourceType: "youtube" | "upload";
  clipStatus: ShortsStatus;
  outputMp4Url?: string;
  selectedSegmentStart?: bigint;
  selectedSegmentEnd?: bigint;
  errorMsg?: string;
  createdAt: bigint;
}
