/**
 * HyperframesPage.tsx — AI Video Studio powered by Nduna + Hyperframes.
 * Tier 3 (Elite) exclusive: generates 6-slide MP4 videos from a topic prompt.
 * Driver types a topic → Nduna builds HTML composition → VPS renders to MP4.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clapperboard,
  Clock,
  Download,
  Film,
  Loader2,
  Play,
  RefreshCw,
  Scissors,
  Send,
  Sparkles,
  Video,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { ShortsTab } from "../features/hyperframes/ShortsTab";
import type { HyperframesJob } from "../features/hyperframes/types";
import {
  useGenerateSlideshow,
  useHyperframesJob,
  useHyperframesJobs,
} from "../features/hyperframes/useHyperframes";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 5;

const TOPIC_SUGGESTIONS = [
  "My best earnings week yet",
  "Why passengers love driving with me",
  "Top event near me this weekend",
  "My MoneyDrive success story",
  "Tips for new Uber & Bolt drivers",
];

const RENDER_STATUS_CFG: Record<
  string,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Queued",
    cls: "bg-muted/60 text-muted-foreground",
    icon: <Clock className="w-3 h-3" />,
  },
  rendering: {
    label: "Rendering",
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  profile?: UserProfile | null;
  tier?: number;
  isAdmin?: boolean;
  pilotMode?: boolean;
}

type HyperframesTab = "studio" | "shorts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts: bigint) {
  const ms = Number(ts / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function todayRenderCount(jobs: HyperframesJob[]): number {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  return jobs.filter((j) => {
    const ms = Number(j.createdAt / BigInt(1_000_000));
    return ms >= todayMs;
  }).length;
}

// ─── CompositionPreview ───────────────────────────────────────────────────────

function CompositionPreview({ html }: { html: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [html]);

  if (!html || !blobUrl) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <Clapperboard className="w-3.5 h-3.5 text-primary" />
        Slide Composition Preview
      </p>
      <div
        className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-muted/10"
        style={{ aspectRatio: "9/16", maxHeight: 420 }}
      >
        <iframe
          src={blobUrl}
          title="Hyperframes composition preview"
          className="absolute inset-0 w-full h-full border-0"
          sandbox=""
          aria-label="Slide composition preview"
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        1080×1920 preview — scaled to fit screen
      </p>
    </div>
  );
}

// ─── VideoPlayer ──────────────────────────────────────────────────────────────

function VideoPlayer({ job }: { job: HyperframesJob }) {
  const handleShare = (platform: "tiktok" | "instagram") => {
    const label = platform === "tiktok" ? "TikTok" : "Instagram";
    toast.info(`Opening ${label} to share your video…`);
    const url =
      platform === "tiktok"
        ? "https://www.tiktok.com/upload"
        : "https://www.instagram.com/";
    window.open(url, "_blank", "noopener");
  };

  return (
    <div className="space-y-4" data-ocid="hyperframes.video_player">
      {/* Video */}
      <div
        className="relative w-full overflow-hidden rounded-xl border border-green-500/20 bg-muted/10"
        style={{ aspectRatio: "9/16", maxHeight: 420 }}
      >
        <video
          src={job.mp4Url ?? ""}
          controls
          className="absolute inset-0 w-full h-full object-contain"
          aria-label="Generated video"
        >
          <track kind="captions" src="" label="No captions" default />
        </video>
      </div>

      {/* Action row */}
      <div className="grid grid-cols-3 gap-2">
        <a
          href={job.mp4Url ?? "#"}
          download={`nduna-video-${job.id}.mp4`}
          className="contents"
        >
          <Button
            variant="default"
            className="w-full gap-1.5 text-xs col-span-1"
            data-ocid="hyperframes.download_button"
            aria-label="Download MP4"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
        </a>

        <Button
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => handleShare("tiktok")}
          data-ocid="hyperframes.share_tiktok_button"
        >
          🎵 TikTok
        </Button>

        <Button
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => handleShare("instagram")}
          data-ocid="hyperframes.share_instagram_button"
        >
          📸 Insta
        </Button>
      </div>
    </div>
  );
}

// ─── RenderStatusPoller ───────────────────────────────────────────────────────

