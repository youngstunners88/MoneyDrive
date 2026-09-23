import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, C as CircleCheckBig, B as Button, M as Mic, L as LoaderCircle, S as Square, T as Trash2, a as Sheet, b as SheetContent, d as SheetHeader, e as SheetTitle, X, f as Textarea, g as Switch, P as Pause, h as Play, i as Badge, k as cn, H as Heart, l as MessageCircle, u as useActor, m as useQuery, n as useQueryClient, o as useMutation, p as ue, A as ArrowLeft, q as Skeleton, s as ChevronDown, t as useInternetIdentity, W as WifiOff } from "./index-C-RLbQrs.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z", key: "i9b6wo" }],
  ["line", { x1: "4", x2: "4", y1: "22", y2: "15", key: "1cm3nv" }]
];
const Flag = createLucideIcon("flag", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ]
];
const Pen = createLucideIcon("pen", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
  ["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }]
];
const User = createLucideIcon("user", __iconNode);
function formatTime$1(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg"
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}
const MAX_DURATION = 120;
function VoiceNoteRecorder({
  onKeyReady,
  onDiscard
}) {
  const [state, setState] = reactExports.useState(
    () => typeof MediaRecorder === "undefined" ? "unsupported" : "idle"
  );
  const [errorMsg, setErrorMsg] = reactExports.useState(null);
  const [elapsed, setElapsed] = reactExports.useState(0);
  const [duration, setDuration] = reactExports.useState(0);
  const [progressPct, setProgressPct] = reactExports.useState(0);
  const mediaRef = reactExports.useRef(null);
  const chunksRef = reactExports.useRef([]);
  const blobRef = reactExports.useRef(null);
  const objectUrlRef = reactExports.useRef(null);
  const timerRef = reactExports.useRef(null);
  const streamRef = reactExports.useRef(null);
  const elapsedRef = reactExports.useRef(0);
  reactExports.useEffect(() => {
    if (state === "recording") {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          elapsedRef.current = next;
          setProgressPct(Math.min(next / MAX_DURATION * 100, 100));
          if (next >= MAX_DURATION) {
            stopRecording();
          }
          return next;
        });
      }, 1e3);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);
  reactExports.useEffect(() => {
    return () => {
      var _a;
      for (const t of ((_a = streamRef.current) == null ? void 0 : _a.getTracks()) ?? []) t.stop();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);
  const startRecording = reactExports.useCallback(async () => {
    setErrorMsg(null);
    setState("requesting-permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      elapsedRef.current = 0;
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : void 0
      );
      mediaRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm"
        });
        blobRef.current = blob;
        for (const t of stream.getTracks()) t.stop();
        setDuration(elapsedRef.current);
        setState("recorded");
      };
      recorder.start(500);
      setElapsed(0);
      setProgressPct(0);
      setState("recording");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setErrorMsg(
          "Microphone access denied. Please allow mic access in your browser settings."
        );
      } else {
        setErrorMsg("Could not start recording. Please try again.");
      }
      setState("idle");
    }
  }, []);
  const stopRecording = reactExports.useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
  }, []);
  const discard = reactExports.useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    blobRef.current = null;
    setElapsed(0);
    setProgressPct(0);
    setDuration(0);
    setState("idle");
    onDiscard();
  }, [onDiscard]);
  const confirmUse = reactExports.useCallback(() => {
    if (!blobRef.current) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(blobRef.current);
    objectUrlRef.current = url;
    onKeyReady(url, duration);
    setState("uploaded");
  }, [duration, onKeyReady]);
  if (state === "unsupported") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground italic", children: "Voice notes not supported in this browser." });
  }
  if (state === "uploaded") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-2 text-sm font-medium py-1",
        style: { color: "oklch(0.65 0.18 145)" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-4 h-4" }),
          "Voice note attached"
        ]
      }
    );
  }
  if (errorMsg) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-destructive text-xs", children: errorMsg }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => setErrorMsg(null),
          "data-ocid": "voice_recorder.retry_button",
          children: "Try again"
        }
      )
    ] });
  }
  if (state === "idle") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "outline",
        size: "sm",
        onClick: startRecording,
        className: "gap-2 border-dashed",
        "data-ocid": "voice_recorder.start_button",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "w-4 h-4", style: { color: "oklch(0.6 0.22 35)" } }),
          "Add Voice Note"
        ]
      }
    );
  }
  if (state === "requesting-permission") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }),
      "Requesting microphone..."
    ] });
  }
  if (state === "recording") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", "data-ocid": "voice_recorder.recording", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-mono font-semibold text-foreground", children: formatTime$1(elapsed) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground ml-auto", children: "max 2:00" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-full bg-destructive transition-all duration-1000",
          style: { width: `${progressPct}%` }
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            variant: "destructive",
            onClick: stopRecording,
            className: "gap-1.5",
            "data-ocid": "voice_recorder.stop_button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "w-3.5 h-3.5 fill-current" }),
              "Stop"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            size: "sm",
            variant: "ghost",
            onClick: discard,
            "data-ocid": "voice_recorder.discard_button",
            children: "Cancel"
          }
        )
      ] })
    ] });
  }
  if (state === "recorded") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", "data-ocid": "voice_recorder.preview", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 bg-muted/50 rounded-xl px-3 py-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Mic,
          {
            className: "w-4 h-4 shrink-0",
            style: { color: "oklch(0.6 0.22 35)" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-foreground", children: "Voice note recorded" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: formatTime$1(duration) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end gap-px h-5", children: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "w-px rounded-full",
            style: {
              height: `${20 + Math.sin(i * 0.8) * 60}%`,
              background: "oklch(0.6 0.22 35 / 0.6)"
            }
          },
          i
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            onClick: confirmUse,
            className: "gap-1.5",
            "data-ocid": "voice_recorder.confirm_button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-3.5 h-3.5" }),
              "Use this"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            variant: "ghost",
            onClick: discard,
            className: "gap-1.5 text-muted-foreground",
            "data-ocid": "voice_recorder.re_record_button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3.5 h-3.5" }),
              "Re-record"
            ]
          }
        )
      ] })
    ] });
  }
  return null;
}
const CHANNEL_LABELS = {
  whatILove: "What I ❤️",
  whatNeedsWork: "What I 😡",
  featureRequests: "What I want"
};
const MAX_CHARS = 2e3;
function NewPostSheet({
  open,
  onClose,
  channel,
  parentPost,
  onSubmit,
  isSubmitting
}) {
  const [text, setText] = reactExports.useState("");
  const [isAnonymous, setIsAnonymous] = reactExports.useState(false);
  const [voiceNoteKey, setVoiceNoteKey] = reactExports.useState(null);
  const textareaRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!open) {
      setText("");
      setIsAnonymous(false);
      setVoiceNoteKey(null);
    } else {
      setTimeout(() => {
        var _a;
        return (_a = textareaRef.current) == null ? void 0 : _a.focus();
      }, 200);
    }
  }, [open]);
  const remaining = MAX_CHARS - text.length;
  const canSubmit = text.trim().length > 0 && !isSubmitting;
  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      text: text.trim(),
      isAnonymous,
      voiceNoteKey,
      parentId: (parentPost == null ? void 0 : parentPost.id) ?? null
    });
  };
  const title = parentPost ? `Reply to ${parentPost.isAnonymous ? "Anonymous" : parentPost.displayName}` : CHANNEL_LABELS[channel];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { open, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    SheetContent,
    {
      side: "bottom",
      className: "rounded-t-3xl pb-8 px-4 max-h-[85vh] overflow-y-auto",
      "data-ocid": "etavern.new_post.sheet",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "mb-4 flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "font-display text-base text-left truncate", children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "p-1 rounded-lg text-muted-foreground hover:text-foreground",
              "aria-label": "Close",
              "data-ocid": "etavern.new_post.close_button",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-5 h-5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          parentPost && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-muted/40 rounded-xl px-3 py-2 border-l-2 border-primary/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground line-clamp-2", children: parentPost.text }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                ref: textareaRef,
                value: text,
                onChange: (e) => setText(e.target.value.slice(0, MAX_CHARS)),
                placeholder: parentPost ? "Write your reply..." : "Share your thoughts with the community...",
                className: "min-h-[120px] resize-none bg-muted/30 border-border/60 focus:border-primary/60 rounded-xl text-sm",
                "data-ocid": "etavern.new_post.textarea"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `absolute bottom-2 right-3 text-[10px] font-mono ${remaining < 100 ? "text-destructive" : "text-muted-foreground/60"}`,
                children: remaining
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-medium", children: "Voice note" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              VoiceNoteRecorder,
              {
                onKeyReady: (key) => {
                  setVoiceNoteKey(key);
                },
                onDiscard: () => {
                  setVoiceNoteKey(null);
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: "Post anonymously" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Hides your name and tier" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                checked: isAnonymous,
                onCheckedChange: setIsAnonymous,
                "aria-label": "Post anonymously",
                "data-ocid": "etavern.new_post.anonymous_toggle"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: handleSubmit,
                disabled: !canSubmit,
                className: "flex-1 gap-2 font-semibold",
                "data-ocid": "etavern.new_post.submit_button",
                children: [
                  isSubmitting && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }),
                  parentPost ? "Post Reply" : "Post to eTavern"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                onClick: onClose,
                "data-ocid": "etavern.new_post.cancel_button",
                children: "Cancel"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
const WAVEFORM_BARS = [0, 1, 2, 3, 4, 5, 6, 7];
function VoiceNotePlayer({
  storageKey,
  durationHint
}) {
  const audioRef = reactExports.useRef(null);
  const [loaded, setLoaded] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(false);
  const [playing, setPlaying] = reactExports.useState(false);
  const [current, setCurrent] = reactExports.useState(0);
  const [total, setTotal] = reactExports.useState(durationHint ?? 0);
  const [error, setError] = reactExports.useState(false);
  const initAudio = reactExports.useCallback(
    (autoPlay) => {
      if (audioRef.current) {
        if (autoPlay) {
          audioRef.current.play().then(() => setPlaying(true)).catch(() => setError(true));
        }
        return;
      }
      setLoading(true);
      const audio = new Audio(storageKey);
      audio.preload = "metadata";
      audio.addEventListener(
        "loadedmetadata",
        () => setTotal(audio.duration || 0)
      );
      audio.addEventListener("timeupdate", () => setCurrent(audio.currentTime));
      audio.addEventListener("ended", () => {
        setPlaying(false);
        setCurrent(0);
        audio.currentTime = 0;
      });
      audio.addEventListener("error", () => {
        setError(true);
        setLoading(false);
      });
      audio.addEventListener("canplay", () => {
        setLoaded(true);
        setLoading(false);
        setTotal(audio.duration || 0);
        if (autoPlay) {
          audio.play().then(() => setPlaying(true)).catch(() => setError(true));
        }
      });
      audioRef.current = audio;
    },
    [storageKey]
  );
  const togglePlay = reactExports.useCallback(() => {
    const audio = audioRef.current;
    if (!loaded || !audio) {
      initAudio(true);
      return;
    }
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setError(true));
    }
  }, [loaded, playing, initAudio]);
  const handleSeek = reactExports.useCallback((e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrent(t);
  }, []);
  const pct = total > 0 ? current / total * 100 : 0;
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground italic", children: "Voice note unavailable" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex items-center gap-2 bg-muted/40 rounded-xl px-2.5 py-1.5 max-w-[260px]",
      "data-ocid": "voice_player.container",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: togglePlay,
            className: "w-7 h-7 rounded-full flex items-center justify-center bg-burnt-orange/90 text-white shrink-0 hover:opacity-80 transition-opacity",
            "aria-label": playing ? "Pause voice note" : "Play voice note",
            "data-ocid": "voice_player.play_button",
            children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3 h-3 animate-spin" }) : playing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { className: "w-3 h-3 fill-current" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "w-3 h-3 fill-current ml-0.5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: 0,
              max: total || 1,
              step: 0.1,
              value: current,
              onChange: handleSeek,
              disabled: !loaded,
              "aria-label": "Voice note progress",
              className: "w-full h-1 accent-burnt-orange cursor-pointer disabled:cursor-default"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px] text-muted-foreground font-mono", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(current) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(total) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end gap-px h-4 shrink-0", children: WAVEFORM_BARS.map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "w-0.5 rounded-full transition-all duration-300",
            style: {
              height: `${30 + Math.sin(i * 1.1) * 70}%`,
              background: i / 8 <= pct / 100 ? "oklch(0.6 0.22 35)" : "oklch(0.4 0.02 80)"
            }
          },
          i
        )) })
      ]
    }
  );
}
const TIER_CONFIG = {
  1: { label: "Hustler", className: "bg-muted text-muted-foreground" },
  2: { label: "Grinder", className: "bg-primary/20 text-primary" },
  3: {
    label: "Power Earner",
    className: "bg-burnt-orange/20 text-burnt-orange"
  }
};
function getTierConfig(tier) {
  return TIER_CONFIG[tier] ?? TIER_CONFIG[1];
}
function relativeTime(ms) {
  const diff = Date.now() - ms;
  const secs = Math.floor(diff / 1e3);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short"
  });
}
function Avatar({ name, isAnon }) {
  if (isAnon) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-4 h-4 text-muted-foreground" }) });
  }
  const initials = name.split(" ").slice(0, 2).map((w) => {
    var _a;
    return ((_a = w[0]) == null ? void 0 : _a.toUpperCase()) ?? "";
  }).join("");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-primary-foreground",
      style: { background: "oklch(0.6 0.22 35)" },
      children: initials || "D"
    }
  );
}
function PostCard({
  post,
  currentUserId,
  isLiked = false,
  onLike,
  onReply,
  onDelete,
  onFlag,
  heroMode = false,
  index
}) {
  const [optimisticLike, setOptimisticLike] = reactExports.useState(null);
  const liked = optimisticLike !== null ? optimisticLike : isLiked;
  const likeCount = optimisticLike !== null ? post.likeCount + (optimisticLike ? 1 : -1) : post.likeCount;
  const isOwn = post.authorId === currentUserId;
  const tierConf = getTierConfig(post.tier);
  const displayName = post.isAnonymous ? "Anonymous" : post.displayName;
  const ocidSuffix = index != null ? `.${index}` : "";
  const handleLike = () => {
    setOptimisticLike(!liked);
    onLike(post);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "article",
    {
      className: cn(
        "bg-card border border-border rounded-2xl p-4 space-y-3 transition-shadow",
        heroMode && "border-primary/30 shadow-md"
      ),
      "data-ocid": `etavern.post${ocidSuffix}.card`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: displayName, isAnon: post.isAnonymous }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-foreground truncate max-w-[140px]", children: displayName }),
              !post.isAnonymous && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  className: cn(
                    "text-[10px] px-1.5 py-0 font-semibold",
                    tierConf.className
                  ),
                  children: tierConf.label
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: relativeTime(post.timestamp) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
            !isOwn && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => onFlag(post),
                className: "p-1 rounded-lg text-muted-foreground/50 hover:text-muted-foreground transition-colors",
                "aria-label": "Flag post",
                "data-ocid": `etavern.post${ocidSuffix}.flag_button`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flag, { className: "w-3.5 h-3.5" })
              }
            ),
            isOwn && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => onDelete(post),
                className: "p-1 rounded-lg text-muted-foreground/50 hover:text-destructive transition-colors",
                "aria-label": "Delete post",
                "data-ocid": `etavern.post${ocidSuffix}.delete_button`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3.5 h-3.5" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground leading-relaxed break-words", children: post.text }),
        post.voiceNoteKey && /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceNotePlayer, { storageKey: post.voiceNoteKey }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 pt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: handleLike,
              className: cn(
                "h-8 px-2.5 gap-1.5 text-xs rounded-xl transition-colors",
                liked ? "text-destructive hover:text-destructive bg-destructive/10 hover:bg-destructive/15" : "text-muted-foreground hover:text-foreground"
              ),
              "aria-label": liked ? "Unlike" : "Like",
              "data-ocid": `etavern.post${ocidSuffix}.like_button`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: cn("w-3.5 h-3.5", liked && "fill-current") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: likeCount > 0 ? likeCount : "" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => onReply(post),
              className: "h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-xl",
              "aria-label": "Reply",
              "data-ocid": `etavern.post${ocidSuffix}.reply_button`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.replyCount > 0 ? post.replyCount : "Reply" })
              ]
            }
          )
        ] })
      ]
    }
  );
}
const forumKeys = {
  all: ["forum"],
  posts: (channel) => ["forum", "posts", channel],
  post: (id) => ["forum", "post", id],
  replies: (parentId) => ["forum", "replies", parentId],
  liked: (postId) => ["forum", "liked", postId]
};
function normalisePost(p) {
  return {
    id: p.id,
    channel: p.channel,
    authorId: typeof p.authorId === "string" ? p.authorId : String(p.authorId),
    isAnonymous: p.isAnonymous,
    displayName: p.isAnonymous ? "Anonymous" : "Driver",
    tier: 1,
    text: p.text,
    voiceNoteKey: p.voiceNoteKey ?? null,
    timestamp: Number(p.timestamp),
    replyCount: Number(p.replyCount),
    likeCount: Number(p.likeCount),
    flagCount: Number(p.flagCount),
    parentId: p.parentId ?? null,
    deleted: p.deleted
  };
}
function normalisePage(p) {
  return {
    posts: (p.posts ?? []).map(normalisePost),
    total: Number(p.total),
    nextOffset: p.nextOffset != null ? Number(p.nextOffset) : null
  };
}
function useForumPosts(channel, offset = 0) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: [...forumKeys.posts(channel), offset],
    queryFn: async () => {
      if (!(actor == null ? void 0 : actor.getForumPosts))
        return { posts: [], total: 0, nextOffset: null };
      try {
        const res = await actor.getForumPosts(
          channel,
          BigInt(offset),
          BigInt(25)
        );
        return normalisePage(res);
      } catch {
        return { posts: [], total: 0, nextOffset: null };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 3e4
  });
}
function useForumReplies(parentId, offset = 0) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: [...forumKeys.replies(parentId), offset],
    queryFn: async () => {
      if (!(actor == null ? void 0 : actor.getForumReplies))
        return { posts: [], total: 0, nextOffset: null };
      try {
        const res = await actor.getForumReplies(
          parentId,
          BigInt(offset),
          BigInt(25)
        );
        return normalisePage(res);
      } catch {
        return { posts: [], total: 0, nextOffset: null };
      }
    },
    enabled: !!actor && !isFetching && !!parentId
  });
}
function useHasLikedPost(postId) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: forumKeys.liked(postId),
    queryFn: async () => {
      if (!(actor == null ? void 0 : actor.hasLikedForumPost)) return false;
      try {
        return await actor.hasLikedForumPost(postId);
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching && !!postId,
    staleTime: 6e4
  });
}
function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      channel,
      text,
      isAnonymous,
      voiceNoteKey,
      parentId
    }) => {
      if (!(actor == null ? void 0 : actor.createForumPost)) throw new Error("Forum not available yet");
      const res = await actor.createForumPost(
        channel,
        text,
        isAnonymous,
        voiceNoteKey,
        parentId
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return normalisePost(res.ok);
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({
        queryKey: forumKeys.posts(post.channel)
      });
      if (post.parentId) {
        queryClient.invalidateQueries({
          queryKey: forumKeys.replies(post.parentId)
        });
        queryClient.invalidateQueries({
          queryKey: forumKeys.post(post.parentId)
        });
      }
    }
  });
}
function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }) => {
      if (!(actor == null ? void 0 : actor.likeForumPost)) throw new Error("Forum not available");
      const res = await actor.likeForumPost(postId);
      if (res.__kind__ === "err") throw new Error(res.err);
      return Number(res.ok);
    },
    onSuccess: (_data, { postId, channel }) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.posts(channel) });
      queryClient.invalidateQueries({ queryKey: forumKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: forumKeys.liked(postId) });
    }
  });
}
function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }) => {
      if (!(actor == null ? void 0 : actor.deleteForumPost)) throw new Error("Forum not available");
      const res = await actor.deleteForumPost(postId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: (_data, { channel }) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.posts(channel) });
    }
  });
}
function useFlagPost() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ postId, reason }) => {
      if (!(actor == null ? void 0 : actor.flagForumPost)) throw new Error("Forum not available");
      const res = await actor.flagForumPost(postId, reason);
      if (res.__kind__ === "err") throw new Error(res.err);
    }
  });
}
function ReplyItem({
  reply,
  currentUserId,
  depth,
  onReply,
  index
}) {
  const likePost = useLikePost();
  const deletePost = useDeletePost();
  const flagPost = useFlagPost();
  const { data: isLiked } = useHasLikedPost(reply.id);
  const handleLike = reactExports.useCallback(
    (p) => {
      likePost.mutate(
        { postId: p.id, channel: p.channel },
        {
          onError: (e) => ue.error(e.message)
        }
      );
    },
    [likePost]
  );
  const handleDelete = reactExports.useCallback(
    (p) => {
      if (!confirm("Delete this reply?")) return;
      deletePost.mutate(
        { postId: p.id, channel: p.channel },
        {
          onSuccess: () => ue.success("Reply deleted"),
          onError: (e) => ue.error(e.message)
        }
      );
    },
    [deletePost]
  );
  const handleFlag = reactExports.useCallback(
    (p) => {
      flagPost.mutate(
        { postId: p.id, reason: "inappropriate" },
        {
          onSuccess: () => ue.success("Post flagged for review"),
          onError: (e) => ue.error(e.message)
        }
      );
    },
    [flagPost]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: { marginLeft: depth > 0 ? Math.min(depth, 3) * 16 : 0 },
      className: "border-l border-border/40 pl-3",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PostCard,
          {
            post: reply,
            currentUserId,
            isLiked: isLiked ?? false,
            onLike: handleLike,
            onReply,
            onDelete: handleDelete,
            onFlag: handleFlag,
            index
          }
        ),
        reply.replyCount > 0 && depth < 3 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          NestedReplies,
          {
            parentId: reply.id,
            currentUserId,
            depth: depth + 1,
            onReply
          }
        )
      ]
    }
  );
}
function NestedReplies({
  parentId,
  currentUserId,
  depth,
  onReply
}) {
  const [expanded, setExpanded] = reactExports.useState(false);
  const { data, isLoading } = useForumReplies(parentId);
  if (!expanded) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => setExpanded(true),
        className: "flex items-center gap-1 text-xs text-primary/80 hover:text-primary ml-3 mt-1 mb-2 transition-colors",
        "data-ocid": `etavern.replies.expand_${parentId}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-3 h-3" }),
          "View more replies"
        ]
      }
    );
  }
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-16 mx-3 mt-2 rounded-xl" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 mt-2", children: ((data == null ? void 0 : data.posts) ?? []).map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    ReplyItem,
    {
      reply: r,
      currentUserId,
      depth,
      onReply,
      index: i + 1
    },
    r.id
  )) });
}
function PostDetailView({
  post,
  currentUserId,
  onBack
}) {
  const [offset, setOffset] = reactExports.useState(0);
  const [sheetOpen, setSheetOpen] = reactExports.useState(false);
  const [replyTarget, setReplyTarget] = reactExports.useState(post);
  const { data: repliesPage, isLoading } = useForumReplies(post.id, offset);
  const likePost = useLikePost();
  const deletePost = useDeletePost();
  const flagPost = useFlagPost();
  const createPost = useCreatePost();
  const { data: isRootLiked } = useHasLikedPost(post.id);
  const handleReply = reactExports.useCallback((target) => {
    setReplyTarget(target);
    setSheetOpen(true);
  }, []);
  const handleLike = reactExports.useCallback(
    (p) => {
      likePost.mutate(
        { postId: p.id, channel: p.channel },
        {
          onError: (e) => ue.error(e.message)
        }
      );
    },
    [likePost]
  );
  const handleDelete = reactExports.useCallback(
    (p) => {
      if (!confirm("Delete this post?")) return;
      deletePost.mutate(
        { postId: p.id, channel: p.channel },
        {
          onSuccess: () => {
            ue.success("Post deleted");
            onBack();
          },
          onError: (e) => ue.error(e.message)
        }
      );
    },
    [deletePost, onBack]
  );
  const handleFlag = reactExports.useCallback(
    (p) => {
      flagPost.mutate(
        { postId: p.id, reason: "inappropriate" },
        {
          onSuccess: () => ue.success("Post flagged for review"),
          onError: (e) => ue.error(e.message)
        }
      );
    },
    [flagPost]
  );
  const handleSubmitReply = reactExports.useCallback(
    (params) => {
      createPost.mutate(
        { ...params, channel: post.channel },
        {
          onSuccess: () => {
            setSheetOpen(false);
            ue.success("Reply posted!");
          },
          onError: (e) => ue.error(e.message)
        }
      );
    },
    [createPost, post.channel]
  );
  const replies = (repliesPage == null ? void 0 : repliesPage.posts) ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col min-h-screen bg-background",
      "data-ocid": "etavern.detail.page",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 z-20 bg-card border-b border-border/60 flex items-center gap-3 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onBack,
              className: "p-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors",
              "aria-label": "Back",
              "data-ocid": "etavern.detail.back_button",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-5 h-5" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-semibold text-base text-foreground", children: "Thread" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PostCard,
            {
              post,
              currentUserId,
              isLiked: isRootLiked ?? false,
              onLike: handleLike,
              onReply: handleReply,
              onDelete: handleDelete,
              onFlag: handleFlag,
              heroMode: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border/40" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground font-medium", children: [
              (repliesPage == null ? void 0 : repliesPage.total) ?? 0,
              " ",
              (repliesPage == null ? void 0 : repliesPage.total) === 1 ? "reply" : "replies"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border/40" })
          ] }),
          isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-28 rounded-2xl" }, i)) }) : replies.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "text-center py-12 text-muted-foreground",
              "data-ocid": "etavern.detail.empty_state",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircleIcon, {}),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mt-3", children: "No replies yet. Be the first!" })
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: replies.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            ReplyItem,
            {
              reply: r,
              currentUserId,
              depth: 0,
              onReply: handleReply,
              index: i + 1
            },
            r.id
          )) }),
          (repliesPage == null ? void 0 : repliesPage.nextOffset) != null && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              className: "w-full",
              onClick: () => setOffset(repliesPage.nextOffset),
              "data-ocid": "etavern.detail.load_more_button",
              children: "Load more replies"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-card border-t border-border/60 px-4 py-3 flex gap-2 z-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: () => handleReply(post),
            className: "flex-1 gap-2 font-semibold",
            "data-ocid": "etavern.detail.reply_primary_button",
            children: createPost.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : "Reply to thread"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          NewPostSheet,
          {
            open: sheetOpen,
            onClose: () => setSheetOpen(false),
            channel: post.channel,
            parentPost: replyTarget,
            onSubmit: handleSubmitReply,
            isSubmitting: createPost.isPending
          }
        )
      ]
    }
  );
}
function MessageCircleIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "svg",
    {
      className: "w-10 h-10 mx-auto text-muted-foreground/30",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.5,
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: "No replies" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" })
      ]
    }
  );
}
const CHANNELS = [
  {
    id: "whatILove",
    label: "What I ❤️",
    emoji: "❤️",
    description: "Share what's working great"
  },
  {
    id: "whatNeedsWork",
    label: "What I 😡",
    emoji: "😡",
    description: "Honest feedback welcome"
  },
  {
    id: "featureRequests",
    label: "What I want",
    emoji: "💡",
    description: "Ideas to make it better"
  }
];
function OfflineReadBanner() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2 text-xs text-muted-foreground border border-border/40", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { className: "w-3.5 h-3.5 shrink-0" }),
    "You're offline — forum is read-only. Your draft is saved."
  ] });
}
function PostCardConnected({
  post,
  currentUserId,
  onReply,
  onDetail,
  index
}) {
  const { data: isLiked } = useHasLikedPost(post.id);
  const likePost = useLikePost();
  const deletePost = useDeletePost();
  const flagPost = useFlagPost();
  const handleLike = reactExports.useCallback(
    (p) => {
      likePost.mutate(
        { postId: p.id, channel: p.channel },
        {
          onError: (e) => ue.error(e.message)
        }
      );
    },
    [likePost]
  );
  const handleDelete = reactExports.useCallback(
    (p) => {
      if (!confirm("Delete this post?")) return;
      deletePost.mutate(
        { postId: p.id, channel: p.channel },
        {
          onSuccess: () => ue.success("Post deleted"),
          onError: (e) => ue.error(e.message)
        }
      );
    },
    [deletePost]
  );
  const handleFlag = reactExports.useCallback(
    (p) => {
      flagPost.mutate(
        { postId: p.id, reason: "inappropriate" },
        {
          onSuccess: () => ue.success("Post flagged for review"),
          onError: (e) => ue.error(e.message)
        }
      );
    },
    [flagPost]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      onClick: () => onDetail(post),
      className: "cursor-pointer w-full text-left",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        PostCard,
        {
          post,
          currentUserId,
          isLiked: isLiked ?? false,
          onLike: (p) => {
            handleLike(p);
          },
          onReply: (p) => {
            onReply(p);
          },
          onDelete: handleDelete,
          onFlag: handleFlag,
          index
        }
      )
    }
  );
}
function ETavernPage() {
  var _a;
  const { identity } = useInternetIdentity();
  const currentUserId = (identity == null ? void 0 : identity.getPrincipal().toText()) ?? "";
  const [activeChannel, setActiveChannel] = reactExports.useState("whatILove");
  const [offset, setOffset] = reactExports.useState(0);
  const [allPosts, setAllPosts] = reactExports.useState([]);
  const [sheetOpen, setSheetOpen] = reactExports.useState(false);
  const [replyTarget, setReplyTarget] = reactExports.useState(null);
  const [detailPost, setDetailPost] = reactExports.useState(null);
  const [isOffline, setIsOffline] = reactExports.useState(!navigator.onLine);
  const [optimisticPosts, setOptimisticPosts] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const online = () => setIsOffline(false);
    const offline = () => setIsOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);
  const {
    data: page,
    isLoading,
    isFetching
  } = useForumPosts(activeChannel, offset);
  reactExports.useEffect(() => {
    if (!page) return;
    setAllPosts(
      (prev) => offset === 0 ? page.posts : [
        ...prev,
        ...page.posts.filter((p) => !prev.some((x) => x.id === p.id))
      ]
    );
  }, [page, offset]);
  reactExports.useEffect(() => {
    setAllPosts([]);
    setOptimisticPosts([]);
    setOffset(0);
  }, [activeChannel]);
  const createPost = useCreatePost();
  const handleSubmit = reactExports.useCallback(
    (params) => {
      if (isOffline) {
        const draft = {
          ...params,
          channel: activeChannel,
          savedAt: Date.now()
        };
        localStorage.setItem("etavern_draft", JSON.stringify(draft));
        ue.info("You're offline — draft saved locally.");
        setSheetOpen(false);
        return;
      }
      const tempPost = {
        id: `temp-${Date.now()}`,
        channel: activeChannel,
        authorId: currentUserId,
        isAnonymous: params.isAnonymous,
        displayName: params.isAnonymous ? "Anonymous" : "You",
        tier: 1,
        text: params.text,
        voiceNoteKey: params.voiceNoteKey,
        timestamp: Date.now(),
        replyCount: 0,
        likeCount: 0,
        flagCount: 0,
        parentId: params.parentId,
        deleted: false
      };
      setOptimisticPosts((prev) => [tempPost, ...prev]);
      setSheetOpen(false);
      createPost.mutate(
        { ...params, channel: activeChannel },
        {
          onSuccess: (real) => {
            setOptimisticPosts(
              (prev) => prev.filter((p) => p.id !== tempPost.id)
            );
            setAllPosts((prev) => [real, ...prev]);
            ue.success("Posted to eTavern! 🍺");
          },
          onError: (e) => {
            setOptimisticPosts(
              (prev) => prev.filter((p) => p.id !== tempPost.id)
            );
            ue.error(e.message || "Failed to post. Try again.");
          }
        }
      );
    },
    [activeChannel, createPost, currentUserId, isOffline]
  );
  const handleOpenReply = reactExports.useCallback((p) => {
    setReplyTarget(p);
    setSheetOpen(true);
  }, []);
  const handleOpenDetail = reactExports.useCallback((p) => {
    setDetailPost(p);
  }, []);
  const handleNewPost = reactExports.useCallback(() => {
    setReplyTarget(null);
    setSheetOpen(true);
  }, []);
  if (detailPost) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      PostDetailView,
      {
        post: detailPost,
        currentUserId,
        onBack: () => setDetailPost(null)
      }
    );
  }
  const combinedPosts = [...optimisticPosts, ...allPosts];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background pb-32", "data-ocid": "etavern.page", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-card border-b border-border/60 px-4 pt-5 pb-4 sticky top-0 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            style: { background: "oklch(0.6 0.22 35 / 0.2)" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl", children: "🍺" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-bold text-xl text-foreground leading-tight", children: "eTavern" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Your community — talk straight, talk free" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-auto bg-burnt-orange/20 text-burnt-orange text-[10px] font-bold border-0", children: "All Tiers" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "flex gap-1 mt-3 overflow-x-auto scrollbar-hide",
          "data-ocid": "etavern.channel.tabs",
          children: CHANNELS.map((ch) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setActiveChannel(ch.id),
              className: cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                activeChannel === ch.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              ),
              "data-ocid": `etavern.channel.${ch.id}.tab`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ch.emoji }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ch.label })
              ]
            },
            ch.id
          ))
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 pt-4 space-y-3", children: [
      isOffline && /* @__PURE__ */ jsxRuntimeExports.jsx(OfflineReadBanner, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground px-1", children: (_a = CHANNELS.find((c) => c.id === activeChannel)) == null ? void 0 : _a.description }),
      isLoading && offset === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", "data-ocid": "etavern.feed.loading_state", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "bg-card border border-border rounded-2xl p-4 space-y-3",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-8 h-8 rounded-full" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3.5 w-28 rounded" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-16 rounded" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-full rounded" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-3/4 rounded" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-7 w-16 rounded-xl" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-7 w-16 rounded-xl" })
            ] })
          ]
        },
        i
      )) }) : combinedPosts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "text-center py-20 space-y-4",
          "data-ocid": "etavern.feed.empty_state",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center",
                style: { background: "oklch(0.6 0.22 35 / 0.1)" },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-8 h-8 text-burnt-orange" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-foreground text-lg", children: "Be the first to post!" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1 max-w-xs mx-auto", children: "Start the conversation in this channel. Your community is waiting." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: handleNewPost,
                className: "gap-2 font-semibold",
                "data-ocid": "etavern.empty_state.new_post_button",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "w-4 h-4" }),
                  "Post first"
                ]
              }
            )
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", "data-ocid": "etavern.feed.list", children: combinedPosts.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          PostCardConnected,
          {
            post: p,
            currentUserId,
            onReply: handleOpenReply,
            onDetail: handleOpenDetail,
            index: i + 1
          },
          p.id
        )) }),
        (page == null ? void 0 : page.nextOffset) != null && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            className: "w-full mt-2",
            onClick: () => setOffset(page.nextOffset),
            disabled: isFetching,
            "data-ocid": "etavern.feed.load_more_button",
            children: isFetching ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : "Load more posts"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: handleNewPost,
        disabled: isOffline,
        className: "fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-transform active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
        style: { background: "oklch(0.6 0.22 35)" },
        "aria-label": "New post",
        "data-ocid": "etavern.new_post_fab.button",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "w-5 h-5" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      NewPostSheet,
      {
        open: sheetOpen,
        onClose: () => setSheetOpen(false),
        channel: activeChannel,
        parentPost: replyTarget,
        onSubmit: handleSubmit,
        isSubmitting: createPost.isPending
      }
    )
  ] });
}
export {
  ETavernPage as default
};
