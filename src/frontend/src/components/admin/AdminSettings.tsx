/**
 * AdminSettings.tsx — Exa Company Research admin section.
 * Follows the same card/section pattern as Tavily and Browserbase panels.
 * Paste into the Admin Panel in SettingsPage.tsx.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Eye, EyeOff, FlaskConical, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

// ─── Actor extension type ─────────────────────────────────────────────────────

type ExaActorExt = {
  setExaApiKey?: (
    key: string,
  ) => Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
  getExaApiKey?: () => Promise<string>;
  testExaCompanyResearch?: (
    companyName: string,
  ) => Promise<{ ok: string } | { err: string }>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ExaAdminSection() {
  const { actor } = useActor();
  const [exaKey, setExaKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const { data: maskedKey, refetch: refetchMasked } = useQuery<string | null>({
    queryKey: ["exaApiKeyMasked"],
    queryFn: async () => {
      if (!actor) return null;
      const ext = actor as typeof actor & ExaActorExt;
      if (!ext.getExaApiKey) return null;
      const result = await ext.getExaApiKey();
      return result || null;
    },
    enabled: !!actor,
  });

  const isConfigured = !!maskedKey && maskedKey.length > 0;

  const saveKeyMut = useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("Actor not available");
      const ext = actor as typeof actor & ExaActorExt;
      if (!ext.setExaApiKey) throw new Error("setExaApiKey not available");
      const result = await ext.setExaApiKey(key);
      if (result.__kind__ === "err") {
        throw new Error((result as { __kind__: "err"; err: string }).err);
      }
    },
    onSuccess: () => {
      toast.success("Exa API key saved securely.");
      setExaKey("");
      refetchMasked();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save Exa API key."),
  });

  const testMut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const ext = actor as typeof actor & ExaActorExt;
      if (!ext.testExaCompanyResearch)
        throw new Error("testExaCompanyResearch not available");
      const result = await ext.testExaCompanyResearch("Uber South Africa");
      if ("err" in result) {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: (data) => {
      setTestResult(data);
      toast.success("Exa test successful — company data returned.");
    },
    onError: (err: Error) => {
      setTestResult(null);
      toast.error(err.message || "Exa test failed.");
    },
  });

  return (
    <div
      className="border-t pt-4 space-y-3"
      style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
      data-ocid="settings.admin.exa.section"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Search className="w-4 h-4" style={{ color: "oklch(0.50 0.18 35)" }} />
        <Label
          className="text-sm font-medium"
          style={{ color: "oklch(0.30 0.10 35)" }}
        >
          Exa Company Research
        </Label>
        <Badge
          className="bg-gold/20 border text-[10px]"
          style={{
            color: "oklch(0.30 0.10 35)",
            borderColor: "oklch(0.75 0.12 85 / 0.5)",
          }}
        >
          ADMIN
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Exa powers Nduna's company research — gives your leads real company data
        (size, industry, contact) for more personalised pitch decks. Get your
        key at{" "}
        <a
          href="https://exa.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2"
          style={{ color: "oklch(0.50 0.18 35)" }}
        >
          exa.ai ↗
        </a>
      </p>

      {/* Status pill */}
      <div
        className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
          isConfigured
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-muted text-muted-foreground border border-border"
        }`}
        data-ocid="settings.admin.exa.status"
      >
        {isConfigured ? (
          <>
            <Check className="w-3.5 h-3.5 shrink-0" />
            Configured ✓ — {maskedKey}
          </>
        ) : (
          <>
            <X className="w-3.5 h-3.5 shrink-0" />
            Not configured — enter your Exa API key below
          </>
        )}
      </div>

      {/* Key input + Save */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? "text" : "password"}
            placeholder="exa_..."
            value={exaKey}
            onChange={(e) => setExaKey(e.target.value)}
            className="pr-10 bg-background"
            data-ocid="settings.admin.exa_key.input"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showKey ? "Hide Exa key" : "Show Exa key"}
          >
            {showKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        <Button
          onClick={() => saveKeyMut.mutate(exaKey)}
          disabled={!exaKey.trim() || saveKeyMut.isPending}
          size="sm"
          className="shrink-0"
          data-ocid="settings.admin.exa_key.save_button"
        >
          {saveKeyMut.isPending ? "Saving..." : "Save Key"}
        </Button>
      </div>

      {/* Test button */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => testMut.mutate()}
          disabled={!isConfigured || testMut.isPending}
          className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          data-ocid="settings.admin.exa_test.button"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          {testMut.isPending ? "Testing..." : "Test — Uber South Africa"}
        </Button>
        {!isConfigured && (
          <span className="text-[11px] text-muted-foreground">
            Save a key first to enable testing
          </span>
        )}
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className="rounded-xl p-3 text-xs font-mono leading-relaxed break-words overflow-auto max-h-32"
          style={{
            background: "oklch(0.50 0.18 145 / 0.08)",
            border: "1px solid oklch(0.50 0.18 145 / 0.25)",
            color: "oklch(0.35 0.14 145)",
          }}
          data-ocid="settings.admin.exa_test.success_state"
        >
          <span className="font-semibold not-italic block mb-1 flex items-center gap-1.5">
            <Check className="w-3 h-3" /> Exa test result
          </span>
          {testResult}
        </div>
      )}

      {/* Info note */}
      <p
        className="text-xs rounded-lg px-3 py-2"
        style={{
          color: "oklch(0.50 0.18 35)",
          backgroundColor: "oklch(0.94 0.06 85 / 0.5)",
        }}
      >
        Exa enrichment runs automatically during weekly lead refresh. Results
        appear as "Verified by Exa" badges on lead cards with detailed company
        insights drivers can use when crafting pitches.
      </p>
    </div>
  );
}

export default ExaAdminSection;
