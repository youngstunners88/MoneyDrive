/**
 * WebsiteBuilderPage.tsx — Nduna's Driver Website Builder.
 * Tier 3 (Elite) exclusive: generates a full professional website from a topic prompt.
 * Enhanced with stacked design skill system, device preview, iteration chips, and progress steps.
 * Publishing: here.now (free permanent hosting on Cloudflare's global network).
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  Monitor,
  RefreshCw,
  Share2,
  Smartphone,
  Sparkles,
  Tablet,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

// ─── Types ─────────────────────────────────────────────────────────────────────

type WebsiteJobStatus = "pending" | "generating" | "ready" | "failed";
type DeviceMode = "mobile" | "tablet" | "desktop";

interface WebsiteJob {
  id: string;
  topic: string;
  status: WebsiteJobStatus;
  htmlContent?: string;
  shareUrl?: string;
  errorMsg?: string;
  createdAt: bigint;
}

type WebsiteBuilderActor = {
  generateDriverWebsite?: (
    topic: string,
  ) => Promise<{ ok: WebsiteJob } | { err: string }>;
  iterateDriverWebsite?: (
    jobId: string,
    instruction: string,
  ) => Promise<{ ok: WebsiteJob } | { err: string }>;
  getWebsiteJob?: (
    jobId: string,
  ) => Promise<{ __kind__: "Some"; value: WebsiteJob } | { __kind__: "None" }>;
  getWebsiteJobs?: () => Promise<WebsiteJob[]>;
  getWebsiteBuilderRateLimit?: () => Promise<bigint>;
  sendWebsiteByEmail?: (
    jobId: string,
    websiteHtml: string,
  ) => Promise<{ ok: null } | { err: string }>;
  publishDriverWebsite?: (
    jobId: string,
  ) => Promise<{ ok: { liveUrl: string; claimUrl: string } } | { err: string }>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 5;
const POLL_INTERVAL_MS = 3000;
const HERE_NOW_API = "https://api.here.now/v1/sites";

const SKILL_BADGES = [
  { label: "taste-skill", color: "oklch(0.60 0.22 35)" },
  { label: "SuperDesign", color: "oklch(0.75 0.12 85)" },
  { label: "frontend-slides", color: "oklch(0.55 0.14 145)" },
  { label: "interaction-design", color: "oklch(0.65 0.18 290)" },
];

const SERVICE_PRESETS = [
  { value: "airport", label: "Airport Transfers" },
  { value: "corporate", label: "Corporate" },
  { value: "family", label: "Family / School Runs" },
  { value: "latenight", label: "Late Night" },
  { value: "general", label: "General" },
  { value: "budget", label: "Budget" },
];

const STYLE_PRESETS = [
  {
    label: "Township Bold",
    direction: "township energy with bold SA colors, vibrant and energetic",
    accent: "oklch(0.60 0.22 35)",
  },
  {
    label: "Luxury Dark",
    direction: "luxury executive aesthetic, dark navy with gold accents",
    accent: "oklch(0.75 0.12 85)",
  },
  {
    label: "Clean & Professional",
    direction: "clean, professional, minimal design for corporate clients",
    accent: "oklch(0.65 0.03 85)",
  },
  {
    label: "Bold & Energetic",
    direction: "bold, high-contrast, full of energy and movement",
    accent: "oklch(0.60 0.22 35)",
  },
];

const ITERATION_CHIPS = [
  "More premium",
  "Bolder animations",
  "Change colors",
  "Add testimonials",
  "Simpler",
  "More SA feel",
];

const GENERATION_STEPS = [
  "Setting SA design taste…",
  "Building layout structure…",
  "Adding animations…",
  "Polishing interactions…",
];

const DEVICE_CONFIG: Record<DeviceMode, { width: string; label: string }> = {
  mobile: { width: "375px", label: "Mobile" },
  tablet: { width: "768px", label: "Tablet" },
  desktop: { width: "100%", label: "Desktop" },
};

const STATUS_CFG: Record<
  WebsiteJobStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Queued",
    cls: "bg-muted/60 text-muted-foreground",
    icon: <Clock className="w-3 h-3" />,
  },
  generating: {
    label: "Generating",
    cls: "bg-primary/15 text-primary",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  ready: {
    label: "Ready",
    cls: "bg-primary/20 text-primary",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  failed: {
    label: "Failed",
    cls: "bg-destructive/15 text-destructive",
    icon: <XCircle className="w-3 h-3" />,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts: bigint) {
  const ms = Number(ts / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function todayJobCount(jobs: WebsiteJob[]): number {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  return jobs.filter((j) => {
    const ms = Number(j.createdAt / BigInt(1_000_000));
    return ms >= todayMs;
  }).length;
}

/**
 * Client-side publish to here.now.
 * Posts the HTML blob directly from the browser — no backend required.
 * Returns { liveUrl, claimUrl }.
 */
