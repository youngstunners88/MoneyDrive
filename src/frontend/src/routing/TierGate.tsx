import type { ReactNode } from "react";
import { TIER_NAMES, TIER_PRICES } from "../lib/tiers";
import { useAppStore } from "../stores/appStore";

interface TierGateProps {
  feature: string;
  requiredTier: number;
  tier: number;
  isAdmin: boolean;
  onSettings: () => void;
  children: ReactNode;
}

/**
 * TierGate — renders children if tier/admin access is sufficient,
 * otherwise shows an upgrade prompt.
 * When pilotMode is active, the upgrade copy is replaced with the pilot offer.
 */
export function TierGate({
  feature,
  requiredTier,
  tier,
  isAdmin,
  onSettings,
  children,
}: TierGateProps) {
  const { pilotMode } = useAppStore();

  if (isAdmin || tier >= requiredTier) {
    return <>{children}</>;
  }

  const tierName = `${TIER_NAMES[requiredTier]} (${TIER_PRICES[requiredTier]})`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-card rounded-2xl shadow-card p-10 max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg
            aria-label="Locked"
            role="img"
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          {feature} Locked
        </h2>
        {pilotMode ? (
          <p className="text-muted-foreground mb-6">
            Free 90-day pilot — no card required. We'll ask for feedback in
            exchange.
          </p>
        ) : (
          <p className="text-muted-foreground mb-6">
            Upgrade to {tierName} to unlock {feature}.
          </p>
        )}
        <button
          type="button"
          onClick={onSettings}
          className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
          data-ocid="tier_gate.settings.button"
        >
          {pilotMode ? "Join Free Pilot" : "View Plans & Upgrade"}
        </button>
      </div>
    </div>
  );
}
