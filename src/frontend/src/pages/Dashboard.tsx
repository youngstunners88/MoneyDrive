import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Bot,
  Car,
  CheckCircle2,
  Clock,
  Flame,
  Mail,
  Pencil,
  Plus,
  Star,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { Tab } from "../App";
import type { Trip, UserProfile } from "../backend";
import AddTripDialog from "../components/AddTripDialog";
import EarningsCounter from "../components/common/EarningsCounter";
import GoalProgressBar from "../components/common/GoalProgressBar";
import SkeletonCard from "../components/common/SkeletonCard";
import {
  getNextCohortInfo,
  useCohort,
  useUpdateDriverRating,
} from "../features/cohort/useCohort";
import { useActor } from "../hooks/useActor";
import { formatCurrency } from "../lib/currency";
import { analytics } from "../services/analyticsService";
import { logPageView } from "../services/behavioralContextService";

const BRIEFING_DISMISSED_KEY = "moneydrive_briefing_banner_dismissed";

interface DashboardProps {
  profile: UserProfile | null | undefined;
  tier: number;
  onTabChange: (t: Tab) => void;
  addTripOpen?: boolean;
  onAddTripOpenChange?: (v: boolean) => void;
}

const PLATFORM_STYLES: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  Uber: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
  Bolt: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  inDriver: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  Other: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Peak hours: 6-9am and 4-7pm
function isPeakHour(): boolean {
  const h = new Date().getHours();
  return (h >= 6 && h < 9) || (h >= 16 && h < 19);
}

function getLast7DaysEarnings(trips: Array<{ date: bigint; amount: number }>) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    const total = trips
      .filter((t) => {
        const ts = Number(t.date);
        return ts >= d.getTime() && ts <= end.getTime();
      })
      .reduce((s, t) => s + t.amount, 0);
    return {
      day: DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
      amount: total,
    };
  });
}