async function publishToHereNow(
  html: string,
  subdomain: string,
): Promise<{ liveUrl: string; claimUrl: string }> {
  const blob = new Blob([html], { type: "text/html" });
  const form = new FormData();
  form.append("file", blob, "index.html");
  form.append("subdomain", subdomain);

  const res = await fetch(HERE_NOW_API, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    // here.now returns JSON errors
    let msg = "Publishing failed";
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      msg = body.error ?? body.message ?? msg;
    } catch {
      // ignore parse errors
    }
    throw new Error(msg);
  }

  const data = (await res.json()) as {
    url?: string;
    liveUrl?: string;
    claimUrl?: string;
  };

  const liveUrl = data.liveUrl ?? data.url ?? `https://${subdomain}.here.now`;
  const claimUrl =
    data.claimUrl ??
    `https://here.now/claim?site=${encodeURIComponent(subdomain)}`;

  return { liveUrl, claimUrl };
}

// ─── GenerationProgress ───────────────────────────────────────────────────────

function GenerationProgress() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s < GENERATION_STEPS.length - 1 ? s + 1 : s));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="p-5 rounded-xl border space-y-4"
      style={{
        background: "oklch(0.60 0.22 35 / 0.08)",
        borderColor: "oklch(0.60 0.22 35 / 0.3)",
      }}
      data-ocid="website-builder.generating_state"
    >
      <div className="flex items-center gap-3">
        <img
          src="https://i.imgur.com/u98U7S6.png"
          alt="Nduna"
          className="w-12 h-12 rounded-full object-cover border-2 shrink-0 animate-pulse"
          style={{ borderColor: "oklch(0.75 0.12 85 / 0.5)" }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Nduna is designing your website…
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Using 4 stacked design skills — crafting something unforgettable
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="space-y-2">
        {GENERATION_STEPS.map((step, i) => (
          <div
            key={step}
            className="flex items-center gap-2.5 transition-all duration-500"
            style={{ opacity: i <= activeStep ? 1 : 0.3 }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500"
              style={{
                background:
                  i < activeStep
                    ? "oklch(0.55 0.14 145)"
                    : i === activeStep
                      ? "oklch(0.60 0.22 35)"
                      : "oklch(0.22 0.02 85)",
                border:
                  i === activeStep
                    ? "2px solid oklch(0.60 0.22 35 / 0.6)"
                    : "none",
              }}
            >
              {i < activeStep ? (
                <CheckCircle className="w-3 h-3 text-background" />
              ) : i === activeStep ? (
                <Loader2 className="w-3 h-3 text-background animate-spin" />
              ) : (
                <span
                  className="text-[9px] font-bold"
                  style={{ color: "oklch(0.65 0.03 85)" }}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <span
              className="text-sm transition-all duration-300"
              style={{
                color:
                  i === activeStep
                    ? "oklch(0.60 0.22 35)"
                    : i < activeStep
                      ? "oklch(0.55 0.14 145)"
                      : "oklch(0.65 0.03 85)",
                fontWeight: i === activeStep ? 600 : 400,
              }}
            >
              {i + 1}. {step}
            </span>
          </div>
        ))}
      </div>

      {/* Skeleton preview */}
      <div className="space-y-2 pt-1">
        <Skeleton
          className="w-full h-3 rounded"
          style={{ background: "oklch(0.60 0.22 35 / 0.12)" }}
        />
        <Skeleton
          className="w-3/4 h-3 rounded"
          style={{ background: "oklch(0.75 0.12 85 / 0.10)" }}
        />
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {[1, 2, 3].map((k) => (
            <Skeleton
              key={k}
              className="h-8 rounded"
              style={{ background: "oklch(0.60 0.22 35 / 0.08)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SitePreview ──────────────────────────────────────────────────────────────

function SitePreview({
  html,
  device,
  onFullScreen,
}: {
  html: string;
  device: DeviceMode;
  onFullScreen: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [html]);

  if (!html || !blobUrl) return null;

  const isMobile = device === "mobile";

  return (
    <div
      className="rounded-xl overflow-hidden border-2"
      style={{ borderColor: "oklch(0.60 0.22 35 / 0.5)" }}
      data-ocid="website-builder.preview_panel"
    >
      {/* Preview bar */}
      <div
        className="px-3 py-2 flex items-center justify-between gap-2"
        style={{
          background: "oklch(0.60 0.22 35 / 0.15)",
        }}
      >
        <div
          className="flex items-center gap-2 text-xs font-semibold"
          style={{ color: "oklch(0.80 0.12 35)" }}
        >
          <Globe className="w-3.5 h-3.5" />
          Live Preview — {DEVICE_CONFIG[device].label}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] gap-1"
          style={{ color: "oklch(0.80 0.12 35)" }}
          onClick={onFullScreen}
          data-ocid="website-builder.fullscreen_button"
        >
          <ExternalLink className="w-3 h-3" />
          Full Screen
        </Button>
      </div>

      {/* Iframe wrapper */}
      <div className="flex justify-center bg-muted/20 p-3">
        <div
          className="transition-all duration-300 overflow-hidden"
          style={{
            width: DEVICE_CONFIG[device].width,
            maxWidth: "100%",
            borderRadius: isMobile ? "24px" : "8px",
            boxShadow: isMobile
              ? "0 0 0 4px oklch(0.22 0.02 85), 0 8px 32px rgba(0,0,0,0.5)"
              : "0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          <iframe
            src={blobUrl}
            title="Generated driver website preview"
            className="w-full border-0 block"
            style={{ height: isMobile ? 600 : 480 }}
            sandbox="allow-scripts allow-same-origin"
            aria-label="Driver website preview"
          />
        </div>
      </div>
    </div>
  );
}

// ─── DeviceToggle ─────────────────────────────────────────────────────────────

function DeviceToggle({
  device,
  onChange,
}: {
  device: DeviceMode;
  onChange: (d: DeviceMode) => void;
}) {
  const modes: { id: DeviceMode; icon: React.ReactNode; label: string }[] = [
    {
      id: "mobile",
      icon: <Smartphone className="w-3.5 h-3.5" />,
      label: "Mobile",
    },
    { id: "tablet", icon: <Tablet className="w-3.5 h-3.5" />, label: "Tablet" },
    {
      id: "desktop",
      icon: <Monitor className="w-3.5 h-3.5" />,
      label: "Desktop",
    },
  ];

  return (
    <div
      className="flex items-center rounded-lg p-0.5 gap-0.5"
      style={{ background: "oklch(0.15 0.01 85)" }}
    >
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
          style={{
            background:
              device === m.id ? "oklch(0.60 0.22 35 / 0.25)" : "transparent",
            color:
              device === m.id ? "oklch(0.80 0.12 35)" : "oklch(0.55 0.03 85)",
            border:
              device === m.id
                ? "1px solid oklch(0.60 0.22 35 / 0.4)"
                : "1px solid transparent",
          }}
          data-ocid={`website-builder.device_${m.id}_toggle`}
        >
          {m.icon}
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── PublishPanel ─────────────────────────────────────────────────────────────

interface PublishedSite {
  liveUrl: string;
  claimUrl: string;
}

function PublishPanel({
  job,
  onPublished,
}: {
  job: WebsiteJob;
  onPublished: (site: PublishedSite) => void;
}) {
  const [publishing, setPublishing] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);
  const [published, setPublished] = useState<PublishedSite | null>(
    job.shareUrl
      ? {
          liveUrl: job.shareUrl,
          claimUrl: `https://here.now/claim?site=${encodeURIComponent(
            job.shareUrl.replace(/^https?:\/\//, "").split(".")[0],
          )}`,
        }
      : null,
  );

  const handlePublish = async () => {
    if (!job.htmlContent) return;
    setPublishing(true);
    setPublishErr(null);

    // Build a URL-safe subdomain from the topic
    const slug = job.topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const subdomain = `${slug}-${job.id.slice(-6)}`;

    try {
      const site = await publishToHereNow(job.htmlContent, subdomain);
      setPublished(site);
      onPublished(site);
      toast.success(
        "Your site is live! Share the link with passengers & clients.",
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Publishing failed. Try again.";
      setPublishErr(msg);
    } finally {
      setPublishing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Link copied to clipboard!"));
  };

  if (published) {
    return (
      <div
        className="space-y-3 p-4 rounded-xl"
        style={{
          background: "oklch(0.55 0.14 145 / 0.08)",
          border: "1px solid oklch(0.55 0.14 145 / 0.25)",
        }}
        data-ocid="website-builder.published_panel"
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.55 0.14 145 / 0.20)" }}
          >
            <Globe
              className="w-4 h-4"
              style={{ color: "oklch(0.55 0.14 145)" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold"
              style={{ color: "oklch(0.55 0.14 145)" }}
            >
              Your site is live! 🎉
            </p>
            <p className="text-[10px] text-muted-foreground">
              Free permanent hosting via here.now on Cloudflare's global network
            </p>
          </div>
        </div>

        {/* Live URL */}
        <div
          className="flex items-center gap-2 p-2.5 rounded-lg"
          style={{ background: "oklch(0.12 0.01 85)" }}
        >
          <code className="flex-1 text-xs font-mono truncate text-muted-foreground">
            {published.liveUrl}
          </code>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0"
            onClick={() => handleCopy(published.liveUrl)}
            aria-label="Copy live URL"
            data-ocid="website-builder.copy_link_button"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0"
            onClick={() => window.open(published.liveUrl, "_blank")}
            aria-label="Open live URL"
            data-ocid="website-builder.open_live_button"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Claim CTA */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs h-8"
          onClick={() => window.open(published.claimUrl, "_blank")}
          data-ocid="website-builder.claim_site_button"
          style={{
            borderColor: "oklch(0.55 0.14 145 / 0.40)",
            color: "oklch(0.55 0.14 145)",
          }}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          Claim Your Site (make it yours permanently)
        </Button>
      </div>
    );
  }

  return (
    <div
      className="space-y-2 p-3 rounded-xl"
      style={{
        background: "oklch(0.75 0.12 85 / 0.06)",
        border: "1px solid oklch(0.75 0.12 85 / 0.20)",
      }}
      data-ocid="website-builder.publish_panel"
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "oklch(0.75 0.12 85 / 0.15)" }}
        >
          <Globe className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Publish your site for free
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Free permanent hosting via{" "}
            <span className="font-semibold text-primary">here.now</span> on
            Cloudflare's global network. Drivers can claim their site with one
            tap to own it permanently.
          </p>
        </div>
      </div>

      {publishErr && (
        <div
          className="flex items-start gap-2 p-2.5 rounded-lg text-xs"
          style={{
            background: "oklch(0.52 0.20 20 / 0.10)",
            border: "1px solid oklch(0.52 0.20 20 / 0.25)",
            color: "oklch(0.52 0.20 20)",
          }}
          data-ocid="website-builder.publish_error_state"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {publishErr} — You can still{" "}
            <button
              type="button"
              className="underline font-semibold"
              onClick={() =>
                document
                  .querySelector<HTMLButtonElement>(
                    "[data-ocid='website-builder.download_button']",
                  )
                  ?.click()
              }
            >
              download the HTML
            </button>{" "}
            and host it manually.
          </span>
        </div>
      )}

      <Button
        className="w-full gap-2 h-10 font-semibold text-sm"
        onClick={handlePublish}
        disabled={publishing}
        data-ocid="website-builder.publish_button"
        style={{
          background: publishing
            ? undefined
            : "linear-gradient(135deg, oklch(0.60 0.22 35) 0%, oklch(0.75 0.12 85) 100%)",
          color: "oklch(0.08 0.01 85)",
        }}
      >
        {publishing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Publishing to here.now…
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            Publish Live (Free)
          </>
        )}
      </Button>

      {publishing && (
        <p
          className="text-[10px] text-center"
          style={{ color: "oklch(0.65 0.03 85)" }}
          data-ocid="website-builder.publish_loading_state"
        >
          Uploading to Cloudflare's global network…
        </p>
      )}
    </div>
  );
}

// ─── HistoryRow ───────────────────────────────────────────────────────────────

function HistoryRow({
  job,
  index,
  onPreview,
}: {
  job: WebsiteJob;
  index: number;
  onPreview: (job: WebsiteJob) => void;
}) {
  const cfg = STATUS_CFG[job.status] ?? STATUS_CFG.failed;

  return (
    <div
      className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50"
      data-ocid={`website-builder.history_item.${index + 1}`}
    >
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Globe className="w-4 h-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {job.topic}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs text-muted-foreground">
            {fmtDate(job.createdAt)}
          </p>
          {job.shareUrl && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                background: "oklch(0.55 0.14 145 / 0.15)",
                color: "oklch(0.55 0.14 145)",
              }}
            >
              Live on here.now
            </span>
          )}
        </div>
      </div>

      <Badge className={`${cfg.cls} flex items-center gap-1 shrink-0 text-xs`}>
        {cfg.icon}
        {cfg.label}
      </Badge>

      {job.status === "ready" && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 px-2 text-xs gap-1"
          onClick={() => onPreview(job)}
          data-ocid={`website-builder.history_preview_button.${index + 1}`}
        >
          View
        </Button>
      )}
    </div>
  );
}

// ─── ActiveJobPanel ───────────────────────────────────────────────────────────

function ActiveJobPanel({
  job,
  onEmailSend,
  onRetry,
  onPublished,
  emailPending,
  iterationHistory,
}: {
  job: WebsiteJob;
  onEmailSend: (jobId: string) => void;
  onRetry: () => void;
  onPublished: (site: PublishedSite) => void;
  emailPending: boolean;
  iterationHistory: string[];
}) {
  const [device, setDevice] = useState<DeviceMode>("mobile");
  const blobUrlRef = useRef<string | null>(null);

  const handleDownload = () => {
    if (!job.htmlContent) return;
    const blob = new Blob([job.htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-driver-website.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    if (!job.shareUrl) return;
    navigator.clipboard
      .writeText(job.shareUrl)
      .then(() => toast.success("Share link copied to clipboard!"));
  };

  const handleFullScreen = () => {
    if (!job.htmlContent) return;
    const blob = new Blob([job.htmlContent], { type: "text/html" });
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = URL.createObjectURL(blob);
    window.open(blobUrlRef.current, "_blank");
  };

  if (job.status === "pending" || job.status === "generating") {
    return <GenerationProgress />;
  }

  if (job.status === "failed") {
    return (
      <div
        className="p-4 rounded-xl border space-y-3"
        style={{
          background: "oklch(0.52 0.20 20 / 0.08)",
          borderColor: "oklch(0.52 0.20 20 / 0.25)",
        }}
        data-ocid="website-builder.error_state"
      >
        <div className="flex items-start gap-3">
          <img
            src="https://i.imgur.com/u98U7S6.png"
            alt="Nduna"
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <div>
            <p className="font-semibold text-sm text-foreground">
              Nduna couldn't complete the website
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {job.errorMsg ||
                "Something went wrong. Try again with a different description."}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 w-full"
          onClick={onRetry}
          data-ocid="website-builder.retry_button"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </Button>
      </div>
    );
  }

  // ready
  return (
    <div className="space-y-4" data-ocid="website-builder.ready_panel">
      {/* Success header */}
      <div
        className="flex items-center gap-2 p-3 rounded-xl border"
        style={{
          background: "oklch(0.55 0.14 145 / 0.10)",
          borderColor: "oklch(0.55 0.14 145 / 0.25)",
        }}
      >
        <CheckCircle
          className="w-4 h-4 shrink-0"
          style={{ color: "oklch(0.55 0.14 145)" }}
        />
        <p className="text-sm font-semibold text-foreground flex-1">
          Your website is ready!
        </p>
        <DeviceToggle device={device} onChange={setDevice} />
      </div>

      {/* Iteration history badges */}
      {iterationHistory.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5"
          data-ocid="website-builder.iteration_history"
        >
          {iterationHistory.map((inst) => (
            <span
              key={inst}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: "oklch(0.75 0.12 85 / 0.12)",
                border: "1px solid oklch(0.75 0.12 85 / 0.25)",
                color: "oklch(0.75 0.12 85)",
              }}
            >
              ✏️ {inst}
            </span>
          ))}
        </div>
      )}

      {/* Preview */}
      {job.htmlContent && (
        <SitePreview
          html={job.htmlContent}
          device={device}
          onFullScreen={handleFullScreen}
        />
      )}

      {/* Publish panel — here.now */}
      <PublishPanel job={job} onPublished={onPublished} />

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="gap-1.5 text-sm"
          onClick={handleDownload}
          data-ocid="website-builder.download_button"
        >
          <Download className="w-4 h-4" />
          Download HTML
        </Button>
        <Button
          variant="outline"
          className="gap-1.5 text-sm"
          onClick={() => onEmailSend(job.id)}
          disabled={emailPending}
          data-ocid="website-builder.email_button"
        >
          <Mail className="w-4 h-4" />
          {emailPending ? "Sending…" : "Send to Email"}
        </Button>
      </div>

      {/* Existing share URL (if already published) */}
      {job.shareUrl && (
        <div
          className="col-span-2 flex items-center gap-2 p-3 rounded-xl"
          style={{
            background: "oklch(0.75 0.12 85 / 0.10)",
            border: "1px solid oklch(0.75 0.12 85 / 0.25)",
          }}
        >
          <Share2 className="w-4 h-4 shrink-0 text-primary" />
          <code className="flex-1 text-xs font-mono truncate text-muted-foreground">
            {job.shareUrl}
          </code>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs shrink-0"
            onClick={handleCopyLink}
            data-ocid="website-builder.copy_link_button"
          >
            Copy
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── WebsiteBuilderPage ───────────────────────────────────────────────────────

export default function WebsiteBuilderPage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const ext = actor as typeof actor & WebsiteBuilderActor;

  const [topic, setTopic] = useState(
    () => localStorage.getItem("wb_draft_topic") ?? "",
  );
  const [serviceType, setServiceType] = useState<string>("");
  const [iterationInstruction, setIterationInstruction] = useState("");
  const [iterationHistory, setIterationHistory] = useState<string[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [previewJob, setPreviewJob] = useState<WebsiteJob | null>(null);
  const [previewDevice, setPreviewDevice] = useState<DeviceMode>("mobile");

  // Persist draft topic
  useEffect(() => {
    localStorage.setItem("wb_draft_topic", topic);
  }, [topic]);

  // Load job history
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<WebsiteJob[]>({
    queryKey: ["websiteJobs"],
    queryFn: async () => {
      if (!ext?.getWebsiteJobs) return [];
      return (ext as WebsiteBuilderActor).getWebsiteJobs!();
    },
    enabled: !!actor,
  });

  // Rate limit
  const { data: rateLimit } = useQuery<bigint>({
    queryKey: ["websiteRateLimit"],
    queryFn: async () => {
      if (!ext?.getWebsiteBuilderRateLimit) return BigInt(DAILY_LIMIT);
      return (ext as WebsiteBuilderActor).getWebsiteBuilderRateLimit!();
    },
    enabled: !!actor,
  });

  const todayCount = todayJobCount(jobs);
  const remainingToday =
    rateLimit != null
      ? Math.max(0, Number(rateLimit))
      : Math.max(0, DAILY_LIMIT - todayCount);
  const rateLimited = remainingToday <= 0;

  // Poll active job
  const { data: activeJob } = useQuery<WebsiteJob | null>({
    queryKey: ["websiteJob", activeJobId],
    queryFn: async () => {
      if (!activeJobId || !ext?.getWebsiteJob) return null;
      const result = await (ext as WebsiteBuilderActor).getWebsiteJob!(
        activeJobId,
      );
      if (result.__kind__ === "None") return null;
      return (result as { __kind__: "Some"; value: WebsiteJob }).value;
    },
    enabled: !!actor && !!activeJobId,
    refetchInterval: (data) => {
      const job = data.state.data;
      if (!job) return POLL_INTERVAL_MS;
      return job.status === "pending" || job.status === "generating"
        ? POLL_INTERVAL_MS
        : false;
    },
  });

  // Refresh history when done
  useEffect(() => {
    if (activeJob?.status === "ready" || activeJob?.status === "failed") {
      queryClient.invalidateQueries({ queryKey: ["websiteJobs"] });
      queryClient.invalidateQueries({ queryKey: ["websiteRateLimit"] });
    }
  }, [activeJob?.status, queryClient]);

  // Generate mutation
  const generateMut = useMutation({
    mutationFn: async (t: string) => {
      if (!ext?.generateDriverWebsite)
        throw new Error("Feature not available yet");
      const result = await (ext as WebsiteBuilderActor).generateDriverWebsite!(
        t,
      );
      if ("err" in result) throw new Error((result as { err: string }).err);
      return (result as { ok: WebsiteJob }).ok;
    },
    onSuccess: (job) => {
      setActiveJobId(job.id);
      setIterationHistory([]);
      setPreviewJob(null);
      toast.success("Nduna is designing your website…");
      queryClient.invalidateQueries({ queryKey: ["websiteJobs"] });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to start website generation."),
  });

  // Iterate mutation
  const iterateMut = useMutation({
    mutationFn: async ({
      jobId,
      instruction,
    }: { jobId: string; instruction: string }) => {
      if (!ext?.iterateDriverWebsite)
        throw new Error("Feature not available yet");
      const result = await (ext as WebsiteBuilderActor).iterateDriverWebsite!(
        jobId,
        instruction,
      );
      if ("err" in result) throw new Error((result as { err: string }).err);
      return (result as { ok: WebsiteJob }).ok;
    },
    onSuccess: (job, variables) => {
      setActiveJobId(job.id);
      setIterationHistory((prev) => [...prev, variables.instruction]);
      setIterationInstruction("");
      toast.success("Nduna is updating your website…");
      queryClient.invalidateQueries({ queryKey: ["websiteJobs"] });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to refine website."),
  });

  // Email mutation
  const emailMut = useMutation({
    mutationFn: async (jobId: string) => {
      if (!ext?.sendWebsiteByEmail)
        throw new Error("Email feature not available yet");
      const htmlContent = activeJob?.htmlContent;
      if (!htmlContent) throw new Error("Website HTML not available for email");
      const result = await (ext as WebsiteBuilderActor).sendWebsiteByEmail!(
        jobId,
        htmlContent,
      );
      if ("err" in result) throw new Error((result as { err: string }).err);
    },
    onSuccess: () => toast.success("Website sent to your email via Nduna!"),
    onError: (err: Error) =>
      toast.error(err.message || "Failed to send email."),
  });

  const applyStylePreset = (preset: (typeof STYLE_PRESETS)[0]) => {
    const base = topic.trim() || "professional driver";
    setTopic(`${base} — ${preset.direction}`);
  };

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Please describe your service first.");
      return;
    }
    if (rateLimited) return;
    generateMut.mutate(topic.trim());
  };

  const handleIterate = () => {
    if (!iterationInstruction.trim() || !activeJobId) return;
    iterateMut.mutate({
      jobId: activeJobId,
      instruction: iterationInstruction.trim(),
    });
  };

  const handleRetry = () => {
    setActiveJobId(null);
    setIterationHistory([]);
  };

  /**
   * Called when here.now publish succeeds — update the job's shareUrl in cached
   * data so the history list immediately reflects "Live on here.now".
   */
  const handlePublished = (site: PublishedSite) => {
    queryClient.setQueryData<WebsiteJob | null>(
      ["websiteJob", activeJobId],
      (prev) => (prev ? { ...prev, shareUrl: site.liveUrl } : prev),
    );
    queryClient.setQueryData<WebsiteJob[]>(
      ["websiteJobs"],
      (prev) =>
        prev?.map((j) =>
          j.id === activeJobId ? { ...j, shareUrl: site.liveUrl } : j,
        ) ?? [],
    );
  };

  const currentJob = activeJob ?? null;
  const isGenerating = generateMut.isPending;
  const isIterating = iterateMut.isPending;
  const showJobPanel = !!activeJobId && !!currentJob;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* ── Header ── */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.60 0.22 35 / 0.20) 0%, oklch(0.75 0.12 85 / 0.12) 100%)",
          border: "1px solid oklch(0.60 0.22 35 / 0.35)",
        }}
        data-ocid="website-builder.page"
      >
        <div className="flex items-start gap-4">
          <img
            src="https://i.imgur.com/u98U7S6.png"
            alt="Nduna"
            className="w-14 h-14 rounded-full object-cover border-2 shrink-0"
            style={{ borderColor: "oklch(0.75 0.12 85 / 0.6)" }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-xl font-display font-bold"
                style={{ color: "oklch(0.96 0.005 85)" }}
              >
                Driver Website Builder
              </h1>
              <Badge
                className="text-[10px] shrink-0"
                style={{
                  background: "oklch(0.75 0.12 85 / 0.25)",
                  color: "oklch(0.90 0.08 85)",
                  border: "1px solid oklch(0.75 0.12 85 / 0.4)",
                }}
              >
                Tier 3 Elite
              </Badge>
            </div>
            <p
              className="text-sm mt-1"
              style={{ color: "oklch(0.75 0.04 85)" }}
            >
              Powered by 4 stacked design skills — Nduna generates
              unforgettable, SA-branded websites. Free permanent hosting via{" "}
              <span
                className="font-semibold"
                style={{ color: "oklch(0.80 0.12 35)" }}
              >
                here.now
              </span>
            </p>
          </div>
        </div>

        {/* Skill badges */}
        <div className="flex flex-wrap gap-2">
          {SKILL_BADGES.map((skill) => (
            <span
              key={skill.label}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `${skill.color.replace(")", " / 0.12)")}`,
                border: `1px solid ${skill.color.replace(")", " / 0.4)")}`,
                color: skill.color,
              }}
            >
              {skill.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Rate limit indicator ── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {remainingToday}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground">{DAILY_LIMIT}</span>{" "}
          websites remaining today
        </p>
        {rateLimited && (
          <Badge className="bg-destructive/15 text-destructive border-destructive/25 text-[10px]">
            Daily limit reached
          </Badge>
        )}
      </div>

      {/* ── Daily limit warning ── */}
      {rateLimited && (
        <Card
          className="p-4 border"
          style={{
            background: "oklch(0.52 0.20 20 / 0.08)",
            borderColor: "oklch(0.52 0.20 20 / 0.25)",
          }}
          data-ocid="website-builder.rate_limit_card"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-foreground">
                Daily limit reached
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You've generated your {DAILY_LIMIT} websites today. Come back
                tomorrow!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Topic input ── */}
      {!showJobPanel && (
        <div className="space-y-4" data-ocid="website-builder.input_section">
          {/* Service type + style presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Service Type
              </Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger
                  className="h-9 text-sm"
                  data-ocid="website-builder.service_type_select"
                >
                  <SelectValue placeholder="Choose a service type…" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_PRESETS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Style Preset
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyStylePreset(p)}
                    className="text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all duration-150"
                    style={{
                      background: "oklch(0.60 0.22 35 / 0.08)",
                      border: "1px solid oklch(0.60 0.22 35 / 0.30)",
                      color: "oklch(0.75 0.10 35)",
                    }}
                    data-ocid={`website-builder.style_preset_button.${STYLE_PRESETS.indexOf(p) + 1}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Topic textarea */}
          <div className="space-y-1.5">
            <Label
              htmlFor="wb-topic"
              className="text-sm font-semibold text-foreground"
            >
              Describe your driving service
            </Label>
            <Textarea
              id="wb-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={`e.g. "Professional luxury airport transfers in Sandton" or "Family-friendly Uber driver, 5 years experience, Durban"`}
              disabled={isGenerating || rateLimited}
              rows={3}
              className="text-base resize-none"
              data-ocid="website-builder.topic_input"
            />
            <p className="text-xs text-muted-foreground">
              Be specific — mention your car type, favourite routes, city, or
              what makes you different
            </p>
          </div>

          <Button
            className="w-full h-12 gap-2 text-base font-semibold"
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim() || rateLimited}
            data-ocid="website-builder.generate_button"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Nduna is designing your website…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Build My Website
              </>
            )}
          </Button>
        </div>
      )}

      {/* ── Active job panel ── */}
      {showJobPanel && currentJob && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-primary" />
              Your Website
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs h-7"
              onClick={handleRetry}
              data-ocid="website-builder.new_website_button"
            >
              New website
            </Button>
          </div>

          <ActiveJobPanel
            job={currentJob}
            onEmailSend={(id) => emailMut.mutate(id)}
            onRetry={handleRetry}
            onPublished={handlePublished}
            emailPending={emailMut.isPending}
            iterationHistory={iterationHistory}
          />

          {/* Iteration input — only when ready */}
          {currentJob.status === "ready" && (
            <div
              className="space-y-3 p-4 rounded-xl"
              style={{
                background: "oklch(0.75 0.12 85 / 0.06)",
                border: "1px solid oklch(0.75 0.12 85 / 0.20)",
              }}
              data-ocid="website-builder.iteration_section"
            >
              <Label className="text-sm font-semibold text-foreground block">
                Refine your website
              </Label>

              {/* Quick action chips */}
              <div className="flex flex-wrap gap-1.5">
                {ITERATION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setIterationInstruction(chip)}
                    className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all duration-150"
                    style={{
                      background:
                        iterationInstruction === chip
                          ? "oklch(0.75 0.12 85 / 0.20)"
                          : "oklch(0.75 0.12 85 / 0.08)",
                      border:
                        iterationInstruction === chip
                          ? "1px solid oklch(0.75 0.12 85 / 0.5)"
                          : "1px solid oklch(0.75 0.12 85 / 0.20)",
                      color: "oklch(0.80 0.10 85)",
                    }}
                    data-ocid={`website-builder.iteration_chip.${ITERATION_CHIPS.indexOf(chip) + 1}`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <Textarea
                value={iterationInstruction}
                onChange={(e) => setIterationInstruction(e.target.value)}
                placeholder="e.g. 'make it more premium', 'add a services section', 'use darker colours'"
                disabled={isIterating}
                rows={2}
                className="text-sm resize-none"
                data-ocid="website-builder.iterate_input"
              />
              <Button
                size="sm"
                className="gap-1.5 w-full"
                onClick={handleIterate}
                disabled={isIterating || !iterationInstruction.trim()}
                data-ocid="website-builder.iterate_button"
              >
                {isIterating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Apply Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Preview from history ── */}
      {previewJob && previewJob.status === "ready" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground truncate">
              Previewing: {previewJob.topic}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <DeviceToggle
                device={previewDevice}
                onChange={setPreviewDevice}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPreviewJob(null)}
                data-ocid="website-builder.close_preview_button"
              >
                Close
              </Button>
            </div>
          </div>
          {previewJob.htmlContent && (
            <SitePreview
              html={previewJob.htmlContent}
              device={previewDevice}
              onFullScreen={() => {
                const blob = new Blob([previewJob.htmlContent!], {
                  type: "text/html",
                });
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
              }}
            />
          )}
        </div>
      )}

      {/* ── History ── */}
      <div className="space-y-3" data-ocid="website-builder.history_section">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            Previous Websites
          </h2>
          {jobs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {jobs.length} site{jobs.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {jobsLoading ? (
          <div
            className="space-y-2"
            data-ocid="website-builder.history_loading_state"
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card
            className="p-8 text-center bg-muted/10 border-dashed"
            data-ocid="website-builder.history_empty_state"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-foreground mb-1">
              No websites yet
            </p>
            <p className="text-sm text-muted-foreground">
              Describe your service above and Nduna will build a professional
              website for you — ready in seconds, published free via here.now.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 20).map((job, i) => (
              <HistoryRow
                key={job.id}
                job={job}
                index={i}
                onPreview={(j) => {
                  setPreviewJob(j);
                  setActiveJobId(null);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
