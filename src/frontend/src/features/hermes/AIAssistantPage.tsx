import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart2,
  Bell,
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Star,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  DriverAnalyticsProfile,
  DriverMemory,
  DriverMemoryEntry,
} from "../../backend";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  formatMemoryEntries,
  formatSkillResult,
} from "../../services/hermesService";
import {
  useFollowUpReminders,
  useMonthlyAnalysis,
} from "../advertising/useAdvertising";
import type { DriverCohort } from "../cohort/useCohort";
import { useCohort } from "../cohort/useCohort";
import { useRemainingNdunaQueries } from "../gateway";
import {
  AIAssistantUI,
  HermesLockedState,
  HermesNotConfiguredState,
} from "./AIAssistant";
import { useHermes } from "./useHermes";

interface AIAssistantPageProps {
  tier: number;
  initialQuery?: string;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {["t1", "t2", "t3", "t4", "t5", "t6"].map((k) => (
        <Skeleton key={k} className="h-14 rounded-xl" />
      ))}
    </div>
  );
}

function formatCurrency(val: number) {
  return `R${val.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Follow-up Reminders Banner ────────────────────────────────────────────────

function RemindersBanner({
  reminders,
  onDismiss,
}: {
  reminders: string[];
  onDismiss: () => void;
}) {
  return (
    <section
      className="rounded-xl border px-4 py-3 mb-4 relative"
      style={{
        background: "oklch(0.12 0.02 40 / 0.5)",
        borderColor: "oklch(0.60 0.22 35 / 0.5)",
      }}
      data-ocid="nduna.reminders_banner"
      aria-label="Nduna follow-up reminders"
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss reminders"
        data-ocid="nduna.reminders_banner.dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 mb-2">
        <Bell
          className="w-4 h-4 flex-shrink-0"
          style={{ color: "oklch(0.78 0.14 40)" }}
        />
        <span
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: "oklch(0.78 0.14 40)" }}
        >
          Nduna Follow-up Reminders
        </span>
      </div>

      <ul className="space-y-1.5 pr-6">
        {reminders.map((reminder) => (
          <li
            key={reminder}
            className="flex items-start gap-2 text-xs text-foreground leading-relaxed"
          >
            <span
              className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
              style={{ background: "oklch(0.78 0.14 40)" }}
              aria-hidden="true"
            />
            {reminder}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Cohort Context Banner ─────────────────────────────────────────────────────

const COHORT_BANNER_DISMISSED_KEY = "moneydrive_cohort_banner_dismissed";
const COHORT_BANNER_COHORT_KEY = "moneydrive_cohort_banner_cohort";

const COHORT_BANNER_CONFIG: Record<
  DriverCohort,
  {
    icon: string;
    strategy: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
  }
> = {
  PowerEarner: {
    icon: "⚡",
    strategy:
      "Power Earner — Aggressive pitch strategy active. Target 5+ deals this month.",
    bgColor: "oklch(0.55 0.18 35 / 0.18)",
    borderColor: "oklch(0.55 0.18 35 / 0.5)",
    textColor: "oklch(0.78 0.16 40)",
  },
  GrowthDriver: {
    icon: "📈",
    strategy:
      "Growth Driver — Balanced strategy. Build rating while pitching mid-market.",
    bgColor: "oklch(0.76 0.12 75 / 0.12)",
    borderColor: "oklch(0.76 0.12 75 / 0.4)",
    textColor: "oklch(0.65 0.11 75)",
  },
  NewDriver: {
    icon: "🚀",
    strategy:
      "New Driver — Build your foundation. Focus on rating and trips before pitching.",
    bgColor: "oklch(0.40 0.08 240 / 0.18)",
    borderColor: "oklch(0.50 0.10 240 / 0.5)",
    textColor: "oklch(0.70 0.10 240)",
  },
};

function CohortBanner({
  cohort,
  onDismiss,
  onViewDashboard,
}: {
  cohort: DriverCohort;
  onDismiss: () => void;
  onViewDashboard?: () => void;
}) {
  const cfg = COHORT_BANNER_CONFIG[cohort];
  return (
    <section
      className="rounded-xl px-4 py-3 mb-4 relative flex items-start gap-3"
      style={{
        background: cfg.bgColor,
        border: `1px solid ${cfg.borderColor}`,
      }}
      data-ocid="nduna.cohort_banner"
      aria-label={`Your driver archetype: ${cohort}`}
    >
      <span className="text-lg leading-none mt-0.5 shrink-0" aria-hidden="true">
        {cfg.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold leading-relaxed"
          style={{ color: cfg.textColor }}
        >
          {cfg.strategy}
        </p>
        <button
          type="button"
          onClick={onViewDashboard}
          className="text-[11px] underline underline-offset-2 mt-0.5 opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: cfg.textColor }}
          data-ocid="nduna.cohort_banner.dashboard_link"
        >
          View full cohort card →
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss cohort banner"
        data-ocid="nduna.cohort_banner.dismiss"
        style={{ color: cfg.textColor }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </section>
  );
}

// ── Driver Memory Panel ───────────────────────────────────────────────────────

function DriverMemoryPanel({
  memory,
  entries,
  loading,
}: {
  memory: DriverMemory | null | undefined;
  entries: DriverMemoryEntry[];
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-2xl border mb-4 overflow-hidden"
      style={{
        background: "oklch(0.11 0.015 78)",
        borderColor: "oklch(0.75 0.12 85 / 0.3)",
        boxShadow: "0 0 16px oklch(0.75 0.12 85 / 0.06)",
      }}
      data-ocid="hermes.memory_panel"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        aria-expanded={open}
        data-ocid="hermes.memory_panel.toggle"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-sm text-foreground">
            Driver Memory
          </span>
          {memory ? (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: "oklch(0.5 0.18 142 / 0.15)",
                color: "oklch(0.65 0.16 142)",
                border: "1px solid oklch(0.5 0.18 142 / 0.3)",
              }}
            >
              Nduna remembers you
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-muted-foreground border border-border">
              Learning...
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : !memory ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nduna is learning about you. Keep chatting, logging trips, and
              using the app — your profile builds automatically.
            </p>
          ) : (
            <>
              {memory.agentNotes && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Nduna Notes
                  </p>
                  <p
                    className="text-xs leading-relaxed rounded-lg px-3 py-2"
                    style={{
                      background: "oklch(0.14 0.015 85)",
                      border: "1px solid oklch(0.22 0.02 85)",
                      color: "oklch(0.75 0.04 85)",
                    }}
                  >
                    {memory.agentNotes}
                  </p>
                </div>
              )}
              {memory.userProfile && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Your Profile
                  </p>
                  <p
                    className="text-xs leading-relaxed rounded-lg px-3 py-2"
                    style={{
                      background: "oklch(0.14 0.015 85)",
                      border: "1px solid oklch(0.22 0.02 85)",
                      color: "oklch(0.75 0.04 85)",
                    }}
                  >
                    {memory.userProfile}
                  </p>
                </div>
              )}
              {entries.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Memory Entries
                  </p>
                  <pre
                    className="text-[11px] leading-relaxed rounded-lg px-3 py-2 whitespace-pre-wrap font-mono"
                    style={{
                      background: "oklch(0.14 0.015 85)",
                      border: "1px solid oklch(0.22 0.02 85)",
                      color: "oklch(0.65 0.03 85)",
                    }}
                  >
                    {formatMemoryEntries(entries)}
                  </pre>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                Last updated:{" "}
                {new Date(
                  Number(memory.lastUpdated) / 1_000_000,
                ).toLocaleString("en-ZA")}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Skill Card ────────────────────────────────────────────────────────────────

interface SkillCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  result: string;
  isLoading: boolean;
  onRefetch: () => void;
  ocid: string;
  accentColor?: string;
}

function SkillCard({
  icon,
  title,
  description,
  result,
  isLoading,
  onRefetch,
  ocid,
  accentColor = "oklch(0.75 0.12 85)",
}: SkillCardProps) {
  const [expanded, setExpanded] = useState(false);
  const parsed = result ? formatSkillResult(result, title) : null;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "oklch(0.11 0.012 80)",
        borderColor: `${accentColor} / 0.25`,
      }}
      data-ocid={ocid}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `color-mix(in oklch, ${accentColor} 15%, transparent)`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {description}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            onRefetch();
            setExpanded(true);
          }}
          disabled={isLoading}
          className="shrink-0 h-8 px-3 text-xs gap-1.5"
          data-ocid={`${ocid}.run`}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {result ? "Refresh" : "Run"}
        </Button>
      </div>

      {result && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground hover:bg-white/5 transition-colors"
            style={{ borderColor: `${accentColor} / 0.15` }}
            data-ocid={`${ocid}.toggle`}
          >
            <span>{expanded ? "Hide" : "View"} results</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {expanded && parsed && (
            <div
              className="px-4 pb-4 pt-2 space-y-2"
              data-ocid={`${ocid}.results`}
            >
              {parsed.bullets.length > 0 ? (
                <ul className="space-y-1.5">
                  {parsed.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 text-xs text-foreground leading-relaxed"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: accentColor }}
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {parsed.raw}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Analytics Profile Panel ───────────────────────────────────────────────────

function AnalyticsProfilePanel({
  profile,
  loading,
  onRecalculate,
  isRecalculating,
}: {
  profile: DriverAnalyticsProfile | null | undefined;
  loading: boolean;
  onRecalculate: () => void;
  isRecalculating: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="rounded-2xl border mb-4 overflow-hidden"
      style={{
        background: "oklch(0.11 0.015 78)",
        borderColor: "oklch(0.75 0.12 85 / 0.2)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        aria-expanded={open}
        data-ocid="hermes.analytics_panel.toggle"
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-sm text-foreground">
            Driver Analytics Profile
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{
              background: "oklch(0.5 0.18 142 / 0.15)",
              color: "oklch(0.65 0.16 142)",
              border: "1px solid oklch(0.5 0.18 142 / 0.3)",
            }}
          >
            LIVE
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4">
          {loading ? (
            <ProfileSkeleton />
          ) : !profile ? (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-3">
                No profile data yet. Log trips, expenses, and fuel — Nduna
                builds your profile over time and helps you land advertising
                deals.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={onRecalculate}
                disabled={isRecalculating}
                className="gap-1.5 text-xs"
                data-ocid="hermes.analytics.recalculate.button"
              >
                {isRecalculating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Build Profile Now
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <StatCard
                  icon={<TrendingUp className="w-4 h-4 text-primary" />}
                  label="Total Trips"
                  value={Number(profile.totalTrips).toLocaleString()}
                />
                <StatCard
                  icon={<Zap className="w-4 h-4 text-primary" />}
                  label="Total Earnings"
                  value={formatCurrency(profile.totalEarnings)}
                />
                <StatCard
                  icon={<BarChart2 className="w-4 h-4 text-primary" />}
                  label="Avg / Hour"
                  value={`${formatCurrency(profile.avgEarningsPerHour)}/hr`}
                />
                <StatCard
                  icon={<Eye className="w-4 h-4 text-primary" />}
                  label="Car Exposure"
                  value={`${Number(profile.estimatedCarExposure).toLocaleString()} views/day`}
                />
                <StatCard
                  icon={<Clock className="w-4 h-4 text-primary" />}
                  label="Peak Hours"
                  value={
                    profile.peakHourRanges.length > 0
                      ? profile.peakHourRanges.join(", ")
                      : "Not enough data"
                  }
                />
                <StatCard
                  icon={<Star className="w-4 h-4 text-primary" />}
                  label="Top Days"
                  value={
                    profile.topEarningDays.length > 0
                      ? profile.topEarningDays.slice(0, 2).join(", ")
                      : "Not enough data"
                  }
                />
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3 px-0.5">
                The more data you log, the stronger your advertising business
                case becomes. Nduna uses this to help you land R10k–R50k/month
                deals.
              </p>

              <Button
                size="sm"
                variant="outline"
                onClick={onRecalculate}
                disabled={isRecalculating}
                className="gap-1.5 text-xs w-full"
                data-ocid="hermes.analytics.recalculate.button"
              >
                {isRecalculating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Recalculating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Recalculate Profile
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Monthly Analysis Panel ────────────────────────────────────────────────────

function MonthlyAnalysisPanel({ driverId }: { driverId: string }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const {
    data: analysis,
    isLoading,
    refetch,
    isFetching,
  } = useMonthlyAnalysis(driverId, year, month);

  const hasUpdate = !!analysis?.suggestedSystemPromptUpdate;

  return (
    <div
      className="rounded-2xl border overflow-hidden mb-4"
      style={{
        background: "oklch(0.11 0.012 80)",
        borderColor: "oklch(0.75 0.12 85 / 0.2)",
      }}
      data-ocid="hermes.monthly_analysis.panel"
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-sm text-foreground">
            Monthly Analysis
          </span>
          <span className="text-[10px] text-muted-foreground">
            {now.toLocaleString("en-ZA", { month: "long", year: "numeric" })}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="h-8 px-3 text-xs gap-1.5"
          data-ocid="hermes.monthly_analysis.run"
        >
          {isLoading || isFetching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Run Analysis
        </Button>
      </div>

      {hasUpdate && (
        <div className="px-4 pb-4 pt-0 border-t border-border/40">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 pt-3">
            Nduna Insights
          </p>
          <p
            className="text-xs leading-relaxed rounded-lg px-3 py-2 whitespace-pre-wrap"
            style={{
              background: "oklch(0.14 0.015 85)",
              border: "1px solid oklch(0.22 0.02 85)",
              color: "oklch(0.75 0.04 85)",
            }}
            data-ocid="hermes.monthly_analysis.output"
          >
            {analysis.suggestedSystemPromptUpdate}
          </p>
          {analysis.surgeAccuracy > 0 && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Surge accuracy this month:{" "}
              <span className="text-primary font-semibold">
                {Math.round(analysis.surgeAccuracy * 100)}%
              </span>
            </p>
          )}
        </div>
      )}

      {!hasUpdate && !isLoading && !isFetching && (
        <p className="text-xs text-muted-foreground px-4 pb-3">
          Run the analysis to see what Nduna learned from your outcomes this
          month.
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AIAssistantPage({ tier, initialQuery }: AIAssistantPageProps) {
  const { identity } = useInternetIdentity();
  const driverId = identity ? identity.getPrincipal().toText() : "anonymous";

  const {
    messages,
    isLoading,
    sendMessage,
    clearConversation,
    isClearing,
    isConfigured,
    checkingConfig,
    initialQuerySentRef,
    analyticsProfile,
    profileLoading,
    recalculateProfile,
    isRecalculating,
    driverMemory,
    memoryLoading,
    driverMemoryEntries,
    earningsSnapshot,
    surgeOpportunities,
    surgeLoading,
    refetchSurge,
    refetchEarningsSnapshot,
    advertisingBusinessCase,
    adCaseLoading,
    refetchAdCase,
    messageClassifications,
  } = useHermes(tier);

  // Rate limit counter — only shown when low (< 10 remaining)
  const { data: remainingQueries } = useRemainingNdunaQueries();
  const showQueryWarning =
    remainingQueries !== null &&
    remainingQueries !== undefined &&
    remainingQueries < 10;

  const [input, setInput] = useState("");
  const [remindersDismissed, setRemindersDismissed] = useState(false);

  // Cohort banner state — dismissed per cohort, reappears if cohort changes
  const { data: cohortData } = useCohort();
  const [cohortBannerDismissed, setCohortBannerDismissed] = useState(() => {
    const dismissedCohort = localStorage.getItem(COHORT_BANNER_COHORT_KEY);
    const isDismissed =
      localStorage.getItem(COHORT_BANNER_DISMISSED_KEY) === "true";
    return isDismissed && dismissedCohort === (cohortData?.cohort ?? "");
  });
  const showCohortBanner = !cohortBannerDismissed && !!cohortData && tier >= 3;

  const dismissCohortBanner = () => {
    localStorage.setItem(COHORT_BANNER_DISMISSED_KEY, "true");
    localStorage.setItem(COHORT_BANNER_COHORT_KEY, cohortData?.cohort ?? "");
    setCohortBannerDismissed(true);
  };

  // Follow-up reminders
  const { data: followUpReminders = [] } = useFollowUpReminders(driverId);
  const showReminders =
    !remindersDismissed && followUpReminders.length > 0 && tier >= 2;

  // Auto-send initialQuery once when configured and ready
  useEffect(() => {
    if (
      initialQuery &&
      isConfigured &&
      !initialQuerySentRef.current &&
      !isLoading
    ) {
      initialQuerySentRef.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery, isConfigured, isLoading, sendMessage, initialQuerySentRef]);

  if (tier < 3) return <HermesLockedState />;

  if (checkingConfig) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConfigured) return <HermesNotConfiguredState />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 relative">
      {/* Nduna background image — subtle decorative overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04] bg-no-repeat bg-center bg-contain"
        style={{ backgroundImage: "url('https://i.imgur.com/u98U7S6.png')" }}
        aria-hidden="true"
      />

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0"
          style={{ borderColor: "oklch(0.75 0.12 85 / 0.5)" }}
        >
          <img
            src="https://i.imgur.com/u98U7S6.png"
            alt="Nduna"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Nduna
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your Earnings Optimization + Income Expansion System — powered by
            persistent memory and real-time analytics.
          </p>
        </div>
      </div>

      {/* Follow-up reminders banner */}
      {showReminders && (
        <RemindersBanner
          reminders={followUpReminders}
          onDismiss={() => setRemindersDismissed(true)}
        />
      )}

      {/* Cohort context banner */}
      {showCohortBanner && cohortData && (
        <CohortBanner
          cohort={cohortData.cohort}
          onDismiss={dismissCohortBanner}
        />
      )}

      {/* Driver Memory Panel */}
      <DriverMemoryPanel
        memory={driverMemory}
        entries={driverMemoryEntries}
        loading={memoryLoading}
      />

      {/* Skill Shortcut Cards */}
      <div className="space-y-2" data-ocid="hermes.skill_cards">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "oklch(0.75 0.12 85 / 0.7)" }}
        >
          Power Skills
        </p>
        <SkillCard
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
          title="Earnings Snapshot"
          description="See a live breakdown of your income trends and performance"
          result={earningsSnapshot}
          isLoading={false}
          onRefetch={refetchEarningsSnapshot}
          ocid="hermes.skill.earnings_snapshot"
          accentColor="oklch(0.75 0.12 85)"
        />
        <SkillCard
          icon={
            <Zap className="w-4 h-4" style={{ color: "oklch(0.80 0.18 65)" }} />
          }
          title="Surge Detector"
          description="Top 3 windows to maximize your earnings today"
          result={surgeOpportunities}
          isLoading={surgeLoading}
          onRefetch={refetchSurge}
          ocid="hermes.skill.surge_detector"
          accentColor="oklch(0.80 0.18 65)"
        />
        <SkillCard
          icon={
            <Star
              className="w-4 h-4"
              style={{ color: "oklch(0.78 0.14 50)" }}
            />
          }
          title="Advertising Dealmaker"
          description="Build a business case to land R10k–R50k/month corporate deals"
          result={advertisingBusinessCase}
          isLoading={adCaseLoading}
          onRefetch={refetchAdCase}
          ocid="hermes.skill.advertising_dealmaker"
          accentColor="oklch(0.78 0.14 50)"
        />
      </div>

      {/* Analytics Profile */}
      <AnalyticsProfilePanel
        profile={analyticsProfile}
        loading={profileLoading}
        onRecalculate={recalculateProfile}
        isRecalculating={isRecalculating}
      />

      {/* Monthly Analysis */}
      <MonthlyAnalysisPanel driverId={driverId} />

      {/* Chat interface */}
      {showQueryWarning && (
        <div
          className="flex items-center justify-end"
          data-ocid="nduna.rate_limit.warning"
        >
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
            style={{
              background: "oklch(0.55 0.18 35 / 0.15)",
              borderColor: "oklch(0.55 0.18 35 / 0.4)",
              color: "oklch(0.78 0.16 40)",
            }}
            aria-label={`${remainingQueries} Nduna queries remaining today`}
          >
            {remainingQueries} quer{remainingQueries === 1 ? "y" : "ies"} left
            today
          </span>
        </div>
      )}
      <AIAssistantUI
        messages={messages}
        isLoading={isLoading}
        isClearing={isClearing}
        sendMessage={sendMessage}
        clearConversation={clearConversation}
        input={input}
        setInput={setInput}
        messageClassifications={messageClassifications}
        hasMemory={!!driverMemory}
        driverId={driverId}
      />
    </div>
  );
}
