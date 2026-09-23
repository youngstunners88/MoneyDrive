/**
 * NewPostSheet.tsx — Bottom sheet for composing eTavern posts and replies.
 */

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ForumChannel, ForumPost } from "@/hooks/useForum";
import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";

// ─── Channel display labels ───────────────────────────────────────────────────

const CHANNEL_LABELS: Record<ForumChannel, string> = {
  whatILove: "What I ❤️",
  whatNeedsWork: "What I 😡",
  featureRequests: "What I want",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewPostSheetProps {
  open: boolean;
  onClose: () => void;
  channel: ForumChannel;
  parentPost?: ForumPost | null;
  onSubmit: (params: {
    text: string;
    isAnonymous: boolean;
    voiceNoteKey: string | null;
    parentId: string | null;
  }) => void;
  isSubmitting: boolean;
}

const MAX_CHARS = 2000;

// ─── Component ────────────────────────────────────────────────────────────────

export function NewPostSheet({
  open,
  onClose,
  channel,
  parentPost,
  onSubmit,
  isSubmitting,
}: NewPostSheetProps) {
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [voiceNoteKey, setVoiceNoteKey] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      setText("");
      setIsAnonymous(false);
      setVoiceNoteKey(null);
    } else {
      setTimeout(() => textareaRef.current?.focus(), 200);
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
      parentId: parentPost?.id ?? null,
    });
  };

  const title = parentPost
    ? `Reply to ${parentPost.isAnonymous ? "Anonymous" : parentPost.displayName}`
    : CHANNEL_LABELS[channel];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-8 px-4 max-h-[85vh] overflow-y-auto"
        data-ocid="etavern.new_post.sheet"
      >
        <SheetHeader className="mb-4 flex-row items-center justify-between">
          <SheetTitle className="font-display text-base text-left truncate">
            {title}
          </SheetTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Close"
            data-ocid="etavern.new_post.close_button"
          >
            <X className="w-5 h-5" />
          </button>
        </SheetHeader>

        <div className="space-y-4">
          {/* Parent preview */}
          {parentPost && (
            <div className="bg-muted/40 rounded-xl px-3 py-2 border-l-2 border-primary/40">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {parentPost.text}
              </p>
            </div>
          )}

          {/* Text area */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder={
                parentPost
                  ? "Write your reply..."
                  : "Share your thoughts with the community..."
              }
              className="min-h-[120px] resize-none bg-muted/30 border-border/60 focus:border-primary/60 rounded-xl text-sm"
              data-ocid="etavern.new_post.textarea"
            />
            <span
              className={`absolute bottom-2 right-3 text-[10px] font-mono ${
                remaining < 100
                  ? "text-destructive"
                  : "text-muted-foreground/60"
              }`}
            >
              {remaining}
            </span>
          </div>

          {/* Voice recorder */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              Voice note
            </p>
            <VoiceNoteRecorder
              onKeyReady={(key) => {
                setVoiceNoteKey(key);
              }}
              onDiscard={() => {
                setVoiceNoteKey(null);
              }}
            />
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Post anonymously
              </p>
              <p className="text-xs text-muted-foreground">
                Hides your name and tier
              </p>
            </div>
            <Switch
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
              aria-label="Post anonymously"
              data-ocid="etavern.new_post.anonymous_toggle"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 gap-2 font-semibold"
              data-ocid="etavern.new_post.submit_button"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {parentPost ? "Post Reply" : "Post to eTavern"}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              data-ocid="etavern.new_post.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
