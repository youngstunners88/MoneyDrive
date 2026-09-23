import { c as createLucideIcon, u as useActor, m as useQuery, n as useQueryClient, o as useMutation, p as ue, _ as ExternalBlob, j as jsxRuntimeExports, $ as Clapperboard, Z as Zap, h as Play, v as Card, a0 as ChartNoAxesColumn, q as Skeleton, B as Button, L as LoaderCircle, a1 as Sparkles, r as reactExports, D as ChevronUp, s as ChevronDown, F as Label, I as Input, g as Switch, C as CircleCheckBig, a2 as CalendarDays, a3 as Lock, a4 as Film, i as Badge, a5 as CircleX, Y as Clock, a6 as Progress, a7 as ChevronLeft, a8 as ChevronRight, a9 as Send, aa as Globe } from "./index-C-RLbQrs.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-DUCUk98S.js";
import { U as Upload } from "./upload-z_EyXbuv.js";
import { V as Video } from "./video-CUzyxwc2.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M20 7h-9", key: "3s1dr2" }],
  ["path", { d: "M14 17H5", key: "gfn3mx" }],
  ["circle", { cx: "17", cy: "17", r: "3", key: "18b49y" }],
  ["circle", { cx: "7", cy: "7", r: "3", key: "dfmy0x" }]
];
const Settings2 = createLucideIcon("settings-2", __iconNode);
const videoKeys = {
  uploads: () => ["video-uploads"],
  upload: (id) => ["video-upload", id],
  clips: (uploadId) => ["video-clips", uploadId],
  clip: (clipId) => ["video-clip", clipId],
  posts: (clipId) => ["video-posts", clipId],
  analytics: (postId) => ["video-analytics", postId],
  jobStatus: (uploadId) => ["video-job-status", uploadId],
  isConfigured: () => ["video-uploadpost-configured"],
  brandingConfig: () => ["video-branding-config"],
  postingSchedule: () => ["video-posting-schedule"]
};
function toUploadStatus(raw) {
  return raw;
}
function toClipStatus(raw) {
  return raw;
}
function toSocialPlatform(raw) {
  return raw;
}
function useVideoUploads() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: videoKeys.uploads(),
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getVideoUploads();
      return result.map((u) => ({
        ...u,
        processingStatus: toUploadStatus(u.processingStatus)
      }));
    },
    enabled: !!actor && !isFetching
  });
}
function useVideoClips(uploadId) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: videoKeys.clips(uploadId),
    queryFn: async () => {
      if (!actor || !uploadId) return [];
      const result = await actor.getVideoClips(uploadId);
      return result.map((c) => ({
        ...c,
        processingStatus: toClipStatus(c.processingStatus)
      }));
    },
    enabled: !!actor && !isFetching && !!uploadId
  });
}
function useVideoJobStatus(uploadId) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: videoKeys.jobStatus(uploadId),
    queryFn: async () => {
      if (!actor || !uploadId) return null;
      return actor.getVideoJobStatus(
        uploadId
      );
    },
    enabled: !!actor && !isFetching && !!uploadId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5e3;
      const total = Number(data.clipsGenerated);
      const settled = Number(data.clipsReady) + Number(data.clipsFailed);
      if (total > 0 && settled >= total) return false;
      return 5e3;
    }
  });
}
function useIsUploadPostConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: videoKeys.isConfigured(),
    queryFn: async () => {
      if (!actor) return false;
      return actor.isUploadPostConfigured();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 6e4
  });
}
function useBrandingConfig() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: videoKeys.brandingConfig(),
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVideoBrandingConfig();
    },
    enabled: !!actor && !isFetching
  });
}
function usePostingSchedule() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: videoKeys.postingSchedule(),
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getPostingSchedule();
      if (!result) return null;
      return {
        ...result,
        platformsEnabled: result.platformsEnabled.map(
          (p) => toSocialPlatform(p)
        )
      };
    },
    enabled: !!actor && !isFetching
  });
}
function useCreateVideoUpload() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, onProgress }) => {
      if (!actor) throw new Error("Actor not available");
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }
      const refBytes = await actor._uploadFile(blob);
      const storageRef = new TextDecoder().decode(refBytes);
      const result = await actor.createVideoUpload(
        storageRef,
        file.name,
        BigInt(file.size),
        file.type || "video/mp4"
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.uploads() });
      ue.success("Video uploaded — Nduna is processing your clips");
    },
    onError: (err) => {
      ue.error(`Upload failed: ${err.message}`);
    }
  });
}
function useTriggerVideoProcessing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (uploadId) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.triggerVideoProcessing(uploadId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_msg, uploadId) => {
      queryClient.invalidateQueries({
        queryKey: videoKeys.jobStatus(uploadId)
      });
      queryClient.invalidateQueries({ queryKey: videoKeys.clips(uploadId) });
      ue.success("Processing started — check back in a few minutes");
    },
    onError: (err) => {
      ue.error(`Processing failed: ${err.message}`);
    }
  });
}
function useCreateVideoPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clipId, platform, scheduledAt }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.createVideoPost(
        clipId,
        platform,
        scheduledAt ?? null
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_id, { clipId }) => {
      queryClient.invalidateQueries({ queryKey: videoKeys.posts(clipId) });
      ue.success("Clip queued for posting");
    },
    onError: (err) => {
      ue.error(`Failed to post clip: ${err.message}`);
    }
  });
}
function useSaveVideoBrandingConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveVideoBrandingConfig(
        config
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.brandingConfig() });
      ue.success("Branding config saved");
    },
    onError: (err) => {
      ue.error(`Failed to save branding: ${err.message}`);
    }
  });
}
function useSavePostingSchedule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (schedule) => {
      if (!actor) throw new Error("Actor not available");
      await actor.savePostingSchedule(
        schedule
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.postingSchedule() });
      ue.success("Posting schedule saved");
    },
    onError: (err) => {
      ue.error(`Failed to save schedule: ${err.message}`);
    }
  });
}
function useFetchAndStoreAnalytics() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.fetchAndStoreAnalytics();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-analytics"] });
      ue.success("Analytics refreshed");
    },
    onError: (err) => {
      ue.error(`Analytics refresh failed: ${err.message}`);
    }
  });
}
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const PLATFORMS = [
  "tiktok",
  "instagram",
  "youtube",
  "linkedin"
];
const PLATFORM_CFG = {
  tiktok: { label: "TikTok", icon: "🎵" },
  instagram: { label: "Instagram", icon: "📸" },
  youtube: { label: "YouTube", icon: "▶️" },
  linkedin: { label: "LinkedIn", icon: "💼" }
};
const UPLOAD_STATUS = {
  pending: {
    label: "Queued",
    cls: "bg-muted/60 text-muted-foreground",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-3 h-3" })
  },
  processing: {
    label: "Processing",
    cls: "bg-primary/15 text-primary",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3 h-3 animate-spin" })
  },
  ready: {
    label: "Ready",
    cls: "bg-green-500/15 text-green-500",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-3 h-3" })
  },
  failed: {
    label: "Failed",
    cls: "bg-destructive/15 text-destructive",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "w-3 h-3" })
  }
};
const CLIP_STATUS = {
  pending: {
    label: "Queued",
    cls: "bg-muted/60 text-muted-foreground",
    dot: "bg-muted-foreground"
  },
  captioning: {
    label: "Captioning",
    cls: "bg-primary/15 text-primary",
    dot: "bg-primary animate-pulse"
  },
  branding: {
    label: "Branding",
    cls: "bg-primary/15 text-primary",
    dot: "bg-primary animate-pulse"
  },
  ready: {
    label: "Ready",
    cls: "bg-green-500/15 text-green-500",
    dot: "bg-green-500"
  },
  failed: {
    label: "Failed",
    cls: "bg-destructive/15 text-destructive",
    dot: "bg-destructive"
  }
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MUSIC_OPTIONS = ["Upbeat", "Driving", "Low Key", "None"];
function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function fmtSize(bytes) {
  const mb = Number(bytes) / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}
function UploadZone() {
  const createUpload = useCreateVideoUpload();
  const triggerProcessing = useTriggerVideoProcessing();
  const fileRef = reactExports.useRef(null);
  const [progress, setProgress] = reactExports.useState(null);
  const [selectedFile, setSelectedFile] = reactExports.useState(null);
  const [sizeError, setSizeError] = reactExports.useState(null);
  const [dragging, setDragging] = reactExports.useState(false);
  const handleFile = reactExports.useCallback(
    (file) => {
      setSizeError(null);
      if (file.size > MAX_FILE_BYTES) {
        setSizeError(
          `File is too large (${(file.size / 1024 / 1024 / 1024).toFixed(2)} GB). Max size is 2 GB.`
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
          }
        }
      );
    },
    [createUpload, triggerProcessing]
  );
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const isPending = createUpload.isPending;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: `drag-drop-zone w-full ${dragging ? "active" : ""} ${isPending ? "pointer-events-none" : ""}`,
        onDragOver: (e) => {
          e.preventDefault();
          setDragging(true);
        },
        onDragLeave: () => setDragging(false),
        onDrop,
        onClick: () => {
          var _a;
          return !isPending && ((_a = fileRef.current) == null ? void 0 : _a.click());
        },
        "aria-label": "Upload video or audio file",
        "data-ocid": "video.upload_zone",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: fileRef,
              type: "file",
              accept: "video/*,audio/*",
              className: "sr-only",
              onChange: (e) => {
                var _a;
                const file = (_a = e.target.files) == null ? void 0 : _a[0];
                if (file) handleFile(file);
                e.target.value = "";
              },
              "data-ocid": "video.upload_input"
            }
          ),
          isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-7 h-7 text-primary animate-spin" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "drag-drop-text", children: [
                "Uploading",
                selectedFile ? ` "${selectedFile.name}"` : "",
                "…"
              ] }),
              selectedFile && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drag-drop-hint mt-1", children: fmtSize(BigInt(selectedFile.size)) })
            ] }),
            progress !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-progress-bar max-w-xs mx-auto", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "progress-label", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Uploading to Nduna" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "progress-percentage", children: [
                  Math.round(progress),
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-track", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "progress-fill",
                  style: { width: `${progress}%` }
                }
              ) })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-7 h-7 text-primary" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drag-drop-text", children: "Drop your video here or tap to browse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "drag-drop-hint mt-1", children: "Podcast, driving footage, pitch recording — any format · Max 2 GB" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap justify-center gap-2 pt-1", children: PLATFORMS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "platform-badge text-xs py-1 px-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: PLATFORM_CFG[p].icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: PLATFORM_CFG[p].label })
            ] }, p)) })
          ] })
        ]
      }
    ),
    sizeError && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "message-error-state",
        "data-ocid": "video.upload_size_error",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "message-error-icon", children: "⚠" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "message-error-content", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "message-error-title", children: "File too large" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "message-error-text", children: sizeError })
          ] })
        ]
      }
    )
  ] });
}
function ProcessingCard({ upload }) {
  const { data: jobStatus } = useVideoJobStatus(upload.id);
  const triggerProcessing = useTriggerVideoProcessing();
  if (upload.processingStatus === "failed") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "message-error-state", "data-ocid": "video.processing_error", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "message-error-icon", children: "✕" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "message-error-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "message-error-title", children: "Processing failed" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "message-error-text", children: upload.errorMsg ?? "Nduna could not process this video. Please try uploading again." })
      ] })
    ] });
  }
  const total = jobStatus ? Number(jobStatus.clipsGenerated) : 0;
  const ready = jobStatus ? Number(jobStatus.clipsReady) : 0;
  const failed = jobStatus ? Number(jobStatus.clipsFailed) : 0;
  const settled = ready + failed;
  const allDone = total > 0 && settled >= total;
  const pct = total > 0 ? Math.round(settled / total * 100) : 0;
  if (!jobStatus || upload.processingStatus === "pending") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-3 bg-muted/20 border-border/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "Queued for processing" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Nduna will begin clipping shortly" })
      ] }),
      upload.processingStatus === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          size: "sm",
          variant: "outline",
          className: "shrink-0 gap-1.5 text-xs",
          onClick: () => triggerProcessing.mutate(upload.id),
          disabled: triggerProcessing.isPending,
          "data-ocid": "video.trigger_processing.button",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-3 h-3" }),
            "Start"
          ]
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      className: `p-3 border ${allDone ? "bg-green-500/5 border-green-500/20" : "bg-primary/5 border-primary/20"}`,
      "data-ocid": "video.job_status_card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${allDone ? "bg-green-500/10" : "bg-primary/10"}`,
              children: allDone ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-4 h-4 text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-4 h-4 text-primary animate-pulse" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: allDone ? `${ready} clip${ready !== 1 ? "s" : ""} ready for review` : `Generating clips… ${ready} of ${total} ready` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: allDone ? failed > 0 ? `${failed} clip${failed !== 1 ? "s" : ""} could not be processed` : "Scroll down to preview and post" : "Nduna is detecting highlights and creating short clips" })
          ] })
        ] }),
        !allDone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: pct, className: "h-1.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-right text-xs text-muted-foreground", children: [
            pct,
            "%"
          ] })
        ] })
      ]
    }
  );
}
function ClipCard({ clip, index }) {
  const createPost = useCreateVideoPost();
  const [posting, setPosting] = reactExports.useState(null);
  const [posted, setPosted] = reactExports.useState([]);
  const statusCfg = CLIP_STATUS[clip.processingStatus];
  const title = clip.title ?? `Clip ${index + 1}`;
  const isReady = clip.processingStatus === "ready";
  const handlePost = (platform) => {
    setPosting(platform);
    createPost.mutate(
      { clipId: clip.id, platform },
      {
        onSuccess: () => {
          setPosted((prev) => [...prev, platform]);
          setPosting(null);
          ue.success(`${PLATFORM_CFG[platform].label} post queued!`);
        },
        onError: () => setPosting(null)
      }
    );
  };
  const handlePostAll = () => {
    const unposted = PLATFORMS.filter((p) => !posted.includes(p));
    for (const p of unposted) {
      handlePost(p);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      className: "clip-card overflow-hidden border-border/60",
      "data-ocid": "video.clip_card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", style: { aspectRatio: "9/16", maxHeight: 200 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 bg-gradient-to-b from-muted/30 to-muted/60 flex flex-col items-center justify-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "w-5 h-5 text-primary" }) }),
            !isReady && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-1.5 h-1.5 rounded-full ${statusCfg.dot}` }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: statusCfg.label })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2 left-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-foreground/80 text-background text-xs font-mono px-1.5 py-0.5", children: fmtDuration(clip.durationSec) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2 right-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: `${statusCfg.cls} text-xs flex items-center gap-1`, children: [
            clip.processingStatus === "captioning" || clip.processingStatus === "branding" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-2.5 h-2.5 animate-spin" }) : clip.processingStatus === "ready" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-2.5 h-2.5" }) : null,
            statusCfg.label
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 space-y-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground truncate", children: title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: clip.captionsVttRef ? "Captions added ✓" : "Captions processing…" })
          ] }),
          isReady && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "Post to:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-1", children: PLATFORMS.map((platform) => {
              const isDone = posted.includes(platform);
              const isLoading = posting === platform;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  size: "sm",
                  variant: isDone ? "secondary" : "outline",
                  className: "gap-1 text-xs h-7 justify-start px-2",
                  onClick: () => !isDone && !posting && handlePost(platform),
                  disabled: isDone || !!posting,
                  "data-ocid": `video.post_${platform}.button`,
                  children: [
                    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-2.5 h-2.5 animate-spin" }) : isDone ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-2.5 h-2.5 text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-2.5 h-2.5" }),
                    PLATFORM_CFG[platform].label
                  ]
                },
                platform
              );
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                size: "sm",
                className: "w-full gap-1.5 text-xs h-8",
                onClick: handlePostAll,
                disabled: !!posting || PLATFORMS.every((p) => posted.includes(p)),
                "data-ocid": "video.post_all.button",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "w-3 h-3" }),
                  "Post to All Platforms"
                ]
              }
            )
          ] }),
          clip.processingStatus === "failed" && clip.errorMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive bg-destructive/10 rounded-md px-2 py-1.5", children: clip.errorMsg })
        ] })
      ]
    }
  );
}
function ClipCarousel({ uploadId }) {
  const { data: clips = [], isLoading } = useVideoClips(uploadId);
  const [page, setPage] = reactExports.useState(0);
  const perPage = 3;
  const totalPages = Math.ceil(clips.length / perPage);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-52 rounded-xl" }, i)) });
  }
  if (clips.length === 0) return null;
  const visibleClips = clips.slice(page * perPage, page * perPage + perPage);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", "data-ocid": "video.clip_carousel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-foreground flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "w-4 h-4 text-primary" }),
        clips.length,
        " Clip",
        clips.length !== 1 ? "s" : "",
        " Generated"
      ] }),
      totalPages > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setPage((p) => Math.max(0, p - 1)),
            disabled: page === 0,
            className: "w-7 h-7 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center disabled:opacity-40 hover:bg-muted/70 transition-colors",
            "aria-label": "Previous clips",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "w-3.5 h-3.5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          page + 1,
          "/",
          totalPages
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setPage((p) => Math.min(totalPages - 1, p + 1)),
            disabled: page >= totalPages - 1,
            className: "w-7 h-7 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center disabled:opacity-40 hover:bg-muted/70 transition-colors",
            "aria-label": "Next clips",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-3.5 h-3.5" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: visibleClips.map((clip, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(ClipCard, { clip, index: page * perPage + i }, clip.id)) }),
    totalPages > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "clip-nav-dots static transform-none flex justify-center gap-1.5 mt-2", children: Array.from({ length: totalPages }, (_, i) => i + 1).map(
      (pageNum) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setPage(pageNum - 1),
          className: `clip-dot ${page === pageNum - 1 ? "active" : ""}`,
          "aria-label": `Page ${pageNum}`
        },
        `page-dot-${pageNum}`
      )
    ) })
  ] });
}
function UploadRow({ upload }) {
  const [expanded, setExpanded] = reactExports.useState(false);
  const statusCfg = UPLOAD_STATUS[upload.processingStatus];
  const isProcessing = upload.processingStatus === "processing";
  const isReady = upload.processingStatus === "ready";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden", "data-ocid": "video.upload_row", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "w-full p-4 flex items-center gap-3 text-left",
        onClick: () => setExpanded((v) => !v),
        "aria-expanded": expanded,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground truncate", children: upload.fileName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: fmtSize(upload.fileSizeBytes) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Badge,
            {
              className: `${statusCfg.cls} flex items-center gap-1 shrink-0 text-xs`,
              children: [
                statusCfg.icon,
                statusCfg.label
              ]
            }
          ),
          expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-4 h-4 text-muted-foreground shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground shrink-0" })
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-4 border-t border-border/50 pt-4 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ProcessingCard, { upload }),
      (isProcessing || isReady) && /* @__PURE__ */ jsxRuntimeExports.jsx(ClipCarousel, { uploadId: upload.id })
    ] })
  ] });
}
function UploadsTab() {
  const { data: uploads = [], isLoading } = useVideoUploads();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(UploadZone, {}),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 rounded-xl" }, i)) }) : uploads.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        className: "p-8 text-center bg-muted/10 border-dashed",
        "data-ocid": "video.uploads_empty_state",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clapperboard, { className: "w-7 h-7 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-foreground mb-1", children: "Upload your first video to start creating clips automatically" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Nduna detects highlights, splits into short clips, adds captions and MoneyDrive branding, then posts to all platforms." })
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: uploads.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsx(UploadRow, { upload: u }, u.id)) })
  ] });
}
function BrandingPanel() {
  const { data: existing, isLoading } = useBrandingConfig();
  const save = useSaveVideoBrandingConfig();
  const [open, setOpen] = reactExports.useState(false);
  const [driverName, setDriverName] = reactExports.useState("");
  const [cta, setCta] = reactExports.useState("Join MoneyDrive");
  const [music, setMusic] = reactExports.useState("Upbeat");
  const [synced, setSynced] = reactExports.useState(false);
  if (!isLoading && existing && !synced) {
    setSynced(true);
    setDriverName(existing.driverName ?? "");
    setCta(existing.callToAction ?? "Join MoneyDrive");
    setMusic(existing.musicPreference ?? "Upbeat");
  }
  const handleSave = () => {
    const config = {
      driverName,
      accentColor: "#D97706",
      callToAction: cta,
      musicPreference: music,
      showMoneyDriveLogo: true
    };
    save.mutate(config);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden", "data-ocid": "video.branding_panel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "w-full p-4 flex items-center gap-3 text-left",
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "w-4 h-4 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground", children: "Branding Settings" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Driver name, CTA, music, logo" })
          ] }),
          open ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-4 h-4 text-muted-foreground" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground" })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-4 border-t border-border/50 pt-4 space-y-4", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 rounded-lg" }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Label,
          {
            htmlFor: "driver-name",
            className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
            children: "Driver Name"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "driver-name",
            value: driverName,
            onChange: (e) => setDriverName(e.target.value),
            placeholder: "Your name as it appears in videos",
            "data-ocid": "video.branding_driver_name"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Label,
          {
            htmlFor: "cta-text",
            className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
            children: "Call-to-Action Text"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "cta-text",
            value: cta,
            onChange: (e) => setCta(e.target.value),
            placeholder: "Join MoneyDrive",
            "data-ocid": "video.branding_cta"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Background Music" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: MUSIC_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setMusic(opt),
            className: `frequency-option text-sm ${music === opt ? "active" : ""}`,
            "data-ocid": `video.music_${opt.toLowerCase().replace(" ", "_")}`,
            children: opt
          },
          opt
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "MoneyDrive Logo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Always shown — MoneyDrive branding only" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: true,
            disabled: true,
            "aria-label": "MoneyDrive logo always on",
            "data-ocid": "video.branding_logo_toggle"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          className: "w-full gap-1.5",
          onClick: handleSave,
          disabled: save.isPending,
          "data-ocid": "video.branding_save.button",
          children: [
            save.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-4 h-4" }),
            "Save Branding"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-3 bg-accent/10 border-accent/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "w-4 h-4 text-primary shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-foreground", children: "Driver preview required" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Every clip goes through your approval before posting. No third-party logos — MoneyDrive branding only." })
        ] })
      ] }) })
    ] }) })
  ] });
}
function SchedulePanel({ tier }) {
  const { data: existing, isLoading } = usePostingSchedule();
  const { data: isConfigured } = useIsUploadPostConfigured();
  const save = useSavePostingSchedule();
  const [open, setOpen] = reactExports.useState(false);
  const [platforms, setPlatforms] = reactExports.useState([
    "tiktok",
    "instagram",
    "youtube"
  ]);
  const [postsPerWeek, setPostsPerWeek] = reactExports.useState(3);
  const [selectedDays, setSelectedDays] = reactExports.useState([0, 2, 4]);
  const [synced, setSynced] = reactExports.useState(false);
  if (!isLoading && existing && !synced) {
    setSynced(true);
    setPlatforms(existing.platformsEnabled);
    setPostsPerWeek(Number(existing.postsPerWeek));
    setSelectedDays(existing.preferredDays.map(Number));
  }
  const isElite = tier >= 3;
  const togglePlatform = (p) => setPlatforms(
    (prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
  );
  const toggleDay = (i) => setSelectedDays(
    (prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]
  );
  const handleSave = () => {
    save.mutate({
      driverId: "",
      enabled: true,
      postsPerWeek: BigInt(postsPerWeek),
      preferredDays: selectedDays.map(BigInt),
      preferredHourUtc: BigInt(8),
      platformsEnabled: platforms
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden", "data-ocid": "video.schedule_panel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "w-full p-4 flex items-center gap-3 text-left",
        onClick: () => isElite && setOpen((v) => !v),
        "aria-expanded": open,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "w-4 h-4 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-semibold text-sm text-foreground flex items-center gap-1.5", children: [
              "Posting Schedule",
              !isElite && /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-3 h-3 text-muted-foreground" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: isElite ? "Auto-post days, frequency, and platforms" : "Elite (R800/mo) feature" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: `messaging-status-indicator shrink-0 ${isConfigured ? "connected" : "disconnected"}`,
              "data-ocid": "video.uploadpost_status",
              children: isConfigured ? "Connected" : "Not set up"
            }
          )
        ]
      }
    ),
    !isElite && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-4 border-t border-border/50 pt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
      "Upgrade to",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary font-semibold", children: "Elite (R800/mo)" }),
      " ",
      "to unlock automated posting and let Nduna post for you on a schedule."
    ] }) }),
    isElite && open && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-4 border-t border-border/50 pt-4 space-y-4", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 rounded-lg" }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Platforms" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "platform-badges flex-wrap", children: PLATFORMS.map((p) => {
          const active = platforms.includes(p);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => togglePlatform(p),
              className: `platform-badge ${active ? "connected" : "disconnected"}`,
              "data-ocid": `video.schedule_platform_${p}`,
              "aria-pressed": active,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: PLATFORM_CFG[p].icon }),
                PLATFORM_CFG[p].label
              ]
            },
            p
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Posts Per Week" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "schedule-frequency-options", children: [1, 2, 3].map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setPostsPerWeek(n),
            className: `frequency-option ${postsPerWeek === n ? "active" : ""}`,
            "data-ocid": `video.schedule_freq_${n}`,
            children: [
              n,
              "×/week"
            ]
          },
          n
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Preferred Days" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-7 gap-1", children: DAYS.map((day, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => toggleDay(i),
            className: `rounded-lg py-2 text-xs font-semibold transition-colors border ${selectedDays.includes(i) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 text-muted-foreground border-border/50 hover:border-primary/40"}`,
            "data-ocid": `video.schedule_day_${day.toLowerCase()}`,
            "aria-pressed": selectedDays.includes(i),
            children: day[0]
          },
          day
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          className: "w-full gap-1.5",
          onClick: handleSave,
          disabled: save.isPending,
          "data-ocid": "video.schedule_save.button",
          children: [
            save.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "w-4 h-4" }),
            "Save Schedule"
          ]
        }
      )
    ] }) })
  ] });
}
const KPI_CARDS = [
  { label: "Total Views", key: "views" },
  { label: "Likes", key: "likes" },
  { label: "Shares", key: "shares" },
  { label: "Engagement", key: "engagement" }
];
function AnalyticsSection() {
  const fetchAnalytics = useFetchAndStoreAnalytics();
  const kpiValues = {
    views: "0",
    likes: "0",
    shares: "0",
    engagement: "0%"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-foreground flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartNoAxesColumn, { className: "w-4 h-4 text-primary" }),
        "Performance Analytics"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => fetchAnalytics.mutate(),
            disabled: fetchAnalytics.isPending,
            className: "gap-1.5 text-xs",
            "data-ocid": "video.refresh_analytics.button",
            children: [
              fetchAnalytics.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-3 h-3" }),
              "Refresh Now"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Analytics automatically update every 24 hours" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "grid grid-cols-2 gap-2.5",
        "data-ocid": "video.analytics_kpi_grid",
        children: KPI_CARDS.map(({ label, key }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Card,
          {
            className: "p-3 bg-muted/10 border-border/60",
            "data-ocid": `video.analytics_kpi_${key}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-1", children: label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-foreground font-mono", children: kpiValues[key] })
            ]
          },
          key
        ))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        className: "p-5 text-center bg-muted/10 border-dashed",
        "data-ocid": "video.analytics_empty_state",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChartNoAxesColumn, { className: "w-8 h-8 text-muted-foreground mx-auto mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-foreground mb-1", children: "Analytics load after first post" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Once your clips are posted, Nduna tracks views, likes, shares, and engagement per platform daily." })
        ]
      }
    )
  ] });
}
function VideoPage({ tier = 1 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-display font-bold text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clapperboard, { className: "w-6 h-6 text-primary" }),
        "Content Creator"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "Upload once — Nduna generates clips, adds captions and branding, then posts to all platforms" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2.5", children: [
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-4 h-4" }),
        label: "1. Upload video",
        sub: "Any format"
      },
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-4 h-4" }),
        label: "2. Nduna clips it",
        sub: "Auto-captioned"
      },
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "w-4 h-4" }),
        label: "3. Preview & post",
        sub: "Your approval"
      }
    ].map((step) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        className: "p-3 text-center bg-muted/20 border-border/50",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1.5 text-primary", children: step.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-foreground leading-tight", children: step.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: step.sub })
        ]
      },
      step.label
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "upload", className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "w-full", "data-ocid": "video.tabs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          TabsTrigger,
          {
            value: "upload",
            className: "flex-1 gap-1.5",
            "data-ocid": "video.tab.upload",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-3.5 h-3.5" }),
              "Upload"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          TabsTrigger,
          {
            value: "analytics",
            className: "flex-1 gap-1.5",
            "data-ocid": "video.tab.analytics",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChartNoAxesColumn, { className: "w-3.5 h-3.5" }),
              "Analytics"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          TabsTrigger,
          {
            value: "settings",
            className: "flex-1 gap-1.5",
            "data-ocid": "video.tab.settings",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "w-3.5 h-3.5" }),
              "Settings"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "upload", className: "space-y-4 mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UploadsTab, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "analytics", className: "mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnalyticsSection, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "settings", className: "mt-0 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BrandingPanel, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SchedulePanel, { tier })
      ] })
    ] })
  ] });
}
export {
  VideoPage as default
};