export default function Dashboard({
  profile,
  tier,
  onTabChange,
  addTripOpen: externalAddTripOpen,
  onAddTripOpenChange: externalOnAddTripOpenChange,
}: DashboardProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [internalAddTripOpen, setInternalAddTripOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  // Behavioral context: log page view on mount
  useEffect(() => {
    logPageView("earnings");
  }, []);

  const addTripOpen =
    externalAddTripOpen !== undefined
      ? externalAddTripOpen
      : internalAddTripOpen;
  const setAddTripOpen = (v: boolean) => {
    if (externalOnAddTripOpenChange) externalOnAddTripOpenChange(v);
    else setInternalAddTripOpen(v);
  };

  const { data: earningsTotal, isLoading: earningsLoading } = useQuery({
    queryKey: ["earningsTotal"],
    queryFn: () => actor!.getEarningsTotal(),
    enabled: !!actor,
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => actor!.getTrips(),
    enabled: !!actor,
    meta: {
      onError: (err: Error) => {
        analytics.track({
          category: "error",
          action: "query_failed",
          errorMessage: err.message,
          success: false,
        });
      },
    },
  });

  const { data: upcomingShifts } = useQuery({
    queryKey: ["upcomingShifts"],
    queryFn: () => actor!.getUpcomingShifts(),
    enabled: !!actor && tier >= 2,
  });

  const { data: earningsGoal } = useQuery({
    queryKey: ["earningsGoal"],
    queryFn: () => actor!.getEarningsGoal(),
    enabled: !!actor,
  });

  const deleteTripMut = useMutation({
    mutationFn: (tripId: string) => actor!.deleteTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["earningsTotal"] });
      setTripToDelete(null);
      analytics.track({ category: "user_action", action: "trip_deleted" });
    },
    onError: (err: Error) => {
      setTripToDelete(null);
      analytics.track({
        category: "error",
        action: "trip_delete_failed",
        errorMessage: err.message,
        success: false,
      });
    },
  });

  const currency = profile?.currencyCode ?? "ZAR";
  const totalAmount = earningsTotal ? earningsTotal[0] : 0;
  const totalTrips = earningsTotal ? Number(earningsTotal[1]) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  const yesterday = new Date(todayTimestamp - 86400000);

  const todayTrips = (trips ?? []).filter(
    (t) =>
      Number(t.date) >= todayTimestamp &&
      Number(t.date) < todayTimestamp + 86400000,
  );
  const yesterdayTrips = (trips ?? []).filter(
    (t) =>
      Number(t.date) >= yesterday.getTime() && Number(t.date) < todayTimestamp,
  );

  const todayEarnings = todayTrips.reduce((s, t) => s + t.amount, 0);
  const yesterdayEarnings = yesterdayTrips.reduce((s, t) => s + t.amount, 0);
  const earningsDelta =
    yesterdayEarnings > 0
      ? ((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100
      : null;

  const recentTrips = (trips ?? [])
    .slice()
    .sort((a, b) => Number(b.date) - Number(a.date))
    .slice(0, 5);

  const totalMinutes = (trips ?? []).reduce(
    (s, t) => s + Number(t.durationMinutes),
    0,
  );
  const hoursOnline = totalMinutes > 0 ? (totalMinutes / 60).toFixed(1) : "0";
  const avgTripValue = totalTrips > 0 ? totalAmount / totalTrips : 0;

  // Streak logic
  const tripDays = new Set(
    (trips ?? []).map((t) => {
      const d = new Date(Number(t.date));
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  let streak = 0;
  const checkDay = new Date();
  for (let i = 0; i < 365; i++) {
    const key = `${checkDay.getFullYear()}-${checkDay.getMonth()}-${checkDay.getDate()}`;
    if (tripDays.has(key)) {
      streak++;
      checkDay.setDate(checkDay.getDate() - 1);
    } else {
      break;
    }
  }

  const name = profile?.displayName ?? "Driver";
  const greetingMsg =
    todayEarnings > 300
      ? `Hola 7, ${name}! 🔥 Lekker shift!`
      : totalTrips === 0
        ? `Hola 7, ${name}! Let's hit the road.`
        : `Hola 7, ${name}!`;

  const hasGoal = earningsGoal != null && earningsGoal.targetAmount > 0;
  const dailyGoal = hasGoal ? earningsGoal!.targetAmount : 0;
  const toGoal = hasGoal ? Math.max(dailyGoal - todayEarnings, 0) : 0;

  const sparklineData = getLast7DaysEarnings(trips ?? []);
  const maxSparkline = Math.max(...sparklineData.map((d) => d.amount), 1);

  const isLoading = tripsLoading || earningsLoading;
  const hasNoTrips = !isLoading && totalTrips === 0;
  const peakNow = isPeakHour();

  // Cohort
  const { data: cohortData, isLoading: cohortLoading } = useCohort();
  const updateRatingMut = useUpdateDriverRating();
  const [ratingEdit, setRatingEdit] = useState<string | null>(null);
  const [ratingSaving, setRatingSaving] = useState(false);

  // Weekly briefing banner
  const [briefingDismissed, setBriefingDismissed] = useState(
    () => localStorage.getItem(BRIEFING_DISMISSED_KEY) === "true",
  );
  const hasWhatsApp = !!(
    profile as (UserProfile & { whatsappNumber?: string }) | null | undefined
  )?.whatsappNumber;
  const showBriefingBanner = !briefingDismissed && hasWhatsApp;

  const dismissBriefing = () => {
    localStorage.setItem(BRIEFING_DISMISSED_KEY, "true");
    setBriefingDismissed(true);
  };

  // Cohort config
  const cohortConfig = {
    PowerEarner: {
      badge: "POWER EARNER 🔥",
      badgeClass: "bg-primary text-white",
      borderColor: "oklch(0.55 0.18 35)",
      heading: "You're driving at the top level",
    },
    GrowthDriver: {
      badge: "GROWTH DRIVER ⬆️",
      badgeClass: "bg-gold text-foreground",
      borderColor: "oklch(0.76 0.12 75)",
      heading: "Building momentum",
    },
    NewDriver: {
      badge: "NEW DRIVER 🚗",
      badgeClass: "bg-foreground text-background",
      borderColor: "oklch(0.40 0.08 240)",
      heading: "Every trip builds your future",
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">
      {/* Peak hours banner */}
      {peakNow && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-up"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.18 55), oklch(0.60 0.20 45))",
          }}
          data-ocid="dashboard.peak_hours.banner"
        >
          <Flame className="w-5 h-5 text-white shrink-0" />
          <div>
            <p className="text-white font-bold text-sm">
              🔥 Peak Hours Active!
            </p>
            <p className="text-white/80 text-xs">
              6–9am & 4–7pm are your highest earning windows. Demand is up — get
              moving!
            </p>
          </div>
          <Badge className="ml-auto bg-white/20 text-white border-white/30 text-[10px] shrink-0">
            PEAK
          </Badge>
        </div>
      )}

      {/* Hero earnings card */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden shimmer-sweep animate-fade-up stagger-1"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.17 0.035 230), oklch(0.22 0.045 240))",
        }}
        data-ocid="dashboard.hero.card"
      >
        {/* SA township-inspired stripe accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.76 0.12 75), oklch(0.55 0.18 145), oklch(0.76 0.12 75))",
            opacity: 0.6,
          }}
        />
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/3 rounded-full translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10">
          {/* Top row: greeting + today earnings */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-1">
                🇿🇦 EARNINGS OPTIMIZATION SYSTEM
              </p>
              <h1 className="font-display text-xl md:text-2xl font-extrabold text-white leading-tight">
                {greetingMsg}
              </h1>

              {/* Streak widget */}
              {streak >= 2 ? (
                <div className="inline-flex items-center gap-1.5 mt-2 bg-white/15 rounded-full px-3 py-1">
                  <span
                    className="text-base"
                    style={{
                      animation: "streakFlame 1.4s ease-in-out infinite",
                    }}
                  >
                    🔥
                  </span>
                  <span className="text-white text-xs font-bold">
                    {streak}-day streak!
                  </span>
                </div>
              ) : (
                totalTrips > 0 && (
                  <p className="text-white/60 text-xs mt-1.5">
                    Building your streak 💪
                  </p>
                )
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-white/50 text-[10px] uppercase tracking-wide mb-0.5">
                Today
              </p>
              {earningsLoading ? (
                <Skeleton className="h-8 w-28 bg-white/20" />
              ) : (
                <EarningsCounter
                  value={todayEarnings}
                  currency={currency}
                  className="text-2xl md:text-3xl font-display font-extrabold text-white"
                />
              )}
              {earningsDelta !== null && (
                <div
                  className={`flex items-center justify-end gap-0.5 mt-0.5 text-xs font-semibold ${
                    earningsDelta >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {earningsDelta >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {earningsDelta >= 0 ? "+" : ""}
                    {earningsDelta.toFixed(1)}% vs yesterday
                  </span>
                </div>
              )}
              {tier === 3 && (
                <Badge className="mt-1.5 bg-gold text-foreground font-bold text-[10px]">
                  ELITE
                </Badge>
              )}
              {tier === 2 && (
                <Badge className="mt-1.5 bg-primary text-white font-bold text-[10px]">
                  PRO
                </Badge>
              )}
            </div>
          </div>

          {/* Peak hours indicator in hero (non-peak) */}
          {!peakNow && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                <Clock className="w-3 h-3 text-white/60" />
                <span className="text-white/60 text-[10px] font-medium">
                  Peak: 6–9am · 4–7pm SAST
                </span>
              </div>
            </div>
          )}

          {hasGoal && !earningsLoading && toGoal > 0 && (
            <p className="text-white/60 text-xs mb-3">
              Keep going! {formatCurrency(toGoal, currency)} to your daily goal
            </p>
          )}

          {hasGoal ? (
            <GoalProgressBar
              current={todayEarnings}
              goal={dailyGoal}
              currency={currency}
            />
          ) : (
            !earningsLoading && (
              <button
                type="button"
                onClick={() => onTabChange("intelligence")}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors text-white text-xs font-semibold px-4 py-2 rounded-full border border-white/25 mt-1"
                data-ocid="dashboard.set_goal.button"
              >
                <Target className="w-3.5 h-3.5" />
                Set a daily goal
              </button>
            )
          )}

          {/* View Driver Manual CTA */}
          {!earningsLoading && (
            <button
              type="button"
              onClick={() => {
                window.location.href = "/manual";
              }}
              className="inline-flex items-center gap-2 bg-gold/20 hover:bg-gold/30 transition-colors text-gold text-xs font-semibold px-4 py-2 rounded-full border border-gold/30 mt-2"
              data-ocid="dashboard.view_manual.button"
            >
              <BookOpen className="w-3.5 h-3.5" />
              View Driver Manual
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats bar */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard
              key={i}
              lines={2}
              showHeader={false}
              className="py-3"
            />
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-3 gap-3 animate-fade-up stagger-2"
          data-ocid="dashboard.stats.panel"
        >
          {[
            {
              icon: <Car className="w-4 h-4" />,
              label: "Today's Trips",
              value: String(todayTrips.length),
              color: "text-primary",
            },
            {
              icon: <TrendingUp className="w-4 h-4" />,
              label: "Avg Trip",
              value: formatCurrency(avgTripValue, currency),
              color: "text-success",
            },
            {
              icon: <Clock className="w-4 h-4" />,
              label: "Hours Online",
              value: `${hoursOnline}h`,
              color: "text-amber-500",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-2xl shadow-card p-3 text-center card-hover-lift"
            >
              <div className={`flex justify-center mb-1 ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="font-display font-bold text-sm text-foreground leading-tight">
                {stat.value}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cohort Card */}
      {cohortLoading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : cohortData ? (
        (() => {
          const cfg = cohortConfig[cohortData.cohort];
          const nextCohort = getNextCohortInfo(cohortData.cohort);
          const tripsTarget = nextCohort?.target ?? 200;
          const progressPct = Math.min(
            (cohortData.tripsThisMonth / tripsTarget) * 100,
            100,
          );
          const tripsToNext = nextCohort
            ? Math.max(nextCohort.target - cohortData.tripsThisMonth, 0)
            : 0;

          const handleRatingSave = async () => {
            if (ratingEdit === null) return;
            const val = Number.parseFloat(ratingEdit);
            if (Number.isNaN(val) || val < 1.0 || val > 5.0) return;
            setRatingSaving(true);
            try {
              await updateRatingMut.mutateAsync(val);
            } finally {
              setRatingSaving(false);
              setRatingEdit(null);
            }
          };

          // Cohort-specific CTA config
          const ctaConfig = {
            PowerEarner: {
              label: "See your top 5 pitch targets",
              tab: "advertising" as Tab,
            },
            GrowthDriver: {
              label: "Balance rating + pitching",
              tab: "advertising" as Tab,
            },
            NewDriver: {
              label: "Build your foundation",
              tab: "academy" as Tab,
            },
          };
          const cta = ctaConfig[cohortData.cohort];

          return (
            <Card
              className="shadow-card overflow-hidden animate-fade-up stagger-3"
              style={{ borderLeft: `4px solid ${cfg.borderColor}` }}
              data-ocid="dashboard.cohort.card"
            >
              <CardContent className="p-4 space-y-3">
                {/* Badge row */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    className={`text-[10px] font-bold px-2 py-0.5 ${cfg.badgeClass}`}
                  >
                    {cfg.badge}
                  </Badge>
                </div>

                {/* Heading + advice */}
                <div>
                  <p className="font-display font-bold text-base text-foreground">
                    {cfg.heading}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {cohortData.cohortAdvice}
                  </p>
                </div>

                {/* Trips progress */}
                {nextCohort ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{cohortData.tripsThisMonth} trips this month</span>
                      <span>
                        {tripsToNext > 0
                          ? `${tripsToNext} more to become a ${nextCohort.label}`
                          : `Target: ${tripsTarget}`}
                      </span>
                    </div>
                    <Progress value={progressPct} className="h-1.5" />
                  </div>
                ) : (
                  <p className="text-xs text-success font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Elite status ✓
                  </p>
                )}

                {/* Editable rating field */}
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <Star className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    Your Uber/Bolt Rating:
                  </span>
                  {ratingEdit !== null ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={ratingEdit}
                        onChange={(e) => setRatingEdit(e.target.value)}
                        className="w-16 text-xs bg-muted border border-input rounded px-2 py-0.5 text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                        data-ocid="dashboard.cohort.rating.input"
                        aria-label="Your driver rating"
                      />
                      <button
                        type="button"
                        onClick={handleRatingSave}
                        disabled={ratingSaving}
                        className="p-1 rounded text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                        aria-label="Save rating"
                        data-ocid="dashboard.cohort.rating.save_button"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRatingEdit(null)}
                        className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
                        aria-label="Cancel rating edit"
                        data-ocid="dashboard.cohort.rating.cancel_button"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-xs font-bold text-foreground">
                        {cohortData.rating > 0
                          ? cohortData.rating.toFixed(1)
                          : "Not set"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setRatingEdit(
                            cohortData.rating > 0
                              ? cohortData.rating.toFixed(1)
                              : "4.5",
                          )
                        }
                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label="Edit your rating"
                        data-ocid="dashboard.cohort.rating.edit_button"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Upgrade recommendation */}
                {cohortData.upgradeRecommendation && (
                  <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
                    <strong>Next target:</strong>{" "}
                    {cohortData.upgradeRecommendation}
                  </p>
                )}

                {/* Cohort-specific CTA */}
                <button
                  type="button"
                  onClick={() => onTabChange(cta.tab)}
                  className="w-full mt-1 text-xs font-semibold py-2 px-3 rounded-xl transition-all btn-press"
                  style={{
                    background:
                      cohortData.cohort === "PowerEarner"
                        ? "oklch(0.55 0.18 35 / 0.12)"
                        : cohortData.cohort === "GrowthDriver"
                          ? "oklch(0.76 0.12 75 / 0.12)"
                          : "oklch(0.40 0.08 240 / 0.12)",
                    border: `1px solid ${cfg.borderColor}40`,
                    color:
                      cohortData.cohort === "PowerEarner"
                        ? "oklch(0.65 0.18 35)"
                        : cohortData.cohort === "GrowthDriver"
                          ? "oklch(0.60 0.12 75)"
                          : "oklch(0.60 0.08 240)",
                  }}
                  data-ocid="dashboard.cohort.cta.button"
                >
                  {cta.label} →
                </button>
              </CardContent>
            </Card>
          );
        })()
      ) : null}

      {/* Weekly Briefing Banner */}
      {showBriefingBanner && (
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-3 animate-fade-up stagger-4"
          style={{
            background: "oklch(0.17 0.035 230)",
            border: "1px solid oklch(0.30 0.05 240)",
          }}
          data-ocid="dashboard.briefing.banner"
        >
          <Mail
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: "oklch(0.76 0.12 75)" }}
          />
          <p
            className="text-xs flex-1"
            style={{ color: "oklch(0.76 0.12 75)" }}
          >
            <strong>Weekly briefing:</strong> Every Monday, Nduna sends your top
            3 opportunities + earnings summary to WhatsApp.
          </p>
          <button
            type="button"
            onClick={dismissBriefing}
            className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss briefing banner"
            data-ocid="dashboard.briefing.close_button"
          >
            <X
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.76 0.12 75)" }}
            />
          </button>
        </div>
      )}

      {/* Empty state */}
      {hasNoTrips && (
        <div
          className="bg-card rounded-2xl shadow-card p-8 text-center animate-fade-up stagger-3"
          data-ocid="dashboard.empty_state"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Car className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">
            Ready to earn?
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Log your first trip and start tracking your earnings, streaks, and
            daily goals — all in one place.
          </p>
          <Button
            onClick={() => setAddTripOpen(true)}
            size="lg"
            className="gap-2 rounded-xl px-8 shadow-voice btn-press"
            data-ocid="dashboard.log_first_trip.button"
          >
            <Plus className="w-5 h-5" />
            Log First Trip
          </Button>
        </div>
      )}

      {/* 7-Day Earnings Pulse sparkline */}
      {!hasNoTrips && (
        <div
          className="bg-card rounded-2xl shadow-card p-4 animate-fade-up stagger-3 card-hover-lift"
          data-ocid="dashboard.sparkline.card"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-sm text-foreground">
              7-Day Earnings Pulse
            </h2>
            <span className="text-xs text-muted-foreground">
              {formatCurrency(totalAmount, currency)} total
            </span>
          </div>
          {tripsLoading ? (
            <div className="h-[80px] skeleton-loader rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={sparklineData} barCategoryGap="20%">
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "oklch(0.47 0.015 230)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [
                    formatCurrency(v, currency),
                    "Earnings",
                  ]}
                  contentStyle={{
                    background: "oklch(1 0 0)",
                    border: "1px solid oklch(0.91 0.005 230)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {sparklineData.map((entry) => (
                    <Cell
                      key={entry.day}
                      fill={
                        entry.amount === maxSparkline && maxSparkline > 0
                          ? "oklch(0.76 0.12 75)"
                          : "oklch(0.58 0.18 240)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Quick actions row */}
      {!hasNoTrips && (
        <div
          className="grid grid-cols-2 gap-3 animate-fade-up stagger-4"
          data-ocid="dashboard.quick_actions.panel"
        >
          <button
            type="button"
            onClick={() => setAddTripOpen(true)}
            className="bg-primary text-primary-foreground rounded-2xl p-4 flex items-center gap-3 shadow-voice btn-press hover:opacity-90 transition-opacity min-h-[56px]"
            data-ocid="dashboard.add_trip.button"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-sm">Log Trip</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("earnings")}
            className="bg-card rounded-2xl p-4 flex items-center gap-3 shadow-card card-hover-lift btn-press min-h-[56px]"
            data-ocid="dashboard.view_earnings.button"
          >
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <span className="font-display font-bold text-sm text-foreground">
              Earnings
            </span>
          </button>
        </div>
      )}

      {/* AI Insights CTA for Tier 3 */}
      {tier === 3 && !hasNoTrips && (
        <button
          type="button"
          onClick={() => onTabChange("intelligence")}
          className="w-full bg-card rounded-2xl shadow-card p-4 flex items-center gap-3 premium-glow card-hover-lift btn-press animate-fade-up stagger-4"
          data-ocid="dashboard.ai_insights.button"
        >
          <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
            <Bot className="w-5 h-5 text-gold" />
          </div>
          <div className="text-left">
            <p className="font-display font-bold text-sm text-foreground">
              Hermes AI Agent
            </p>
            <p className="text-xs text-muted-foreground">
              Your Elite earnings intelligence co-pilot
            </p>
          </div>
          <Badge className="ml-auto bg-gold/20 text-gold border-gold/30 text-[10px]">
            ELITE
          </Badge>
        </button>
      )}

      {/* Recent Trips */}
      {!hasNoTrips && recentTrips.length > 0 && (
        <div
          className="bg-card rounded-2xl shadow-card overflow-hidden animate-fade-up stagger-5"
          data-ocid="dashboard.recent_trips.card"
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="font-display font-bold text-sm text-foreground">
              Recent Trips
            </h2>
            <button
              type="button"
              onClick={() => onTabChange("earnings")}
              className="text-xs text-primary font-medium hover:underline"
              data-ocid="dashboard.all_trips.link"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-border">
            {recentTrips.map((trip, idx) => {
              const style =
                PLATFORM_STYLES[trip.platform] ?? PLATFORM_STYLES.Other;
              return (
                <div
                  key={trip.tripId}
                  className="flex items-center justify-between px-4 py-3"
                  data-ocid={`dashboard.recent_trips.item.${idx + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${style.bg}`}
                    >
                      <span className={`text-[10px] font-bold ${style.text}`}>
                        {trip.platform.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {trip.platform}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(Number(trip.date)).toLocaleDateString()}
                        {Number(trip.durationMinutes) > 0
                          ? ` · ${trip.durationMinutes}min`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-foreground">
                      {formatCurrency(trip.amount, currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTripToDelete(trip)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Delete trip"
                      data-ocid={`dashboard.recent_trips.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming shifts for tier 2+ */}
      {tier >= 2 && upcomingShifts && upcomingShifts.length > 0 && (
        <div
          className="bg-card rounded-2xl shadow-card p-4 animate-fade-up stagger-6"
          data-ocid="dashboard.upcoming_shifts.card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-display font-bold text-sm text-foreground">
              Upcoming Shifts
            </h2>
          </div>
          {upcomingShifts.slice(0, 2).map((shift, idx) => (
            <div
              key={shift.shiftId}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
              data-ocid={`dashboard.shift.item.${idx + 1}`}
            >
              <div>
                <p className="text-sm font-semibold">
                  {new Date(Number(shift.date)).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {shift.startTime} &ndash; {shift.endTime}
                </p>
              </div>
              {shift.targetEarnings > 0 && (
                <span className="text-xs font-bold text-success">
                  Target: {formatCurrency(shift.targetEarnings, currency)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SA footer notices */}
      <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 text-center space-y-1">
        <p className="text-[11px] text-muted-foreground">
          <strong>FAIS:</strong> MoneyDrive is not a financial services
          provider. Information is for informational purposes only.
        </p>
        <p className="text-[11px] text-muted-foreground">
          <strong>POPIA:</strong> Your data is protected under POPIA.
        </p>
      </div>

      <AddTripDialog
        open={addTripOpen}
        onOpenChange={setAddTripOpen}
        currency={currency}
      />

      {/* Delete trip confirmation */}
      <AlertDialog
        open={!!tripToDelete}
        onOpenChange={(open) => {
          if (!open) setTripToDelete(null);
        }}
      >
        <AlertDialogContent data-ocid="dashboard.delete_trip.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The trip from{" "}
              {tripToDelete
                ? new Date(Number(tripToDelete.date)).toLocaleDateString()
                : ""}{" "}
              ({tripToDelete?.platform}) will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="dashboard.delete_trip.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                tripToDelete && deleteTripMut.mutate(tripToDelete.tripId)
              }
              data-ocid="dashboard.delete_trip.confirm_button"
            >
              Remove Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
