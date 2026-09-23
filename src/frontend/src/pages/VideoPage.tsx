/**
 * VideoPage.tsx — Nduna Video Automation Engine.
 * Drivers upload raw content; Nduna auto-generates clips, previews them,
 * and posts to TikTok, Instagram Reels, YouTube Shorts, and LinkedIn.
 * Tier 2+ (Pro Driver) required for upload; Tier 3 for scheduling.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart2,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clapperboard,
  Clock,
  Film,
  Globe,
  Loader2,
  Lock,
  Play,
  Send,
  Settings2,
  Sparkles,
  Upload,
  Video,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import type {
  BrandingConfig,
  ClipStatus,
  SocialPlatform,
  UploadStatus,
  VideoClip,
  VideoUpload,
} from "../features/video/types";
import {
  useBrandingConfig,
  useCreateVideoPost,
  useCreateVideoUpload,
  useFetchAndStoreAnalytics,
  useIsUploadPostConfigured,
  usePostingSchedule,
  useSavePostingSchedule,
  useSaveVideoBrandingConfig,
  useTriggerVideoProcessing,
  useVideoClips,
  useVideoJobStatus,
  useVideoUploads,
} from "../features/video/useVideo";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  profile?: UserProfile | null;
  tier?: number;
  isAdmin?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

const PLATFORMS: SocialPlatform[] = [
  "tiktok",
  "instagram",
  "youtube",
  "linkedin",
];

const PLATFORM_CFG: Record<SocialPlatform, { label: string; icon: string }> = {
  tiktok: { label: "TikTok", icon: "🎵" },
  instagram: { label: "Instagram", icon: "📸" },
  youtube: { label: "YouTube", icon: "▶️" },
  linkedin: { label: "LinkedIn", icon: "💼" },
};

const UPLOAD_STATUS: Record<
  UploadStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Queued",
    cls: "bg-muted/60 text-muted-foreground",
    icon: <Clock className="w-3 h-3" />,
  },
  processing: {
    label: "Processing",
    cls: "bg-primary/15 text-primary",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  ready: {
    label: "Ready",
    cls: "bg-green-500/15 text-green-500",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  failed: {
    label: "Failed",
    cls: "bg-destructive/15 text-destructive",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const CLIP_STATUS: Record<
  ClipStatus,
  { label: string; cls: string; dot: string }
> = {
  pending: {
    label: "Queued",
    cls: "bg-muted/60 text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  captioning: {
    label: "Captioning",
    cls: "bg-primary/15 text-primary",
    dot: "bg-primary animate-pulse",
  },
  branding: {
    label: "Branding",
    cls: "bg-primary/15 text-primary",
    dot: "bg-primary animate-pulse",
  },
  ready: {
    label: "Ready",
    cls: "bg-green-500/15 text-green-500",
    dot: "bg-green-500",
  },
  failed: {
    label: "Failed",
    cls: "bg-destructive/15 text-destructive",
    dot: "bg-destructive",
  },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MUSIC_OPTIONS = ["Upbeat", "Driving", "Low Key", "None"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtSize(bytes: bigint) {
  const mb = Number(bytes) / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

// ─── UploadZone ───────────────────────────────────────────────────────────────

function UploadZone() {
  const createUpload = useCreateVideoUpload();
  const triggerProcessing = useTriggerVideoProcessing();
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      setSizeError(null);
      if (file.size > MAX_FILE_BYTES) {
        setSizeError(
          `File is too large (${(file.size / 1024 / 1024 / 1024).toFixed(2)} GB). Max size is 2 GB.`,
        );
        return;
      }
      setSelectedFile(file);
      setProgress(0);
      createUpload.mutate(
        { file, onProgress: setProgress },
        {
          onSuccess: (uploadId) => {
            setProgress(null);
            setSelectedFile(null);
            triggerProcessing.mutate(uploadId);
          },
          onError: () => {
            setProgress(null);
            setSelectedFile(null);
          },
        },
      );
    },
    [createUpload, triggerProcessing],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isPending = createUpload.isPending;

  return (
    <div className="space-y-3">
      <button
        type="button"
        className={`drag-drop-zone w-full ${dragging ? "active" : ""} ${isPending ? "pointer-events-none" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !isPending && fileRef.current?.click()}
        aria-label="Upload video or audio file"
        data-ocid="video.upload_zone"
      >
        <input
          ref={fileRef}
          type="file"
          accept="video/*,audio/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
          data-ocid="video.upload_input"
        />

        {isPending ? (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            </div>
            <div>
              <p className="drag-drop-text">
                Uploading{selectedFile ? ` "${selectedFile.name}"` : ""}…
              </p>
              {selectedFile && (
                <p className="drag-drop-hint mt-1">
                  {fmtSize(BigInt(selectedFile.size))}
                </p>
              )}
            </div>
            {progress !== null && (
              <div className="upload-progress-bar max-w-xs mx-auto">
                <div className="progress-label">
                  <span>Uploading to Nduna</span>
                  <span className="progress-percentage">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="drag-drop-text">
                Drop your video here or tap to browse
              </p>
              <p className="drag-drop-hint mt-1">
                Podcast, driving footage, pitch recording — any format · Max 2
                GB
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {PLATFORMS.map((p) => (
                <span key={p} className="platform-badge text-xs py-1 px-2.5">
                  <span>{PLATFORM_CFG[p].icon}</span>
                  <span className="text-muted-foreground">
                    {PLATFORM_CFG[p].label}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </button>

      {sizeError && (
        <div
          className="message-error-state"
          data-ocid="video.upload_size_error"
        >
          <div className="message-error-icon">⚠</div>
          <div className="message-error-content">
            <p className="message-error-title">File too large</p>
            <p className="message-error-text">{sizeError}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProcessingCard ───────────────────────────────────────────────────────────

function ProcessingCard({ upload }: { upload: VideoUpload }) {
  const { data: jobStatus } = useVideoJobStatus(upload.id);
  const triggerProcessing = useTriggerVideoProcessing();

  if (upload.processingStatus === "failed") {
    return (
      <div className="message-error-state" data-ocid="video.processing_error">
        <div className="message-error-icon">✕</div>
        <div className="message-error-content">
          <p className="message-error-title">Processing failed</p>
          <p className="message-error-text">
            {upload.errorMsg ??
              "Nduna could not process this video. Please try uploading again."}
          </p>
        </div>
      </div>
    );
  }

  const total = jobStatus ? Number(jobStatus.clipsGenerated) : 0;
  const ready = jobStatus ? Number(jobStatus.clipsReady) : 0;
  const failed = jobStatus ? Number(jobStatus.clipsFailed) : 0;
  const settled = ready + failed;
  const allDone = total > 0 && settled >= total;
  const pct = total > 0 ? Math.round((settled / total) * 100) : 0;

  if (!jobStatus || upload.processingStatus === "pending") {
    return (
      <Card className="p-3 bg-muted/20 border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Queued for processing
            </p>
            <p className="text-xs text-muted-foreground">
              Nduna will begin clipping shortly
            </p>
          </div>
          {upload.processingStatus === "pending" && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5 text-xs"
              onClick={() => triggerProcessing.mutate(upload.id)}
              disabled={triggerProcessing.isPending}
              data-ocid="video.trigger_processing.button"
            >
              <Zap className="w-3 h-3" />
              Start
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-3 border ${allDone ? "bg-green-500/5 border-green-500/20" : "bg-primary/5 border-primary/20"}`}
      data-ocid="video.job_status_card"
    >
      <div className="flex items-center gap-3 mb-2.5">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${allDone ? "bg-green-500/10" : "bg-primary/10"}`}
        >
          {allDone ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {allDone
              ? `${ready} clip${ready !== 1 ? "s" : ""} ready for review`
              : `Generating clips… ${ready} of ${total} ready`}
          </p>
          <p className="text-xs text-muted-foreground">
            {allDone
              ? failed > 0
                ? `${failed} clip${failed !== 1 ? "s" : ""} could not be processed`
                : "Scroll down to preview and post"
              : "Nduna is detecting highlights and creating short clips"}
          </p>
        </div>
      </div>
      {!allDone && (
        <div className="space-y-1.5">
          <Progress value={pct} className="h-1.5" />
          <p className="text-right text-xs text-muted-foreground">{pct}%</p>
        </div>
      )}
    </Card>
  );
}

// ─── ClipCard ─────────────────────────────────────────────────────────────────

function ClipCard({ clip, index }: { clip: VideoClip; index: number }) {
  const createPost = useCreateVideoPost();
  const [posting, setPosting] = useState<SocialPlatform | null>(null);
  const [posted, setPosted] = useState<SocialPlatform[]>([]);

  const statusCfg = CLIP_STATUS[clip.processingStatus];
  const title = clip.title ?? `Clip ${index + 1}`;
  const isReady = clip.processingStatus === "ready";

  const handlePost = (platform: SocialPlatform) => {
    setPosting(platform);
    createPost.mutate(
      { clipId: clip.id, platform },
      {
        onSuccess: () => {
          setPosted((prev) => [...prev, platform]);
          setPosting(null);
          toast.success(`${PLATFORM_CFG[platform].label} post queued!`);
        },
        onError: () => setPosting(null),
      },
    );
  };

  const handlePostAll = () => {
    const unposted = PLATFORMS.filter((p) => !posted.includes(p));
    for (const p of unposted) {
      handlePost(p);
    }
  };

  return (
    <Card
      className="clip-card overflow-hidden border-border/60"
      data-ocid="video.clip_card"
    >
      {/* 9:16 thumbnail */}
      <div className="relative" style={{ aspectRatio: "9/16", maxHeight: 200 }}>
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-muted/60 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Video className="w-5 h-5 text-primary" />
          </div>
          {!isReady && (
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              <span className="text-xs text-muted-foreground">
                {statusCfg.label}
              </span>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-foreground/80 text-background text-xs font-mono px-1.5 py-0.5">
            {fmtDuration(clip.durationSec)}
          </Badge>
        </div>

        {/* Status */}
        <div className="absolute top-2 right-2">
          <Badge className={`${statusCfg.cls} text-xs flex items-center gap-1`}>
            {clip.processingStatus === "captioning" ||
            clip.processingStatus === "branding" ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            ) : clip.processingStatus === "ready" ? (
              <CheckCircle className="w-2.5 h-2.5" />
            ) : null}
            {statusCfg.label}
          </Badge>
        </div>
      </div>

      {/* Info + actions */}
      <div className="p-3 space-y-2.5">
        <div>
          <p className="font-semibold text-sm text-foreground truncate">
            {title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {clip.captionsVttRef ? "Captions added ✓" : "Captions processing…"}
          </p>
        </div>

        {isReady && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Post to:
            </p>
            <div className="grid grid-cols-2 gap-1">
              {PLATFORMS.map((platform) => {
                const isDone = posted.includes(platform);
                const isLoading = posting === platform;
                return (
                  <Button
                    key={platform}
                    size="sm"
                    variant={isDone ? "secondary" : "outline"}
                    className="gap-1 text-xs h-7 justify-start px-2"
                    onClick={() => !isDone && !posting && handlePost(platform)}
                    disabled={isDone || !!posting}
                    data-ocid={`video.post_${platform}.button`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : isDone ? (
                      <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                    ) : (
                      <Send className="w-2.5 h-2.5" />
                    )}
                    {PLATFORM_CFG[platform].label}
                  </Button>
                );
              })}
            </div>
            <Button
              size="sm"
              className="w-full gap-1.5 text-xs h-8"
              onClick={handlePostAll}
              disabled={!!posting || PLATFORMS.every((p) => posted.includes(p))}
              data-ocid="video.post_all.button"
            >
              <Globe className="w-3 h-3" />
              Post to All Platforms
            </Button>
          </div>
        )}

        {clip.processingStatus === "failed" && clip.errorMsg && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-md px-2 py-1.5">
            {clip.errorMsg}
          </p>
        )}
      </div>
    </Card>
  );
}

