/**
 * DocumentMarkdownModal.tsx — Bottom sheet (mobile) / Dialog (desktop) that shows
 * Nduna's markdown view of an uploaded document, with an option to ask Nduna about it.
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, MessageSquare, X } from "lucide-react";
import { useCallback } from "react";
import { useDocumentMarkdown } from "./useDocuments";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  storageRef: string | null;
  filename: string;
  docType: string;
  onAskNduna?: (message: string) => void;
}

// ─── Simple markdown renderer (no external dep) ───────────────────────────────

function renderMarkdown(md: string): string {
  return (
    md
      // Headings
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      // Bold / italic
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Unordered lists
      .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
      // Horizontal rule
      .replace(/^---$/gm, "<hr />")
      // Paragraphs (double newlines)
      .replace(/\n\n/g, "</p><p>")
      // Wrap in <p> at the start
      .replace(/^/, "<p>")
      .replace(/$/, "</p>")
      // Collapse <p> around block elements
      .replace(/<p>(<h[1-3]>)/g, "$1")
      .replace(/(<\/h[1-3]>)<\/p>/g, "$1")
      .replace(/<p>(<li>)/g, "<ul>$1")
      .replace(/(<\/li>)<\/p>/g, "$1</ul>")
      .replace(/<p>(<hr \/>)<\/p>/g, "$1")
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

function MarkdownContent({
  storageRef,
  filename,
  docType,
  onClose,
  onAskNduna,
}: Omit<Props, "isOpen">) {
  const { data: markdown, isLoading, error } = useDocumentMarkdown(storageRef);

  const handleAskNduna = useCallback(() => {
    if (onAskNduna) {
      onAskNduna(`I want to talk about my ${docType} document: ${filename}`);
    }
    onClose();
  }, [onAskNduna, docType, filename, onClose]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-5 h-5 text-burnt-orange shrink-0" />
        <span className="text-xs text-muted-foreground">
          What Nduna sees in
        </span>
      </div>
      <p
        className="font-display font-bold text-lg text-burnt-orange leading-tight truncate mb-4"
        title={filename}
      >
        {filename}
      </p>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto rounded-xl bg-muted/30 border border-border/50 p-4 min-h-[200px] max-h-[55vh] text-sm"
        data-ocid="document_vault.markdown_preview"
      >
        {isLoading && (
          <div className="space-y-3">
            {(["a", "b", "c", "d", "e", "f"] as const).map((k, i) => (
              <Skeleton
                key={k}
                className={`h-3.5 rounded skeleton-loader ${i % 3 === 2 ? "w-2/3" : "w-full"}`}
              />
            ))}
          </div>
        )}

        {error && (
          <div
            className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-8"
            data-ocid="document_vault.markdown_error_state"
          >
            <AlertCircle className="w-8 h-8 text-destructive/60" />
            <p className="text-center text-sm">
              Couldn't load document content. Try again in a moment.
            </p>
          </div>
        )}

        {!isLoading && !error && markdown && (
          <div
            className="prose-sm text-foreground leading-relaxed [&_h1]:font-display [&_h1]:text-burnt-orange [&_h1]:font-bold [&_h1]:text-base [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:font-display [&_h2]:text-gold [&_h2]:font-semibold [&_h2]:text-sm [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:text-sm [&_h3]:mt-2.5 [&_h3]:mb-1 [&_strong]:text-foreground [&_strong]:font-semibold [&_em]:text-muted-foreground [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_ul]:pl-4 [&_ul]:my-2 [&_li]:my-0.5 [&_li]:list-disc [&_li]:text-muted-foreground [&_hr]:border-border/40 [&_hr]:my-3 [&_p]:mb-2 [&_p]:text-muted-foreground"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled markdown from trusted canister
            dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
          />
        )}

        {!isLoading && !error && !markdown && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-8">
            No readable content available yet.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground"
          data-ocid="document_vault.markdown_close_button"
        >
          <X className="w-4 h-4 mr-1.5" />
          Close
        </Button>
        <Button
          size="sm"
          onClick={handleAskNduna}
          className="flex-1 bg-burnt-orange hover:bg-burnt-orange/90 text-white font-semibold"
          data-ocid="document_vault.ask_nduna_button"
        >
          <MessageSquare className="w-4 h-4 mr-1.5" />
          Ask Nduna about this document
        </Button>
      </div>
    </>
  );
}

// ─── Responsive wrapper: Drawer on mobile, Dialog on desktop ─────────────────

export function DocumentMarkdownModal({
  isOpen,
  onClose,
  storageRef,
  filename,
  docType,
  onAskNduna,
}: Props) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const contentProps = { storageRef, filename, docType, onClose, onAskNduna };

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent
          className="bg-card border-border rounded-t-2xl px-4 pb-6 pt-2"
          data-ocid="document_vault.markdown_sheet"
        >
          <DrawerHeader className="sr-only">
            <DrawerTitle>What Nduna sees</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col">
            <MarkdownContent {...contentProps} />
          </div>
          <DrawerFooter className="sr-only" />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-card border-border rounded-2xl max-w-2xl w-full p-6 flex flex-col"
        data-ocid="document_vault.markdown_dialog"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>What Nduna sees</DialogTitle>
        </DialogHeader>
        <MarkdownContent {...contentProps} />
        <DialogFooter className="sr-only" />
      </DialogContent>
    </Dialog>
  );
}
