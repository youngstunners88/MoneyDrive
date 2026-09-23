/**
 * AdminPilotModePage.tsx — Admin-only feature flag control for the 90-day free pilot.
 * Route: admin-pilot-mode tab (admin-gated).
 *
 * Shows current pilot mode status, a toggle button, and a clear list of
 * what is blocked in pilot mode and what stays active.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Lock,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Unlock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useAppStore } from "../stores/appStore";

/** Actor subset for pilot mode methods */
type ActorWithPilot = {
  getPilotMode?: () => Promise<boolean>;
  setPilotMode?: (
    enabled: boolean,
  ) => Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
};

const PILOT_BLOCKED = [
  { label: "ElevenLabs Voice Synthesis", reason: "Paid per-character API" },
  { label: "Whisper Transcription", reason: "Paid per-minute API" },
  {
    label: "Camofox Residential Proxy",
    reason: "Paid proxy cost per lead batch",
  },
  {
    label: "360dialog Paid WhatsApp Templates",
    reason: "Per-message cost in pilot",
  },
  { label: "Tavily Paid Web Search Tier", reason: "Billed per query" },
  {
    label: "OpenRouter Paid Models",
    reason: "Only free-tier models (DeepSeek, Llama, Qwen)",
  },
];

const PILOT_ACTIVE = [
  { label: "Nduna AI Chat (free models)", reason: "DeepSeek, Llama 3.3, Qwen" },
  { label: "Dashboard & Earnings Tracker", reason: "Core Tier 1/2 features" },
  { label: "Smart Scheduling", reason: "Core Tier 2 feature" },
  { label: "Fuel Intelligence", reason: "Core Tier 1 feature" },
  { label: "In-Car Retail QR Menu", reason: "Core Tier 2 feature" },
  { label: "Expense Tracking", reason: "Core Tier 1 feature" },
  { label: "Referral Engine", reason: "Zero API cost" },
  { label: "SnapScan Payment Gateway", reason: "Payments always active" },
  { label: "Google Maps / TomTom (free tier)", reason: "Free-tier only calls" },
  { label: "MiniPay Savings Tools", reason: "No API cost" },
];

interface AdminPilotModePageProps {
  isAdmin: boolean;
}

export default function AdminPilotModePage({
  isAdmin,
}: AdminPilotModePageProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { setPilotMode: setStorePilotMode } = useAppStore();

  const {
    data: pilotMode,
    isLoading,
    error,
  } = useQuery<boolean>({
    queryKey: ["pilotMode"],
    queryFn: async () => {
      if (!actor) return true;
      const actorExt = actor as unknown as ActorWithPilot;
      if (typeof actorExt.getPilotMode !== "function") return false;
      return actorExt.getPilotMode();
    },
    enabled: !!actor && isAdmin,
    staleTime: 10_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("No actor");
      const actorExt = actor as unknown as ActorWithPilot;
      if (typeof actorExt.setPilotMode !== "function") {
        throw new Error("setPilotMode not available on this canister version");
      }
      const result = await actorExt.setPilotMode(enabled);
      if (result && result.__kind__ === "err") throw new Error(result.err);
      return enabled;
    },
    onSuccess: (enabled) => {
      setStorePilotMode(enabled);
      queryClient.setQueryData(["pilotMode"], enabled);
      toast.success(
        enabled
          ? "Pilot Mode enabled — Tier 1 & 2 are now free for 90 days"
          : "Pilot Mode disabled — full pricing restored",
      );
    },
    onError: (err: Error) => {
      toast.error(`Failed to update pilot mode: ${err.message}`);
    },
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="bg-card rounded-2xl shadow-card p-10 max-w-sm w-full text-center">
          <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display font-bold text-lg text-foreground mb-2">
            Admin Access Required
          </h2>
          <p className="text-sm text-muted-foreground">
            This page is restricted to MoneyDrive administrators.
          </p>
        </div>
      </div>
    );
  }

  const currentMode = pilotMode ?? true;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg text-foreground">
            Pilot Mode
          </h1>
          <p className="text-xs text-muted-foreground">
            90-day free pilot — Tier 1 &amp; 2 features at no cost
          </p>
        </div>
        <Badge
          className={`ml-auto text-xs font-bold px-2.5 py-1 ${
            currentMode
              ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
              : "bg-muted text-muted-foreground border-border"
          }`}
          variant="outline"
          data-ocid="admin_pilot_mode.status_badge"
        >
          {isLoading ? "Loading…" : currentMode ? "PILOT ON" : "PILOT OFF"}
        </Badge>
      </div>

      {/* Status card + toggle */}
      <Card className="shadow-card" data-ocid="admin_pilot_mode.status.card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            {currentMode ? (
              <ToggleRight className="w-5 h-5 text-amber-600" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-muted-foreground" />
            )}
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/10">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">
                Could not reach backend — pilot mode methods may not be deployed
                yet.
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading pilot mode status…
            </div>
          ) : (
            <div
              className={`rounded-xl border p-4 flex items-start gap-3 ${
                currentMode
                  ? "border-amber-300 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
              data-ocid="admin_pilot_mode.current_state"
            >
              {currentMode ? (
                <FlaskConical className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${currentMode ? "text-amber-900" : "text-emerald-900"}`}
                >
                  {currentMode
                    ? "Pilot Mode is ON — 90-day free trial active"
                    : "Pilot Mode is OFF — full pricing in effect"}
                </p>
                <p
                  className={`text-xs mt-0.5 ${currentMode ? "text-amber-700" : "text-emerald-700"}`}
                >
                  {currentMode
                    ? "Tier 1 & 2 are free. Paid API calls are stubbed. Only free LLM models allowed."
                    : "All features and APIs run normally. Subscription pricing is shown as configured."}
                </p>
              </div>
            </div>
          )}

          <Button
            className="w-full gap-2"
            variant={currentMode ? "outline" : "default"}
            onClick={() => toggleMutation.mutate(!currentMode)}
            disabled={isLoading || toggleMutation.isPending}
            data-ocid="admin_pilot_mode.toggle.button"
          >
            {toggleMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentMode ? (
              <Unlock className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {toggleMutation.isPending
              ? "Updating…"
              : currentMode
                ? "Disable Pilot Mode (restore pricing)"
                : "Enable Pilot Mode (90-day free)"}
          </Button>
        </CardContent>
      </Card>

      {/* What is blocked */}
      <Card className="shadow-card" data-ocid="admin_pilot_mode.blocked.card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <X className="w-4 h-4 text-destructive" />
            Blocked in Pilot Mode (paid API calls)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {PILOT_BLOCKED.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-2.5 py-2 border-b border-border/50 last:border-0"
              data-ocid={`admin_pilot_mode.blocked.${item.label.toLowerCase().replace(/\W+/g, "_")}`}
            >
              <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                <X className="w-3 h-3 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.reason}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* What stays active */}
      <Card className="shadow-card" data-ocid="admin_pilot_mode.active.card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Always Active (even in Pilot Mode)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {PILOT_ACTIVE.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-2.5 py-2 border-b border-border/50 last:border-0"
              data-ocid={`admin_pilot_mode.active.${item.label.toLowerCase().replace(/\W+/g, "_")}`}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.reason}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pilot copy note */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">
            Subscription copy when pilot is ON:
          </strong>{" "}
          All pricing and paywall screens show{" "}
          <em>
            "Free 90-day pilot — no card required. We'll ask for feedback in
            exchange."
          </em>{" "}
          instead of tier prices. Tier 3 features are hidden from the
          navigation. No code is deleted — features are conditionally rendered.
        </p>
      </div>
    </div>
  );
}
