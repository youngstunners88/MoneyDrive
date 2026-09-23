/**
 * OrbisPublisherPanel.tsx — Admin panel for listing MoneyDrive intelligence on Orbis marketplace.
 * Self-contained — reads its own hooks, no props from parent.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  DollarSign,
  Eye,
  EyeOff,
  Info,
  Loader2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  useOrbisPublisherStatus,
  useSetOrbisPublisherConfig,
} from "./useIntelligence";

export function OrbisPublisherPanel() {
  const [providerApiKey, setProviderApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [listingName, setListingName] = useState(
    "MoneyDrive SA Intelligence API",
  );
  const [pricePerCall, setPricePerCall] = useState("0.05");
  const [autoPublish, setAutoPublish] = useState(true);

  const { data: status, isLoading } = useOrbisPublisherStatus();
  const saveConfig = useSetOrbisPublisherConfig();

  const handleSaveAndPublish = async () => {
    const price = Number.parseFloat(pricePerCall);
    if (Number.isNaN(price) || price <= 0) return;
    await saveConfig.mutateAsync({
      providerApiKey: providerApiKey.trim(),
      listingName: listingName.trim() || "MoneyDrive SA Intelligence API",
      pricePerCall: price,
      autoPublish,
    });
    setProviderApiKey("");
  };

  const usdcEarned = status?.usdcEarned ?? 0;
  const totalCalls = status?.totalCalls ?? 0;

  return (
    <div
      className="space-y-4 pt-1"
      data-ocid="settings.admin.orbis_publisher.panel"
    >
      <p className="text-xs text-muted-foreground leading-relaxed">
        Publish MoneyDrive's anonymised SA driving intelligence on the Orbis
        marketplace — earn USDC per API call. Researchers, AI agents, and fleet
        operators pay for insights like top earning zones, surge windows, and ad
        conversion rates. All raw driver data stays encrypted and private.
      </p>

      {/* Status card */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          background: status?.listed
            ? "oklch(0.55 0.14 145 / 0.06)"
            : "oklch(0.94 0.06 85 / 0.3)",
          border: status?.listed
            ? "1px solid oklch(0.55 0.14 145 / 0.25)"
            : "1px solid oklch(0.75 0.12 85 / 0.3)",
        }}
        data-ocid="settings.admin.orbis_publisher.status_card"
      >
        {/* Listing badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : status?.listed ? (
            <>
              <Badge
                className="gap-1.5 text-xs"
                style={{
                  background: "oklch(0.55 0.14 145 / 0.15)",
                  color: "oklch(0.35 0.14 145)",
                  border: "1px solid oklch(0.55 0.14 145 / 0.3)",
                }}
                data-ocid="settings.admin.orbis_publisher.listed_badge"
              >
                <Check className="w-3 h-3" />
                Listed on Orbis
              </Badge>
              {status.listingId && (
                <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">
                  ID: {status.listingId}
                </span>
              )}
            </>
          ) : (
            <Badge
              variant="outline"
              className="gap-1.5 text-xs text-muted-foreground"
              data-ocid="settings.admin.orbis_publisher.unlisted_badge"
            >
              <Info className="w-3 h-3" />
              Not listed yet
            </Badge>
          )}
        </div>

        {/* Earnings metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-lg p-3 text-center"
            style={{
              background: "oklch(0.75 0.12 85 / 0.12)",
              border: "1px solid oklch(0.75 0.12 85 / 0.25)",
            }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.55 0.12 85)" }}
              />
            </div>
            <p
              className="font-display font-bold text-lg"
              style={{ color: "oklch(0.40 0.12 85)" }}
            >
              {totalCalls.toLocaleString()}
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              API Calls
            </p>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{
              background: "oklch(0.55 0.14 145 / 0.10)",
              border: "1px solid oklch(0.55 0.14 145 / 0.25)",
            }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.40 0.14 145)" }}
              />
            </div>
            <p
              className="font-display font-bold text-lg"
              style={{ color: "oklch(0.35 0.14 145)" }}
            >
              ${usdcEarned.toFixed(2)}
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              USDC Earned
            </p>
          </div>
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">
            Data exposed is strictly anonymised — no individual driver
            information is included. Only city-level and platform-level
            aggregates are served.
          </p>
        </div>
      </div>

      {/* Config form */}
      <div className="space-y-3">
        {/* Provider API Key */}
        <div className="space-y-1.5">
          <Label
            className="text-xs font-semibold"
            style={{ color: "oklch(0.30 0.10 35)" }}
          >
            Orbis Provider API Key
          </Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={
                status?.listed ? "•••••••••••• (key set)" : "sk_provider_..."
              }
              value={providerApiKey}
              onChange={(e) => setProviderApiKey(e.target.value)}
              className="pr-10 font-mono text-xs"
              autoComplete="new-password"
              data-ocid="settings.admin.orbis_publisher.key.input"
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
          <p className="text-[11px] text-muted-foreground">
            Get your provider key at{" "}
            <a
              href="https://orbisapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
              style={{ color: "oklch(0.50 0.18 35)" }}
            >
              orbisapi.com ↗
            </a>
          </p>
        </div>

        {/* Listing name */}
        <div className="space-y-1.5">
          <Label
            className="text-xs font-semibold"
            style={{ color: "oklch(0.30 0.10 35)" }}
          >
            Listing Name
          </Label>
          <Input
            type="text"
            value={listingName}
            onChange={(e) => setListingName(e.target.value)}
            placeholder="MoneyDrive SA Intelligence API"
            className="text-sm"
            data-ocid="settings.admin.orbis_publisher.listing_name.input"
          />
        </div>

        {/* Price per call */}
        <div className="space-y-1.5">
          <Label
            className="text-xs font-semibold"
            style={{ color: "oklch(0.30 0.10 35)" }}
          >
            Price per call (USDC)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              min="0.001"
              value={pricePerCall}
              onChange={(e) => setPricePerCall(e.target.value)}
              className="w-28 font-mono text-sm"
              data-ocid="settings.admin.orbis_publisher.price.input"
            />
            <span className="text-xs text-muted-foreground">
              USDC — you keep 80%
            </span>
          </div>
        </div>

        {/* Auto-publish toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p
              className="text-xs font-medium"
              style={{ color: "oklch(0.30 0.10 35)" }}
            >
              Auto-publish listing
            </p>
            <p className="text-[11px] text-muted-foreground">
              Automatically publish to Orbis marketplace after saving
            </p>
          </div>
          <Switch
            checked={autoPublish}
            onCheckedChange={setAutoPublish}
            data-ocid="settings.admin.orbis_publisher.auto_publish.switch"
          />
        </div>

        {/* Save button */}
        <Button
          onClick={handleSaveAndPublish}
          disabled={saveConfig.isPending}
          size="sm"
          className="w-full gap-2"
          data-ocid="settings.admin.orbis_publisher.save_button"
        >
          {saveConfig.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          {saveConfig.isPending ? "Publishing..." : "Save & Publish"}
        </Button>
      </div>
    </div>
  );
}
