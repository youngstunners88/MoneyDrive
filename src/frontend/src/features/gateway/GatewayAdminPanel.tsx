/**
 * GatewayAdminPanel — Admin UI for Cloudflare AI Gateway configuration and metrics.
 * Reads from hooks only — never calls actor directly.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Loader2,
  RadioTower,
  RefreshCw,
  Shield,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { GatewayMetricEntry } from "./types";
import {
  useClearGatewayConfig,
  useGatewayEntries,
  useGatewayMetrics,
  useGatewayStatus,
  useSetGatewayConfig,
} from "./useGatewayMetrics";
import { useGatewayStore } from "./useGatewayStore";

// ── Helpers ────────────────────────────────────────────────────────────────────

function tsToDate(ns: bigint): string {
  const ms = Number(ns) > 1e12 ? Number(ns) / 1_000_000 : Number(ns);
  return new Date(ms).toLocaleString("en-ZA", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function exportEntriesCsv(entries: GatewayMetricEntry[]): void {
  const header = "timestamp,model,durationMs,isGateway,wasCached,error";
  const rows = entries.map((e) => {
    const ms =
      Number(e.timestamp) > 1e12
        ? Number(e.timestamp) / 1_000_000
        : Number(e.timestamp);
    return [
      new Date(ms).toISOString(),
      e.model,
      String(Number(e.durationMs)),
      String(e.isGateway),
      String(e.wasCached),
      `"${(e.error ?? "").replace(/"/g, "'")}"`,
    ].join(",");
  });
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gateway-metrics-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-background rounded-xl border border-border p-4 flex items-start gap-3">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="font-display font-bold text-lg text-foreground leading-tight">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Config Section ─────────────────────────────────────────────────────────────

function GatewayConfigSection() {
  const {
    configForm,
    setConfigFormUrl,
    setConfigFormApiKey,
    resetConfigForm,
    isSaving,
    isTesting,
    testResult,
    setSaving,
    setTesting,
    setTestResult,
  } = useGatewayStore();

  const {
    data: status,
    isLoading: statusLoading,
    refetch,
  } = useGatewayStatus();
  const setConfig = useSetGatewayConfig();
  const clearConfig = useClearGatewayConfig();
  const [showKey, setShowKey] = useState(false);

  const handleSave = async () => {
    if (!configForm.url.trim() || !configForm.apiKey.trim()) return;
    setSaving(true);
    setTestResult(null);
    try {
      await setConfig.mutateAsync({
        url: configForm.url.trim(),
        apiKey: configForm.apiKey.trim(),
      });
      resetConfigForm();
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const start = Date.now();
    try {
      // Test = verify the config was saved by calling getAIGatewayStatus()
      // Real Cloudflare connectivity is tested at the backend level on actual AI calls.
      await refetch();
      const latencyMs = Date.now() - start;
      setTestResult({
        success: true,
        message:
          "Canister connection verified. Real gateway test happens on next AI call.",
        latencyMs,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Connection test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await clearConfig.mutateAsync();
      setTestResult(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4" data-ocid="gateway.config.panel">
      {/* Status line */}
      <div className="flex items-center gap-3">
        {statusLoading ? (
          <Skeleton className="h-6 w-32 rounded-full" />
        ) : status?.configured ? (
          <Badge
            variant="outline"
            className="gap-1.5 bg-primary/10 text-primary border-primary/30 font-semibold"
            data-ocid="gateway.status.active_badge"
          >
            <Wifi className="w-3 h-3" />
            Active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="gap-1.5 bg-muted text-muted-foreground border-border"
            data-ocid="gateway.status.inactive_badge"
          >
            <WifiOff className="w-3 h-3" />
            Not configured
          </Badge>
        )}
        {status?.url && (
          <p
            className="text-[11px] text-muted-foreground truncate max-w-[280px]"
            title={status.url}
          >
            {status.url}
          </p>
        )}
      </div>

      {/* Form */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="gateway-url" className="text-xs font-semibold">
            Gateway URL
          </Label>
          <Input
            id="gateway-url"
            placeholder="https://gateway.ai.cloudflare.com/v1/{account_id}/moneydriver"
            value={configForm.url}
            onChange={(e) => setConfigFormUrl(e.target.value)}
            className="text-sm font-mono"
            autoComplete="off"
            data-ocid="gateway.config.url_input"
          />
          <p className="text-[11px] text-muted-foreground">
            Format:{" "}
            <code className="font-mono">
              https://gateway.ai.cloudflare.com/v1/&#123;account_id&#125;/moneydriver/&#123;provider&#125;
            </code>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gateway-key" className="text-xs font-semibold">
            API Key
          </Label>
          <div className="relative">
            <Input
              id="gateway-key"
              type={showKey ? "text" : "password"}
              placeholder="cf_gateway_***"
              value={configForm.apiKey}
              onChange={(e) => setConfigFormApiKey(e.target.value)}
              className="text-sm font-mono pr-10"
              autoComplete="new-password"
              data-ocid="gateway.config.key_input"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showKey ? "Hide API key" : "Show API key"}
              data-ocid="gateway.config.toggle_key"
            >
              {showKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Stored encrypted in the canister — never displayed after save.
          </p>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className={`rounded-xl border px-3 py-2.5 flex items-start gap-2 ${
            testResult.success
              ? "bg-green-500/10 border-green-500/30"
              : "bg-destructive/10 border-destructive/30"
          }`}
          data-ocid={
            testResult.success
              ? "gateway.test.success_state"
              : "gateway.test.error_state"
          }
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p
              className={`text-xs font-medium ${testResult.success ? "text-green-400" : "text-destructive"}`}
            >
              {testResult.message}
            </p>
            {testResult.latencyMs !== undefined && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Round-trip:{" "}
                <span className="font-mono">{testResult.latencyMs}ms</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={
            isSaving || !configForm.url.trim() || !configForm.apiKey.trim()
          }
          className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
          data-ocid="gateway.config.save_button"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Shield className="w-3.5 h-3.5" />
          )}
          Save Gateway Config
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={isTesting}
          className="gap-1.5"
          data-ocid="gateway.config.test_button"
        >
          {isTesting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RadioTower className="w-3.5 h-3.5" />
          )}
          Test Connection
        </Button>

        {status?.configured && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleClear}
            disabled={isSaving}
            className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
            data-ocid="gateway.config.disable_button"
          >
            <WifiOff className="w-3.5 h-3.5" />
            Disable Gateway
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Metrics Dashboard ──────────────────────────────────────────────────────────

