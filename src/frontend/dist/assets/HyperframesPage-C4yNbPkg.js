import { c as createLucideIcon, u as useActor, n as useQueryClient, o as useMutation, p as ue, m as useQuery, r as reactExports, j as jsxRuntimeExports, af as TriangleAlert, v as Card, F as Label, I as Input, B as Button, L as LoaderCircle, Y as Clock, q as Skeleton, a5 as CircleX, a4 as Film, i as Badge, C as CircleCheckBig, ag as Download, a1 as Sparkles, $ as Clapperboard, a8 as ChevronRight, a9 as Send, R as RefreshCw, h as Play } from "./index-C-RLbQrs.js";
import { V as Video } from "./video-CUzyxwc2.js";
import { U as Upload } from "./upload-z_EyXbuv.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["circle", { cx: "6", cy: "6", r: "3", key: "1lh9wr" }],
  ["path", { d: "M8.12 8.12 12 12", key: "1alkpv" }],
  ["path", { d: "M20 4 8.12 15.88", key: "xgtan2" }],
  ["circle", { cx: "6", cy: "18", r: "3", key: "fqmcym" }],
  ["path", { d: "M14.8 14.8 20 20", key: "ptml3r" }]
];
const Scissors = createLucideIcon("scissors", __iconNode);
const shortsKeys = {
  jobs: () => ["shorts-jobs"],
  job: (id) => ["shorts-job", id]
};
function mapShortsStatus(raw) {
  const key = Object.keys(raw)[0];
  return key;
}
function mapShortsJob(raw) {
  var _a, _b;
  const sourceTypeKey = Object.keys(raw.sourceType)[0];
  const unwrapOpt = (v) => {
    if (Array.isArray(v)) return v[0];
    return v;
  };
  return {
    id: raw.id,
    driverId: typeof raw.driverId === "string" ? raw.driverId : ((_b = (_a = raw.driverId).toText) == null ? void 0 : _b.call(_a)) ?? "",
    sourceUrl: raw.sourceUrl,
    sourceType: sourceTypeKey,
    clipStatus: mapShortsStatus(raw.clipStatus),
    outputMp4Url: unwrapOpt(raw.outputMp4Url),
    selectedSegmentStart: unwrapOpt(
      raw.selectedSegmentStart
    ),
    selectedSegmentEnd: unwrapOpt(
      raw.selectedSegmentEnd
    ),
    errorMsg: unwrapOpt(raw.errorMsg),
    createdAt: raw.createdAt
  };
}
const TERMINAL_STATUSES = ["ready", "failed"];
function useShortsJobs() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: shortsKeys.jobs(),
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.listShortsJobs();
      return result.map(mapShortsJob).sort((a, b) => Number(b.createdAt - a.createdAt));
    },
    enabled: !!actor && !isFetching
  });
}
function useShortsJob(jobId) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: shortsKeys.job(jobId),
    queryFn: async () => {
      if (!actor || !jobId) return null;
      const result = await actor.getShortsJob(jobId);
      if (!result) return null;
      return mapShortsJob(result);
    },
    enabled: !!actor && !isFetching && !!jobId,
    refetchInterval: (query) => {
      var _a;
      const status = (_a = query.state.data) == null ? void 0 : _a.clipStatus;
      if (!status || TERMINAL_STATUSES.includes(status)) return false;
      return 5e3;
    }
  });
}
function useSubmitShortsJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.submitShortsJob({
        sourceUrl: req.sourceUrl,
        sourceType: { [req.sourceType]: null }
      });
      if (result.err !== void 0) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortsKeys.jobs() });
    },
    onError: (err) => {
      ue.error(`Couldn't start the clip: ${err.message}`);
    }
  });
}
const DAILY_LIMIT$1 = 3;
const STATUS_STEPS = [
  { key: ["pending"], emoji: "⏳", label: "Queued for processing…" },
  { key: ["transcribing"], emoji: "🎙️", label: "Transcribing audio…" },
  { key: ["selecting"], emoji: "🎯", label: "Picking best 2-minute segment…" },
  {
    key: ["rendering"],
    emoji: "✂️",
    label: "Cropping vertical & burning subtitles…"
  }
];
function fmtDate$1(ts) {
  const ms = Number(ts / BigInt(1e6));
  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short"
  });
}
function todayShortsCount(jobs) {
  const startOfToday = /* @__PURE__ */ new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return jobs.filter(
    (j) => Number(j.createdAt / BigInt(1e6)) >= startOfToday.getTime()
  ).length;
}
function isTerminal(status) {
  return status === "ready" || status === "failed";
}
function statusLabel(status) {
  switch (status) {
    case "pending":
      return {
        label: "Queued",
        cls: "bg-muted/60 text-muted-foreground"
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
        cls: "bg-destructive/15 text-destructive"
      };
  }
}
function ProcessingCard({ job }) {
  const activeIndex = STATUS_STEPS.findIndex(
    (s) => s.key.includes(job.clipStatus)
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      className: "p-5 bg-primary/5 border-primary/20 space-y-4",
      "data-ocid": "shorts.processing_card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin text-primary shrink-0" }),
          "Nduna is working on your Short…"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: STATUS_STEPS.map((step, i) => {
          const isPast = i < activeIndex;
          const isActive = i === activeIndex;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "li",
            {
              className: `flex items-center gap-2.5 text-sm transition-colors ${isPast ? "text-muted-foreground line-through" : isActive ? "text-foreground font-medium" : "text-muted-foreground/50"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base leading-none", children: step.emoji }),
                step.label,
                isActive && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3 h-3 animate-spin text-primary ml-auto shrink-0" }),
                isPast && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-3 h-3 text-green-500 ml-auto shrink-0" })
              ]
            },
            step.label
          );
        }) })
      ]
    }
  );
}
function ShortsOutput({ job }) {
  const handleShare = (platform) => {
    if (platform === "tiktok") {
      window.open("https://www.tiktok.com/upload", "_blank", "noopener");
    } else {
      navigator.clipboard.writeText(job.outputMp4Url ?? window.location.href).then(() => ue.success("Link copied! Paste it on Instagram.")).catch(() => ue.error("Couldn't copy the link."));
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", "data-ocid": "shorts.output_section", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-4 h-4 text-green-500 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "Your Short is ready! 🎉" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "relative overflow-hidden rounded-xl border border-border/60 bg-muted/10 w-full",
        style: { aspectRatio: "9/16", maxWidth: 270 },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "video",
          {
            src: job.outputMp4Url ?? "",
            controls: true,
            playsInline: true,
            className: "absolute inset-0 w-full h-full object-contain",
            "aria-label": "Generated short video",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("track", { kind: "captions", src: "", label: "No captions", default: true })
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: job.outputMp4Url ?? "#",
          download: `nduna-short-${job.id}.mp4`,
          className: "contents",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "default",
              className: "w-full gap-1.5 text-xs",
              "data-ocid": "shorts.download_button",
              "aria-label": "Download short MP4",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-3.5 h-3.5" }),
                "Download"
              ]
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          className: "gap-1.5 text-xs",
          onClick: () => handleShare("tiktok"),
          "data-ocid": "shorts.share_tiktok_button",
          children: "🎵 TikTok"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          className: "gap-1.5 text-xs",
          onClick: () => handleShare("instagram"),
          "data-ocid": "shorts.share_instagram_button",
          children: "📸 Insta"
        }
      )
    ] })
  ] });
}
function ShortsPoller({
  jobId,
  onReset
}) {
  const { data: job, isLoading } = useShortsJob(jobId);
  if (isLoading || !job) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-4 bg-muted/10 rounded-xl border border-border/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-5 h-5 animate-spin text-primary shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Connecting to render pipeline…" })
    ] });
  }
  if (job.clipStatus === "ready") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShortsOutput, { job }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "w-full text-xs gap-1.5",
          onClick: onReset,
          "data-ocid": "shorts.new_short_button",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "w-3 h-3" }),
            "Clip another video"
          ]
        }
      )
    ] });
  }
  if (job.clipStatus === "failed") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        className: "p-4 bg-destructive/10 border-destructive/20 space-y-3",
        "data-ocid": "shorts.error_state",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "w-5 h-5 text-destructive shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground", children: "Something went wrong" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: job.errorMsg ?? "The render job failed. Give it another try." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "w-full gap-1.5 text-xs",
              onClick: onReset,
              "data-ocid": "shorts.retry_button",
              children: "Try Again"
            }
          )
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ProcessingCard, { job });
}
function HistoryCard({ job, index }) {
  const { label, cls } = statusLabel(job.clipStatus);
  const isYouTube = job.sourceType === "youtube";
  const displayUrl = job.sourceUrl.length > 42 ? `${job.sourceUrl.slice(0, 40)}…` : job.sourceUrl;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50",
      "data-ocid": `shorts.history_item.${index + 1}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0", children: isYouTube ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base", children: "🎬" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "w-4 h-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-foreground truncate", children: displayUrl }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: fmtDate$1(job.createdAt) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: `${cls} flex items-center gap-1 shrink-0 text-xs`, children: [
          job.clipStatus === "ready" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-3 h-3" }) : !isTerminal(job.clipStatus) ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "w-3 h-3" }),
          label
        ] })
      ]
    }
  );
}
function ShortsTab({ pilotMode }) {
  const [inputMode, setInputMode] = reactExports.useState("youtube");
  const [youtubeUrl, setYoutubeUrl] = reactExports.useState("");
  const [uploadFile, setUploadFile] = reactExports.useState(null);
  const [isDragging, setIsDragging] = reactExports.useState(false);
  const [activeJobId, setActiveJobId] = reactExports.useState(null);
  const fileInputRef = reactExports.useRef(null);
  const submit = useSubmitShortsJob();
  const { data: jobs = [], isLoading: jobsLoading } = useShortsJobs();
  const todayCount = todayShortsCount(jobs);
  const rateLimited = todayCount >= DAILY_LIMIT$1;
  const isSubmitting = submit.isPending;
  const handleSubmit = () => {
    if (rateLimited) return;
    const req = inputMode === "youtube" ? { sourceUrl: youtubeUrl.trim(), sourceType: "youtube" } : {
      sourceUrl: uploadFile ? uploadFile.name : "",
      sourceType: "upload"
    };
    if (inputMode === "youtube" && !req.sourceUrl) {
      ue.error("Please paste a YouTube URL first.");
      return;
    }
    if (inputMode === "upload" && !uploadFile) {
      ue.error("Please select a video file.");
      return;
    }
    submit.mutate(req, {
      onSuccess: (jobId) => {
        setActiveJobId(jobId);
        ue.success("Nduna is finding the best clip…");
      }
    });
  };
  const handleReset = () => {
    setActiveJobId(null);
    setYoutubeUrl("");
    setUploadFile(null);
  };
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadFile(file);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-display font-bold text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "w-5 h-5 text-primary" }),
        "Clip to Short"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: "Paste a YouTube URL or upload a video. Nduna finds the most gripping 2 minutes, crops it vertical, and burns in subtitles — ready for TikTok or Instagram." })
    ] }),
    pilotMode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-3 bg-muted/20 border border-border/50 rounded-xl text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" }),
      "Pilot mode active — rendering runs on your VPS. Make sure the VPS URL is set in Settings."
    ] }),
    rateLimited && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Card,
      {
        className: "p-4 bg-destructive/10 border-destructive/20",
        "data-ocid": "shorts.rate_limit_card",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-5 h-5 text-destructive shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground", children: "Daily limit reached" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
              "You've used your ",
              DAILY_LIMIT$1,
              " clips today. Come back tomorrow!"
            ] })
          ] })
        ] })
      }
    ),
    !activeJobId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "flex gap-1 bg-muted/20 rounded-xl p-1",
          "data-ocid": "shorts.source_toggle",
          children: ["youtube", "upload"].map((mode) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setInputMode(mode),
              className: `flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${inputMode === mode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
              "data-ocid": `shorts.${mode}_tab`,
              children: mode === "youtube" ? "YouTube URL" : "Upload Video"
            },
            mode
          ))
        }
      ),
      inputMode === "youtube" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Label,
          {
            htmlFor: "shorts-youtube-url",
            className: "text-sm font-semibold text-foreground",
            children: "YouTube URL"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-base select-none", children: "▶" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "shorts-youtube-url",
              value: youtubeUrl,
              onChange: (e) => setYoutubeUrl(e.target.value),
              placeholder: "https://youtube.com/watch?v=...",
              disabled: isSubmitting || rateLimited,
              className: "h-12 text-sm pl-8",
              "data-ocid": "shorts.youtube_url_input",
              onKeyDown: (e) => {
                if (e.key === "Enter") handleSubmit();
              }
            }
          )
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-foreground", children: "Upload Video" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onDrop: handleFileDrop,
            onDragOver: (e) => {
              e.preventDefault();
              setIsDragging(true);
            },
            onDragLeave: () => setIsDragging(false),
            onClick: () => {
              var _a;
              return (_a = fileInputRef.current) == null ? void 0 : _a.click();
            },
            className: `w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-border/60 bg-muted/10 hover:border-primary/50 hover:bg-primary/5"}`,
            "data-ocid": "shorts.upload_dropzone",
            "aria-label": "Drop video file or click to upload",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  ref: fileInputRef,
                  type: "file",
                  accept: ".mp4,.mov,.avi,video/*",
                  className: "hidden",
                  onChange: (e) => {
                    var _a;
                    return setUploadFile(((_a = e.target.files) == null ? void 0 : _a[0]) ?? null);
                  }
                }
              ),
              uploadFile ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "w-8 h-8 text-primary mx-auto" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: uploadFile.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  (uploadFile.size / (1024 * 1024)).toFixed(1),
                  " MB"
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-8 h-8 text-muted-foreground mx-auto" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "Drop your video here or tap to choose" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: ".mp4 / .mov / .avi — up to 500 MB" })
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          className: "w-full h-12 gap-2 text-base font-semibold",
          onClick: handleSubmit,
          disabled: isSubmitting || rateLimited || inputMode === "youtube" && !youtubeUrl.trim() || inputMode === "upload" && !uploadFile,
          "data-ocid": "shorts.generate_button",
          children: isSubmitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-5 h-5 animate-spin" }),
            "Sending to Nduna…"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "w-5 h-5" }),
            "Generate Short"
          ] })
        }
      ),
      !rateLimited && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-center font-medium text-primary", children: [
        DAILY_LIMIT$1 - todayCount,
        " short",
        DAILY_LIMIT$1 - todayCount !== 1 ? "s" : "",
        " remaining today"
      ] })
    ] }),
    activeJobId && /* @__PURE__ */ jsxRuntimeExports.jsx(ShortsPoller, { jobId: activeJobId, onReset: handleReset }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", "data-ocid": "shorts.history_section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-foreground flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4 text-primary" }),
          "Previous Clips"
        ] }),
        jobs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          Math.min(jobs.length, 20),
          " of ",
          jobs.length
        ] })
      ] }),
      jobsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", "data-ocid": "shorts.history_loading_state", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-16 rounded-xl" }, i)) }) : jobs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Card,
        {
          className: "p-8 text-center bg-muted/10 border-dashed",
          "data-ocid": "shorts.history_empty_state",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "w-7 h-7 text-primary" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-foreground mb-1", children: "No clips yet" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Paste a YouTube URL or upload a video and Nduna will find the most gripping 2 minutes — vertical, subtitled, and ready to post." })
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: jobs.slice(0, 20).map((job, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(HistoryCard, { job, index: i }, job.id)) })
    ] })
  ] });
}
const hyperframesKeys = {
  jobs: () => ["hyperframes-jobs"],
  job: (id) => ["hyperframes-job", id]
};
function mapStatus(raw) {
  return raw;
}
function mapBackendJob(raw) {
  return {
    id: raw.id,
    driverId: raw.driverId,
    topic: raw.topic,
    compositionHtml: raw.compositionHtml,
    renderStatus: mapStatus(raw.renderStatus),
    mp4Url: raw.mp4Url,
    errorMsg: raw.errorMsg,
    createdAt: raw.createdAt
  };
}
function useHyperframesJobs() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: hyperframesKeys.jobs(),
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getHyperframesJobs();
      return result.map((j) => mapBackendJob(j));
    },
    enabled: !!actor && !isFetching
  });
}
function useHyperframesJob(id) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: hyperframesKeys.job(id),
    queryFn: async () => {
      if (!actor || !id) return null;
      const result = await actor.getHyperframesJob(id);
      if (!result) return null;
      return mapBackendJob(result);
    },
    enabled: !!actor && !isFetching && !!id,
    refetchInterval: (query) => {
      var _a;
      const status = (_a = query.state.data) == null ? void 0 : _a.renderStatus;
      if (status === "ready" || status === "failed") return false;
      return 5e3;
    }
  });
}
function useGenerateSlideshow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ topic }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.generateHyperframesSlideshow(topic);
      if (result.__kind__ === "err") throw new Error(result.err);
      return mapBackendJob(result.ok);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hyperframesKeys.jobs() });
    },
    onError: (err) => {
      ue.error(`Failed to generate video: ${err.message}`);
    }
  });
}
const DAILY_LIMIT = 5;
const TOPIC_SUGGESTIONS = [
  "My best earnings week yet",
  "Why passengers love driving with me",
  "Top event near me this weekend",
  "My MoneyDrive success story",
  "Tips for new Uber & Bolt drivers"
];
const RENDER_STATUS_CFG = {
  pending: {
    label: "Queued",
    cls: "bg-muted/60 text-muted-foreground",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-3 h-3" })
  },
  rendering: {
    label: "Rendering",
    cls: "bg-primary/15 text-primary",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3 h-3 animate-spin" })
  },
  ready: {
    label: "Ready",
    cls: "bg-primary/20 text-primary",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-3 h-3" })
  },
  failed: {
    label: "Failed",
    cls: "bg-destructive/15 text-destructive",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "w-3 h-3" })
  }
};
function fmtDate(ts) {
  const ms = Number(ts / BigInt(1e6));
  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
function todayRenderCount(jobs) {
  const startOfToday = /* @__PURE__ */ new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  return jobs.filter((j) => {
    const ms = Number(j.createdAt / BigInt(1e6));
    return ms >= todayMs;
  }).length;
}
function CompositionPreview({ html }) {
  const [blobUrl, setBlobUrl] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [html]);
  if (!html || !blobUrl) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Clapperboard, { className: "w-3.5 h-3.5 text-primary" }),
      "Slide Composition Preview"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "relative w-full overflow-hidden rounded-xl border border-border/60 bg-muted/10",
        style: { aspectRatio: "9/16", maxHeight: 420 },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "iframe",
          {
            src: blobUrl,
            title: "Hyperframes composition preview",
            className: "absolute inset-0 w-full h-full border-0",
            sandbox: "",
            "aria-label": "Slide composition preview"
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground text-center", children: "1080×1920 preview — scaled to fit screen" })
  ] });
}
function VideoPlayer({ job }) {
  const handleShare = (platform) => {
    const label = platform === "tiktok" ? "TikTok" : "Instagram";
    ue.info(`Opening ${label} to share your video…`);
    const url = platform === "tiktok" ? "https://www.tiktok.com/upload" : "https://www.instagram.com/";
    window.open(url, "_blank", "noopener");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", "data-ocid": "hyperframes.video_player", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "relative w-full overflow-hidden rounded-xl border border-green-500/20 bg-muted/10",
        style: { aspectRatio: "9/16", maxHeight: 420 },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "video",
          {
            src: job.mp4Url ?? "",
            controls: true,
            className: "absolute inset-0 w-full h-full object-contain",
            "aria-label": "Generated video",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("track", { kind: "captions", src: "", label: "No captions", default: true })
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: job.mp4Url ?? "#",
          download: `nduna-video-${job.id}.mp4`,
          className: "contents",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "default",
              className: "w-full gap-1.5 text-xs col-span-1",
              "data-ocid": "hyperframes.download_button",
              "aria-label": "Download MP4",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-3.5 h-3.5" }),
                "Download"
              ]
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          className: "gap-1.5 text-xs",
          onClick: () => handleShare("tiktok"),
          "data-ocid": "hyperframes.share_tiktok_button",
          children: "🎵 TikTok"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          className: "gap-1.5 text-xs",
          onClick: () => handleShare("instagram"),
          "data-ocid": "hyperframes.share_instagram_button",
          children: "📸 Insta"
        }
      )
    ] })
  ] });
}
function RenderStatusPoller({
  jobId,
  compositionHtml,
  onRetry
}) {
  var _a, _b, _c;
  const { data: job, isLoading } = useHyperframesJob(jobId);
  if (isLoading || !job) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-4 bg-muted/10 rounded-xl border border-border/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-5 h-5 animate-spin text-primary shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Checking render status…" })
    ] });
  }
  if (job.renderStatus === "ready") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-4 h-4 text-green-500 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "Your video is ready!" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(VideoPlayer, { job })
    ] });
  }
  if (job.renderStatus === "failed") {
    const isNotConfigured = ((_a = job.errorMsg) == null ? void 0 : _a.toLowerCase().includes("not configured")) || ((_b = job.errorMsg) == null ? void 0 : _b.toLowerCase().includes("vps url")) || ((_c = job.errorMsg) == null ? void 0 : _c.toLowerCase().includes("render server"));
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3",
        "data-ocid": "hyperframes.error_state",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: "https://i.imgur.com/u98U7S6.png",
                alt: "Nduna",
                className: "w-10 h-10 rounded-full object-cover shrink-0"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground", children: isNotConfigured ? "Video rendering is not yet configured" : "Nduna couldn't complete the render" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: isNotConfigured ? "Ask your admin to set the VPS URL in Settings — you can still see your slideshow composition below." : job.errorMsg || "The VPS render job failed. This sometimes happens — give it another try." })
            ] })
          ] }),
          !isNotConfigured && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "gap-1.5 w-full",
              onClick: onRetry,
              "data-ocid": "hyperframes.retry_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-3.5 h-3.5" }),
                "Try Again"
              ]
            }
          ),
          compositionHtml && /* @__PURE__ */ jsxRuntimeExports.jsx(CompositionPreview, { html: compositionHtml })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl",
        "data-ocid": "hyperframes.rendering_state",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-5 h-5 animate-spin text-primary shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "Rendering your video…" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Up to 2 minutes — sit back, Nduna is working" })
          ] })
        ]
      }
    ),
    compositionHtml && /* @__PURE__ */ jsxRuntimeExports.jsx(CompositionPreview, { html: compositionHtml })
  ] });
}
function HistoryRow({
  job,
  index,
  onPreview
}) {
  const cfg = RENDER_STATUS_CFG[job.renderStatus] ?? RENDER_STATUS_CFG.failed;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50",
      "data-ocid": `hyperframes.history_item.${index + 1}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "w-4 h-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground truncate", children: job.topic }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: fmtDate(job.createdAt) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: `${cfg.cls} flex items-center gap-1 shrink-0 text-xs`, children: [
          cfg.icon,
          cfg.label
        ] }),
        job.renderStatus === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "shrink-0 h-7 px-2 text-xs gap-1",
            onClick: () => onPreview(job),
            "data-ocid": `hyperframes.history_preview_button.${index + 1}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "w-3 h-3" }),
              "Preview"
            ]
          }
        )
      ]
    }
  );
}
function HyperframesPage({
  tier = 1,
  pilotMode = false
}) {
  const [topic, setTopic] = reactExports.useState("");
  const [activeJobId, setActiveJobId] = reactExports.useState(null);
  const [activeHtml, setActiveHtml] = reactExports.useState("");
  const [previewJob, setPreviewJob] = reactExports.useState(null);
  const [activeTab, setActiveTab] = reactExports.useState("studio");
  const generate = useGenerateSlideshow();
  const { data: jobs = [], isLoading: jobsLoading } = useHyperframesJobs();
  const todayCount = todayRenderCount(jobs);
  const rateLimited = todayCount >= DAILY_LIMIT;
  const isGenerating = generate.isPending;
  const isRendering = !!activeJobId;
  const handleGenerate = () => {
    if (!topic.trim()) {
      ue.error("Please enter a topic for Nduna to create a video about.");
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
          ue.success("Nduna is crafting your slides…");
        }
      }
    );
  };
  const handleRetry = () => {
    setActiveJobId(null);
    setActiveHtml("");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: "https://i.imgur.com/u98U7S6.png",
            alt: "Nduna",
            className: "w-10 h-10 rounded-full object-cover border-2 border-primary/40 shrink-0"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-display font-bold text-foreground flex items-center gap-2", children: "AI Video Studio" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "Nduna generates a 6-slide MP4 video from your topic" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-primary/15 text-primary border border-primary/30 shrink-0", children: "Tier 3" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex gap-1 bg-muted/20 rounded-xl p-1",
        "data-ocid": "hyperframes.tab_bar",
        children: [
          {
            key: "studio",
            label: "Video Studio",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-3.5 h-3.5" })
          },
          {
            key: "shorts",
            label: "Clip to Short",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "w-3.5 h-3.5" })
          }
        ].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setActiveTab(tab.key),
            className: `flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
            "data-ocid": `hyperframes.${tab.key}_tab`,
            children: [
              tab.icon,
              tab.label
            ]
          },
          tab.key
        ))
      }
    ),
    activeTab === "shorts" && /* @__PURE__ */ jsxRuntimeExports.jsx(ShortsTab, { pilotMode }),
    activeTab === "studio" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2.5", children: [
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-4 h-4" }),
          label: "1. Type topic",
          sub: "Any idea works"
        },
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clapperboard, { className: "w-4 h-4" }),
          label: "2. Nduna builds slides",
          sub: "6-slide HTML"
        },
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "w-4 h-4" }),
          label: "3. Download MP4",
          sub: "Post to TikTok"
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
      rateLimited && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Card,
        {
          className: "p-4 bg-destructive/10 border-destructive/20",
          "data-ocid": "hyperframes.rate_limit_card",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-5 h-5 text-destructive shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground", children: "Daily limit reached" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
                "You've used your ",
                DAILY_LIMIT,
                " renders today. Come back tomorrow!"
              ] })
            ] })
          ] })
        }
      ),
      !isRendering && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Label,
            {
              htmlFor: "hyperframes-topic",
              className: "text-sm font-semibold text-foreground",
              children: "What do you want Nduna to create a video about?"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "hyperframes-topic",
              value: topic,
              onChange: (e) => setTopic(e.target.value),
              placeholder: "e.g. My earnings this week, Why drive with me, Event near me this weekend",
              disabled: isGenerating || rateLimited,
              onKeyDown: (e) => {
                if (e.key === "Enter") handleGenerate();
              },
              "data-ocid": "hyperframes.topic_input",
              className: "h-12 text-base"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Quick topics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: TOPIC_SUGGESTIONS.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setTopic(s),
              className: "text-xs px-3 py-1.5 rounded-full bg-muted/30 border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors",
              "data-ocid": "hyperframes.suggestion_button",
              children: s
            },
            s
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            className: "w-full h-12 gap-2 text-base font-semibold",
            onClick: handleGenerate,
            disabled: isGenerating || !topic.trim() || rateLimited,
            "data-ocid": "hyperframes.generate_button",
            children: isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-5 h-5 animate-spin" }),
              "Nduna is crafting your slides…"
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-5 h-5" }),
              "Generate Video"
            ] })
          }
        ),
        !rateLimited && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground text-center", children: [
          DAILY_LIMIT - todayCount,
          " of ",
          DAILY_LIMIT,
          " renders remaining today"
        ] })
      ] }),
      activeJobId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-semibold text-foreground flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "w-4 h-4 text-primary" }),
            "Your Video"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "gap-1.5 text-xs h-7",
              onClick: handleRetry,
              "data-ocid": "hyperframes.new_video_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-3 h-3" }),
                "New video"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          RenderStatusPoller,
          {
            jobId: activeJobId,
            compositionHtml: activeHtml,
            onRetry: handleRetry
          }
        )
      ] }),
      previewJob && previewJob.renderStatus === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-semibold text-foreground", children: [
            "Previewing: ",
            previewJob.topic
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "h-7 text-xs",
              onClick: () => setPreviewJob(null),
              "data-ocid": "hyperframes.close_preview_button",
              children: "Close"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(VideoPlayer, { job: previewJob })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", "data-ocid": "hyperframes.history_section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-semibold text-foreground flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4 text-primary" }),
            "Previous Videos"
          ] }),
          jobs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
            jobs.slice(0, 20).length,
            " of ",
            jobs.length
          ] })
        ] }),
        jobsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "space-y-2",
            "data-ocid": "hyperframes.history_loading_state",
            children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-16 rounded-xl" }, i))
          }
        ) : jobs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Card,
          {
            className: "p-8 text-center bg-muted/10 border-dashed",
            "data-ocid": "hyperframes.history_empty_state",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "w-7 h-7 text-primary" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-foreground mb-1", children: "No videos yet" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Type a topic above and let Nduna create your first AI video — it takes about 2 minutes to render." })
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: jobs.slice(0, 20).map((job, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          HistoryRow,
          {
            job,
            index: i,
            onPreview: (j) => {
              setPreviewJob(j);
              setActiveJobId(null);
            }
          },
          job.id
        )) })
      ] }),
      tier < 3 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Card,
        {
          className: "p-4 bg-primary/5 border-primary/20",
          "data-ocid": "hyperframes.tier_gate_card",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-5 h-5 text-primary shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground", children: "Elite feature — R800/month" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "AI Video Studio is available exclusively on the Elite plan. Upgrade to start generating Hyperframes videos with Nduna." })
            ] })
          ] })
        }
      )
    ] })
  ] });
}
export {
  HyperframesPage as default
};
