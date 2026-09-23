import { c as createLucideIcon, u as useActor, n as useQueryClient, r as reactExports, m as useQuery, o as useMutation, j as jsxRuntimeExports, i as Badge, v as Card, af as TriangleAlert, F as Label, ah as Select, ai as SelectTrigger, aj as SelectValue, ak as SelectContent, al as SelectItem, f as Textarea, B as Button, L as LoaderCircle, a1 as Sparkles, aa as Globe, Y as Clock, q as Skeleton, p as ue, R as RefreshCw, C as CircleCheckBig, ag as Download, am as Mail, an as ExternalLink, K as Copy, O as Smartphone, a5 as CircleX } from "./index-C-RLbQrs.js";
import { S as Share2 } from "./share-2-D9nDc0cb.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "M7 7h10v10", key: "1tivn9" }],
  ["path", { d: "M7 17 17 7", key: "1vkiza" }]
];
const ArrowUpRight = createLucideIcon("arrow-up-right", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2", key: "48i651" }],
  ["line", { x1: "8", x2: "16", y1: "21", y2: "21", key: "1svkeh" }],
  ["line", { x1: "12", x2: "12", y1: "17", y2: "21", key: "vw1qmm" }]
];
const Monitor = createLucideIcon("monitor", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2", ry: "2", key: "76otgf" }],
  ["line", { x1: "12", x2: "12.01", y1: "18", y2: "18", key: "1dp563" }]
];
const Tablet = createLucideIcon("tablet", __iconNode);
const DAILY_LIMIT = 5;
const POLL_INTERVAL_MS = 3e3;
const HERE_NOW_API = "https://api.here.now/v1/sites";
const SKILL_BADGES = [
  { label: "taste-skill", color: "oklch(0.60 0.22 35)" },
  { label: "SuperDesign", color: "oklch(0.75 0.12 85)" },
  { label: "frontend-slides", color: "oklch(0.55 0.14 145)" },
  { label: "interaction-design", color: "oklch(0.65 0.18 290)" }
];
const SERVICE_PRESETS = [
  { value: "airport", label: "Airport Transfers" },
  { value: "corporate", label: "Corporate" },
  { value: "family", label: "Family / School Runs" },
  { value: "latenight", label: "Late Night" },
  { value: "general", label: "General" },
  { value: "budget", label: "Budget" }
];
const STYLE_PRESETS = [
  {
    label: "Township Bold",
    direction: "township energy with bold SA colors, vibrant and energetic",
    accent: "oklch(0.60 0.22 35)"
  },
  {
    label: "Luxury Dark",
    direction: "luxury executive aesthetic, dark navy with gold accents",
    accent: "oklch(0.75 0.12 85)"
  },
  {
    label: "Clean & Professional",
    direction: "clean, professional, minimal design for corporate clients",
    accent: "oklch(0.65 0.03 85)"
  },
  {
    label: "Bold & Energetic",
    direction: "bold, high-contrast, full of energy and movement",
    accent: "oklch(0.60 0.22 35)"
  }
];
const ITERATION_CHIPS = [
  "More premium",
  "Bolder animations",
  "Change colors",
  "Add testimonials",
  "Simpler",
  "More SA feel"
];
const GENERATION_STEPS = [
  "Setting SA design taste…",
  "Building layout structure…",
  "Adding animations…",
  "Polishing interactions…"
];
const DEVICE_CONFIG = {
  mobile: { width: "375px", label: "Mobile" },
  tablet: { width: "768px", label: "Tablet" },
  desktop: { width: "100%", label: "Desktop" }
};
const STATUS_CFG = {
  pending: {
    label: "Queued",
    cls: "bg-muted/60 text-muted-foreground",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-3 h-3" })
  },
  generating: {
    label: "Generating",
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
function todayJobCount(jobs) {
  const startOfToday = /* @__PURE__ */ new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  return jobs.filter((j) => {
    const ms = Number(j.createdAt / BigInt(1e6));
    return ms >= todayMs;
  }).length;
}
async function publishToHereNow(html, subdomain) {
  const blob = new Blob([html], { type: "text/html" });
  const form = new FormData();
  form.append("file", blob, "index.html");
  form.append("subdomain", subdomain);
  const res = await fetch(HERE_NOW_API, {
    method: "POST",
    body: form
  });
  if (!res.ok) {
    let msg = "Publishing failed";
    try {
      const body = await res.json();
      msg = body.error ?? body.message ?? msg;
    } catch {
    }
    throw new Error(msg);
  }
  const data = await res.json();
  const liveUrl = data.liveUrl ?? data.url ?? `https://${subdomain}.here.now`;
  const claimUrl = data.claimUrl ?? `https://here.now/claim?site=${encodeURIComponent(subdomain)}`;
  return { liveUrl, claimUrl };
}
function GenerationProgress() {
  const [activeStep, setActiveStep] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => s < GENERATION_STEPS.length - 1 ? s + 1 : s);
    }, 5e3);
    return () => clearInterval(interval);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "p-5 rounded-xl border space-y-4",
      style: {
        background: "oklch(0.60 0.22 35 / 0.08)",
        borderColor: "oklch(0.60 0.22 35 / 0.3)"
      },
      "data-ocid": "website-builder.generating_state",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: "https://i.imgur.com/u98U7S6.png",
              alt: "Nduna",
              className: "w-12 h-12 rounded-full object-cover border-2 shrink-0 animate-pulse",
              style: { borderColor: "oklch(0.75 0.12 85 / 0.5)" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-semibold text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin text-primary" }),
              "Nduna is designing your website…"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Using 4 stacked design skills — crafting something unforgettable" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: GENERATION_STEPS.map((step, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-2.5 transition-all duration-500",
            style: { opacity: i <= activeStep ? 1 : 0.3 },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500",
                  style: {
                    background: i < activeStep ? "oklch(0.55 0.14 145)" : i === activeStep ? "oklch(0.60 0.22 35)" : "oklch(0.22 0.02 85)",
                    border: i === activeStep ? "2px solid oklch(0.60 0.22 35 / 0.6)" : "none"
                  },
                  children: i < activeStep ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-3 h-3 text-background" }) : i === activeStep ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3 h-3 text-background animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "text-[9px] font-bold",
                      style: { color: "oklch(0.65 0.03 85)" },
                      children: i + 1
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "span",
                {
                  className: "text-sm transition-all duration-300",
                  style: {
                    color: i === activeStep ? "oklch(0.60 0.22 35)" : i < activeStep ? "oklch(0.55 0.14 145)" : "oklch(0.65 0.03 85)",
                    fontWeight: i === activeStep ? 600 : 400
                  },
                  children: [
                    i + 1,
                    ". ",
                    step
                  ]
                }
              )
            ]
          },
          step
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Skeleton,
            {
              className: "w-full h-3 rounded",
              style: { background: "oklch(0.60 0.22 35 / 0.12)" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Skeleton,
            {
              className: "w-3/4 h-3 rounded",
              style: { background: "oklch(0.75 0.12 85 / 0.10)" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-1.5 mt-2", children: [1, 2, 3].map((k) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Skeleton,
            {
              className: "h-8 rounded",
              style: { background: "oklch(0.60 0.22 35 / 0.08)" }
            },
            k
          )) })
        ] })
      ]
    }
  );
}
function SitePreview({
  html,
  device,
  onFullScreen
}) {
  const [blobUrl, setBlobUrl] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [html]);
  if (!html || !blobUrl) return null;
  const isMobile = device === "mobile";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "rounded-xl overflow-hidden border-2",
      style: { borderColor: "oklch(0.60 0.22 35 / 0.5)" },
      "data-ocid": "website-builder.preview_panel",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "px-3 py-2 flex items-center justify-between gap-2",
            style: {
              background: "oklch(0.60 0.22 35 / 0.15)"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "flex items-center gap-2 text-xs font-semibold",
                  style: { color: "oklch(0.80 0.12 35)" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "w-3.5 h-3.5" }),
                    "Live Preview — ",
                    DEVICE_CONFIG[device].label
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "h-6 px-2 text-[10px] gap-1",
                  style: { color: "oklch(0.80 0.12 35)" },
                  onClick: onFullScreen,
                  "data-ocid": "website-builder.fullscreen_button",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" }),
                    "Full Screen"
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center bg-muted/20 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "transition-all duration-300 overflow-hidden",
            style: {
              width: DEVICE_CONFIG[device].width,
              maxWidth: "100%",
              borderRadius: isMobile ? "24px" : "8px",
              boxShadow: isMobile ? "0 0 0 4px oklch(0.22 0.02 85), 0 8px 32px rgba(0,0,0,0.5)" : "0 4px 16px rgba(0,0,0,0.3)"
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "iframe",
              {
                src: blobUrl,
                title: "Generated driver website preview",
                className: "w-full border-0 block",
                style: { height: isMobile ? 600 : 480 },
                sandbox: "allow-scripts allow-same-origin",
                "aria-label": "Driver website preview"
              }
            )
          }
        ) })
      ]
    }
  );
}
function DeviceToggle({
  device,
  onChange
}) {
  const modes = [
    {
      id: "mobile",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "w-3.5 h-3.5" }),
      label: "Mobile"
    },
    { id: "tablet", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Tablet, { className: "w-3.5 h-3.5" }), label: "Tablet" },
    {
      id: "desktop",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { className: "w-3.5 h-3.5" }),
      label: "Desktop"
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "flex items-center rounded-lg p-0.5 gap-0.5",
      style: { background: "oklch(0.15 0.01 85)" },
      children: modes.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => onChange(m.id),
          className: "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
          style: {
            background: device === m.id ? "oklch(0.60 0.22 35 / 0.25)" : "transparent",
            color: device === m.id ? "oklch(0.80 0.12 35)" : "oklch(0.55 0.03 85)",
            border: device === m.id ? "1px solid oklch(0.60 0.22 35 / 0.4)" : "1px solid transparent"
          },
          "data-ocid": `website-builder.device_${m.id}_toggle`,
          children: [
            m.icon,
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: m.label })
          ]
        },
        m.id
      ))
    }
  );
}
function PublishPanel({
  job,
  onPublished
}) {
  const [publishing, setPublishing] = reactExports.useState(false);
  const [publishErr, setPublishErr] = reactExports.useState(null);
  const [published, setPublished] = reactExports.useState(
    job.shareUrl ? {
      liveUrl: job.shareUrl,
      claimUrl: `https://here.now/claim?site=${encodeURIComponent(
        job.shareUrl.replace(/^https?:\/\//, "").split(".")[0]
      )}`
    } : null
  );
  const handlePublish = async () => {
    if (!job.htmlContent) return;
    setPublishing(true);
    setPublishErr(null);
    const slug = job.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    const subdomain = `${slug}-${job.id.slice(-6)}`;
    try {
      const site = await publishToHereNow(job.htmlContent, subdomain);
      setPublished(site);
      onPublished(site);
      ue.success(
        "Your site is live! Share the link with passengers & clients."
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Publishing failed. Try again.";
      setPublishErr(msg);
    } finally {
      setPublishing(false);
    }
  };
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => ue.success("Link copied to clipboard!"));
  };
  if (published) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "space-y-3 p-4 rounded-xl",
        style: {
          background: "oklch(0.55 0.14 145 / 0.08)",
          border: "1px solid oklch(0.55 0.14 145 / 0.25)"
        },
        "data-ocid": "website-builder.published_panel",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                style: { background: "oklch(0.55 0.14 145 / 0.20)" },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Globe,
                  {
                    className: "w-4 h-4",
                    style: { color: "oklch(0.55 0.14 145)" }
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "p",
                {
                  className: "text-sm font-semibold",
                  style: { color: "oklch(0.55 0.14 145)" },
                  children: "Your site is live! 🎉"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: "Free permanent hosting via here.now on Cloudflare's global network" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center gap-2 p-2.5 rounded-lg",
              style: { background: "oklch(0.12 0.01 85)" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "flex-1 text-xs font-mono truncate text-muted-foreground", children: published.liveUrl }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    className: "h-7 w-7 p-0 shrink-0",
                    onClick: () => handleCopy(published.liveUrl),
                    "aria-label": "Copy live URL",
                    "data-ocid": "website-builder.copy_link_button",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-3.5 h-3.5" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    className: "h-7 w-7 p-0 shrink-0",
                    onClick: () => window.open(published.liveUrl, "_blank"),
                    "aria-label": "Open live URL",
                    "data-ocid": "website-builder.open_live_button",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3.5 h-3.5" })
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "w-full gap-1.5 text-xs h-8",
              onClick: () => window.open(published.claimUrl, "_blank"),
              "data-ocid": "website-builder.claim_site_button",
              style: {
                borderColor: "oklch(0.55 0.14 145 / 0.40)",
                color: "oklch(0.55 0.14 145)"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "w-3.5 h-3.5" }),
                "Claim Your Site (make it yours permanently)"
              ]
            }
          )
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "space-y-2 p-3 rounded-xl",
      style: {
        background: "oklch(0.75 0.12 85 / 0.06)",
        border: "1px solid oklch(0.75 0.12 85 / 0.20)"
      },
      "data-ocid": "website-builder.publish_panel",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              style: { background: "oklch(0.75 0.12 85 / 0.15)" },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "w-4 h-4 text-primary" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "Publish your site for free" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-muted-foreground mt-0.5 leading-relaxed", children: [
              "Free permanent hosting via",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-primary", children: "here.now" }),
              " on Cloudflare's global network. Drivers can claim their site with one tap to own it permanently."
            ] })
          ] })
        ] }),
        publishErr && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-start gap-2 p-2.5 rounded-lg text-xs",
            style: {
              background: "oklch(0.52 0.20 20 / 0.10)",
              border: "1px solid oklch(0.52 0.20 20 / 0.25)",
              color: "oklch(0.52 0.20 20)"
            },
            "data-ocid": "website-builder.publish_error_state",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-3.5 h-3.5 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                publishErr,
                " — You can still",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    className: "underline font-semibold",
                    onClick: () => {
                      var _a;
                      return (_a = document.querySelector(
                        "[data-ocid='website-builder.download_button']"
                      )) == null ? void 0 : _a.click();
                    },
                    children: "download the HTML"
                  }
                ),
                " ",
                "and host it manually."
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            className: "w-full gap-2 h-10 font-semibold text-sm",
            onClick: handlePublish,
            disabled: publishing,
            "data-ocid": "website-builder.publish_button",
            style: {
              background: publishing ? void 0 : "linear-gradient(135deg, oklch(0.60 0.22 35) 0%, oklch(0.75 0.12 85) 100%)",
              color: "oklch(0.08 0.01 85)"
            },
            children: publishing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }),
              "Publishing to here.now…"
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "w-4 h-4" }),
              "Publish Live (Free)"
            ] })
          }
        ),
        publishing && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            className: "text-[10px] text-center",
            style: { color: "oklch(0.65 0.03 85)" },
            "data-ocid": "website-builder.publish_loading_state",
            children: "Uploading to Cloudflare's global network…"
          }
        )
      ]
    }
  );
}
function HistoryRow({
  job,
  index,
  onPreview
}) {
  const cfg = STATUS_CFG[job.status] ?? STATUS_CFG.failed;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50",
      "data-ocid": `website-builder.history_item.${index + 1}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "w-4 h-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground truncate", children: job.topic }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mt-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: fmtDate(job.createdAt) }),
            job.shareUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
                style: {
                  background: "oklch(0.55 0.14 145 / 0.15)",
                  color: "oklch(0.55 0.14 145)"
                },
                children: "Live on here.now"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: `${cfg.cls} flex items-center gap-1 shrink-0 text-xs`, children: [
          cfg.icon,
          cfg.label
        ] }),
        job.status === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "shrink-0 h-7 px-2 text-xs gap-1",
            onClick: () => onPreview(job),
            "data-ocid": `website-builder.history_preview_button.${index + 1}`,
            children: "View"
          }
        )
      ]
    }
  );
}
function ActiveJobPanel({
  job,
  onEmailSend,
  onRetry,
  onPublished,
  emailPending,
  iterationHistory
}) {
  const [device, setDevice] = reactExports.useState("mobile");
  const blobUrlRef = reactExports.useRef(null);
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
    navigator.clipboard.writeText(job.shareUrl).then(() => ue.success("Share link copied to clipboard!"));
  };
  const handleFullScreen = () => {
    if (!job.htmlContent) return;
    const blob = new Blob([job.htmlContent], { type: "text/html" });
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = URL.createObjectURL(blob);
    window.open(blobUrlRef.current, "_blank");
  };
  if (job.status === "pending" || job.status === "generating") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(GenerationProgress, {});
  }
  if (job.status === "failed") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "p-4 rounded-xl border space-y-3",
        style: {
          background: "oklch(0.52 0.20 20 / 0.08)",
          borderColor: "oklch(0.52 0.20 20 / 0.25)"
        },
        "data-ocid": "website-builder.error_state",
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground", children: "Nduna couldn't complete the website" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: job.errorMsg || "Something went wrong. Try again with a different description." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "gap-1.5 w-full",
              onClick: onRetry,
              "data-ocid": "website-builder.retry_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-3.5 h-3.5" }),
                "Try Again"
              ]
            }
          )
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", "data-ocid": "website-builder.ready_panel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-2 p-3 rounded-xl border",
        style: {
          background: "oklch(0.55 0.14 145 / 0.10)",
          borderColor: "oklch(0.55 0.14 145 / 0.25)"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CircleCheckBig,
            {
              className: "w-4 h-4 shrink-0",
              style: { color: "oklch(0.55 0.14 145)" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground flex-1", children: "Your website is ready!" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DeviceToggle, { device, onChange: setDevice })
        ]
      }
    ),
    iterationHistory.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex flex-wrap gap-1.5",
        "data-ocid": "website-builder.iteration_history",
        children: iterationHistory.map((inst) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: "text-[10px] px-2 py-0.5 rounded-full font-medium",
            style: {
              background: "oklch(0.75 0.12 85 / 0.12)",
              border: "1px solid oklch(0.75 0.12 85 / 0.25)",
              color: "oklch(0.75 0.12 85)"
            },
            children: [
              "✏️ ",
              inst
            ]
          },
          inst
        ))
      }
    ),
    job.htmlContent && /* @__PURE__ */ jsxRuntimeExports.jsx(
      SitePreview,
      {
        html: job.htmlContent,
        device,
        onFullScreen: handleFullScreen
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PublishPanel, { job, onPublished }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          className: "gap-1.5 text-sm",
          onClick: handleDownload,
          "data-ocid": "website-builder.download_button",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
            "Download HTML"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          className: "gap-1.5 text-sm",
          onClick: () => onEmailSend(job.id),
          disabled: emailPending,
          "data-ocid": "website-builder.email_button",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4" }),
            emailPending ? "Sending…" : "Send to Email"
          ]
        }
      )
    ] }),
    job.shareUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "col-span-2 flex items-center gap-2 p-3 rounded-xl",
        style: {
          background: "oklch(0.75 0.12 85 / 0.10)",
          border: "1px solid oklch(0.75 0.12 85 / 0.25)"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "w-4 h-4 shrink-0 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "flex-1 text-xs font-mono truncate text-muted-foreground", children: job.shareUrl }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "h-7 text-xs shrink-0",
              onClick: handleCopyLink,
              "data-ocid": "website-builder.copy_link_button",
              children: "Copy"
            }
          )
        ]
      }
    )
  ] });
}
function WebsiteBuilderPage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const ext = actor;
  const [topic, setTopic] = reactExports.useState(
    () => localStorage.getItem("wb_draft_topic") ?? ""
  );
  const [serviceType, setServiceType] = reactExports.useState("");
  const [iterationInstruction, setIterationInstruction] = reactExports.useState("");
  const [iterationHistory, setIterationHistory] = reactExports.useState([]);
  const [activeJobId, setActiveJobId] = reactExports.useState(null);
  const [previewJob, setPreviewJob] = reactExports.useState(null);
  const [previewDevice, setPreviewDevice] = reactExports.useState("mobile");
  reactExports.useEffect(() => {
    localStorage.setItem("wb_draft_topic", topic);
  }, [topic]);
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["websiteJobs"],
    queryFn: async () => {
      if (!(ext == null ? void 0 : ext.getWebsiteJobs)) return [];
      return ext.getWebsiteJobs();
    },
    enabled: !!actor
  });
  const { data: rateLimit } = useQuery({
    queryKey: ["websiteRateLimit"],
    queryFn: async () => {
      if (!(ext == null ? void 0 : ext.getWebsiteBuilderRateLimit)) return BigInt(DAILY_LIMIT);
      return ext.getWebsiteBuilderRateLimit();
    },
    enabled: !!actor
  });
  const todayCount = todayJobCount(jobs);
  const remainingToday = rateLimit != null ? Math.max(0, Number(rateLimit)) : Math.max(0, DAILY_LIMIT - todayCount);
  const rateLimited = remainingToday <= 0;
  const { data: activeJob } = useQuery({
    queryKey: ["websiteJob", activeJobId],
    queryFn: async () => {
      if (!activeJobId || !(ext == null ? void 0 : ext.getWebsiteJob)) return null;
      const result = await ext.getWebsiteJob(
        activeJobId
      );
      if (result.__kind__ === "None") return null;
      return result.value;
    },
    enabled: !!actor && !!activeJobId,
    refetchInterval: (data) => {
      const job = data.state.data;
      if (!job) return POLL_INTERVAL_MS;
      return job.status === "pending" || job.status === "generating" ? POLL_INTERVAL_MS : false;
    }
  });
  reactExports.useEffect(() => {
    if ((activeJob == null ? void 0 : activeJob.status) === "ready" || (activeJob == null ? void 0 : activeJob.status) === "failed") {
      queryClient.invalidateQueries({ queryKey: ["websiteJobs"] });
      queryClient.invalidateQueries({ queryKey: ["websiteRateLimit"] });
    }
  }, [activeJob == null ? void 0 : activeJob.status, queryClient]);
  const generateMut = useMutation({
    mutationFn: async (t) => {
      if (!(ext == null ? void 0 : ext.generateDriverWebsite))
        throw new Error("Feature not available yet");
      const result = await ext.generateDriverWebsite(
        t
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (job) => {
      setActiveJobId(job.id);
      setIterationHistory([]);
      setPreviewJob(null);
      ue.success("Nduna is designing your website…");
      queryClient.invalidateQueries({ queryKey: ["websiteJobs"] });
    },
    onError: (err) => ue.error(err.message || "Failed to start website generation.")
  });
  const iterateMut = useMutation({
    mutationFn: async ({
      jobId,
      instruction
    }) => {
      if (!(ext == null ? void 0 : ext.iterateDriverWebsite))
        throw new Error("Feature not available yet");
      const result = await ext.iterateDriverWebsite(
        jobId,
        instruction
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (job, variables) => {
      setActiveJobId(job.id);
      setIterationHistory((prev) => [...prev, variables.instruction]);
      setIterationInstruction("");
      ue.success("Nduna is updating your website…");
      queryClient.invalidateQueries({ queryKey: ["websiteJobs"] });
    },
    onError: (err) => ue.error(err.message || "Failed to refine website.")
  });
  const emailMut = useMutation({
    mutationFn: async (jobId) => {
      if (!(ext == null ? void 0 : ext.sendWebsiteByEmail))
        throw new Error("Email feature not available yet");
      const htmlContent = activeJob == null ? void 0 : activeJob.htmlContent;
      if (!htmlContent) throw new Error("Website HTML not available for email");
      const result = await ext.sendWebsiteByEmail(
        jobId,
        htmlContent
      );
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => ue.success("Website sent to your email via Nduna!"),
    onError: (err) => ue.error(err.message || "Failed to send email.")
  });
  const applyStylePreset = (preset) => {
    const base = topic.trim() || "professional driver";
    setTopic(`${base} — ${preset.direction}`);
  };
  const handleGenerate = () => {
    if (!topic.trim()) {
      ue.error("Please describe your service first.");
      return;
    }
    if (rateLimited) return;
    generateMut.mutate(topic.trim());
  };
  const handleIterate = () => {
    if (!iterationInstruction.trim() || !activeJobId) return;
    iterateMut.mutate({
      jobId: activeJobId,
      instruction: iterationInstruction.trim()
    });
  };
  const handleRetry = () => {
    setActiveJobId(null);
    setIterationHistory([]);
  };
  const handlePublished = (site) => {
    queryClient.setQueryData(
      ["websiteJob", activeJobId],
      (prev) => prev ? { ...prev, shareUrl: site.liveUrl } : prev
    );
    queryClient.setQueryData(
      ["websiteJobs"],
      (prev) => (prev == null ? void 0 : prev.map(
        (j) => j.id === activeJobId ? { ...j, shareUrl: site.liveUrl } : j
      )) ?? []
    );
  };
  const currentJob = activeJob ?? null;
  const isGenerating = generateMut.isPending;
  const isIterating = iterateMut.isPending;
  const showJobPanel = !!activeJobId && !!currentJob;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "rounded-2xl p-5 space-y-4",
        style: {
          background: "linear-gradient(135deg, oklch(0.60 0.22 35 / 0.20) 0%, oklch(0.75 0.12 85 / 0.12) 100%)",
          border: "1px solid oklch(0.60 0.22 35 / 0.35)"
        },
        "data-ocid": "website-builder.page",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: "https://i.imgur.com/u98U7S6.png",
                alt: "Nduna",
                className: "w-14 h-14 rounded-full object-cover border-2 shrink-0",
                style: { borderColor: "oklch(0.75 0.12 85 / 0.6)" }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "h1",
                  {
                    className: "text-xl font-display font-bold",
                    style: { color: "oklch(0.96 0.005 85)" },
                    children: "Driver Website Builder"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    className: "text-[10px] shrink-0",
                    style: {
                      background: "oklch(0.75 0.12 85 / 0.25)",
                      color: "oklch(0.90 0.08 85)",
                      border: "1px solid oklch(0.75 0.12 85 / 0.4)"
                    },
                    children: "Tier 3 Elite"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "p",
                {
                  className: "text-sm mt-1",
                  style: { color: "oklch(0.75 0.04 85)" },
                  children: [
                    "Powered by 4 stacked design skills — Nduna generates unforgettable, SA-branded websites. Free permanent hosting via",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: "font-semibold",
                        style: { color: "oklch(0.80 0.12 35)" },
                        children: "here.now"
                      }
                    )
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: SKILL_BADGES.map((skill) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              style: {
                background: `${skill.color.replace(")", " / 0.12)")}`,
                border: `1px solid ${skill.color.replace(")", " / 0.4)")}`,
                color: skill.color
              },
              children: skill.label
            },
            skill.label
          )) })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: remainingToday }),
        " ",
        "of",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: DAILY_LIMIT }),
        " ",
        "websites remaining today"
      ] }),
      rateLimited && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-destructive/15 text-destructive border-destructive/25 text-[10px]", children: "Daily limit reached" })
    ] }),
    rateLimited && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Card,
      {
        className: "p-4 border",
        style: {
          background: "oklch(0.52 0.20 20 / 0.08)",
          borderColor: "oklch(0.52 0.20 20 / 0.25)"
        },
        "data-ocid": "website-builder.rate_limit_card",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-5 h-5 text-destructive shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground", children: "Daily limit reached" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
              "You've generated your ",
              DAILY_LIMIT,
              " websites today. Come back tomorrow!"
            ] })
          ] })
        ] })
      }
    ),
    !showJobPanel && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", "data-ocid": "website-builder.input_section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "Service Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: serviceType, onValueChange: setServiceType, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectTrigger,
              {
                className: "h-9 text-sm",
                "data-ocid": "website-builder.service_type_select",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Choose a service type…" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: SERVICE_PRESETS.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s.value, children: s.label }, s.value)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "Style Preset" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: STYLE_PRESETS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => applyStylePreset(p),
              className: "text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all duration-150",
              style: {
                background: "oklch(0.60 0.22 35 / 0.08)",
                border: "1px solid oklch(0.60 0.22 35 / 0.30)",
                color: "oklch(0.75 0.10 35)"
              },
              "data-ocid": `website-builder.style_preset_button.${STYLE_PRESETS.indexOf(p) + 1}`,
              children: p.label
            },
            p.label
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Label,
          {
            htmlFor: "wb-topic",
            className: "text-sm font-semibold text-foreground",
            children: "Describe your driving service"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "wb-topic",
            value: topic,
            onChange: (e) => setTopic(e.target.value),
            placeholder: `e.g. "Professional luxury airport transfers in Sandton" or "Family-friendly Uber driver, 5 years experience, Durban"`,
            disabled: isGenerating || rateLimited,
            rows: 3,
            className: "text-base resize-none",
            "data-ocid": "website-builder.topic_input"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Be specific — mention your car type, favourite routes, city, or what makes you different" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          className: "w-full h-12 gap-2 text-base font-semibold",
          onClick: handleGenerate,
          disabled: isGenerating || !topic.trim() || rateLimited,
          "data-ocid": "website-builder.generate_button",
          children: isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-5 h-5 animate-spin" }),
            "Nduna is designing your website…"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-5 h-5" }),
            "Build My Website"
          ] })
        }
      )
    ] }),
    showJobPanel && currentJob && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-semibold text-foreground flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "w-4 h-4 text-primary" }),
          "Your Website"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "gap-1.5 text-xs h-7",
            onClick: handleRetry,
            "data-ocid": "website-builder.new_website_button",
            children: "New website"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ActiveJobPanel,
        {
          job: currentJob,
          onEmailSend: (id) => emailMut.mutate(id),
          onRetry: handleRetry,
          onPublished: handlePublished,
          emailPending: emailMut.isPending,
          iterationHistory
        }
      ),
      currentJob.status === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "space-y-3 p-4 rounded-xl",
          style: {
            background: "oklch(0.75 0.12 85 / 0.06)",
            border: "1px solid oklch(0.75 0.12 85 / 0.20)"
          },
          "data-ocid": "website-builder.iteration_section",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold text-foreground block", children: "Refine your website" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: ITERATION_CHIPS.map((chip) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setIterationInstruction(chip),
                className: "text-[11px] px-2.5 py-1 rounded-full font-medium transition-all duration-150",
                style: {
                  background: iterationInstruction === chip ? "oklch(0.75 0.12 85 / 0.20)" : "oklch(0.75 0.12 85 / 0.08)",
                  border: iterationInstruction === chip ? "1px solid oklch(0.75 0.12 85 / 0.5)" : "1px solid oklch(0.75 0.12 85 / 0.20)",
                  color: "oklch(0.80 0.10 85)"
                },
                "data-ocid": `website-builder.iteration_chip.${ITERATION_CHIPS.indexOf(chip) + 1}`,
                children: chip
              },
              chip
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                value: iterationInstruction,
                onChange: (e) => setIterationInstruction(e.target.value),
                placeholder: "e.g. 'make it more premium', 'add a services section', 'use darker colours'",
                disabled: isIterating,
                rows: 2,
                className: "text-sm resize-none",
                "data-ocid": "website-builder.iterate_input"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                className: "gap-1.5 w-full",
                onClick: handleIterate,
                disabled: isIterating || !iterationInstruction.trim(),
                "data-ocid": "website-builder.iterate_button",
                children: isIterating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3.5 h-3.5 animate-spin" }),
                  "Updating…"
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-3.5 h-3.5" }),
                  "Apply Changes"
                ] })
              }
            )
          ]
        }
      )
    ] }),
    previewJob && previewJob.status === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-semibold text-foreground truncate", children: [
          "Previewing: ",
          previewJob.topic
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            DeviceToggle,
            {
              device: previewDevice,
              onChange: setPreviewDevice
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "h-7 text-xs",
              onClick: () => setPreviewJob(null),
              "data-ocid": "website-builder.close_preview_button",
              children: "Close"
            }
          )
        ] })
      ] }),
      previewJob.htmlContent && /* @__PURE__ */ jsxRuntimeExports.jsx(
        SitePreview,
        {
          html: previewJob.htmlContent,
          device: previewDevice,
          onFullScreen: () => {
            const blob = new Blob([previewJob.htmlContent], {
              type: "text/html"
            });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", "data-ocid": "website-builder.history_section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-semibold text-foreground flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4 text-primary" }),
          "Previous Websites"
        ] }),
        jobs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          jobs.length,
          " site",
          jobs.length !== 1 ? "s" : ""
        ] })
      ] }),
      jobsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "space-y-2",
          "data-ocid": "website-builder.history_loading_state",
          children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-16 rounded-xl" }, i))
        }
      ) : jobs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Card,
        {
          className: "p-8 text-center bg-muted/10 border-dashed",
          "data-ocid": "website-builder.history_empty_state",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "w-7 h-7 text-primary" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-foreground mb-1", children: "No websites yet" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Describe your service above and Nduna will build a professional website for you — ready in seconds, published free via here.now." })
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
    ] })
  ] });
}
export {
  WebsiteBuilderPage as default
};
