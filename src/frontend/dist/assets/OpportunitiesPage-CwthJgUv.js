import { c as createLucideIcon, j as jsxRuntimeExports, X, an as ExternalLink, Y as Clock, B as Button, aU as Bot, aV as Cloud, aW as Search, q as Skeleton, u as useActor, n as useQueryClient, m as useQuery, o as useMutation, p as ue, r as reactExports, i as Badge, R as RefreshCw, aI as TrendingUp, aA as CircleAlert } from "./index-C-RLbQrs.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "m3 16 4 4 4-4", key: "1co6wj" }],
  ["path", { d: "M7 20V4", key: "1yoxec" }],
  ["path", { d: "m21 8-4-4-4 4", key: "1c9v7m" }],
  ["path", { d: "M17 4v16", key: "7dpous" }]
];
const ArrowDownUp = createLucideIcon("arrow-down-up", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2", key: "aa7l1z" }],
  ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2", key: "4qcy5o" }],
  ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2", key: "6vwrx8" }],
  ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2", key: "ioqczr" }]
];
const Scan = createLucideIcon("scan", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["rect", { width: "20", height: "8", x: "2", y: "2", rx: "2", ry: "2", key: "ngkwjq" }],
  ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2", ry: "2", key: "iecqi9" }],
  ["line", { x1: "6", x2: "6.01", y1: "6", y2: "6", key: "16zg32" }],
  ["line", { x1: "6", x2: "6.01", y1: "18", y2: "18", key: "nzw8ys" }]
];
const Server = createLucideIcon("server", __iconNode);
const CATEGORY_META = {
  newPlatform: {
    label: "New Platform",
    textClass: "text-[oklch(0.75_0.12_85)]",
    bgClass: "bg-[oklch(0.75_0.12_85/0.12)]",
    borderClass: "border-[oklch(0.75_0.12_85/0.35)]",
    emoji: "🚀"
  },
  intercityRoute: {
    label: "Route Opportunity",
    textClass: "text-[oklch(0.55_0.18_240)]",
    bgClass: "bg-[oklch(0.55_0.18_240/0.12)]",
    borderClass: "border-[oklch(0.55_0.18_240/0.35)]",
    emoji: "🛣️"
  },
  platformPromotion: {
    label: "Platform Promo",
    textClass: "text-burnt-orange",
    bgClass: "bg-[oklch(0.6_0.22_35/0.12)]",
    borderClass: "border-[oklch(0.6_0.22_35/0.35)]",
    emoji: "🔥"
  },
  incomeCategory: {
    label: "New Income",
    textClass: "text-success",
    bgClass: "bg-[oklch(0.55_0.14_145/0.12)]",
    borderClass: "border-[oklch(0.55_0.14_145/0.35)]",
    emoji: "💰"
  },
  businessLead: {
    label: "Business Lead",
    textClass: "text-[oklch(0.65_0.18_300)]",
    bgClass: "bg-[oklch(0.65_0.18_300/0.12)]",
    borderClass: "border-[oklch(0.65_0.18_300/0.35)]",
    emoji: "🏢"
  },
  regulatoryChange: {
    label: "Policy Update",
    textClass: "text-muted-foreground",
    bgClass: "bg-muted/30",
    borderClass: "border-border",
    emoji: "📋"
  }
};
const ACCENT_COLORS = {
  newPlatform: "oklch(0.75 0.12 85 / 0.6)",
  intercityRoute: "oklch(0.55 0.18 240 / 0.6)",
  platformPromotion: "oklch(0.6 0.22 35 / 0.6)",
  incomeCategory: "oklch(0.55 0.14 145 / 0.6)",
  businessLead: "oklch(0.65 0.18 300 / 0.6)",
  regulatoryChange: "oklch(0.55 0.04 85 / 0.4)"
};
function RelevanceBar({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  const colorClass = pct >= 75 ? "bg-[oklch(0.75_0.12_85)]" : pct >= 45 ? "bg-[oklch(0.6_0.22_35)]" : "bg-[oklch(0.55_0.14_145)]";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-1.5 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `h-full rounded-full transition-all duration-500 ${colorClass}`,
        style: { width: `${pct}%` },
        "aria-label": `Relevance score ${pct} out of 100`
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-muted-foreground tabular-nums w-8 text-right", children: pct })
  ] });
}
function ExpiryLabel({ expiresAt }) {
  const msLeft = Number(expiresAt) - Date.now();
  const daysLeft = Math.floor(msLeft / 864e5);
  if (daysLeft < 0) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive/80", children: "Expired" });
  if (daysLeft === 0)
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive/80", children: "Expires today" });
  if (daysLeft === 1)
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[oklch(0.6_0.22_35)]", children: "Expires tomorrow" });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
    "Expires in ",
    daysLeft,
    " days"
  ] });
}
function SourceBadge({ source }) {
  const lower = source.toLowerCase();
  if (lower.includes("browserbase") || lower === "browserbase") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Cloud, { className: "w-2.5 h-2.5" }),
      "Browserbase"
    ] });
  }
  if (lower.includes("tavily") || lower === "tavily") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "span",
      {
        className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
        style: {
          background: "oklch(0.6 0.22 35 / 0.10)",
          color: "oklch(0.55 0.20 35)",
          borderColor: "oklch(0.6 0.22 35 / 0.30)"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "w-2.5 h-2.5" }),
          "Tavily"
        ]
      }
    );
  }
  if (lower.includes("vps") || lower === "vps") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Server, { className: "w-2.5 h-2.5" }),
      "VPS Hunter"
    ] });
  }
  return null;
}
function OpportunityCard({
  finding,
  index,
  onDismiss,
  onAskNduna,
  isDismissing = false
}) {
  const meta = CATEGORY_META[finding.category];
  const score = Number(finding.relevanceScore);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "article",
    {
      className: `relative rounded-xl border bg-card shadow-card card-hover-lift animate-fade-up stagger-${Math.min(index + 1, 6)} overflow-hidden`,
      "data-ocid": `opportunity.item.${index + 1}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
            style: { background: ACCENT_COLORS[finding.category] },
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pl-5 pr-4 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${meta.textClass} ${meta.bgClass} ${meta.borderClass}`,
                "data-ocid": `opportunity.category_badge.${index + 1}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: meta.emoji }),
                  meta.label
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => onDismiss(finding.id),
                disabled: isDismissing,
                className: "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40",
                "aria-label": "Dismiss opportunity",
                "data-ocid": `opportunity.dismiss_button.${index + 1}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3.5 h-3.5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-foreground text-base leading-tight mb-1.5 pr-2", children: finding.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3", children: finding.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", children: "Relevance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(RelevanceBar, { score })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[11px] text-muted-foreground min-w-0 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SourceBadge, { source: finding.source }),
              finding.source.startsWith("http") ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: finding.source,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "flex items-center gap-1 hover:text-primary transition-colors truncate max-w-[120px]",
                  "data-ocid": `opportunity.source_link.${index + 1}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3 flex-shrink-0" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: "Source" })
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 truncate max-w-[120px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3 flex-shrink-0 opacity-50" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: finding.source || "Nduna scan" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-3 h-3 flex-shrink-0 opacity-60" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExpiryLabel, { expiresAt: finding.expiresAt })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                className: "border-primary/30 text-primary hover:bg-primary/10 text-xs gap-1.5 h-7 flex-shrink-0",
                onClick: () => onAskNduna(finding),
                "data-ocid": `opportunity.ask_nduna_button.${index + 1}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "w-3 h-3" }),
                  "Ask Nduna"
                ]
              }
            )
          ] })
        ] })
      ]
    }
  );
}
function CardSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card p-4 space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-28 rounded-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-6 rounded-lg" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-3/4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-5/6" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-7 w-28 rounded-md" })
    ] })
  ] });
}
function CategoryGroupHeader({ category }) {
  const meta = CATEGORY_META[category];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 pt-2 pb-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base", "aria-hidden": "true", children: meta.emoji }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "h4",
      {
        className: `text-xs font-bold uppercase tracking-wider ${meta.textClass}`,
        children: meta.label
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-border/50" })
  ] });
}
function sortFindings(findings, sort) {
  return [...findings].sort(
    (a, b) => sort === "relevance" ? Number(b.relevanceScore) - Number(a.relevanceScore) : Number(b.discoveredAt) - Number(a.discoveredAt)
  );
}
const CATEGORY_ORDER = [
  "newPlatform",
  "platformPromotion",
  "incomeCategory",
  "intercityRoute",
  "businessLead",
  "regulatoryChange"
];
function OpportunityList({
  findings,
  isLoading,
  filter,
  sort,
  onDismiss,
  onAskNduna,
  dismissingId
}) {
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", "data-ocid": "opportunity.loading_state", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(CardSkeleton, {}, i)) });
  }
  const active = findings.filter((f) => !f.dismissed);
  const filtered = filter === "all" ? active : active.filter((f) => f.category === filter);
  const sorted = sortFindings(filtered, sort);
  if (sorted.length === 0) {
    return null;
  }
  if (filter === "all") {
    const groups = {};
    for (const f of sorted) {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    }
    let globalIndex = 0;
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", "data-ocid": "opportunity.list", children: CATEGORY_ORDER.filter((cat) => {
      var _a;
      return (_a = groups[cat]) == null ? void 0 : _a.length;
    }).map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CategoryGroupHeader, { category: cat }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: groups[cat].map((finding) => {
        const idx = globalIndex++;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          OpportunityCard,
          {
            finding,
            index: idx,
            onDismiss,
            onAskNduna,
            isDismissing: dismissingId === finding.id
          },
          finding.id
        );
      }) })
    ] }, cat)) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", "data-ocid": "opportunity.list", children: sorted.map((finding, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    OpportunityCard,
    {
      finding,
      index: idx,
      onDismiss,
      onAskNduna,
      isDismissing: dismissingId === finding.id
    },
    finding.id
  )) });
}
const FINDINGS_KEY = ["opportunities"];
const STATUS_KEY = ["opportunityHunterStatus"];
const BROWSERBASE_CONFIGURED_KEY = ["isBrowserbaseConfigured"];
function mapFinding(r) {
  return {
    id: r.id,
    driverId: r.driverId,
    category: r.category,
    title: r.title,
    description: r.description,
    relevanceScore: r.relevanceScore,
    source: r.source,
    discoveredAt: r.discoveredAt,
    expiresAt: r.expiresAt,
    dismissed: r.dismissed
  };
}
function useOpportunities(limit = 50) {
  const { actor, isFetching: actorFetching } = useActor();
  const qc = useQueryClient();
  const {
    data: findings = [],
    isLoading,
    error
  } = useQuery({
    queryKey: [...FINDINGS_KEY, limit],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.getDriverOpportunities(BigInt(limit));
      return raw.map(mapFinding);
    },
    enabled: !!actor && !actorFetching
  });
  const { data: hunterStatus } = useQuery({
    queryKey: STATUS_KEY,
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      const s = await actor.getOpportunityHunterStatus();
      return {
        configured: s.configured,
        lastRun: BigInt(s.lastRun),
        lastError: s.lastError
      };
    },
    enabled: !!actor && !actorFetching,
    staleTime: 6e4
  });
  const dismissMut = useMutation({
    mutationFn: async (findingId) => {
      if (!actor) throw new Error("Not connected");
      await actor.dismissOpportunity(findingId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINDINGS_KEY });
      ue.success("Opportunity dismissed.");
    },
    onError: (err) => ue.error(err.message || "Failed to dismiss.")
  });
  const triggerHuntMut = useMutation({
    mutationFn: async (driverId) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.triggerOpportunityHunt(driverId);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINDINGS_KEY });
      qc.invalidateQueries({ queryKey: STATUS_KEY });
    }
  });
  return {
    findings,
    isLoading: isLoading || actorFetching,
    error,
    hunterStatus,
    dismissOpportunity: dismissMut.mutateAsync,
    isDismissing: dismissMut.isPending,
    dismissingId: dismissMut.variables,
    triggerHunt: triggerHuntMut.mutateAsync,
    isHunting: triggerHuntMut.isPending
  };
}
function useIsBrowserbaseConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: [...BROWSERBASE_CONFIGURED_KEY],
    queryFn: async () => {
      if (!actor) return false;
      const ext = actor;
      if (!ext.isBrowserbaseConfigured) return false;
      return ext.isBrowserbaseConfigured();
    },
    enabled: !!actor && !isFetching,
    staleTime: 3e4
  });
}
function useTriggerBrowserbaseHunt() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (driverPrincipal) => {
      if (!actor) throw new Error("Not connected");
      const ext = actor;
      if (!ext.triggerBrowserbaseHunt)
        throw new Error("triggerBrowserbaseHunt not available");
      const result = await ext.triggerBrowserbaseHunt(driverPrincipal);
      if (result.__kind__ === "err")
        throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINDINGS_KEY });
      qc.invalidateQueries({ queryKey: STATUS_KEY });
    },
    onError: (err) => ue.error(err.message || "Cloud hunt failed.")
  });
}
const FILTERS = [
  { value: "all", label: "All" },
  { value: "newPlatform", label: "Platforms" },
  { value: "intercityRoute", label: "Routes" },
  { value: "platformPromotion", label: "Promos" },
  { value: "incomeCategory", label: "Income" },
  { value: "businessLead", label: "Businesses" },
  { value: "regulatoryChange", label: "Policy" }
];
function formatRelativeTime(timestampMs) {
  if (!timestampMs) return "Never";
  const diff = Date.now() - timestampMs;
  const minutes = Math.floor(diff / 6e4);
  const hours = Math.floor(diff / 36e5);
  const days = Math.floor(diff / 864e5);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
function StatusBar({
  lastRun,
  isConfigured,
  isBrowserbaseConfigured,
  isTriggerPending,
  isCloudHuntPending,
  isAdmin,
  onTrigger,
  onCloudHunt
}) {
  const lastRunMs = Number(lastRun);
  const nextRunLabel = lastRunMs ? (() => {
    const next = lastRunMs + 7 * 864e5;
    const diffDays = Math.ceil((next - Date.now()) / 864e5);
    return diffDays <= 0 ? "Overdue" : `In ${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  })() : "Not yet scheduled";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "rounded-xl border bg-card px-4 py-3 shadow-card space-y-3",
      "data-ocid": "opportunity.status_bar",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `w-2 h-2 rounded-full ${isConfigured ? "bg-[oklch(0.55_0.14_145)] animate-pulse" : "bg-muted-foreground/40"}`,
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
              "VPS Hunter:",
              " ",
              lastRunMs > 0 ? formatRelativeTime(lastRunMs) : "not yet run"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `w-2 h-2 rounded-full ${isBrowserbaseConfigured ? "bg-blue-400 animate-pulse" : "bg-muted-foreground/40"}`,
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
              "Browserbase: ",
              isBrowserbaseConfigured ? "ready" : "not configured"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto text-[11px]", children: [
            "Next:",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-medium", children: nextRunLabel })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "sm",
              variant: "outline",
              className: "border-primary/30 text-primary hover:bg-primary/10 gap-1.5 text-xs h-8",
              onClick: onTrigger,
              disabled: !isConfigured || isTriggerPending,
              title: !isConfigured ? "VPS must be configured in Settings to run a manual scan" : void 0,
              "data-ocid": "opportunity.manual_scan_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Scan,
                  {
                    className: `w-3.5 h-3.5 ${isTriggerPending ? "animate-spin" : ""}`
                  }
                ),
                isTriggerPending ? "Scanning..." : "Manual Scan"
              ]
            }
          ),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "sm",
              variant: "outline",
              className: "border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-1.5 text-xs h-8",
              onClick: onCloudHunt,
              disabled: !isBrowserbaseConfigured || isCloudHuntPending,
              title: !isBrowserbaseConfigured ? "Configure Browserbase in Settings to enable cloud hunting" : void 0,
              "data-ocid": "opportunity.cloud_hunt_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Cloud,
                  {
                    className: `w-3.5 h-3.5 ${isCloudHuntPending ? "animate-pulse" : ""}`
                  }
                ),
                isCloudHuntPending ? "Nduna is browsing the web via Browserbase..." : "Cloud Hunt"
              ]
            }
          ),
          isAdmin && !isBrowserbaseConfigured && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground self-center", children: "Configure Browserbase in Settings to enable cloud hunting" })
        ] })
      ]
    }
  );
}
function TierUpgradePrompt({ onSettings }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "flex flex-col items-center justify-center min-h-[60vh] px-4 text-center",
      "data-ocid": "opportunity.tier_gate",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card rounded-2xl shadow-card p-10 max-w-md w-full border border-primary/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: "https://i.imgur.com/u98U7S6.png",
            alt: "Nduna",
            className: "w-10 h-10 rounded-full object-cover"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-display font-bold text-foreground mb-2", children: "Opportunity Intel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground mb-1 text-sm", children: [
          "Nduna's autonomous market scanner is a",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary font-semibold", children: "Tier 3 feature" }),
          "."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground mb-6 text-sm", children: [
          "Upgrade to",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "Pro Elite (R800/month)" }),
          " ",
          "and Nduna will scan the market every week to surface income opportunities you'd otherwise miss."
        ] }),
        onSettings && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: onSettings,
            className: "w-full",
            "data-ocid": "opportunity.upgrade_button",
            children: "View Plans & Upgrade"
          }
        )
      ] })
    }
  );
}
function EmptyNoVPS() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col items-center justify-center gap-4 py-14 text-center",
      "data-ocid": "opportunity.empty_state",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-muted/30 border border-border flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Server, { className: "w-7 h-7 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-foreground mb-1", children: "VPS Not Configured" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground max-w-xs", children: "Nduna's weekly scan requires a VPS to be configured — ask your admin to set it up in Settings. Alternatively, use Cloud Hunt to scan via Browserbase." })
        ] })
      ]
    }
  );
}
function EmptyNoFindings() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col items-center justify-center gap-4 py-14 text-center",
      "data-ocid": "opportunity.empty_state",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-7 h-7 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-foreground mb-1", children: "No opportunities found yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground max-w-xs", children: "The first scan runs weekly — check back soon. You can also trigger a manual scan or Cloud Hunt above." })
        ] })
      ]
    }
  );
}
function EmptyFiltered({ filter }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col items-center justify-center gap-3 py-10 text-center",
      "data-ocid": "opportunity.empty_state",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-8 h-8 text-muted-foreground/50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "No ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-medium", children: filter }),
          " ",
          "opportunities right now."
        ] })
      ]
    }
  );
}
function OpportunitiesPage({
  profile: _profile,
  tier,
  isAdmin = false,
  onNavigateToAI,
  onSettings
}) {
  const effectiveTier = isAdmin ? 3 : tier;
  const [filter, setFilter] = reactExports.useState("all");
  const [sort, setSort] = reactExports.useState("relevance");
  const [dismissingId, setDismissingId] = reactExports.useState();
  const {
    findings,
    isLoading,
    hunterStatus,
    dismissOpportunity,
    triggerHunt,
    isHunting
  } = useOpportunities(50);
  const { data: isBrowserbaseConfigured = false } = useIsBrowserbaseConfigured();
  const triggerBrowserbaseHunt = useTriggerBrowserbaseHunt();
  if (effectiveTier < 3) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(TierUpgradePrompt, { onSettings });
  }
  const isConfigured = (hunterStatus == null ? void 0 : hunterStatus.configured) ?? false;
  const lastRun = (hunterStatus == null ? void 0 : hunterStatus.lastRun) ?? BigInt(0);
  const handleTrigger = async () => {
    try {
      const msg = await triggerHunt("driver");
      ue.success(
        msg || "Opportunity scan started — check back in a moment."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      ue.error(message);
    }
  };
  const handleCloudHunt = async () => {
    try {
      const msg = await triggerBrowserbaseHunt.mutateAsync("driver");
      ue.success(
        msg || "Browserbase cloud hunt started — Nduna is browsing now."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cloud hunt failed";
      ue.error(message);
    }
  };
  const handleDismiss = async (id) => {
    setDismissingId(id);
    try {
      await dismissOpportunity(id);
      ue.success("Opportunity dismissed");
    } catch {
      ue.error("Failed to dismiss");
    } finally {
      setDismissingId(void 0);
    }
  };
  const handleAskNduna = (finding) => {
    const query = `Tell me more about this opportunity: "${finding.title}". ${finding.description}`;
    if (onNavigateToAI) {
      onNavigateToAI(query);
    } else {
      ue.info("Open Nduna from the navigation to explore this opportunity.");
    }
  };
  const activeFindings = findings.filter((f) => !f.dismissed);
  const filteredCount = filter === "all" ? activeFindings.length : activeFindings.filter((f) => f.category === filter).length;
  const showEmptyNoVPS = !isLoading && !isConfigured && !isBrowserbaseConfigured && activeFindings.length === 0;
  const showEmptyNoFindings = !isLoading && (isConfigured || isBrowserbaseConfigured) && activeFindings.length === 0;
  const showEmptyFiltered = !isLoading && filter !== "all" && activeFindings.length > 0 && filteredCount === 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "max-w-2xl mx-auto px-4 py-6 space-y-5",
      "data-ocid": "opportunity.page",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: "https://i.imgur.com/u98U7S6.png",
              alt: "Nduna",
              className: "w-10 h-10 rounded-full object-cover border border-primary/30 flex-shrink-0 mt-0.5"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-bold text-2xl text-foreground leading-tight", children: "Opportunity Intel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "Nduna scans the market every week to find what you might be missing" })
          ] }),
          !isLoading && activeFindings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "secondary",
              className: "flex-shrink-0 bg-primary/10 text-primary border-primary/30 font-bold",
              children: activeFindings.length
            }
          )
        ] }),
        isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-28 w-full rounded-xl" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatusBar,
          {
            lastRun,
            isConfigured,
            isBrowserbaseConfigured,
            isTriggerPending: isHunting,
            isCloudHuntPending: triggerBrowserbaseHunt.isPending,
            isAdmin,
            onTrigger: handleTrigger,
            onCloudHunt: handleCloudHunt
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", "data-ocid": "opportunity.filters", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center gap-1.5 overflow-x-auto pb-1", children: FILTERS.map((f) => {
            const count = f.value === "all" ? activeFindings.length : activeFindings.filter((x) => x.category === f.value).length;
            const isActive = filter === f.value;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setFilter(f.value),
                className: `flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border ${isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"}`,
                "aria-pressed": isActive,
                "data-ocid": `opportunity.filter.${f.value}`,
                children: [
                  f.label,
                  count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `text-[10px] font-bold tabular-nums ${isActive ? "opacity-80" : "opacity-60"}`,
                      children: count
                    }
                  )
                ]
              },
              f.value
            );
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setSort((s) => s === "relevance" ? "recent" : "relevance"),
              className: "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all",
              "data-ocid": "opportunity.sort_toggle",
              title: `Sort by: ${sort === "relevance" ? "Relevance" : "Most Recent"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownUp, { className: "w-3 h-3" }),
                sort === "relevance" ? "Relevance" : "Recent"
              ]
            }
          )
        ] }),
        showEmptyNoVPS && /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyNoVPS, {}),
        showEmptyNoFindings && /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyNoFindings, {}),
        showEmptyFiltered && /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyFiltered, { filter }),
        !showEmptyNoVPS && !showEmptyNoFindings && /* @__PURE__ */ jsxRuntimeExports.jsx(
          OpportunityList,
          {
            findings,
            isLoading,
            filter,
            sort,
            onDismiss: handleDismiss,
            onAskNduna: handleAskNduna,
            dismissingId
          }
        ),
        !isLoading && activeFindings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground text-center pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-3 h-3 inline mr-1 opacity-60" }),
          "Findings are ranked by relevance to your driving patterns. Dismissed findings are hidden, not deleted."
        ] })
      ]
    }
  );
}
export {
  OpportunitiesPage as default
};
