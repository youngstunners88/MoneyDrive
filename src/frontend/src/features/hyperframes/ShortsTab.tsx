/**
 * ShortsTab.tsx — "Clip to Short" tab for the Hyperframes AI Video Studio.
 * Accepts a YouTube URL or uploaded video, polls backend status, and displays
 * the vertical 9:16 output with download / share actions.
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
  Clock,
  Download,
  Film,
  Loader2,
  Scissors,
  Upload,
  Video,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ShortsJob, ShortsStatus } from "./shorts-types";
import {
  type ShortsRequest,
  useShortsJob,
  useShortsJobs,
  useSubmitShortsJob,
} from "./useShortsGenerator";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 3;

const STATUS_STEPS: Array<{
  key: ShortsStatus[];
  emoji: string;
  label: string;
}> = [
  { key: ["pending"], emoji: "⏳", label: "Queued for processing…" },
  { key: ["transcribing"], emoji: "🎙️", label: "Transcribing audio…" },
  { key: ["selecting"], emoji: "🎯", label: "Picking best 2-minute segment…" },
  {
    key: ["rendering"],
    emoji: "✂️",
    label: "Cropping vertical & burning subtitles…",
  },
];

function fmtDate(ts: bigint) {
  const ms = Number(ts / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

function todayShortsCount(jobs: ShortsJob[]): number {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return jobs.filter(
    (j) => Number(j.createdAt / BigInt(1_000_000)) >= startOfToday.getTime(),
  ).length;
}

function isTerminal(status: ShortsStatus) {
  return status === "ready" || status === "failed";
}

function statusLabel(status: ShortsStatus): { label: string; cls: string } {
  switch (status) {
    case "pending":
      return {
        label: "Queued",
        cls: "bg-muted/60 text-muted-foreground",
      };
    case "transcribing":
    case "selecting":
    case "rendering":
      return { label: "Processing", cls: "bg-primary/15 text-primary" };
    case "ready":
      return { label: "Ready", cls: "bg-success/20 text-success" };
    case "failed":
      return {
        label: "Failed",
        cls: "bg-destructive/15 text-destructive",
      };
  }
}

// ─── ProcessingCard ───────────────────────────────────────────────────────────

function ProcessingCard({ job }: { job: ShortsJob }) {
  const activeIndex = STATUS_STEPS.findIndex((s) =>
    (s.key as string[]).includes(job.clipStatus),
  );

  return (
    <Card
      className="p-5 bg-primary/5 border-primary/20 space-y-4"
      data-ocid="shorts.processing_card"
    >
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
        Nduna is working on your Short…
      </p>
      <ul className="space-y-2">
        {STATUS_STEPS.map((step, i) => {
          const isPast = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <li
              key={step.label}
              className={`flex items-center gap-2.5 text-sm transition-colors ${
                isPast
                  ? "text-muted-foreground line-through"
                  : isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground/50"
              }`}
            >
              <span className="text-base leading-none">{step.emoji}</span>
              {step.label}
              {isActive && (
                <Loader2 className="w-3 h-3 animate-spin text-primary ml-auto shrink-0" />
              )}
              {isPast && (
                <CheckCircle className="w-3 h-3 text-green-500 ml-auto shrink-0" />
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ─── ShortsOutput ─────────────────────────────────────────────────────────────

function ShortsOutput({ job }: { job: ShortsJob }) {
  const handleShare = (platform: "tiktok" | "instagram") => {
    if (platform === "tiktok") {
      window.open("https://www.tiktok.com/upload", "_blank", "noopener");
    } else {
      navigator.clipboard
        .writeText(job.outputMp4Url ?? window.location.href)
        .then(() => toast.success("Link copied! Paste it on Instagram."))
        .catch(() => toast.error("Couldn't copy the link."));
    }
  };

  return (
    <div className="space-y-4" data-ocid="shorts.output_section">
      {/* Success banner */}
      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
        <p className="text-sm font-semibold text-foreground">
          Your Short is ready! 🎉
        </p>
      </div>

      {/* Vertical video player */}
      <div className="flex justify-center">
        <div
          className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/10 w-full"
          style={{ aspectRatio: "9/16", maxWidth: 270 }}
        >
          <video
            src={job.outputMp4Url ?? ""}
            controls
            playsInline
            className="absolute inset-0 w-full h-full object-contain"
            aria-label="Generated short video"
          >
            <track kind="captions" src="" label="No captions" default />
          </video>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <a
          href={job.outputMp4Url ?? "#"}
          download={`nduna-short-${job.id}.mp4`}
          className="contents"
        >
          <Button
            variant="default"
            className="w-full gap-1.5 text-xs"
            data-ocid="shorts.download_button"
            aria-label="Download short MP4"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
        </a>
        <Button
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => handleShare("tiktok")}
          data-ocid="shorts.share_tiktok_button"
        >
          🎵 TikTok
        </Button>
        <Button
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => handleShare("instagram")}
          data-ocid="shorts.share_instagram_button"
        >
          📸 Insta
        </Button>
      </div>
    </div>
  );
}

