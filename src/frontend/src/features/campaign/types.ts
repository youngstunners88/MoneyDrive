/**
 * campaign/types.ts — Display helpers for the Nduna Campaign Engine.
 * All data types come from backend.d.ts — this file only adds display mappings.
 */

import type {
  CampaignChannel,
  CampaignStatus,
  MessageAngle,
} from "../../backend.d";

// Re-export backend types for convenience
export type {
  AbTestResult,
  Campaign,
  CampaignChannel,
  CampaignConfig,
  CampaignCreative,
  CampaignFailureLog,
  CampaignMetrics,
  CampaignStatus,
  DriverSegment,
  MessageAngle,
  WeeklyReport,
} from "../../backend.d";

// ── Display helpers ────────────────────────────────────────────────────────────

export const ANGLE_LABELS: Record<MessageAngle, string> = {
  earnings_proof: "Earnings Proof",
  feature_benefit: "Feature Benefit",
  referral_incentive: "Referral Incentive",
  limited_time_offer: "Limited Time Offer",
};

export const ANGLE_COLORS: Record<MessageAngle, string> = {
  earnings_proof: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  feature_benefit: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  referral_incentive: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  limited_time_offer: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export const CHANNEL_LABELS: Record<CampaignChannel, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  both: "Both",
};

export const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  pending_approval: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  approved: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  paused: "bg-muted text-muted-foreground border-border",
  completed: "bg-primary/15 text-primary border-primary/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  archived: "bg-muted text-muted-foreground border-border",
};

export function bigintToMs(ns: bigint): number {
  const n = Number(ns);
  return n > 1e12 ? n / 1_000_000 : n;
}

export function formatDate(ns: bigint): string {
  return new Date(bigintToMs(ns)).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
