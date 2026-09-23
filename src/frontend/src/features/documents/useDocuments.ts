/**
 * useDocuments.ts — React Query hooks for the Document Vault feature.
 * Wraps uploadDocument, listDriverDocuments, deleteDocument, addDocumentNote,
 * requestMarkdownConversion, and getDocumentMarkdown.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DocumentType as BackendDocumentType } from "../../backend";
import { useActor } from "../../shared/hooks/useActor";
import {
  type DocumentRecord,
  type DocumentType,
  toDocumentType,
} from "../../types/documents";

const QUERY_KEY = ["documents"] as const;

const FRONTEND_TO_BACKEND: Record<DocumentType, BackendDocumentType> = {
  registration: BackendDocumentType.registration,
  licence: BackendDocumentType.licence,
  invoice: BackendDocumentType.invoice,
  other: BackendDocumentType.other,
};

export function useDocuments() {
  const { actor, isFetching: actorFetching } = useActor();
  const qc = useQueryClient();

  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery<DocumentRecord[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.listDriverDocuments();
      return raw
        .filter((r) => !r.deleted)
        .map((r) => ({
          ...r,
          docType: toDocumentType(r.docType as unknown as string),
        }));
    },
    enabled: !!actor && !actorFetching,
  });

  const uploadMut = useMutation({
    mutationFn: async ({
      storageRef,
      docType,
      fileName,
      notes,
    }: {
      storageRef: string;
      docType: DocumentType;
      fileName: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.uploadDocument(
        storageRef,
        FRONTEND_TO_BACKEND[docType],
        fileName,
        notes,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Document uploaded successfully.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to upload document."),
  });

  const deleteMut = useMutation({
    mutationFn: async (docId: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.deleteDocument(docId);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Document removed.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to remove document."),
  });

  const addNoteMut = useMutation({
    mutationFn: async ({ docId, note }: { docId: string; note: string }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.addDocumentNote(docId, note);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Note saved.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save note."),
  });

  return {
    documents,
    isLoading: isLoading || actorFetching,
    error,
    uploadDocument: uploadMut.mutate,
    isUploading: uploadMut.isPending,
    deleteDocument: deleteMut.mutate,
    isDeleting: deleteMut.isPending,
    addNote: addNoteMut.mutate,
    isAddingNote: addNoteMut.isPending,
  };
}

/**
 * Named convenience hooks for components that prefer individual hooks.
 * DocumentUpload.tsx uses useUploadDocument().mutateAsync(...)
 */
export function useUploadDocument() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storageRef,
      docType,
      fileName,
      notes,
    }: {
      storageRef: string;
      docType: BackendDocumentType;
      fileName: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.uploadDocument(
        storageRef,
        docType,
        fileName,
        notes,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to upload document."),
  });
}

/** DocumentList.tsx uses useDeleteDocument().mutateAsync(id) */
export function useDeleteDocument() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (docId: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.deleteDocument(docId);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to delete document."),
  });
}

/** Request markdown conversion for a document (by storageRef) */
export function useRequestMarkdownConversion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (storageRef: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.requestMarkdownConversion(storageRef);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Nduna is starting to read the document...");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to request conversion."),
  });
}

/** Fetch markdown content for a single document — only when storageRef is non-null */
export function useDocumentMarkdown(storageRef: string | null) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<string>({
    queryKey: ["document-markdown", storageRef],
    queryFn: async () => {
      if (!actor || !storageRef) return "";
      const result = await actor.getDocumentMarkdown(storageRef);
      if ("err" in result) throw new Error(result.err);
      return result.ok ?? "";
    },
    enabled: !!actor && !actorFetching && storageRef !== null,
    staleTime: 60_000,
  });
}