// ─── ShortsPoller ─────────────────────────────────────────────────────────────

function ShortsPoller({
  jobId,
  onReset,
}: {
  jobId: string;
  onReset: () => void;
}) {
  const { data: job, isLoading } = useShortsJob(jobId);

  if (isLoading || !job) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/10 rounded-xl border border-border/50">
        <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">
          Connecting to render pipeline…
        </p>
      </div>
    );
  }

  if (job.clipStatus === "ready") {
    return (
      <div className="space-y-4">
        <ShortsOutput job={job} />
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs gap-1.5"
          onClick={onReset}
          data-ocid="shorts.new_short_button"
        >
          <Scissors className="w-3 h-3" />
          Clip another video
        </Button>
      </div>
    );
  }

  if (job.clipStatus === "failed") {
    return (
      <Card
        className="p-4 bg-destructive/10 border-destructive/20 space-y-3"
        data-ocid="shorts.error_state"
      >
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-foreground">
              Something went wrong
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {job.errorMsg ?? "The render job failed. Give it another try."}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={onReset}
          data-ocid="shorts.retry_button"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  return <ProcessingCard job={job} />;
}

// ─── HistoryCard ──────────────────────────────────────────────────────────────

function HistoryCard({ job, index }: { job: ShortsJob; index: number }) {
  const { label, cls } = statusLabel(job.clipStatus);
  const isYouTube = job.sourceType === "youtube";
  const displayUrl =
    job.sourceUrl.length > 42
      ? `${job.sourceUrl.slice(0, 40)}…`
      : job.sourceUrl;

  return (
    <div
      className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50"
      data-ocid={`shorts.history_item.${index + 1}`}
    >
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        {isYouTube ? (
          <span className="text-base">🎬</span>
        ) : (
          <Film className="w-4 h-4 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">
          {displayUrl}
        </p>
        <p className="text-xs text-muted-foreground">
          {fmtDate(job.createdAt)}
        </p>
      </div>
      <Badge className={`${cls} flex items-center gap-1 shrink-0 text-xs`}>
        {job.clipStatus === "ready" ? (
          <CheckCircle className="w-3 h-3" />
        ) : !isTerminal(job.clipStatus) ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        {label}
      </Badge>
    </div>
  );
}

// ─── ShortsTab ────────────────────────────────────────────────────────────────

interface ShortsTabProps {
  pilotMode?: boolean;
}

export function ShortsTab({ pilotMode }: ShortsTabProps) {
  const [inputMode, setInputMode] = useState<"youtube" | "upload">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = useSubmitShortsJob();
  const { data: jobs = [], isLoading: jobsLoading } = useShortsJobs();

  const todayCount = todayShortsCount(jobs);
  const rateLimited = todayCount >= DAILY_LIMIT;
  const isSubmitting = submit.isPending;

  const handleSubmit = () => {
    if (rateLimited) return;

    const req: ShortsRequest =
      inputMode === "youtube"
        ? { sourceUrl: youtubeUrl.trim(), sourceType: "youtube" }
        : {
            sourceUrl: uploadFile ? uploadFile.name : "",
            sourceType: "upload",
          };

    if (inputMode === "youtube" && !req.sourceUrl) {
      toast.error("Please paste a YouTube URL first.");
      return;
    }
    if (inputMode === "upload" && !uploadFile) {
      toast.error("Please select a video file.");
      return;
    }

    submit.mutate(req, {
      onSuccess: (jobId) => {
        setActiveJobId(jobId);
        toast.success("Nduna is finding the best clip…");
      },
    });
  };

  const handleReset = () => {
    setActiveJobId(null);
    setYoutubeUrl("");
    setUploadFile(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadFile(file);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="space-y-1">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Scissors className="w-5 h-5 text-primary" />
          Clip to Short
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Paste a YouTube URL or upload a video. Nduna finds the most gripping 2
          minutes, crops it vertical, and burns in subtitles — ready for TikTok
          or Instagram.
        </p>
      </div>

      {pilotMode && (
        <div className="flex items-start gap-2 p-3 bg-muted/20 border border-border/50 rounded-xl text-xs text-muted-foreground">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
          Pilot mode active — rendering runs on your VPS. Make sure the VPS URL
          is set in Settings.
        </div>
      )}

      {/* ── Rate limit ── */}
      {rateLimited && (
        <Card
          className="p-4 bg-destructive/10 border-destructive/20"
          data-ocid="shorts.rate_limit_card"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-foreground">
                Daily limit reached
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You've used your {DAILY_LIMIT} clips today. Come back tomorrow!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Input form (hide when a job is active) ── */}
      {!activeJobId && (
        <div className="space-y-4">
          {/* Source toggle */}
          <div
            className="flex gap-1 bg-muted/20 rounded-xl p-1"
            data-ocid="shorts.source_toggle"
          >
            {(["youtube", "upload"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setInputMode(mode)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  inputMode === mode
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid={`shorts.${mode}_tab`}
              >
                {mode === "youtube" ? "YouTube URL" : "Upload Video"}
              </button>
            ))}
          </div>

          {inputMode === "youtube" ? (
            <div className="space-y-1.5">
              <Label
                htmlFor="shorts-youtube-url"
                className="text-sm font-semibold text-foreground"
              >
                YouTube URL
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base select-none">
                  ▶
                </span>
                <Input
                  id="shorts-youtube-url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={isSubmitting || rateLimited}
                  className="h-12 text-sm pl-8"
                  data-ocid="shorts.youtube_url_input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">
                Upload Video
              </Label>
              <button
                type="button"
                onDrop={handleFileDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border/60 bg-muted/10 hover:border-primary/50 hover:bg-primary/5"
                }`}
                data-ocid="shorts.upload_dropzone"
                aria-label="Drop video file or click to upload"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp4,.mov,.avi,video/*"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
                {uploadFile ? (
                  <div className="space-y-1">
                    <Video className="w-8 h-8 text-primary mx-auto" />
                    <p className="text-sm font-semibold text-foreground">
                      {uploadFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-semibold text-foreground">
                      Drop your video here or tap to choose
                    </p>
                    <p className="text-xs text-muted-foreground">
                      .mp4 / .mov / .avi — up to 500 MB
                    </p>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Generate button */}
          <Button
            className="w-full h-12 gap-2 text-base font-semibold"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              rateLimited ||
              (inputMode === "youtube" && !youtubeUrl.trim()) ||
              (inputMode === "upload" && !uploadFile)
            }
            data-ocid="shorts.generate_button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending to Nduna…
              </>
            ) : (
              <>
                <Scissors className="w-5 h-5" />
                Generate Short
              </>
            )}
          </Button>

          {/* Daily limit badge */}
          {!rateLimited && (
            <p className="text-xs text-center font-medium text-primary">
              {DAILY_LIMIT - todayCount} short
              {DAILY_LIMIT - todayCount !== 1 ? "s" : ""} remaining today
            </p>
          )}
        </div>
      )}

      {/* ── Status poller ── */}
      {activeJobId && (
        <ShortsPoller jobId={activeJobId} onReset={handleReset} />
      )}

      {/* ── History ── */}
      <div className="space-y-3" data-ocid="shorts.history_section">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            Previous Clips
          </h3>
          {jobs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {Math.min(jobs.length, 20)} of {jobs.length}
            </span>
          )}
        </div>

        {jobsLoading ? (
          <div className="space-y-2" data-ocid="shorts.history_loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card
            className="p-8 text-center bg-muted/10 border-dashed"
            data-ocid="shorts.history_empty_state"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Scissors className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-foreground mb-1">No clips yet</p>
            <p className="text-sm text-muted-foreground">
              Paste a YouTube URL or upload a video and Nduna will find the most
              gripping 2 minutes — vertical, subtitled, and ready to post.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 20).map((job, i) => (
              <HistoryCard key={job.id} job={job} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
