/**
 * BrowserbasePanel.tsx — Admin config panel for Browserbase cloud hunting.
 * Self-contained — reads its own hooks, no props from parent.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Check,
  Cloud,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import {
  useIsBrowserbaseConfigured,
  useSetBrowserbaseConfig,
} from "./useIntelligence";

export function BrowserbasePanel() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  const {
    data: isConfigured,
    isLoading: checkLoading,
    refetch,
  } = useIsBrowserbaseConfigured();
  const saveConfig = useSetBrowserbaseConfig();

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    await saveConfig.mutateAsync(apiKey.trim());
    setApiKey("");
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      await refetch();
      setTestResult("ok");
    } catch {
      setTestResult("fail");
    }
  };

  return (
    <div
      className="space-y-3 pt-1"
      data-ocid="settings.admin.browserbase.panel"
    >
      <p className="text-xs text-muted-foreground leading-relaxed">
        Cloud-hosted browser sessions with anti-bot stealth and CAPTCHA solving
        — smarter opportunity discovery without loading your VPS. Free tier:
        1,000 minutes/month. Get your key at{" "}
        <a
          href="https://www.browserbase.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold"
          style={{ color: "oklch(0.50 0.18 35)" }}
        >
          browserbase.com ↗
        </a>
      </p>

      {/* Status indicator */}
      <div
        className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
          isConfigured
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-muted text-muted-foreground border border-border"
        }`}
        data-ocid="settings.admin.browserbase.status"
      >
        {checkLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : isConfigured ? (
          <>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="flex-1">Cloud hunting active</span>
            <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 shrink-0">
              Configured
            </Badge>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
            <span className="flex-1">Not configured</span>
          </>
        )}
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className={`rounded-lg px-3 py-2 flex items-center gap-2 text-xs ${
            testResult === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
          data-ocid={
            testResult === "ok"
              ? "settings.admin.browserbase.success_state"
              : "settings.admin.browserbase.error_state"
          }
        >
          {testResult === "ok" ? (
            <>
              <Check className="w-3.5 h-3.5 shrink-0" /> Connection verified.
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Connection
              check failed.
            </>
          )}
        </div>
      )}

      {/* API key input */}
      <div className="space-y-1.5">
        <Label className="text-xs" style={{ color: "oklch(0.30 0.10 35)" }}>
          Browserbase API Key
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={
                isConfigured ? "•••••••••••• (key set)" : "bb_live_..."
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
              data-ocid="settings.admin.browserbase_key.input"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!apiKey.trim() || saveConfig.isPending}
            className="shrink-0 gap-1.5"
            data-ocid="settings.admin.browserbase.save_button"
          >
            {saveConfig.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Cloud className="w-3.5 h-3.5" />
            )}
            {saveConfig.isPending ? "Saving..." : "Save Key"}
          </Button>
        </div>
      </div>

      {/* Test connection */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleTest}
        className="gap-1.5 text-xs w-full"
        data-ocid="settings.admin.browserbase.test_button"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Test Connection
      </Button>

      {/* Schedule note */}
      <p
        className="text-xs rounded-lg px-3 py-2"
        style={{
          color: "oklch(0.50 0.18 35)",
          backgroundColor: "oklch(0.94 0.06 85 / 0.5)",
        }}
      >
        Scans run automatically every Monday at 2 AM, and on-demand from the
        Opportunities page. API key is stored securely in the backend — never
        visible to drivers.
      </p>
    </div>
  );
}
