/**
 * XPostingPanel.tsx — Nduna's X (Twitter) posting module. Admin-only.
 * Layer 4: Nduna earns $100/month from 0xWork → funds his own X account → posts autonomously.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Heart,
  Info,
  Loader2,
  MessageCircle,
  RefreshCw,
  Repeat2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { XPostType } from "../../backend.d";
import type { XPost } from "./useXPosting";
import {
  useSaveXApiKeys,
  useSyncXMetrics,
  useTriggerXPost,
  useXPostingConfig,
  useXPostingStatus,
  useXPosts,
} from "./useXPosting";

// ─── Constants ─────────────────────────────────────────────────────────────────

const POST_TYPE_CONFIG: {
  type: XPostType;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    type: XPostType.DriverWin,
    label: "Driver Win",
    emoji: "🏆",
    color: "oklch(0.40 0.10 85)",
    bg: "oklch(0.75 0.12 85 / 0.12)",
    border: "oklch(0.75 0.12 85 / 0.35)",
  },
  {
    type: XPostType.SAIntelligence,
    label: "SA Intel",
    emoji: "📊",
    color: "oklch(0.40 0.14 240)",
    bg: "oklch(0.55 0.14 240 / 0.10)",
    border: "oklch(0.55 0.14 240 / 0.30)",
  },
  {
    type: XPostType.IncomeTip,
    label: "Income Tip",
    emoji: "💡",
    color: "oklch(0.45 0.18 35)",
    bg: "oklch(0.55 0.18 35 / 0.10)",
    border: "oklch(0.55 0.18 35 / 0.30)",
  },
  {
    type: XPostType.TaskOutcome,
    label: "Task Outcome",
    emoji: "🤖",
    color: "oklch(0.40 0.14 300)",
    bg: "oklch(0.55 0.14 300 / 0.10)",
    border: "oklch(0.55 0.14 300 / 0.30)",
  },
];

const STATUS_BADGE: Record<XPost["status"], { label: string; cls: string }> = {
  posted: {
    label: "Posted",
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  failed: {
    label: "Failed",
    cls: "bg-destructive/15 text-destructive border-destructive/30",
  },
  scheduled: {
    label: "Scheduled",
    cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function CircularProgress({ pct }: { pct: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 88 88"
        role="img"
        aria-label={`${pct}% of earnings goal reached`}
      >
        <title>{pct}% of X fund earnings goal reached</title>
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="oklch(0.75 0.12 85 / 0.2)"
          strokeWidth="8"
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="url(#xfund-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="xfund-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.52 0.20 35)" />
            <stop offset="100%" stopColor="oklch(0.65 0.18 85)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-bold text-lg leading-none"
          style={{ color: "oklch(0.35 0.14 35)" }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: XPost }) {
  const typeCfg = POST_TYPE_CONFIG.find((c) => c.type === post.postType);
  const statusCfg = STATUS_BADGE[post.status];

  const postedDate = post.postedAt
    ? new Date(Number(post.postedAt) / 1_000_000).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{
        background: "oklch(0.97 0.03 85 / 0.4)",
        border: "1px solid oklch(0.75 0.12 85 / 0.25)",
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {typeCfg && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: typeCfg.bg,
              color: typeCfg.color,
              border: `1px solid ${typeCfg.border}`,
            }}
          >
            {typeCfg.emoji} {typeCfg.label}
          </span>
        )}
        <Badge variant="outline" className={`text-[10px] ${statusCfg.cls}`}>
          {statusCfg.label}
        </Badge>
        {postedDate && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {postedDate}
          </span>
        )}
      </div>

      <p className="text-xs text-foreground leading-relaxed line-clamp-3">
        {post.content}
      </p>

      <div className="flex items-center gap-4 pt-0.5">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Heart className="w-3 h-3" /> {post.likesCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Repeat2 className="w-3 h-3" /> {post.retweetsCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MessageCircle className="w-3 h-3" />{" "}
          {post.repliesCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
          👁️ {post.impressionsCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface XPostingPanelProps {
  compact?: boolean; // true = only threshold card + API keys section (for Settings page)
}

export function XPostingPanel({ compact = false }: XPostingPanelProps) {
  const { data: status, isLoading: statusLoading } = useXPostingStatus();
  const { data: config } = useXPostingConfig();
  const [postsPage, setPostsPage] = useState(0);
  const POSTS_PER_PAGE = 10;
  const { data: postsData } = useXPosts(
    POSTS_PER_PAGE,
    postsPage * POSTS_PER_PAGE,
  );
  const posts: XPost[] = postsData ?? [];

  const triggerPost = useTriggerXPost();
  const syncMetrics = useSyncXMetrics();
  const saveKeys = useSaveXApiKeys();

  // API keys form state
  const [keysExpanded, setKeysExpanded] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [keyForm, setKeyForm] = useState({
    xApiKey: "",
    xApiSecret: "",
    xAccessToken: "",
    xAccessTokenSecret: "",
  });
  const [activePostType, setActivePostType] = useState<XPostType | null>(null);

  // Sync form with loaded config (masked values from backend)
  useEffect(() => {
    if (config) {
      setKeyForm({
        xApiKey: config.xApiKey || "",
        xApiSecret: config.xApiSecret || "",
        xAccessToken: config.xAccessToken || "",
        xAccessTokenSecret: config.xAccessTokenSecret || "",
      });
    }
  }, [config]);

  const isUnlocked = status?.isUnlocked ?? false;
  const progressPct = status?.progressPct ?? 0;
  const earningsUSD = (status?.earningsCents ?? 0) / 100;
  const thresholdUSD = (status?.thresholdCents ?? 10000) / 100;
  const totalPosts = status?.totalPosts ?? 0;

  const handleTriggerPost = (type: XPostType) => {
    setActivePostType(type);
    triggerPost.mutate(type, {
      onSettled: () => setActivePostType(null),
    });
  };

  const handleSaveKeys = () => {
    if (
      !keyForm.xApiKey ||
      !keyForm.xApiSecret ||
      !keyForm.xAccessToken ||
      !keyForm.xAccessTokenSecret
    ) {
      return;
    }
    saveKeys.mutate(keyForm);
  };

  return (
    <div className="space-y-4 pt-1" data-ocid="settings.admin.x_posting.panel">
      {/* ── 1. Earnings Threshold Card ──────────────────────────────────────── */}
      <div
        className="rounded-xl p-4"
        style={{
          background: isUnlocked
            ? "oklch(0.75 0.12 85 / 0.12)"
            : "oklch(0.55 0.18 35 / 0.05)",
          border: isUnlocked
            ? "1px solid oklch(0.75 0.12 85 / 0.35)"
            : "1px solid oklch(0.55 0.18 35 / 0.20)",
        }}
        data-ocid="settings.admin.x_posting.threshold_card"
      >
        <div className="flex items-center gap-4">
          {statusLoading ? (
            <div
              className="w-24 h-24 rounded-full bg-muted/30 animate-pulse shrink-0"
              aria-label="Loading progress"
            />
          ) : (
            <CircularProgress pct={progressPct} />
          )}

          <div className="flex-1 min-w-0 space-y-1.5">
            <p
              className="text-sm font-display font-bold"
              style={{ color: "oklch(0.25 0.10 35)" }}
            >
              Nduna's X Posting Fund
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When Nduna earns <strong>${thresholdUSD.toFixed(0)}/month</strong>{" "}
              from 0xWork + Uphive, he funds his own X account and starts
              posting automatically.
            </p>

            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span
                className="text-xs font-bold"
                style={{ color: "oklch(0.35 0.18 35)" }}
              >
                ${earningsUSD.toFixed(2)} earned this month
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.40 0.14 240 / 0.12)",
                  color: "oklch(0.40 0.12 240)",
                  border: "1px solid oklch(0.40 0.14 240 / 0.25)",
                }}
              >
                USDC
              </span>
            </div>

            {isUnlocked ? (
              <div
                className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-2.5 py-1"
                style={{
                  background: "oklch(0.75 0.12 85 / 0.20)",
                  color: "oklch(0.35 0.10 65)",
                  border: "1px solid oklch(0.75 0.12 85 / 0.40)",
                }}
                data-ocid="settings.admin.x_posting.unlocked_badge"
              >
                ✅ Unlocked — Nduna is posting
              </div>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1"
                style={{
                  background: "oklch(0.90 0.02 85 / 0.5)",
                  color: "oklch(0.50 0.06 85)",
                  border: "1px solid oklch(0.75 0.08 85 / 0.30)",
                }}
                data-ocid="settings.admin.x_posting.locked_badge"
              >
                🔒 Locked — keep earning
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Nduna's hustling on 0xWork. When he's earned enough, he goes live on X
          — fully self-funded.
        </p>
      </div>

      {/* ── 2. X API Keys (collapsible, only show when unlocked) ─────────────── */}
      {isUnlocked && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid oklch(0.75 0.12 85 / 0.35)" }}
          data-ocid="settings.admin.x_posting.api_keys.section"
        >
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/20"
            onClick={() => setKeysExpanded((v) => !v)}
            data-ocid="settings.admin.x_posting.api_keys.toggle"
          >
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold"
                style={{ color: "oklch(0.30 0.10 35)" }}
              >
                X API Credentials
              </span>
            </div>
            {keysExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {keysExpanded && (
            <div
              className="px-4 pb-4 space-y-3 border-t"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.25)" }}
            >
              <div className="flex items-center justify-between pt-3">
                <p className="text-[11px] text-muted-foreground">
                  Get these from{" "}
                  <a
                    href="https://developer.twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline"
                    style={{ color: "oklch(0.45 0.18 35)" }}
                  >
                    developer.twitter.com
                  </a>{" "}
                  → Your App → Keys and Tokens
                </p>
                <button
                  type="button"
                  onClick={() => setShowKeys((v) => !v)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showKeys ? "Hide keys" : "Show keys"}
                >
                  {showKeys ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {(
                [
                  "xApiKey",
                  "xApiSecret",
                  "xAccessToken",
                  "xAccessTokenSecret",
                ] as const
              ).map((field) => {
                const labels: Record<typeof field, string> = {
                  xApiKey: "API Key",
                  xApiSecret: "API Secret",
                  xAccessToken: "Access Token",
                  xAccessTokenSecret: "Access Token Secret",
                };
                return (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {labels[field]}
                    </Label>
                    <Input
                      type={showKeys ? "text" : "password"}
                      placeholder="••••••••••••••••"
                      value={keyForm[field]}
                      onChange={(e) =>
                        setKeyForm((f) => ({ ...f, [field]: e.target.value }))
                      }
                      className="text-xs font-mono"
                      data-ocid={`settings.admin.x_posting.${field}_input`}
                    />
                  </div>
                );
              })}

              <Button
                className="w-full gap-2 mt-1"
                onClick={handleSaveKeys}
                disabled={
                  saveKeys.isPending ||
                  !keyForm.xApiKey ||
                  !keyForm.xApiSecret ||
                  !keyForm.xAccessToken ||
                  !keyForm.xAccessTokenSecret
                }
                style={
                  !saveKeys.isPending
                    ? {
                        background:
                          "linear-gradient(135deg, oklch(0.52 0.20 35), oklch(0.45 0.18 45))",
                        color: "white",
                        border: "none",
                      }
                    : {}
                }
                data-ocid="settings.admin.x_posting.save_keys_button"
              >
                {saveKeys.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Keys"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── 3. Trigger a Post (only when unlocked, not compact) ──────────────── */}
      {isUnlocked && !compact && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            background: "oklch(0.55 0.18 35 / 0.04)",
            border: "1px solid oklch(0.55 0.18 35 / 0.18)",
          }}
          data-ocid="settings.admin.x_posting.trigger.section"
        >
          <p
            className="text-sm font-display font-semibold"
            style={{ color: "oklch(0.25 0.10 35)" }}
          >
            Trigger a Post
          </p>
          <div className="grid grid-cols-2 gap-2">
            {POST_TYPE_CONFIG.map((cfg) => {
              const isActive =
                activePostType === cfg.type && triggerPost.isPending;
              return (
                <button
                  key={cfg.type}
                  type="button"
                  onClick={() => handleTriggerPost(cfg.type)}
                  disabled={triggerPost.isPending}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                  }}
                  data-ocid={`settings.admin.x_posting.trigger.${cfg.type.toLowerCase()}_button`}
                >
                  {isActive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  ) : (
                    <span className="text-base leading-none shrink-0">
                      {cfg.emoji}
                    </span>
                  )}
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. Posts Feed (only when posts exist, not compact) ───────────────── */}
      {!compact && totalPosts > 0 && (
        <div
          className="space-y-3"
          data-ocid="settings.admin.x_posting.posts_feed"
        >
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-sm font-display font-semibold"
              style={{ color: "oklch(0.25 0.10 35)" }}
            >
              Nduna's X Posts
            </p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-7"
              onClick={() => syncMetrics.mutate()}
              disabled={syncMetrics.isPending}
              data-ocid="settings.admin.x_posting.sync_metrics_button"
            >
              {syncMetrics.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Sync Metrics
            </Button>
          </div>

          {posts.length === 0 ? (
            <div
              className="text-center py-6 rounded-xl"
              style={{
                background: "oklch(0.94 0.04 85 / 0.4)",
                border: "1px solid oklch(0.75 0.12 85 / 0.25)",
              }}
              data-ocid="settings.admin.x_posting.posts.empty_state"
            >
              <p className="text-xs text-muted-foreground">
                No posts yet — trigger one above.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {posts.map((post, idx) => (
                  <div
                    key={post.id}
                    data-ocid={`settings.admin.x_posting.post.${idx + 1}`}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPosts > POSTS_PER_PAGE && (
                <div className="flex items-center justify-between pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setPostsPage((p) => Math.max(0, p - 1))}
                    disabled={postsPage === 0}
                    data-ocid="settings.admin.x_posting.pagination_prev"
                  >
                    ← Prev
                  </Button>
                  <span className="text-[11px] text-muted-foreground">
                    Page {postsPage + 1}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setPostsPage((p) => p + 1)}
                    disabled={(postsPage + 1) * POSTS_PER_PAGE >= totalPosts}
                    data-ocid="settings.admin.x_posting.pagination_next"
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── 5. Info footer ──────────────────────────────────────────────────── */}
      <div
        className="flex items-start gap-2 text-[11px] rounded-lg px-3 py-2"
        style={{
          color: "oklch(0.50 0.18 35)",
          backgroundColor: "oklch(0.94 0.06 85 / 0.5)",
        }}
      >
        {isUnlocked ? (
          <>
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              0xWork earnings sync automatically updates Nduna's X Fund balance
              every time you check task status.
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              0xWork earnings sync automatically updates Nduna's X Fund balance
              every time you check task status.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
