/**
 * DocumentUpload.tsx — Drag-drop file upload for the Document Vault.
 * Calls backend uploadDocument with storageRef + metadata.
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, FileText, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "../../types/documents";
import { useDocuments } from "./useDocuments";

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_TYPE_OPTIONS: DocumentType[] = [
  "registration",
  "licence",
  "invoice",
  "other",
];

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── Component ────────────────────────────────────────────────────────────────

interface DocumentUploadProps {
  onSuccess?: () => void;
}

export function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>("registration");
  const [notes, setNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { uploadDocument, isUploading } = useDocuments();

  const handleFile = useCallback((f: File) => {
    if (f.size > MAX_BYTES) {
      return;
    }
    setFile(f);
    setUploadDone(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleUpload = () => {
    if (!file) return;
    const storageRef = `documents/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    uploadDocument(
      { storageRef, docType, fileName: file.name, notes: notes.trim() },
      {
        onSuccess: () => {
          setUploadDone(true);
          setFile(null);
          setNotes("");
          if (fileRef.current) fileRef.current.value = "";
          onSuccess?.();
          setTimeout(() => setUploadDone(false), 3000);
        },
      },
    );
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setUploadDone(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-5" data-ocid="document_upload.panel">
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Drag-drop zone with inner button for accessibility */}
      <div
        className={`drag-drop-zone ${isDragging ? "active" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        data-ocid="document_upload.dropzone"
      >
        {file ? (
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Remove file"
              data-ocid="document_upload.remove_file_button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer"
            data-ocid="document_upload.browse_button"
          >
            <div className="drag-drop-icon">📄</div>
            <p className="drag-drop-text">Drop your document here</p>
            <p className="drag-drop-hint">
              or click to browse — PDF, JPG, PNG, DOC (max 10 MB)
            </p>
          </button>
        )}
      </div>

      {/* Success state */}
      {uploadDone && (
        <div className="flex items-center gap-2 text-success text-sm font-medium px-1">
          <CheckCircle className="w-4 h-4" />
          Document saved to your vault!
        </div>
      )}

      {/* Document type selector */}
      <div className="space-y-1.5">
        <Label
          htmlFor="doc-type"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
        >
          Document Type
        </Label>
        <Select
          value={docType}
          onValueChange={(v) => setDocType(v as DocumentType)}
        >
          <SelectTrigger
            id="doc-type"
            className="bg-muted/30 border-border"
            data-ocid="document_upload.type_select"
          >
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {DOC_TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {DOCUMENT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label
          htmlFor="doc-notes"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
        >
          Notes{" "}
          <span className="font-normal text-xs normal-case">(optional)</span>
        </Label>
        <Textarea
          id="doc-notes"
          placeholder="e.g. Renewed April 2026, expires April 2028"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="bg-muted/30 border-border resize-none text-sm"
          data-ocid="document_upload.notes_textarea"
        />
      </div>

      {/* Upload button */}
      <Button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full font-semibold bg-burnt-orange text-white border-0 hover:opacity-90 transition-opacity"
        data-ocid="document_upload.upload_button"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving to vault...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Save to Document Vault
          </>
        )}
      </Button>
    </div>
  );
}
