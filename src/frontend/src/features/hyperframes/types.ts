/**
 * types.ts — TypeScript types for the Hyperframes AI Video Studio feature.
 * mp4Url and errorMsg are optional (nullable in Motoko backend).
 */

export type HyperframesRenderStatus =
  | "pending"
  | "rendering"
  | "ready"
  | "failed";

export interface HyperframesJob {
  id: string;
  driverId: string;
  topic: string;
  compositionHtml: string;
  renderStatus: HyperframesRenderStatus;
  mp4Url?: string;
  errorMsg?: string;
  createdAt: bigint;
}

export interface GenerateSlideshowInput {
  topic: string;
}
