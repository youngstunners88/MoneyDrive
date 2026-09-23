/**
 * Document Vault — shared TypeScript types.
 * These mirror the backend DocumentRecord and DocumentType enums.
 */

import type { MarkdownStatus } from "../backend";

export type DocumentType = "registration" | "licence" | "invoice" | "other";

export interface DocumentRecord {
  id: string;
  driverId: string;
  uploadedAt: bigint;
  storageRef: string;
  docType: DocumentType;
  fileName: string;
  notes: string;
  deleted: boolean;
  markdownStatus?: MarkdownStatus;
  markdownContent?: string;
}

/** Map backend enum values to our frontend union */
export function toDocumentType(raw: string): DocumentType {
  const map: Record<string, DocumentType> = {
    registration: "registration",
    licence: "licence",
    invoice: "invoice",
    other: "other",
  };
  return map[raw] ?? "other";
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  registration: "Vehicle Registration",
  licence: "Driver's Licence",
  invoice: "Invoice / Receipt",
  other: "Other",
};