// ─── ClipCarousel ─────────────────────────────────────────────────────────────

function ClipCarousel({ uploadId }: { uploadId: string }) {
  const { data: clips = [], isLoading } = useVideoClips(uploadId);
  const [page, setPage] = useState(0);
  const perPage = 3;
  const totalPages = Math.ceil(clips.length / perPage);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    );
  }

  if (clips.length === 0) return null;

  const visibleClips = clips.slice(page * perPage, page * perPage + perPage);

  return (
    <div className="space-y-3" data-ocid="video.clip_carousel">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Film className="w-4 h-4 text-primary" />
          {clips.length} Clip{clips.length !== 1 ? "s" : ""} Generated
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-7 h-7 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center disabled:opacity-40 hover:bg-muted/70 transition-colors"
              aria-label="Previous clips"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-muted-foreground">
              {page + 1}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-7 h-7 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center disabled:opacity-40 hover:bg-muted/70 transition-colors"
              aria-label="Next clips"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visibleClips.map((clip, i) => (
          <ClipCard key={clip.id} clip={clip} index={page * perPage + i} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="clip-nav-dots static transform-none flex justify-center gap-1.5 mt-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={`page-dot-${pageNum}`}
                type="button"
                onClick={() => setPage(pageNum - 1)}
                className={`clip-dot ${page === pageNum - 1 ? "active" : ""}`}
                aria-label={`Page ${pageNum}`}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ─── UploadRow ────────────────────────────────────────────────────────────────

function UploadRow({ upload }: { upload: VideoUpload }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = UPLOAD_STATUS[upload.processingStatus];

  const isProcessing = upload.processingStatus === "processing";
  const isReady = upload.processingStatus === "ready";

  return (
    <Card className="overflow-hidden" data-ocid="video.upload_row">
      <button
        type="button"
        className="w-full p-4 flex items-center gap-3 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Film className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {upload.fileName}
          </p>
          <p className="text-xs text-muted-foreground">
            {fmtSize(upload.fileSizeBytes)}
          </p>
        </div>
        <Badge
          className={`${statusCfg.cls} flex items-center gap-1 shrink-0 text-xs`}
        >
          {statusCfg.icon}
          {statusCfg.label}
        </Badge>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">
          <ProcessingCard upload={upload} />
          {(isProcessing || isReady) && <ClipCarousel uploadId={upload.id} />}
        </div>
      )}
    </Card>
  );
}

// ─── UploadsTab ───────────────────────────────────────────────────────────────

function UploadsTab() {
  const { data: uploads = [], isLoading } = useVideoUploads();

  return (
    <div className="space-y-4">
      <UploadZone />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : uploads.length === 0 ? (
        <Card
          className="p-8 text-center bg-muted/10 border-dashed"
          data-ocid="video.uploads_empty_state"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Clapperboard className="w-7 h-7 text-primary" />
          </div>
          <p className="font-semibold text-foreground mb-1">
            Upload your first video to start creating clips automatically
          </p>
          <p className="text-sm text-muted-foreground">
            Nduna detects highlights, splits into short clips, adds captions and
            MoneyDrive branding, then posts to all platforms.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {uploads.map((u) => (
            <UploadRow key={u.id} upload={u} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BrandingPanel ────────────────────────────────────────────────────────────

function BrandingPanel() {
  const { data: existing, isLoading } = useBrandingConfig();
  const save = useSaveVideoBrandingConfig();
  const [open, setOpen] = useState(false);

  const [driverName, setDriverName] = useState("");
  const [cta, setCta] = useState("Join MoneyDrive");
  const [music, setMusic] = useState("Upbeat");
  const [synced, setSynced] = useState(false);

  if (!isLoading && existing && !synced) {
    setSynced(true);
    setDriverName(existing.driverName ?? "");
    setCta(existing.callToAction ?? "Join MoneyDrive");
    setMusic(existing.musicPreference ?? "Upbeat");
  }

  const handleSave = () => {
    const config: BrandingConfig = {
      driverName,
      accentColor: "#D97706",
      callToAction: cta,
      musicPreference: music,
      showMoneyDriveLogo: true,
    };
    save.mutate(config);
  };

  return (
    <Card className="overflow-hidden" data-ocid="video.branding_panel">
      <button
        type="button"
        className="w-full p-4 flex items-center gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Settings2 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground">
            Branding Settings
          </p>
          <p className="text-xs text-muted-foreground">
            Driver name, CTA, music, logo
          </p>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label
                  htmlFor="driver-name"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Driver Name
                </Label>
                <Input
                  id="driver-name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Your name as it appears in videos"
                  data-ocid="video.branding_driver_name"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="cta-text"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Call-to-Action Text
                </Label>
                <Input
                  id="cta-text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="Join MoneyDrive"
                  data-ocid="video.branding_cta"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Background Music
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {MUSIC_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setMusic(opt)}
                      className={`frequency-option text-sm ${music === opt ? "active" : ""}`}
                      data-ocid={`video.music_${opt.toLowerCase().replace(" ", "_")}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    MoneyDrive Logo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Always shown — MoneyDrive branding only
                  </p>
                </div>
                <Switch
                  checked={true}
                  disabled
                  aria-label="MoneyDrive logo always on"
                  data-ocid="video.branding_logo_toggle"
                />
              </div>

              <Button
                className="w-full gap-1.5"
                onClick={handleSave}
                disabled={save.isPending}
                data-ocid="video.branding_save.button"
              >
                {save.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Save Branding
              </Button>

              <Card className="p-3 bg-accent/10 border-accent/30">
                <div className="flex items-start gap-2.5">
                  <Play className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Driver preview required
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Every clip goes through your approval before posting. No
                      third-party logos — MoneyDrive branding only.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── SchedulePanel ────────────────────────────────────────────────────────────

function SchedulePanel({ tier }: { tier: number }) {
  const { data: existing, isLoading } = usePostingSchedule();
  const { data: isConfigured } = useIsUploadPostConfigured();
  const save = useSavePostingSchedule();
  const [open, setOpen] = useState(false);

  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    "tiktok",
    "instagram",
    "youtube",
  ]);
  const [postsPerWeek, setPostsPerWeek] = useState(3);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 2, 4]);
  const [synced, setSynced] = useState(false);

  if (!isLoading && existing && !synced) {
    setSynced(true);
    setPlatforms(existing.platformsEnabled);
    setPostsPerWeek(Number(existing.postsPerWeek));
    setSelectedDays(existing.preferredDays.map(Number));
  }

  const isElite = tier >= 3;

  const togglePlatform = (p: SocialPlatform) =>
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );

  const toggleDay = (i: number) =>
    setSelectedDays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i],
    );

  const handleSave = () => {
    save.mutate({
      driverId: "",
      enabled: true,
      postsPerWeek: BigInt(postsPerWeek),
      preferredDays: selectedDays.map(BigInt),
      preferredHourUtc: BigInt(8),
      platformsEnabled: platforms,
    });
  };

  return (
    <Card className="overflow-hidden" data-ocid="video.schedule_panel">
      <button
        type="button"
        className="w-full p-4 flex items-center gap-3 text-left"
        onClick={() => isElite && setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <CalendarDays className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            Posting Schedule
            {!isElite && <Lock className="w-3 h-3 text-muted-foreground" />}
          </p>
          <p className="text-xs text-muted-foreground">
            {isElite
              ? "Auto-post days, frequency, and platforms"
              : "Elite (R800/mo) feature"}
          </p>
        </div>
        <span
          className={`messaging-status-indicator shrink-0 ${isConfigured ? "connected" : "disconnected"}`}
          data-ocid="video.uploadpost_status"
        >
          {isConfigured ? "Connected" : "Not set up"}
        </span>
      </button>

      {!isElite && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <p className="text-xs text-muted-foreground">
            Upgrade to{" "}
            <span className="text-primary font-semibold">Elite (R800/mo)</span>{" "}
            to unlock automated posting and let Nduna post for you on a
            schedule.
          </p>
        </div>
      )}

      {isElite && open && (
        <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* Platform toggles */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Platforms
                </p>
                <div className="platform-badges flex-wrap">
                  {PLATFORMS.map((p) => {
                    const active = platforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={`platform-badge ${active ? "connected" : "disconnected"}`}
                        data-ocid={`video.schedule_platform_${p}`}
                        aria-pressed={active}
                      >
                        <span>{PLATFORM_CFG[p].icon}</span>
                        {PLATFORM_CFG[p].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Posts per week */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Posts Per Week
                </p>
                <div className="schedule-frequency-options">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPostsPerWeek(n)}
                      className={`frequency-option ${postsPerWeek === n ? "active" : ""}`}
                      data-ocid={`video.schedule_freq_${n}`}
                    >
                      {n}×/week
                    </button>
                  ))}
                </div>
              </div>

              {/* Day selector */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Preferred Days
                </p>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`rounded-lg py-2 text-xs font-semibold transition-colors border ${
                        selectedDays.includes(i)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/20 text-muted-foreground border-border/50 hover:border-primary/40"
                      }`}
                      data-ocid={`video.schedule_day_${day.toLowerCase()}`}
                      aria-pressed={selectedDays.includes(i)}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full gap-1.5"
                onClick={handleSave}
                disabled={save.isPending}
                data-ocid="video.schedule_save.button"
              >
                {save.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CalendarDays className="w-4 h-4" />
                )}
                Save Schedule
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── AnalyticsSection ─────────────────────────────────────────────────────────

const KPI_CARDS = [
  { label: "Total Views", key: "views" as const },
  { label: "Likes", key: "likes" as const },
  { label: "Shares", key: "shares" as const },
  { label: "Engagement", key: "engagement" as const },
] as const;

function AnalyticsSection() {
  const fetchAnalytics = useFetchAndStoreAnalytics();

  // KPI values — always 0 until real data arrives
  const kpiValues: Record<"views" | "likes" | "shares" | "engagement", string> =
    {
      views: "0",
      likes: "0",
      shares: "0",
      engagement: "0%",
    };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-primary" />
          Performance Analytics
        </h3>
        <div className="flex flex-col items-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics.mutate()}
            disabled={fetchAnalytics.isPending}
            className="gap-1.5 text-xs"
            data-ocid="video.refresh_analytics.button"
          >
            {fetchAnalytics.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Refresh Now
          </Button>
          <p className="text-xs text-muted-foreground">
            Analytics automatically update every 24 hours
          </p>
        </div>
      </div>

      {/* KPI overview cards — always visible, show 0 when no data yet */}
      <div
        className="grid grid-cols-2 gap-2.5"
        data-ocid="video.analytics_kpi_grid"
      >
        {KPI_CARDS.map(({ label, key }) => (
          <Card
            key={key}
            className="p-3 bg-muted/10 border-border/60"
            data-ocid={`video.analytics_kpi_${key}`}
          >
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-xl font-bold text-foreground font-mono">
              {kpiValues[key]}
            </p>
          </Card>
        ))}
      </div>

      <Card
        className="p-5 text-center bg-muted/10 border-dashed"
        data-ocid="video.analytics_empty_state"
      >
        <BarChart2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="font-semibold text-foreground mb-1">
          Analytics load after first post
        </p>
        <p className="text-sm text-muted-foreground">
          Once your clips are posted, Nduna tracks views, likes, shares, and
          engagement per platform daily.
        </p>
      </Card>
    </div>
  );
}

// ─── VideoPage ────────────────────────────────────────────────────────────────

export default function VideoPage({ tier = 1 }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Clapperboard className="w-6 h-6 text-primary" />
          Content Creator
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload once — Nduna generates clips, adds captions and branding, then
          posts to all platforms
        </p>
      </div>

      {/* How it works strip */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          {
            icon: <Upload className="w-4 h-4" />,
            label: "1. Upload video",
            sub: "Any format",
          },
          {
            icon: <Zap className="w-4 h-4" />,
            label: "2. Nduna clips it",
            sub: "Auto-captioned",
          },
          {
            icon: <Play className="w-4 h-4" />,
            label: "3. Preview & post",
            sub: "Your approval",
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
            <p className="text-xs text-muted-foreground mt-0.5">{step.sub}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="w-full" data-ocid="video.tabs">
          <TabsTrigger
            value="upload"
            className="flex-1 gap-1.5"
            data-ocid="video.tab.upload"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex-1 gap-1.5"
            data-ocid="video.tab.analytics"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex-1 gap-1.5"
            data-ocid="video.tab.settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 mt-0">
          <UploadsTab />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <AnalyticsSection />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 space-y-3">
          <BrandingPanel />
          <SchedulePanel tier={tier} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
