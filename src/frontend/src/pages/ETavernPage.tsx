/**
 * ETavernPage.tsx — Community forum for MoneyDrive drivers.
 * "Talk straight, talk free" — SA-flavoured, anonymous-friendly.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewPostSheet } from "@/features/forum/NewPostSheet";
import { PostCard } from "@/features/forum/PostCard";
import { PostDetailView } from "@/features/forum/PostDetailView";
import {
  type ForumChannel,
  type ForumPost,
  useCreatePost,
  useDeletePost,
  useFlagPost,
  useForumPosts,
  useHasLikedPost,
  useLikePost,
} from "@/hooks/useForum";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { cn } from "@/lib/utils";
import { Loader2, MessageCircle, Pen, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Channel config ───────────────────────────────────────────────────────────

interface ChannelDef {
  id: ForumChannel;
  label: string;
  emoji: string;
  description: string;
}

const CHANNELS: ChannelDef[] = [
  {
    id: "whatILove",
    label: "What I ❤️",
    emoji: "❤️",
    description: "Share what's working great",
  },
  {
    id: "whatNeedsWork",
    label: "What I 😡",
    emoji: "😡",
    description: "Honest feedback welcome",
  },
  {
    id: "featureRequests",
    label: "What I want",
    emoji: "💡",
    description: "Ideas to make it better",
  },
];

// ─── Offline banner ───────────────────────────────────────────────────────────

function OfflineReadBanner() {
  return (
    <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2 text-xs text-muted-foreground border border-border/40">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      You're offline — forum is read-only. Your draft is saved.
    </div>
  );
}

// ─── Post card with liked state ───────────────────────────────────────────────

function PostCardConnected({
  post,
  currentUserId,
  onReply,
  onDetail,
  index,
}: {
  post: ForumPost;
  currentUserId: string;
  onReply: (p: ForumPost) => void;
  onDetail: (p: ForumPost) => void;
  index: number;
}) {
  const { data: isLiked } = useHasLikedPost(post.id);
  const likePost = useLikePost();
  const deletePost = useDeletePost();
  const flagPost = useFlagPost();

  const handleLike = useCallback(
    (p: ForumPost) => {
      likePost.mutate(
        { postId: p.id, channel: p.channel },
        {
          onError: (e) => toast.error(e.message),
        },
      );
    },
    [likePost],
  );

  const handleDelete = useCallback(
    (p: ForumPost) => {
      if (!confirm("Delete this post?")) return;
      deletePost.mutate(
        { postId: p.id, channel: p.channel },
        {
          onSuccess: () => toast.success("Post deleted"),
          onError: (e) => toast.error(e.message),
        },
      );
    },
    [deletePost],
  );

  const handleFlag = useCallback(
    (p: ForumPost) => {
      flagPost.mutate(
        { postId: p.id, reason: "inappropriate" },
        {
          onSuccess: () => toast.success("Post flagged for review"),
          onError: (e) => toast.error(e.message),
        },
      );
    },
    [flagPost],
  );

  return (
    <button
      type="button"
      onClick={() => onDetail(post)}
      className="cursor-pointer w-full text-left"
    >
      <PostCard
        post={post}
        currentUserId={currentUserId}
        isLiked={isLiked ?? false}
        onLike={(p) => {
          handleLike(p);
        }}
        onReply={(p) => {
          onReply(p);
        }}
        onDelete={handleDelete}
        onFlag={handleFlag}
        index={index}
      />
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ETavernPage() {
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toText() ?? "";

  const [activeChannel, setActiveChannel] = useState<ForumChannel>("whatILove");
  const [offset, setOffset] = useState(0);
  const [allPosts, setAllPosts] = useState<ForumPost[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ForumPost | null>(null);
  const [detailPost, setDetailPost] = useState<ForumPost | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [optimisticPosts, setOptimisticPosts] = useState<ForumPost[]>([]);

  // Offline detection
  useEffect(() => {
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
    isFetching,
  } = useForumPosts(activeChannel, offset);

  // Accumulate pages
  useEffect(() => {
    if (!page) return;
    setAllPosts((prev) =>
      offset === 0
        ? page.posts
        : [
            ...prev,
            ...page.posts.filter((p) => !prev.some((x) => x.id === p.id)),
          ],
    );
  }, [page, offset]);

  // Reset on channel change — derive from page channel via key changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset trigger
  useEffect(() => {
    setAllPosts([]);
    setOptimisticPosts([]);
    setOffset(0);
  }, [activeChannel]);

  const createPost = useCreatePost();

  const handleSubmit = useCallback(
    (params: {
      text: string;
      isAnonymous: boolean;
      voiceNoteKey: string | null;
      parentId: string | null;
    }) => {
      if (isOffline) {
        // Save draft to localStorage
        const draft = {
          ...params,
          channel: activeChannel,
          savedAt: Date.now(),
        };
        localStorage.setItem("etavern_draft", JSON.stringify(draft));
        toast.info("You're offline — draft saved locally.");
        setSheetOpen(false);
        return;
      }

      // Optimistic post
      const tempPost: ForumPost = {
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
        deleted: false,
      };

      setOptimisticPosts((prev) => [tempPost, ...prev]);
      setSheetOpen(false);

      createPost.mutate(
        { ...params, channel: activeChannel },
        {
          onSuccess: (real) => {
            setOptimisticPosts((prev) =>
              prev.filter((p) => p.id !== tempPost.id),
            );
            setAllPosts((prev) => [real, ...prev]);
            toast.success("Posted to eTavern! 🍺");
          },
          onError: (e) => {
            setOptimisticPosts((prev) =>
              prev.filter((p) => p.id !== tempPost.id),
            );
            toast.error(e.message || "Failed to post. Try again.");
          },
        },
      );
    },
    [activeChannel, createPost, currentUserId, isOffline],
  );

  const handleOpenReply = useCallback((p: ForumPost) => {
    setReplyTarget(p);
    setSheetOpen(true);
  }, []);

  const handleOpenDetail = useCallback((p: ForumPost) => {
    setDetailPost(p);
  }, []);

  const handleNewPost = useCallback(() => {
    setReplyTarget(null);
    setSheetOpen(true);
  }, []);

  // Detail view
  if (detailPost) {
    return (
      <PostDetailView
        post={detailPost}
        currentUserId={currentUserId}
        onBack={() => setDetailPost(null)}
      />
    );
  }

  const combinedPosts = [...optimisticPosts, ...allPosts];

  return (
    <div className="min-h-screen bg-background pb-32" data-ocid="etavern.page">
      {/* Page header */}
      <div className="bg-card border-b border-border/60 px-4 pt-5 pb-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.6 0.22 35 / 0.2)" }}
            >
              <span className="text-xl">🍺</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground leading-tight">
                eTavern
              </h1>
              <p className="text-xs text-muted-foreground">
                Your community — talk straight, talk free
              </p>
            </div>
            <Badge className="ml-auto bg-burnt-orange/20 text-burnt-orange text-[10px] font-bold border-0">
              All Tiers
            </Badge>
          </div>

          {/* Channel tabs */}
          <div
            className="flex gap-1 mt-3 overflow-x-auto scrollbar-hide"
            data-ocid="etavern.channel.tabs"
          >
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChannel(ch.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                  activeChannel === ch.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                data-ocid={`etavern.channel.${ch.id}.tab`}
              >
                <span>{ch.emoji}</span>
                <span>{ch.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {/* Offline banner */}
        {isOffline && <OfflineReadBanner />}

        {/* Channel description */}
        <p className="text-xs text-muted-foreground px-1">
          {CHANNELS.find((c) => c.id === activeChannel)?.description}
        </p>

        {/* Loading skeletons */}
        {isLoading && offset === 0 ? (
          <div className="space-y-3" data-ocid="etavern.feed.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-2xl p-4 space-y-3"
              >
                <div className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <div className="flex gap-3">
                  <Skeleton className="h-7 w-16 rounded-xl" />
                  <Skeleton className="h-7 w-16 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : combinedPosts.length === 0 ? (
          <div
            className="text-center py-20 space-y-4"
            data-ocid="etavern.feed.empty_state"
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "oklch(0.6 0.22 35 / 0.1)" }}
            >
              <MessageCircle className="w-8 h-8 text-burnt-orange" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground text-lg">
                Be the first to post!
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Start the conversation in this channel. Your community is
                waiting.
              </p>
            </div>
            <Button
              onClick={handleNewPost}
              className="gap-2 font-semibold"
              data-ocid="etavern.empty_state.new_post_button"
            >
              <Pen className="w-4 h-4" />
              Post first
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3" data-ocid="etavern.feed.list">
              {combinedPosts.map((p, i) => (
                <PostCardConnected
                  key={p.id}
                  post={p}
                  currentUserId={currentUserId}
                  onReply={handleOpenReply}
                  onDetail={handleOpenDetail}
                  index={i + 1}
                />
              ))}
            </div>

            {/* Load more */}
            {page?.nextOffset != null && (
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={() => setOffset(page.nextOffset!)}
                disabled={isFetching}
                data-ocid="etavern.feed.load_more_button"
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Load more posts"
                )}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Floating new post button */}
      <button
        type="button"
        onClick={handleNewPost}
        disabled={isOffline}
        className="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-transform active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "oklch(0.6 0.22 35)" }}
        aria-label="New post"
        data-ocid="etavern.new_post_fab.button"
      >
        <Pen className="w-5 h-5" />
      </button>

      {/* New post / reply sheet */}
      <NewPostSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        channel={activeChannel}
        parentPost={replyTarget}
        onSubmit={handleSubmit}
        isSubmitting={createPost.isPending}
      />
    </div>
  );
}