function RenderStatusPoller({
  jobId,
  compositionHtml,
  onRetry,
}: {
  jobId: string;
  compositionHtml: string;
  onRetry: () => void;
}) {
  const { data: job, isLoading } = useHyperframesJob(jobId);

  if (isLoading || !job) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/10 rounded-xl border border-border/50">
        <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">Checking render status…</p>
      </div>
    );
  }

  if (job.renderStatus === "ready") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          <p className="text-sm font-semibold text-foreground">
            Your video is ready!
          </p>
        </div>
        <VideoPlayer job={job} />
      </div>
    );
  }

  if (job.renderStatus === "failed") {
    const isNotConfigured =
      job.errorMsg?.toLowerCase().includes("not configured") ||
      job.errorMsg?.toLowerCase().includes("vps url") ||
      job.errorMsg?.toLowerCase().includes("render server");

    return (
      <div
        className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3"
        data-ocid="hyperframes.error_state"
      >
        <div className="flex items-start gap-3">
          <img
            src="https://i.imgur.com/u98U7S6.png"
            alt="Nduna"
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <div>
            <p className="font-semibold text-sm text-foreground">
              {isNotConfigured
                ? "Video rendering is not yet configured"
                : "Nduna couldn't complete the render"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isNotConfigured
                ? "Ask your admin to set the VPS URL in Settings — you can still see your slideshow composition below."
                : job.errorMsg ||
                  "The VPS render job failed. This sometimes happens — give it another try."}
            </p>
          </div>
        </div>
        {!isNotConfigured && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 w-full"
            onClick={onRetry}
            data-ocid="hyperframes.retry_button"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>
        )}
        {compositionHtml && <CompositionPreview html={compositionHtml} />}
      </div>
    );
  }

  // pending or rendering
  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl"
        data-ocid="hyperframes.rendering_state"
      >
        <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Rendering your video…
          </p>
          <p className="text-xs text-muted-foreground">
            Up to 2 minutes — sit back, Nduna is working
          </p>
        </div>
      </div>
      {compositionHtml && <CompositionPreview html={compositionHtml} />}
    </div>
  );
}

// ─── HistoryRow ───────────────────────────────────────────────────────────────

function HistoryRow({
  job,
  index,
  onPreview,
}: {
  job: HyperframesJob;
  index: number;
  onPreview: (job: HyperframesJob) => void;
}) {
  const cfg = RENDER_STATUS_CFG[job.renderStatus] ?? RENDER_STATUS_CFG.failed;

  return (
    <div
      className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50"
      data-ocid={`hyperframes.history_item.${index + 1}`}
    >
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Film className="w-4 h-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {job.topic}
        </p>
        <p className="text-xs text-muted-foreground">
          {fmtDate(job.createdAt)}
        </p>
      </div>

      <Badge className={`${cfg.cls} flex items-center gap-1 shrink-0 text-xs`}>
        {cfg.icon}
        {cfg.label}
      </Badge>

      {job.renderStatus === "ready" && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 px-2 text-xs gap-1"
          onClick={() => onPreview(job)}
          data-ocid={`hyperframes.history_preview_button.${index + 1}`}
        >
          <Play className="w-3 h-3" />
          Preview
        </Button>
      )}
    </div>
  );
}

// ─── HyperframesPage ──────────────────────────────────────────────────────────

