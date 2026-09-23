export const TIER_NAMES: Record<number, string> = {
  1: "Hustler",
  2: "Pro Driver",
  3: "Elite Driver",
};

export const TIER_PRICES: Record<number, string> = {
  1: "R350/mo",
  2: "R530/mo",
  3: "R800/mo",
};

export const TIER_TRIAL: Record<number, string | null> = {
  1: "14-day free trial",
  2: null,
  3: null,
};

/**
 * Returns the display price for a tier, respecting pilot mode.
 * Tier 1 and 2 are R0.00/mo when pilot mode is active.
 * Tier 3 is always R800/mo regardless of pilot mode.
 */
export function getTierPrice(tier: number, pilotMode: boolean): string {
  if (pilotMode && tier === 1) return "R0.00/mo";
  if (pilotMode && tier === 2) return "R0.00/mo";
  return TIER_PRICES[tier] ?? "R0.00/mo";
}

/**
 * Returns the SnapScan payment amount in ZAR cents.
 * Tier 1 and 2 are 0 cents when pilot mode is active.
 * Tier 3 is always 80000 cents (R800) regardless of pilot mode.
 */
export function getTierAmountCents(tier: number, pilotMode: boolean): number {
  if (tier === 3) return 80000;
  if (pilotMode) return 0;
  if (tier === 1) return 35000;
  if (tier === 2) return 53000;
  return 0;
}

export function canAccess(
  feature:
    | "inCarSales"
    | "schedule"
    | "qrMenu"
    | "aiVoice"
    | "aiInsights"
    | "openClaw",
  tier: number,
  isAdmin = false,
): boolean {
  if (isAdmin) return true;
  const gates: Record<string, number> = {
    inCarSales: 2,
    schedule: 2,
    qrMenu: 2,
    aiVoice: 2,
    aiInsights: 3,
    openClaw: 3,
  };
  return tier >= (gates[feature] ?? 1);
}
