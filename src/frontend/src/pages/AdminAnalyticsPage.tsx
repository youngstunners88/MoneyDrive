/**
 * AdminAnalyticsPage.tsx — Admin-only analytics dashboard.
 * Shows event summary, error log, recent activity feed, CSV export, AI Gateway panel, and Growth Strategy.
 * Route: /admin/analytics (tab: "admin-analytics")
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  ChevronDown,
  ChevronUp,
  Download,
  RadioTower,
  Rocket,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { GatewayAdminPanel } from "../features/gateway";
import { useActor } from "../hooks/useActor";

// ── Types (backend returns these — gracefully handled if methods missing) ─────

interface AnalyticsSummary {
  totalEvents: bigint;
  errorCount: bigint;
  ndunaQueryCount: bigint;
  avgNdunaDurationMs?: bigint;
  topActions: Array<[string, bigint]>;
}

interface AnalyticsEventRow {
  category: string;
  action: string;
  driverId: string;
  timestamp: bigint;
  success: boolean;
  errorMessage?: string;
  durationMs?: bigint;
}

// ── Category badge colors ─────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  user_action: "bg-primary/15 text-primary border-primary/30",
  nduna_query: "bg-gold/15 text-gold border-gold/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
  deal_event: "bg-green-500/15 text-green-400 border-green-500/30",
  lead_event: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  video_event: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  performance: "bg-muted text-muted-foreground border-border",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function tsToDate(ns: bigint): string {
  const ms = Number(ns) > 1e12 ? Number(ns) / 1_000_000 : Number(ns);
  return new Date(ms).toLocaleString("en-ZA", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCsv(events: AnalyticsEventRow[]): void {
  const header =
    "category,action,driverId,timestamp,success,durationMs,errorMessage";
  const rows = events.map((e) => {
    const ts =
      Number(e.timestamp) > 1e12
        ? Number(e.timestamp) / 1_000_000
        : Number(e.timestamp);
    return [
      e.category,
      e.action,
      e.driverId,
      new Date(ts).toISOString(),
      String(e.success),
      e.durationMs !== undefined ? String(Number(e.durationMs)) : "0",
      `"${(e.errorMessage ?? "").replace(/"/g, "'")}"`,
    ].join(",");
  });
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `moneydrive-analytics-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-start gap-3 shadow-card">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="font-display font-bold text-xl text-foreground leading-tight">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface AdminAnalyticsPageProps {
  isAdmin: boolean;
  onTabChange?: (tab: string) => void;
}

export default function AdminAnalyticsPage({
  isAdmin,
  onTabChange,
}: AdminAnalyticsPageProps) {
  const { actor } = useActor();
  const [activeTab, setActiveTab] = useState<"summary" | "gateway" | "growth">(
    "summary",
  );

  const { data: summary, isLoading: summaryLoading } =
    useQuery<AnalyticsSummary | null>({
      queryKey: ["analyticsSummary"],
      queryFn: async () => {
        if (!actor) return null;
        try {
          return (
            (await (
              actor as unknown as {
                getAnalyticsSummary: () => Promise<AnalyticsSummary>;
              }
            ).getAnalyticsSummary()) ?? null
          );
        } catch {
          return null;
        }
      },
      enabled: !!actor && isAdmin,
      staleTime: 30_000,
      refetchInterval: 60_000,
    });

  const { data: recentEvents = [], isLoading: eventsLoading } = useQuery<
    AnalyticsEventRow[]
  >({
    queryKey: ["recentAnalyticsEvents"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return (
          (await (
            actor as unknown as {
              getRecentAnalyticsEvents: (
                n: bigint,
              ) => Promise<AnalyticsEventRow[]>;
            }
          ).getRecentAnalyticsEvents(BigInt(50))) ?? []
        );
      } catch {
        return [];
      }
    },
    enabled: !!actor && isAdmin,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: errorLog = [], isLoading: errorsLoading } = useQuery<
    AnalyticsEventRow[]
  >({
    queryKey: ["analyticsErrorLog"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return (
          (await (
            actor as unknown as {
              getErrorLog: (n: bigint) => Promise<AnalyticsEventRow[]>;
            }
          ).getErrorLog(BigInt(20))) ?? []
        );
      } catch {
        return [];
      }
    },
    enabled: !!actor && isAdmin,
    staleTime: 30_000,
  });

  // Category distribution for the bar chart
  const categoryCount = recentEvents.reduce<Record<string, number>>(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const totalEvents = recentEvents.length || 1;

  if (!isAdmin) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-16 text-center"
        data-ocid="admin_analytics.error_state"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-2">
          Access Denied
        </h2>
        <p className="text-muted-foreground text-sm">
          This dashboard is only accessible to MoneyDrive administrators.
        </p>
      </div>
    );
  }

  return (
    <div
      className="max-w-4xl mx-auto px-4 py-6 space-y-6"
      data-ocid="admin_analytics.page"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Analytics Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">
              Admin — real-time event monitoring
            </p>
          </div>
        </div>
        {activeTab === "summary" && (
          <Button
            size="sm"
            variant="outline"
            className="gap-2 text-xs"
            onClick={() => exportCsv(recentEvents)}
            disabled={recentEvents.length === 0}
            data-ocid="admin_analytics.export_button"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border"
        role="tablist"
        data-ocid="admin_analytics.tabs"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "summary"}
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 justify-center ${
            activeTab === "summary"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-ocid="admin_analytics.tab.summary"
        >
          <Activity className="w-3.5 h-3.5" />
          Summary
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "gateway"}
          onClick={() => setActiveTab("gateway")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 justify-center ${
            activeTab === "gateway"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-ocid="admin_analytics.tab.gateway"
        >
          <RadioTower className="w-3.5 h-3.5" />
          AI Gateway
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "growth"}
          onClick={() => setActiveTab("growth")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 justify-center ${
            activeTab === "growth"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-ocid="admin_analytics.tab.growth"
        >
          <Rocket className="w-3.5 h-3.5" />
          Growth
        </button>
      </div>

      {/* Tab: Summary */}
      {activeTab === "summary" && (
        <>
          {/* Summary cards */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
            data-ocid="admin_analytics.summary.panel"
          >
            {summaryLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={`summary-sk-${String(i)}`}
                  className="h-24 rounded-2xl"
                />
              ))
            ) : (
              <>
                <SummaryCard
                  icon={<Activity className="w-5 h-5 text-primary" />}
                  label="Events Today"
                  value={summary ? String(summary.totalEvents) : "—"}
                  color="bg-primary/10"
                />
                <SummaryCard
                  icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
                  label="Errors"
                  value={summary ? String(summary.errorCount) : "—"}
                  color="bg-destructive/10"
                />
                <SummaryCard
                  icon={<Bot className="w-5 h-5 text-gold" />}
                  label="Nduna Queries"
                  value={summary ? String(summary.ndunaQueryCount) : "—"}
                  color="bg-gold/10"
                />
                <SummaryCard
                  icon={<Activity className="w-5 h-5 text-green-400" />}
                  label="Avg Nduna Time"
                  value={
                    summary?.avgNdunaDurationMs
                      ? `${Number(summary.avgNdunaDurationMs)}ms`
                      : "—"
                  }
                  color="bg-green-500/10"
                />
              </>
            )}
          </div>

          {/* Category breakdown */}
          <Card
            className="shadow-card"
            data-ocid="admin_analytics.category.panel"
          >
            <CardContent className="p-4">
              <h2 className="font-display font-bold text-sm text-foreground mb-4">
                Event Distribution (last 50 events)
              </h2>
              {eventsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(categoryCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => (
                      <div
                        key={cat}
                        className="flex items-center gap-3"
                        data-ocid={`admin_analytics.category.${cat}`}
                      >
                        <Badge
                          variant="outline"
                          className={`text-[10px] w-28 justify-center shrink-0 ${CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {cat.replace("_", " ")}
                        </Badge>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${(count / totalEvents) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-8 text-right shrink-0">
                          {count}
                        </span>
                      </div>
                    ))}
                  {Object.keys(categoryCount).length === 0 && (
                    <p
                      className="text-xs text-muted-foreground py-4 text-center"
                      data-ocid="admin_analytics.category.empty_state"
                    >
                      No events tracked yet.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error log */}
          <Card
            className="shadow-card"
            data-ocid="admin_analytics.error_log.panel"
          >
            <CardContent className="p-4">
              <h2 className="font-display font-bold text-sm text-foreground mb-4">
                Recent Errors (last 20)
              </h2>
              {errorsLoading ? (
                <div className="space-y-2">
                  {["sk-e1", "sk-e2", "sk-e3"].map((k) => (
                    <Skeleton key={k} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : errorLog.length === 0 ? (
                <div
                  className="py-6 text-center"
                  data-ocid="admin_analytics.error_log.empty_state"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">✓</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    No errors logged
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All systems running clean
                  </p>
                </div>
              ) : (
                <div
                  className="space-y-2"
                  data-ocid="admin_analytics.error_log.list"
                >
                  {errorLog.map((e, idx) => (
                    <div
                      key={`err-${e.action}-${String(e.timestamp)}-${idx}`}
                      className="rounded-xl bg-destructive/5 border border-destructive/20 px-3 py-2.5"
                      data-ocid={`admin_analytics.error_log.item.${idx + 1}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">
                          {e.action}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {tsToDate(e.timestamp)}
                        </span>
                      </div>
                      {e.errorMessage && (
                        <p className="text-[11px] text-destructive leading-snug break-words">
                          {e.errorMessage}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                        {e.driverId}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent activity feed */}
          <Card
            className="shadow-card"
            data-ocid="admin_analytics.activity.panel"
          >
            <CardContent className="p-4">
              <h2 className="font-display font-bold text-sm text-foreground mb-4">
                Recent Activity (last 50 events)
              </h2>
              {eventsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                      key={`act-sk-${String(i)}`}
                      className="h-12 rounded-xl"
                    />
                  ))}
                </div>
              ) : recentEvents.length === 0 ? (
                <div
                  className="py-8 text-center"
                  data-ocid="admin_analytics.activity.empty_state"
                >
                  <p className="text-xs text-muted-foreground">
                    No events recorded yet. Driver activity will appear here
                    automatically.
                  </p>
                </div>
              ) : (
                <div
                  className="divide-y divide-border"
                  data-ocid="admin_analytics.activity.list"
                >
                  {recentEvents.map((e, idx) => (
                    <div
                      key={`evt-${e.action}-${String(e.timestamp)}-${idx}`}
                      className="flex items-center justify-between py-2.5 gap-3"
                      data-ocid={`admin_analytics.activity.item.${idx + 1}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Badge
                          variant="outline"
                          className={`text-[9px] shrink-0 ${CATEGORY_COLORS[e.category] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {e.category.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-foreground font-medium truncate">
                          {e.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!e.success && (
                          <AlertTriangle className="w-3 h-3 text-destructive" />
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {tsToDate(e.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Tab: AI Gateway */}
      {activeTab === "gateway" && <GatewayAdminPanel />}

      {/* Tab: Growth Strategy */}
      {activeTab === "growth" && (
        <GrowthStrategyPanel onTabChange={onTabChange} />
      )}
    </div>
  );
}

// ── Growth Strategy Panel ────────────────────────────────────────────────────

const GTM_PHASES = [
  {
    id: "alpha",
    label: "Alpha",
    driverThreshold: 50,
    color: "bg-primary/10 border-primary/20 text-primary",
    dotColor: "bg-primary",
    actions: [
      "Recruit 50 power drivers via SA driver WhatsApp groups (personal DMs)",
      "Weekly 10-min voice check-ins with top 10 most active users",
      "Document 3 case studies showing real income increase",
      "Track onboarding completion rate — target >65%",
    ],
    kpi: "50 paying drivers · NPS > 40",
  },
  {
    id: "waitlist",
    label: "Waitlist",
    driverThreshold: 500,
    color: "bg-gold/10 border-gold/30 text-gold",
    dotColor: "bg-gold",
    actions: [
      "Post case studies in 10+ SA driver Facebook groups + WhatsApp communities",
      "Activate referral engine — R50/driver, share link with all alpha users",
      "Publish 3 TikTok/Reels: 'This app got me R1,200 extra last month'",
      "Partner with 5 SA driver WhatsApp group admins (offer 3 months Tier 2 free)",
    ],
    kpi: "500 waitlist signups · 50% organic",
  },
  {
    id: "launch",
    label: "Full Launch",
    driverThreshold: 5000,
    color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    dotColor: "bg-emerald-500",
    actions: [
      "Product Hunt launch — SA-focused description + demo video",
      "Press release to TechCentral, MyBroadband, Ventureburn",
      "Meta ads targeting SA ride-hailing drivers — R15,000/month budget",
      "Nduna automated onboarding: Day 1/3/7/14 WhatsApp + email sequence",
    ],
    kpi: "5,000 drivers · R1.75M MRR",
  },
] as const;

const CHANNEL_PLAYBOOKS = [
  {
    icon: <Users className="w-4 h-4" />,
    channel: "SA Driver WhatsApp Groups",
    tactic:
      "Share 1 useful tip per week for 2 weeks, then share MoneyDrive with referral code",
    cac: "~R50 (referral cost)",
  },
  {
    icon: <Activity className="w-4 h-4" />,
    channel: "TikTok / Instagram Reels",
    tactic:
      "'How much I made with MoneyDrive' — real driver story format, no ads budget",
    cac: "R0",
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    channel: "Referral Engine (in-app)",
    tactic:
      "R50 per signup, automated via MoneyDrive. Drivers share personal link via WhatsApp",
    cac: "R50",
  },
  {
    icon: <Target className="w-4 h-4" />,
    channel: "Meta Paid Ads (Phase 3)",
    tactic: "SA ride-hailing drivers, 25–45, Android. Target CPL < R30",
    cac: "~R100–R150",
  },
] as const;

function GrowthStrategyPanel({
  onTabChange,
}: { onTabChange?: (tab: string) => void }) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>("alpha");

  // Placeholder: in production, pull real driver count from analytics
  const currentDriverCount = 50; // TODO: wire to real analytics
  const currentPhase =
    currentDriverCount < 50
      ? "alpha"
      : currentDriverCount < 500
        ? "waitlist"
        : "launch";

  return (
    <div className="space-y-5" data-ocid="admin_analytics.growth.panel">
      {/* Nduna Marketing HQ link card */}
      <Card className="shadow-card border-primary/20 bg-gradient-to-br from-primary/5 to-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-sm text-foreground">
                  Nduna Marketing HQ
                </p>
                <p className="text-xs text-muted-foreground">
                  Plan, approve, and track autonomous campaigns
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-2 text-xs shrink-0"
              onClick={() => onTabChange?.("admin-marketing")}
              data-ocid="admin_analytics.growth.marketing_hq_button"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Open HQ
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Rocket className="w-4.5 h-4.5 text-gold" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-foreground">
                GTM Growth Strategy
              </h2>
              <p className="text-xs text-muted-foreground">
                Based on skills.rest/gtm-strategy skill
              </p>
            </div>
          </div>

          {/* Current phase banner */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 mb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
                  Current Phase
                </p>
                <p className="font-display font-bold text-foreground text-base capitalize">
                  {currentPhase === "alpha"
                    ? "Alpha"
                    : currentPhase === "waitlist"
                      ? "Waitlist"
                      : "Full Launch"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Active Drivers</p>
                <p className="font-display font-bold text-primary text-lg">
                  {currentDriverCount.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((currentDriverCount / 50) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                50 drivers = Phase 2
              </span>
            </div>
          </div>

          {/* Phase cards */}
          <div className="space-y-2">
            {GTM_PHASES.map((phase) => {
              const isActive = phase.id === currentPhase;
              const isExpanded = expandedPhase === phase.id;
              return (
                <div
                  key={phase.id}
                  className={`rounded-xl border ${phase.color} ${isActive ? "ring-1 ring-current/30" : "opacity-70"}`}
                  data-ocid={`admin_analytics.growth.phase.${phase.id}`}
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold"
                    onClick={() =>
                      setExpandedPhase(isExpanded ? null : phase.id)
                    }
                    aria-expanded={isExpanded}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${phase.dotColor} ${isActive ? "animate-pulse" : ""}`}
                      />
                      {phase.label}
                      {isActive && (
                        <Badge
                          variant="outline"
                          className="text-[9px] border-current/40 bg-current/10"
                        >
                          Current
                        </Badge>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] opacity-60 font-normal hidden sm:block">
                        {phase.kpi}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 opacity-60" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-1.5">
                      <p className="text-[10px] font-semibold opacity-70 uppercase tracking-wide mb-2">
                        30-Day Actions
                      </p>
                      {phase.actions.map((action, i) => (
                        <div
                          key={`${phase.id}-action-${String(i)}`}
                          className="flex items-start gap-2 text-xs opacity-80"
                        >
                          <Zap className="w-3 h-3 shrink-0 mt-0.5 opacity-60" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Tracker */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <h2 className="font-display font-bold text-sm text-foreground mb-3">
            Key GTM Metrics
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Trial Activation",
                target: ">60%",
                current: "—",
                icon: <Target className="w-3.5 h-3.5" />,
              },
              {
                label: "Trial → Tier 1",
                target: ">30%",
                current: "—",
                icon: <TrendingUp className="w-3.5 h-3.5" />,
              },
              {
                label: "Tier 1 → Tier 2",
                target: ">15%",
                current: "—",
                icon: <Zap className="w-3.5 h-3.5" />,
              },
              {
                label: "Monthly Churn",
                target: "<10%",
                current: "—",
                icon: <Activity className="w-3.5 h-3.5" />,
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="bg-muted/40 rounded-xl p-3 border border-border"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  {metric.icon}
                  <p className="text-[10px] uppercase tracking-wider font-semibold">
                    {metric.label}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <p className="font-display font-bold text-foreground text-lg">
                    {metric.current}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Target: {metric.target}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            Connect to live analytics to populate these metrics automatically.
          </p>
        </CardContent>
      </Card>

      {/* Channel Playbooks */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <h2 className="font-display font-bold text-sm text-foreground mb-3">
            Acquisition Channel Playbooks
          </h2>
          <div className="space-y-3">
            {CHANNEL_PLAYBOOKS.map((ch) => (
              <div
                key={ch.channel}
                className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border"
                data-ocid={`admin_analytics.growth.channel.${ch.channel.toLowerCase().replace(/\W+/g, "_")}`}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                  {ch.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                    <p className="text-xs font-semibold text-foreground">
                      {ch.channel}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                    >
                      {ch.cac} CAC
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {ch.tactic}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