export default function HyperframesPage({
  tier = 1,
  pilotMode = false,
}: Props) {
  const [topic, setTopic] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeHtml, setActiveHtml] = useState<string>("");
  const [previewJob, setPreviewJob] = useState<HyperframesJob | null>(null);
  const [activeTab, setActiveTab] = useState<HyperframesTab>("studio");

  const generate = useGenerateSlideshow();
  const { data: jobs = [], isLoading: jobsLoading } = useHyperframesJobs();

  const todayCount = todayRenderCount(jobs);
  const rateLimited = todayCount >= DAILY_LIMIT;
  const isGenerating = generate.isPending;
  const isRendering = !!activeJobId;

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic for Nduna to create a video about.");
      return;
    }
    if (rateLimited) return;

    generate.mutate(
      { topic: topic.trim() },
      {
        onSuccess: (job) => {
          setActiveJobId(job.id);
          setActiveHtml(job.compositionHtml);
          setPreviewJob(null);
          toast.success("Nduna is crafting your slides…");
        },
      },
    );
  };

  const handleRetry = () => {
    setActiveJobId(null);
    setActiveHtml("");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="https://i.imgur.com/u98U7S6.png"
            alt="Nduna"
            className="w-10 h-10 rounded-full object-cover border-2 border-primary/40 shrink-0"
          />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              AI Video Studio
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Nduna generates a 6-slide MP4 video from your topic
            </p>
          </div>
        </div>
        <Badge className="bg-primary/15 text-primary border border-primary/30 shrink-0">
          Tier 3
        </Badge>
      </div>

      {/* ── Tab bar ── */}
      <div
        className="flex gap-1 bg-muted/20 rounded-xl p-1"
        data-ocid="hyperframes.tab_bar"
      >
        {(
          [
            {
              key: "studio",
              label: "Video Studio",
              icon: <Sparkles className="w-3.5 h-3.5" />,
            },
            {
              key: "shorts",
              label: "Clip to Short",
              icon: <Scissors className="w-3.5 h-3.5" />,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid={`hyperframes.${tab.key}_tab`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Shorts tab ── */}
      {activeTab === "shorts" && <ShortsTab pilotMode={pilotMode} />}

      {/* ── Video Studio tab content ── */}
      {activeTab === "studio" && (
        <>
          {/* ── How it works strip ── */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                icon: <Sparkles className="w-4 h-4" />,
                label: "1. Type topic",
                sub: "Any idea works",
              },
              {
                icon: <Clapperboard className="w-4 h-4" />,
                label: "2. Nduna builds slides",
                sub: "6-slide HTML",
              },
              {
                icon: <Video className="w-4 h-4" />,
                label: "3. Download MP4",
                sub: "Post to TikTok",
              },
            ].map((step) => (
              <Card
                key={step.label}
                className="p-3 text-center bg-muted/20 border-border/50"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1.5 text-primary">
                  {step.icon}
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.sub}
                </p>
              </Card>
            ))}
          </div>

          {/* ── Rate limit warning ── */}
          {rateLimited && (
            <Card
              className="p-4 bg-destructive/10 border-destructive/20"
              data-ocid="hyperframes.rate_limit_card"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Daily limit reached
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You've used your {DAILY_LIMIT} renders today. Come back
                    tomorrow!
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* ── Topic input ── */}
          {!isRendering && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="hyperframes-topic"
                  className="text-sm font-semibold text-foreground"
                >
                  What do you want Nduna to create a video about?
                </Label>
                <Input
                  id="hyperframes-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. My earnings this week, Why drive with me, Event near me this weekend"
                  disabled={isGenerating || rateLimited}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGenerate();
                  }}
                  data-ocid="hyperframes.topic_input"
                  className="h-12 text-base"
                />
              </div>

              {/* Suggestions */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Quick topics
                </p>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTopic(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted/30 border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                      data-ocid="hyperframes.suggestion_button"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <Button
                className="w-full h-12 gap-2 text-base font-semibold"
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim() || rateLimited}
                data-ocid="hyperframes.generate_button"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Nduna is crafting your slides…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Video
                  </>
                )}
              </Button>

              {/* Renders remaining today */}
              {!rateLimited && (
                <p className="text-xs text-muted-foreground text-center">
                  {DAILY_LIMIT - todayCount} of {DAILY_LIMIT} renders remaining
                  today
                </p>
              )}
            </div>
          )}

          {/* ── Render status / video player ── */}
          {activeJobId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-primary" />
                  Your Video
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs h-7"
                  onClick={handleRetry}
                  data-ocid="hyperframes.new_video_button"
                >
                  <ChevronRight className="w-3 h-3" />
                  New video
                </Button>
              </div>

              <RenderStatusPoller
                jobId={activeJobId}
                compositionHtml={activeHtml}
                onRetry={handleRetry}
              />
            </div>
          )}

          {/* ── Preview modal job ── */}
          {previewJob && previewJob.renderStatus === "ready" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Previewing: {previewJob.topic}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPreviewJob(null)}
                  data-ocid="hyperframes.close_preview_button"
                >
                  Close
                </Button>
              </div>
              <VideoPlayer job={previewJob} />
            </div>
          )}

          {/* ── History ── */}
          <div className="space-y-3" data-ocid="hyperframes.history_section">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                Previous Videos
              </h2>
              {jobs.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {jobs.slice(0, 20).length} of {jobs.length}
                </span>
              )}
            </div>

            {jobsLoading ? (
              <div
                className="space-y-2"
                data-ocid="hyperframes.history_loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <Card
                className="p-8 text-center bg-muted/10 border-dashed"
                data-ocid="hyperframes.history_empty_state"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Video className="w-7 h-7 text-primary" />
                </div>
                <p className="font-semibold text-foreground mb-1">
                  No videos yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Type a topic above and let Nduna create your first AI video —
                  it takes about 2 minutes to render.
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

          {/* ── Tier gate nudge for non-tier-3 users passed down from App ── */}
          {tier < 3 && (
            <Card
              className="p-4 bg-primary/5 border-primary/20"
              data-ocid="hyperframes.tier_gate_card"
            >
              <div className="flex items-start gap-3">
                <Send className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Elite feature — R800/month
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AI Video Studio is available exclusively on the Elite plan.
                    Upgrade to start generating Hyperframes videos with Nduna.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