function GatewayMetricsDashboard() {
  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch,
  } = useGatewayMetrics();
  const { data: entries = [], isLoading: entriesLoading } =
    useGatewayEntries(20);

  const total = Number(metrics?.totalRequests ?? 0);
  const gateway = Number(metrics?.gatewayRequests ?? 0);
  const cacheHits = Number(metrics?.cacheHits ?? 0);
  const gatewayPct = total > 0 ? Math.round((gateway / total) * 100) : 0;
  const cachePct = gateway > 0 ? Math.round((cacheHits / gateway) * 100) : 0;
  const avgGateway = Number(metrics?.avgGatewayMs ?? 0);

  return (
    <div className="space-y-4" data-ocid="gateway.metrics.panel">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm text-foreground">
          Gateway Metrics
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => refetch()}
          className="h-7 px-2 gap-1 text-xs"
          data-ocid="gateway.metrics.refresh_button"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      {metricsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          data-ocid="gateway.metrics.cards"
        >
          <MetricCard
            icon={<Activity className="w-4 h-4 text-primary" />}
            label="Total Requests"
            value={total.toLocaleString()}
            color="bg-primary/10"
          />
          <MetricCard
            icon={<Wifi className="w-4 h-4 text-blue-400" />}
            label="Gateway %"
            value={`${gatewayPct}%`}
            sub={`${gateway} via gateway`}
            color="bg-blue-500/10"
          />
          <MetricCard
            icon={<Zap className="w-4 h-4 text-gold" />}
            label="Cache Hit Rate"
            value={`${cachePct}%`}
            sub={`${cacheHits} cache hits`}
            color="bg-gold/10"
          />
          <MetricCard
            icon={<Activity className="w-4 h-4 text-green-400" />}
            label="Avg Latency"
            value={`${avgGateway}ms`}
            sub="gateway avg"
            color="bg-green-500/10"
          />
        </div>
      )}

      {/* Recent entries table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Entries (last 20)
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => exportEntriesCsv(entries)}
            disabled={entries.length === 0}
            className="h-7 px-2 gap-1 text-xs"
            data-ocid="gateway.metrics.export_button"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </Button>
        </div>

        {entriesLoading ? (
          <div className="space-y-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div
            className="py-6 text-center rounded-xl border border-border bg-muted/30"
            data-ocid="gateway.metrics.empty_state"
          >
            <p className="text-xs text-muted-foreground">
              No requests recorded yet. AI calls will appear here once the
              gateway is active.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border border-border overflow-hidden"
            data-ocid="gateway.metrics.entries.list"
          >
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1.5fr_80px_80px_80px] bg-muted/50 px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
              <span>Time</span>
              <span>Model</span>
              <span className="text-right">Duration</span>
              <span className="text-center">Route</span>
              <span className="text-center">Cache</span>
            </div>
            {entries.map((entry, idx) => (
              <div
                key={`entry-${String(entry.timestamp)}-${idx}`}
                className={`grid grid-cols-[1fr_1.5fr_80px_80px_80px] px-3 py-2.5 text-xs items-center ${
                  idx < entries.length - 1 ? "border-b border-border/50" : ""
                } ${entry.error ? "bg-destructive/5" : ""}`}
                data-ocid={`gateway.metrics.entries.item.${idx + 1}`}
              >
                <span className="text-muted-foreground font-mono text-[10px] truncate">
                  {tsToDate(entry.timestamp)}
                </span>
                <span className="text-foreground font-mono text-[11px] truncate">
                  {entry.model || "—"}
                </span>
                <span className="text-right font-mono text-foreground">
                  {Number(entry.durationMs)}ms
                </span>
                <span className="text-center">
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 ${
                      entry.isGateway
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {entry.isGateway ? "GW" : "Direct"}
                  </Badge>
                </span>
                <span className="text-center">
                  {entry.wasCached ? (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 bg-green-500/10 text-green-400 border-green-500/30"
                    >
                      HIT
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export function GatewayAdminPanel() {
  const { data: status } = useGatewayStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-ocid="gateway.panel">
      {/* Config card */}
      <Card className="shadow-card" data-ocid="gateway.config.card">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
              <RadioTower className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-foreground">
                Cloudflare AI Gateway
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Proxy all OpenRouter and ElevenLabs calls through Cloudflare for
                caching, rate limiting, and cost analytics.
              </p>
            </div>
          </div>
          <GatewayConfigSection />
        </CardContent>
      </Card>

      {/* Metrics card — only shown when gateway is configured */}
      {status?.configured && (
        <Card className="shadow-card" data-ocid="gateway.metrics.card">
          <CardContent className="p-5">
            <GatewayMetricsDashboard />
          </CardContent>
        </Card>
      )}

      {!status?.configured && (
        <div
          className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center"
          data-ocid="gateway.metrics.empty_state"
        >
          <Wifi className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">
            Configure and save a Gateway URL above to see metrics.
          </p>
        </div>
      )}
    </div>
  );
}
