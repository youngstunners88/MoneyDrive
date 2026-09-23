/**
 * OpportunitiesPage.tsx — Nduna's autonomous opportunity hunter results.
 * Tier 3 only. Shows new income streams, platforms, routes Nduna found by browsing.
 */

import {
  AlertCircle,
  ArrowDownUp,
  Cloud,
  RefreshCw,
  Scan,
  Server,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import type {
  FilterCategory,
  SortMode,
} from "../features/opportunities/OpportunityList";
import { OpportunityList } from "../features/opportunities/OpportunityList";
import {
  useIsBrowserbaseConfigured,
  useOpportunities,
  useTriggerBrowserbaseHunt,
} from "../features/opportunities/useOpportunities";
import type { OpportunityFinding } from "../types/opportunities";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  profile?: UserProfile | null;
  tier: number;
  isAdmin?: boolean;
  onNavigateToAI?: (query: string) => void;
  onSettings?: () => void;
}

// ─── Filter config ─────────────────────────────────────────────────────────────

const FILTERS: { value: FilterCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "newPlatform", label: "Platforms" },
  { value: "intercityRoute", label: "Routes" },
  { value: "platformPromotion", label: "Promos" },
  { value: "incomeCategory", label: "Income" },
  { value: "businessLead", label: "Businesses" },
  { value: "regulatoryChange", label: "Policy" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(timestampMs: number): string {
  if (!timestampMs) return "Never";
  const diff = Date.now() - timestampMs;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Status bar ────────────────────────────────────────────────────────────────

interface StatusBarProps {
  lastRun: bigint;
  isConfigured: boolean;
  isBrowserbaseConfigured: boolean;
  isTriggerPending: boolean;
  isCloudHuntPending: boolean;
  isAdmin: boolean;
  onTrigger: () => void;
  onCloudHunt: () => void;
}

function StatusBar({
  lastRun,
  isConfigured,
  isBrowserbaseConfigured,
  isTriggerPending,
  isCloudHuntPending,
  isAdmin,
  onTrigger,
  onCloudHunt,
}: StatusBarProps) {
  const lastRunMs = Number(lastRun);
  const nextRunLabel = lastRunMs
    ? (() => {
        const next = lastRunMs + 7 * 86_400_000;
        const diffDays = Math.ceil((next - Date.now()) / 86_400_000);
        return diffDays <= 0
          ? "Overdue"
          : `In ${diffDays} day${diffDays !== 1 ? "s" : ""}`;
      })()
    : "Not yet scheduled";

  return (
    <div
      className="rounded-xl border bg-card px-4 py-3 shadow-card space-y-3"
      data-ocid="opportunity.status_bar"
    >
      {/* Status lines */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {/* VPS status */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${isConfigured ? "bg-[oklch(0.55_0.14_145)] animate-pulse" : "bg-muted-foreground/40"}`}
            aria-hidden="true"
          />
          <span className="font-medium">
            VPS Hunter:{" "}
            {lastRunMs > 0 ? formatRelativeTime(lastRunMs) : "not yet run"}
          </span>
        </div>
        {/* Browserbase status */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${isBrowserbaseConfigured ? "bg-blue-400 animate-pulse" : "bg-muted-foreground/40"}`}
            aria-hidden="true"
          />
          <span className="font-medium">
            Browserbase: {isBrowserbaseConfigured ? "ready" : "not configured"}
          </span>
        </div>
        <span className="ml-auto text-[11px]">
          Next:{" "}
          <span className="text-foreground font-medium">{nextRunLabel}</span>
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-primary/30 text-primary hover:bg-primary/10 gap-1.5 text-xs h-8"
          onClick={onTrigger}
          disabled={!isConfigured || isTriggerPending}
          title={
            !isConfigured
              ? "VPS must be configured in Settings to run a manual scan"
              : undefined
          }
          data-ocid="opportunity.manual_scan_button"
        >
          <Scan
            className={`w-3.5 h-3.5 ${isTriggerPending ? "animate-spin" : ""}`}
          />
          {isTriggerPending ? "Scanning..." : "Manual Scan"}
        </Button>

        {isAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-1.5 text-xs h-8"
            onClick={onCloudHunt}
            disabled={!isBrowserbaseConfigured || isCloudHuntPending}
            title={
              !isBrowserbaseConfigured
                ? "Configure Browserbase in Settings to enable cloud hunting"
                : undefined
            }
            data-ocid="opportunity.cloud_hunt_button"
          >
            <Cloud
              className={`w-3.5 h-3.5 ${isCloudHuntPending ? "animate-pulse" : ""}`}
            />
            {isCloudHuntPending
              ? "Nduna is browsing the web via Browserbase..."
              : "Cloud Hunt"}
          </Button>
        )}

        {isAdmin && !isBrowserbaseConfigured && (
          <p className="text-[11px] text-muted-foreground self-center">
            Configure Browserbase in Settings to enable cloud hunting
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Tier gate ─────────────────────────────────────────────────────────────────

function TierUpgradePrompt({ onSettings }: { onSettings?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
      data-ocid="opportunity.tier_gate"
    >
      <div className="bg-card rounded-2xl shadow-card p-10 max-w-md w-full border border-primary/20">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
          <img
            src="https://i.imgur.com/u98U7S6.png"
            alt="Nduna"
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          Opportunity Intel
        </h2>
        <p className="text-muted-foreground mb-1 text-sm">
          Nduna's autonomous market scanner is a{" "}
          <span className="text-primary font-semibold">Tier 3 feature</span>.
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          Upgrade to{" "}
          <strong className="text-foreground">Pro Elite (R800/month)</strong>{" "}
          and Nduna will scan the market every week to surface income
          opportunities you'd otherwise miss.
        </p>
        {onSettings && (
          <Button
            onClick={onSettings}
            className="w-full"
            data-ocid="opportunity.upgrade_button"
          >
            View Plans &amp; Upgrade
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Empty states ──────────────────────────────────────────────────────────────

function EmptyNoVPS() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-14 text-center"
      data-ocid="opportunity.empty_state"
    >
      <div className="w-14 h-14 rounded-2xl bg-muted/30 border border-border flex items-center justify-center">
        <Server className="w-7 h-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-display font-bold text-foreground mb-1">
          VPS Not Configured
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Nduna's weekly scan requires a VPS to be configured — ask your admin
          to set it up in Settings. Alternatively, use Cloud Hunt to scan via
          Browserbase.
        </p>
      </div>
    </div>
  );
}

function EmptyNoFindings() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-14 text-center"
      data-ocid="opportunity.empty_state"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <TrendingUp className="w-7 h-7 text-primary" />
      </div>
      <div>
        <p className="font-display font-bold text-foreground mb-1">
          No opportunities found yet
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          The first scan runs weekly — check back soon. You can also trigger a
          manual scan or Cloud Hunt above.
        </p>
      </div>
    </div>
  );
}

function EmptyFiltered({ filter }: { filter: FilterCategory }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-10 text-center"
      data-ocid="opportunity.empty_state"
    >
      <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">
        No <span className="text-foreground font-medium">{filter}</span>{" "}
        opportunities right now.
      </p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function OpportunitiesPage({
  profile: _profile,
  tier,
  isAdmin = false,
  onNavigateToAI,
  onSettings,
}: Props) {
  const effectiveTier = isAdmin ? 3 : tier;

  const [filter, setFilter] = useState<FilterCategory>("all");
  const [sort, setSort] = useState<SortMode>("relevance");
  const [dismissingId, setDismissingId] = useState<string | undefined>();

  const {
    findings,
    isLoading,
    hunterStatus,
    dismissOpportunity,
    triggerHunt,
    isHunting,
  } = useOpportunities(50);

  const { data: isBrowserbaseConfigured = false } =
    useIsBrowserbaseConfigured();
  const triggerBrowserbaseHunt = useTriggerBrowserbaseHunt();

  if (effectiveTier < 3) {
    return <TierUpgradePrompt onSettings={onSettings} />;
  }

  const isConfigured = hunterStatus?.configured ?? false;
  const lastRun = hunterStatus?.lastRun ?? BigInt(0);

  const handleTrigger = async () => {
    try {
      const msg = await triggerHunt("driver");
      toast.success(
        msg || "Opportunity scan started — check back in a moment.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      toast.error(message);
    }
  };

  const handleCloudHunt = async () => {
    try {
      const msg = await triggerBrowserbaseHunt.mutateAsync("driver");
      toast.success(
        msg || "Browserbase cloud hunt started — Nduna is browsing now.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cloud hunt failed";
      toast.error(message);
    }
  };

  const handleDismiss = async (id: string) => {
    setDismissingId(id);
    try {
      await dismissOpportunity(id);
      toast.success("Opportunity dismissed");
    } catch {
      toast.error("Failed to dismiss");
    } finally {
      setDismissingId(undefined);
    }
  };

  const handleAskNduna = (finding: OpportunityFinding) => {
    const query = `Tell me more about this opportunity: "${finding.title}". ${finding.description}`;
    if (onNavigateToAI) {
      onNavigateToAI(query);
    } else {
      toast.info("Open Nduna from the navigation to explore this opportunity.");
    }
  };

  const activeFindings = findings.filter((f) => !f.dismissed);
  const filteredCount =
    filter === "all"
      ? activeFindings.length
      : activeFindings.filter((f) => f.category === filter).length;

  const showEmptyNoVPS =
    !isLoading &&
    !isConfigured &&
    !isBrowserbaseConfigured &&
    activeFindings.length === 0;
  const showEmptyNoFindings =
    !isLoading &&
    (isConfigured || isBrowserbaseConfigured) &&
    activeFindings.length === 0;
  const showEmptyFiltered =
    !isLoading &&
    filter !== "all" &&
    activeFindings.length > 0 &&
    filteredCount === 0;

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-6 space-y-5"
      data-ocid="opportunity.page"
    >
      {/* Page header */}
      <div className="flex items-start gap-3">
        <img
          src="https://i.imgur.com/u98U7S6.png"
          alt="Nduna"
          className="w-10 h-10 rounded-full object-cover border border-primary/30 flex-shrink-0 mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display font-bold text-2xl text-foreground leading-tight">
            Opportunity Intel
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Nduna scans the market every week to find what you might be missing
          </p>
        </div>
        {!isLoading && activeFindings.length > 0 && (
          <Badge
            variant="secondary"
            className="flex-shrink-0 bg-primary/10 text-primary border-primary/30 font-bold"
          >
            {activeFindings.length}
          </Badge>
        )}
      </div>

      {/* Status bar */}
      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : (
        <StatusBar
          lastRun={lastRun}
          isConfigured={isConfigured}
          isBrowserbaseConfigured={isBrowserbaseConfigured}
          isTriggerPending={isHunting}
          isCloudHuntPending={triggerBrowserbaseHunt.isPending}
          isAdmin={isAdmin}
          onTrigger={handleTrigger}
          onCloudHunt={handleCloudHunt}
        />
      )}

      {/* Filter + sort row */}
      <div className="flex items-center gap-2" data-ocid="opportunity.filters">
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const count =
              f.value === "all"
                ? activeFindings.length
                : activeFindings.filter((x) => x.category === f.value).length;
            const isActive = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
                aria-pressed={isActive}
                data-ocid={`opportunity.filter.${f.value}`}
              >
                {f.label}
                {count > 0 && (
                  <span
                    className={`text-[10px] font-bold tabular-nums ${isActive ? "opacity-80" : "opacity-60"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() =>
            setSort((s) => (s === "relevance" ? "recent" : "relevance"))
          }
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
          data-ocid="opportunity.sort_toggle"
          title={`Sort by: ${sort === "relevance" ? "Relevance" : "Most Recent"}`}
        >
          <ArrowDownUp className="w-3 h-3" />
          {sort === "relevance" ? "Relevance" : "Recent"}
        </button>
      </div>

      {/* Content */}
      {showEmptyNoVPS && <EmptyNoVPS />}
      {showEmptyNoFindings && <EmptyNoFindings />}
      {showEmptyFiltered && <EmptyFiltered filter={filter} />}

      {!showEmptyNoVPS && !showEmptyNoFindings && (
        <OpportunityList
          findings={findings}
          isLoading={isLoading}
          filter={filter}
          sort={sort}
          onDismiss={handleDismiss}
          onAskNduna={handleAskNduna}
          dismissingId={dismissingId}
        />
      )}

      {/* Info footer */}
      {!isLoading && activeFindings.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pb-2">
          <RefreshCw className="w-3 h-3 inline mr-1 opacity-60" />
          Findings are ranked by relevance to your driving patterns. Dismissed
          findings are hidden, not deleted.
        </p>
      )}
    </div>
  );
}
