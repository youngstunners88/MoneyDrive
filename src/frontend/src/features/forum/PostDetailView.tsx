/**
 * PostDetailView.tsx — Full-page threaded view for a single eTavern post.
 */

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForumPost } from "@/hooks/useForum";
import {
  useCreatePost,
  useDeletePost,
  useFlagPost,
  useForumReplies,
  useHasLikedPost,
  useLikePost,
} from "@/hooks/useForum";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { NewPostSheet } from "./NewPostSheet";
import { PostCard } from "./PostCard";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PostDetailViewProps {
  post: ForumPost;
  currentUserId: string;
  onBack: () => void;
}

// ─── Reply thread item (recursive up to 3 levels) ────────────────────────────

interface ReplyItemProps {
  reply: ForumPost;
  currentUserId: string;
  depth: number;
  onReply: (post: ForumPost) => void;
  index: number;
}

function ReplyItem({
  reply,
  currentUserId,
  depth,
  onReply,
  index,
}: ReplyItemProps) {
  const likePost = useLikePost();
  const deletePost = useDeletePost();
  const flagPost = useFlagPost();
  const { data: isLiked } = useHasLikedPost(reply.id);

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
      if (!confirm("Delete this reply?")) return;
      deletePost.mutate(
        { postId: p.id, channel: p.channel },
        {
          onSuccess: () => toast.success("Reply deleted"),
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
    <div
      style={{ marginLeft: depth > 0 ? Math.min(depth, 3) * 16 : 0 }}
      className="border-l border-border/40 pl-3"
    >
      <PostCard
        post={reply}
        currentUserId={currentUserId}
        isLiked={isLiked ?? false}
        onLike={handleLike}
        onReply={onReply}
        onDelete={handleDelete}
        onFlag={handleFlag}
        index={index}
      />
      {reply.replyCount > 0 && depth < 3 && (
        <NestedReplies
          parentId={reply.id}
          currentUserId={currentUserId}
          depth={depth + 1}
          onReply={onReply}
        />
      )}
    </div>
  );
}

// ─── Nested replies loader ────────────────────────────────────────────────────

interface NestedRepliesProps {
  parentId: string;
  currentUserId: string;
  depth: number;
  onReply: (post: ForumPost) => void;
}

function NestedReplies({
  parentId,
  currentUserId,
  depth,
  onReply,
}: NestedRepliesProps) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = useForumReplies(parentId);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1 text-xs text-primary/80 hover:text-primary ml-3 mt-1 mb-2 transition-colors"
        data-ocid={`etavern.replies.expand_${parentId}`}
      >
        <ChevronDown className="w-3 h-3" />
        View more replies
      </button>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-16 mx-3 mt-2 rounded-xl" />;
  }

  return (
    <div className="space-y-2 mt-2">
      {(data?.posts ?? []).map((r, i) => (
        <ReplyItem
          key={r.id}
          reply={r}
          currentUserId={currentUserId}
          depth={depth}
          onReply={onReply}
          index={i + 1}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PostDetailView({
  post,
  currentUserId,
  onBack,
}: PostDetailViewProps) {
  const [offset, setOffset] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ForumPost>(post);

  const { data: repliesPage, isLoading } = useForumReplies(post.id, offset);
  const likePost = useLikePost();
  const deletePost = useDeletePost();
  const flagPost = useFlagPost();
  const createPost = useCreatePost();
  const { data: isRootLiked } = useHasLikedPost(post.id);

  const handleReply = useCallback((target: ForumPost) => {
    setReplyTarget(target);
    setSheetOpen(true);
  }, []);

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
          onSuccess: () => {
            toast.success("Post deleted");
            onBack();
          },
          onError: (e) => toast.error(e.message),
        },
      );
    },
    [deletePost, onBack],
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

  const handleSubmitReply = useCallback(
    (params: {
      text: string;
      isAnonymous: boolean;
      voiceNoteKey: string | null;
      parentId: string | null;
    }) => {
      createPost.mutate(
        { ...params, channel: post.channel },
        {
          onSuccess: () => {
            setSheetOpen(false);
            toast.success("Reply posted!");
          },
          onError: (e) => toast.error(e.message),
        },
      );
    },
    [createPost, post.channel],
  );

  const replies = repliesPage?.posts ?? [];

  return (
    <div
      className="flex flex-col min-h-screen bg-background"
      data-ocid="etavern.detail.page"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border/60 flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back"
          data-ocid="etavern.detail.back_button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display font-semibold text-base text-foreground">
          Thread
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {/* Original post — hero mode */}
        <PostCard
          post={post}
          currentUserId={currentUserId}
          isLiked={isRootLiked ?? false}
          onLike={handleLike}
          onReply={handleReply}
          onDelete={handleDelete}
          onFlag={handleFlag}
          heroMode
        />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-xs text-muted-foreground font-medium">
            {repliesPage?.total ?? 0}{" "}
            {repliesPage?.total === 1 ? "reply" : "replies"}
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        {/* Replies */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : replies.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="etavern.detail.empty_state"
          >
            <MessageCircleIcon />
            <p className="text-sm mt-3">No replies yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {replies.map((r, i) => (
              <ReplyItem
                key={r.id}
                reply={r}
                currentUserId={currentUserId}
                depth={0}
                onReply={handleReply}
                index={i + 1}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {repliesPage?.nextOffset != null && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setOffset(repliesPage.nextOffset!)}
            data-ocid="etavern.detail.load_more_button"
          >
            Load more replies
          </Button>
        )}
      </div>

      {/* Sticky reply bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/60 px-4 py-3 flex gap-2 z-20">
        <Button
          onClick={() => handleReply(post)}
          className="flex-1 gap-2 font-semibold"
          data-ocid="etavern.detail.reply_primary_button"
        >
          {createPost.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Reply to thread"
          )}
        </Button>
      </div>

      {/* New post / reply sheet */}
      <NewPostSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        channel={post.channel}
        parentPost={replyTarget}
        onSubmit={handleSubmitReply}
        isSubmitting={createPost.isPending}
      />
    </div>
  );
}

function MessageCircleIcon() {
  return (
    <svg
      className="w-10 h-10 mx-auto text-muted-foreground/30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <title>No replies</title>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
