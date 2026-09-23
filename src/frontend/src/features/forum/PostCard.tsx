/**
 * PostCard.tsx — Single post card for eTavern community forum.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ForumPost } from "@/hooks/useForum";
import { cn } from "@/lib/utils";
import { Flag, Heart, MessageCircle, Trash2, User } from "lucide-react";
import { useState } from "react";
import { VoiceNotePlayer } from "./VoiceNotePlayer";

// ─── Tier badge colours ───────────────────────────────────────────────────────

const TIER_CONFIG: Record<number, { label: string; className: string }> = {
  1: { label: "Hustler", className: "bg-muted text-muted-foreground" },
  2: { label: "Grinder", className: "bg-primary/20 text-primary" },
  3: {
    label: "Power Earner",
    className: "bg-burnt-orange/20 text-burnt-orange",
  },
};

function getTierConfig(tier: number) {
  return TIER_CONFIG[tier] ?? TIER_CONFIG[1];
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

// ─── Initials avatar ──────────────────────────────────────────────────────────

function Avatar({ name, isAnon }: { name: string; isAnon: boolean }) {
  if (isAnon) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-primary-foreground"
      style={{ background: "oklch(0.6 0.22 35)" }}
    >
      {initials || "D"}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: ForumPost;
  currentUserId: string;
  isLiked?: boolean;
  onLike: (post: ForumPost) => void;
  onReply: (post: ForumPost) => void;
  onDelete: (post: ForumPost) => void;
  onFlag: (post: ForumPost) => void;
  heroMode?: boolean;
  /** index for data-ocid (1-based) */
  index?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PostCard({
  post,
  currentUserId,
  isLiked = false,
  onLike,
  onReply,
  onDelete,
  onFlag,
  heroMode = false,
  index,
}: PostCardProps) {
  const [optimisticLike, setOptimisticLike] = useState<boolean | null>(null);
  const liked = optimisticLike !== null ? optimisticLike : isLiked;
  const likeCount =
    optimisticLike !== null
      ? post.likeCount + (optimisticLike ? 1 : -1)
      : post.likeCount;

  const isOwn = post.authorId === currentUserId;
  const tierConf = getTierConfig(post.tier);
  const displayName = post.isAnonymous ? "Anonymous" : post.displayName;
  const ocidSuffix = index != null ? `.${index}` : "";

  const handleLike = () => {
    setOptimisticLike(!liked);
    onLike(post);
  };

  return (
    <article
      className={cn(
        "bg-card border border-border rounded-2xl p-4 space-y-3 transition-shadow",
        heroMode && "border-primary/30 shadow-md",
      )}
      data-ocid={`etavern.post${ocidSuffix}.card`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Avatar name={displayName} isAnon={post.isAnonymous} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate max-w-[140px]">
              {displayName}
            </span>
            {!post.isAnonymous && (
              <Badge
                className={cn(
                  "text-[10px] px-1.5 py-0 font-semibold",
                  tierConf.className,
                )}
              >
                {tierConf.label}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {relativeTime(post.timestamp)}
          </p>
        </div>

        {/* Actions: flag + delete */}
        <div className="flex items-center gap-1 shrink-0">
          {!isOwn && (
            <button
              type="button"
              onClick={() => onFlag(post)}
              className="p-1 rounded-lg text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              aria-label="Flag post"
              data-ocid={`etavern.post${ocidSuffix}.flag_button`}
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
          {isOwn && (
            <button
              type="button"
              onClick={() => onDelete(post)}
              className="p-1 rounded-lg text-muted-foreground/50 hover:text-destructive transition-colors"
              aria-label="Delete post"
              data-ocid={`etavern.post${ocidSuffix}.delete_button`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Post text */}
      <p className="text-sm text-foreground leading-relaxed break-words">
        {post.text}
      </p>

      {/* Voice note */}
      {post.voiceNoteKey && <VoiceNotePlayer storageKey={post.voiceNoteKey} />}

      {/* Footer actions */}
      <div className="flex items-center gap-1 pt-1">
        {/* Like */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn(
            "h-8 px-2.5 gap-1.5 text-xs rounded-xl transition-colors",
            liked
              ? "text-destructive hover:text-destructive bg-destructive/10 hover:bg-destructive/15"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-label={liked ? "Unlike" : "Like"}
          data-ocid={`etavern.post${ocidSuffix}.like_button`}
        >
          <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} />
          <span>{likeCount > 0 ? likeCount : ""}</span>
        </Button>

        {/* Replies */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReply(post)}
          className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-xl"
          aria-label="Reply"
          data-ocid={`etavern.post${ocidSuffix}.reply_button`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{post.replyCount > 0 ? post.replyCount : "Reply"}</span>
        </Button>
      </div>
    </article>
  );
}
