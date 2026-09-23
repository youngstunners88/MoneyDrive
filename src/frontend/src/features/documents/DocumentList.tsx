/**
 * DocumentList.tsx — Grid of uploaded documents with filter, download, delete,
 * and Nduna markdown-readability indicators.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Calendar,
  Download,
  FileSearch,
  FileText,
  Loader2,
  RefreshCw,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MarkdownStatus } from "../../backend";
import {
  DOCUMENT_TYPE_LABELS,
  type DocumentRecord,
  type DocumentType,
} from "../../types/documents";
import { DocumentMarkdownModal } from "./DocumentMarkdownModal";
import { useDocuments, useRequestMarkdownConversion } from "./useDocuments";

// ─── Constants ────────────────────────────────────────────────────────────────

type FilterType = "all" | DocumentType;

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "registration", label: "Registration" },
  { value: "licence", label: "Licence" },
  { value: "invoice", label: "Invoice" },
  { value: "other", label: "Other" },
];

const DOC_TYPE_CFG: Record<DocumentType, { color: string; icon: string }> = {
  registration: {
    color: "bg-primary/15 text-primary border-primary/30",
    icon: "🚗",
  },
  licence: {
    color: "bg-burnt-orange/10 text-burnt-orange border-burnt-orange/30",
    icon: "📋",
  },
  invoice: {
    color: "bg-success/10 text-success border-success/30",
    icon: "🧾",
  },
  other: {
    color: "bg-muted/50 text-muted-foreground border-border",
    icon: "📄",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Nduna readability badge ──────────────────────────────────────────────────

interface NdunaReadBadgeProps {
  doc: DocumentRecord;
  onRequestConversion: (storageRef: string) => void;
  isRequesting: boolean;
  onViewMarkdown: (
    storageRef: string,
    filename: string,
    docType: string,
  ) => void;
}

function NdunaReadBadge({
  doc,
  onRequestConversion,
  isRequesting,
  onViewMarkdown,
}: NdunaReadBadgeProps) {
  const status = doc.markdownStatus;

  // Not yet requested — show "Ask Nduna to read" ghost button
  if (!status) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-2.5 gap-1.5"
        onClick={() => onRequestConversion(doc.storageRef)}
        disabled={isRequesting}
        data-ocid={`document_vault.ask_nduna_read_button.${doc.id}`}
      >
        <BookOpen className="w-3.5 h-3.5 shrink-0" />
        Ask Nduna to read
      </Button>
    );
  }

  // Pending or converting — pulsing gold badge
  if (
    status === MarkdownStatus.pending ||
    status === MarkdownStatus.converting
  ) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 animate-pulse"
        data-ocid={`document_vault.nduna_reading_badge.${doc.id}`}
      >
        <Loader2 className="w-3 h-3 text-gold animate-spin" />
        <span className="text-xs font-medium text-gold">
          Nduna is reading...
        </span>
      </div>
    );
  }

  // Ready — burnt orange clickable badge
  if (status === MarkdownStatus.ready) {
    return (
      <button
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-burnt-orange/10 border border-burnt-orange/30 hover:bg-burnt-orange/20 transition-colors cursor-pointer"
        onClick={() =>
          onViewMarkdown(
            doc.storageRef,
            doc.fileName,
            DOCUMENT_TYPE_LABELS[doc.docType],
          )
        }
        data-ocid={`document_vault.nduna_ready_badge.${doc.id}`}
      >
        <BookOpen className="w-3 h-3 text-burnt-orange" />
        <span className="text-xs font-semibold text-burnt-orange">
          Nduna can read this ✓
        </span>
      </button>
    );
  }

  // Failed — grey badge with retry
  if (status === MarkdownStatus.failed) {
    return (
      <button
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border hover:bg-muted transition-colors cursor-pointer"
        onClick={() => onRequestConversion(doc.storageRef)}
        disabled={isRequesting}
        data-ocid={`document_vault.conversion_failed_badge.${doc.id}`}
      >
        <RefreshCw className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Conversion failed — retry
        </span>
      </button>
    );
  }

  // Unsupported — grey badge, no action
  if (status === MarkdownStatus.unsupported) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/40 border border-border"
        data-ocid={`document_vault.unsupported_badge.${doc.id}`}
      >
        <span className="text-xs font-medium text-muted-foreground">
          Format not supported
        </span>
      </div>
    );
  }

  return null;
}

// ─── Document card ────────────────────────────────────────────────────────────

function DocumentCard({
  doc,
  index,
  onDelete,
  onRequestConversion,
  isRequesting,
  onViewMarkdown,
}: {
  doc: DocumentRecord;
  index: number;
  onDelete: (id: string, name: string) => void;
  onRequestConversion: (storageRef: string) => void;
  isRequesting: boolean;
  onViewMarkdown: (
    storageRef: string,
    filename: string,
    docType: string,
  ) => void;
}) {
  const cfg = DOC_TYPE_CFG[doc.docType] ?? DOC_TYPE_CFG.other;
  const label = DOCUMENT_TYPE_LABELS[doc.docType];

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 shadow-card card-hover-lift animate-fade-up flex flex-col gap-3"
      style={{ animationDelay: `${index * 60}ms` }}
      data-ocid={`document_vault.item.${index + 1}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="text-xl shrink-0">{cfg.icon}</div>
          <div className="min-w-0">
            <p
              className="font-semibold text-sm text-foreground truncate"
              title={doc.fileName}
            >
              {doc.fileName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(doc.uploadedAt)}
            </p>
          </div>
        </div>
        <Badge className={`text-xs shrink-0 border ${cfg.color}`}>
          {label}
        </Badge>
      </div>

      {doc.notes && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{doc.notes}</span>
        </div>
      )}

      {/* Nduna readability status */}
      <div className="flex items-center">
        <NdunaReadBadge
          doc={doc}
          onRequestConversion={onRequestConversion}
          isRequesting={isRequesting}
          onViewMarkdown={onViewMarkdown}
        />
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="flex-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          data-ocid={`document_vault.download_button.${index + 1}`}
        >
          <a
            href={`/api/storage/${encodeURIComponent(doc.storageRef)}`}
            download={doc.fileName}
            target="_blank"
            rel="noreferrer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-semibold text-destructive/70 hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(doc.id, doc.fileName)}
          data-ocid={`document_vault.delete_button.${index + 1}`}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DocumentListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {(["a", "b", "c"] as const).map((k) => (
        <div
          key={k}
          className="bg-card border border-border rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-8 h-8 rounded-lg skeleton-loader" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-3/4 rounded skeleton-loader" />
              <Skeleton className="h-3 w-1/2 rounded skeleton-loader" />
            </div>
          </div>
          <Skeleton className="h-7 w-36 rounded-full skeleton-loader" />
          <Skeleton className="h-8 w-full rounded-lg skeleton-loader" />
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface DocumentListProps {
  docs: DocumentRecord[];
  isLoading: boolean;
  onUploadClick?: () => void;
  onAskNduna?: (message: string) => void;
}

export function DocumentList({
  docs,
  isLoading,
  onUploadClick,
  onAskNduna,
}: DocumentListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [markdownModal, setMarkdownModal] = useState<{
    storageRef: string;
    filename: string;
    docType: string;
  } | null>(null);

  const { deleteDocument, isDeleting } = useDocuments();
  const requestConversionMut = useRequestMarkdownConversion();

  const filtered =
    activeFilter === "all"
      ? docs
      : docs.filter((d) => d.docType === activeFilter);

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    deleteDocument(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
      onError: () => {
        toast.error("Failed to delete document.");
        setConfirmDelete(null);
      },
    });
  };

  const handleRequestConversion = (storageRef: string) => {
    requestConversionMut.mutate(storageRef);
  };

  const handleViewMarkdown = (
    storageRef: string,
    filename: string,
    docType: string,
  ) => {
    setMarkdownModal({ storageRef, filename, docType });
  };

  if (isLoading) return <DocumentListSkeleton />;

  return (
    <div className="space-y-4" data-ocid="document_vault.list">
      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setActiveFilter(opt.value)}
            className={`filter-btn ${activeFilter === opt.value ? "active" : ""}`}
            data-ocid={`document_vault.filter.${opt.value}`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground shrink-0">
          {filtered.length} document{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Document grid or empty state */}
      {filtered.length === 0 ? (
        <div
          className="bg-card border border-dashed border-border rounded-2xl p-10 text-center animate-fade-up"
          data-ocid="document_vault.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileSearch className="w-8 h-8 text-primary/60" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-1.5">
            {activeFilter === "all"
              ? "No documents yet"
              : `No ${activeFilter} documents`}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {activeFilter === "all"
              ? "Upload your Vehicle Registration and Operating Licence to get started."
              : `Upload a ${activeFilter} document using the panel above.`}
          </p>
          {activeFilter === "all" && onUploadClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUploadClick}
              className="mt-5 border-primary/40 text-primary hover:bg-primary/10"
              data-ocid="document_vault.empty_state_upload_button"
            >
              <FileText className="w-4 h-4 mr-2" />
              Upload your first document
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc, i) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              index={i}
              onDelete={(id, name) => setConfirmDelete({ id, name })}
              onRequestConversion={handleRequestConversion}
              isRequesting={requestConversionMut.isPending}
              onViewMarkdown={handleViewMarkdown}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent data-ocid="document_vault.delete_dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Delete Document?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {confirmDelete?.name}
              </span>
              ? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(null)}
              data-ocid="document_vault.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              data-ocid="document_vault.delete_confirm_button"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Yes, Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Markdown preview modal */}
      <DocumentMarkdownModal
        isOpen={!!markdownModal}
        onClose={() => setMarkdownModal(null)}
        storageRef={markdownModal?.storageRef ?? null}
        filename={markdownModal?.filename ?? ""}
        docType={markdownModal?.docType ?? ""}
        onAskNduna={onAskNduna}
      />
    </div>
  );
}
