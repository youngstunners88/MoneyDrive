/**
 * CompanyPipelineTracker.tsx — Advertising deal pipeline for MoneyDrive drivers.
 * Shows all company pitches, status tracking, follow-up reminders, add/edit modal.
 */

import { Building2, Plus, UserCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { CompanyPitch, PitchStatus } from "./types";
import {
  useCreatePitch,
  useDeletePitch,
  useDriverPitches,
  useUpdatePitch,
  useUpdatePitchStatus,
} from "./useAdvertising";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATUSES: PitchStatus[] = [
  "sent",
  "viewed",
  "interested",
  "negotiating",
  "closed",
  "rejected",
  "abandoned",
];

const FILTER_STATUSES: Array<PitchStatus | "all"> = [
  "all",
  "sent",
  "interested",
  "negotiating",
  "closed",
];

const STATUS_LABELS: Record<PitchStatus, string> = {
  sent: "Sent",
  viewed: "Viewed",
  interested: "Interested",
  negotiating: "Negotiating",
  closed: "Closed",
  rejected: "Rejected",
  abandoned: "Abandoned",
};

/** Inline hex colors per spec — these are status indicator colors, not design tokens */
const STATUS_HEX: Record<PitchStatus, string> = {
  sent: "#F97316",
  viewed: "#EAB308",
  interested: "#22C55E",
  negotiating: "#3B82F6",
  closed: "#15803D",
  rejected: "#EF4444",
  abandoned: "#6B7280",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nanosToDate(ns: bigint): Date {
  return new Date(Number(ns / BigInt(1_000_000)));
}

function relativeDate(ns: bigint): string {
  const now = Date.now();
  const ms = Number(ns / BigInt(1_000_000));
  const diffMs = now - ms;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? "s" : ""} ago`;
}

function formatRand(cents: bigint): string {
  const rands = Number(cents) / 100;
  return `R ${rands.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function dateInputValue(ns: bigint): string {
  const d = nanosToDate(ns);
  return d.toISOString().split("T")[0];
}

function nowNs(): bigint {
  return BigInt(Date.now()) * BigInt(1_000_000);
}

// ─── Empty form state ─────────────────────────────────────────────────────────

interface FormState {
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  pitchDate: string;
  expectedValueR: string;
  notes: string;
  status: PitchStatus;
}

function emptyForm(): FormState {
  return {
    companyName: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    pitchDate: new Date().toISOString().split("T")[0],
    expectedValueR: "",
    notes: "",
    status: "sent",
  };
}

function formFromPitch(p: CompanyPitch): FormState {
  return {
    companyName: p.companyName,
    contactPerson: p.contactPerson ?? "",
    contactEmail: p.contactEmail ?? "",
    contactPhone: p.contactPhone ?? "",
    pitchDate: dateInputValue(p.pitchDate),
    expectedValueR: p.expectedValue
      ? String(Math.round(Number(p.expectedValue) / 100))
      : "",
    notes: p.notes ?? "",
    status: p.status,
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <div className="pitches-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="pitch-card">
          <div className="pitch-card-header">
            <div className="skeleton-loader h-5 w-36 rounded" />
            <div className="skeleton-loader h-5 w-20 rounded-full" />
          </div>
          <div className="pitch-card-details space-y-2">
            <div className="skeleton-loader h-4 w-48 rounded" />
            <div className="skeleton-loader h-4 w-32 rounded" />
          </div>
          <div className="pitch-card-actions">
            <div className="skeleton-loader h-8 w-16 rounded" />
            <div className="skeleton-loader h-8 w-20 rounded" />
            <div className="skeleton-loader h-8 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PitchStatus }) {
  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: `${STATUS_HEX[status]}22`,
        color: STATUS_HEX[status],
        borderColor: `${STATUS_HEX[status]}44`,
        border: `1px solid ${STATUS_HEX[status]}44`,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Pitch Card ───────────────────────────────────────────────────────────────

interface PitchCardProps {
  pitch: CompanyPitch;
  driverId: string;
  onEdit: (pitch: CompanyPitch) => void;
}

function PitchCard({ pitch, driverId, onEdit }: PitchCardProps) {
  const updatePitch = useUpdatePitch();
  const deletePitch = useDeletePitch();
  const updateStatus = useUpdatePitchStatus();

  const handleFollowUp = useCallback(() => {
    const updated: CompanyPitch = {
      ...pitch,
      lastFollowUp: nowNs(),
      updatedAt: nowNs(),
    };
    updatePitch.mutate(
      { id: pitch.id, updated },
      {
        onSuccess: () => {
          toast.success(`Follow-up logged for ${pitch.companyName}`);
        },
        onError: () => {
          toast.error("Failed to log follow-up. Try again.");
        },
      },
    );
  }, [pitch, updatePitch]);

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as PitchStatus;
      updateStatus.mutate(
        { id: pitch.id, status: newStatus, driverId },
        {
          onSuccess: () => {
            toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
          },
          onError: () => {
            toast.error("Failed to update status.");
          },
        },
      );
    },
    [pitch.id, driverId, updateStatus],
  );

  const handleArchive = useCallback(() => {
    deletePitch.mutate(
      { id: pitch.id, driverId },
      {
        onSuccess: () => {
          toast.success("Company archived");
        },
        onError: () => {
          toast.error("Failed to archive.");
        },
      },
    );
  }, [pitch.id, driverId, deletePitch]);

  return (
    <div className="pitch-card" data-ocid="pitch-card">
      <div className="pitch-card-header">
        <h3>{pitch.companyName}</h3>
        <StatusBadge status={pitch.status} />
      </div>

      <div className="pitch-card-details">
        {pitch.contactPerson && (
          <p>
            <strong>Contact:</strong> {pitch.contactPerson}
          </p>
        )}
        <p>
          <strong>Pitched:</strong> {relativeDate(pitch.pitchDate)}
        </p>
        {pitch.expectedValue && pitch.expectedValue > BigInt(0) && (
          <p>
            <strong>Potential value:</strong>{" "}
            <span className="text-gold font-semibold">
              {formatRand(pitch.expectedValue)}
            </span>
            /month
          </p>
        )}
        {pitch.lastFollowUp && (
          <p>
            <strong>Last follow-up:</strong> {relativeDate(pitch.lastFollowUp)}
          </p>
        )}
        {pitch.notes && (
          <p className="text-muted-foreground mt-1 italic">{pitch.notes}</p>
        )}
      </div>

      <div className="pitch-card-actions">
        {/* Edit */}
        <button
          className="action-btn primary"
          onClick={() => onEdit(pitch)}
          data-ocid="pitch-edit-btn"
          type="button"
        >
          Edit
        </button>

        {/* Follow Up */}
        <button
          className="action-btn"
          onClick={handleFollowUp}
          disabled={updatePitch.isPending}
          data-ocid="pitch-followup-btn"
          type="button"
        >
          {updatePitch.isPending ? "Saving…" : "Follow Up"}
        </button>

        {/* Status select */}
        <select
          value={pitch.status}
          onChange={handleStatusChange}
          disabled={updateStatus.isPending}
          className="action-btn"
          style={{ cursor: "pointer" }}
          aria-label="Change status"
          data-ocid="pitch-status-select"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {/* Archive */}
        <button
          className="action-btn"
          onClick={handleArchive}
          disabled={deletePitch.isPending}
          style={{
            marginLeft: "auto",
            color: "#EF4444",
            borderColor: "#EF444444",
          }}
          data-ocid="pitch-archive-btn"
          type="button"
        >
          {deletePitch.isPending ? "…" : "Archive"}
        </button>
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

interface ModalProps {
  driverId: string;
  editing: CompanyPitch | null;
  onClose: () => void;
}

function PitchModal({ driverId, editing, onClose }: ModalProps) {
  const [form, setForm] = useState<FormState>(
    editing ? formFromPitch(editing) : emptyForm(),
  );
  const [nameError, setNameError] = useState("");

  const createPitch = useCreatePitch();
  const updatePitch = useUpdatePitch();

  const isPending = createPitch.isPending || updatePitch.isPending;

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "companyName" && value.trim()) setNameError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      setNameError("Company name is required");
      return;
    }

    const pitchDateMs = new Date(form.pitchDate).getTime();
    const now = nowNs();

    const pitch: CompanyPitch = {
      id:
        editing?.id ??
        `pitch_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      driverId,
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      pitchDate: BigInt(pitchDateMs) * BigInt(1_000_000),
      status: form.status,
      expectedValue: form.expectedValueR
        ? BigInt(Math.round(Number.parseFloat(form.expectedValueR) * 100))
        : undefined,
      notes: form.notes.trim() || undefined,
      lastFollowUp: editing?.lastFollowUp,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };

    if (editing) {
      updatePitch.mutate(
        { id: editing.id, updated: pitch },
        {
          onSuccess: () => {
            toast.success(`${pitch.companyName} updated`);
            onClose();
          },
          onError: () => toast.error("Failed to save. Try again."),
        },
      );
    } else {
      createPitch.mutate(pitch, {
        onSuccess: () => {
          toast.success(`${pitch.companyName} added to pipeline`);
          onClose();
        },
        onError: () => toast.error("Failed to add company. Try again."),
      });
    }
  };

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: overlay click handled via onClick
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      data-ocid="pitch-modal"
    >
      <dialog
        open
        className="modal-content"
        onKeyDown={handleKeyDown}
        aria-label={editing ? "Edit company pitch" : "Add company pitch"}
        style={{
          border: "none",
          padding: 0,
          background: "transparent",
          maxWidth: "100%",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold">
            {editing ? "Edit Company" : "Add Company"}
          </h2>
          <button
            onClick={onClose}
            className="action-btn"
            aria-label="Close modal"
            type="button"
            data-ocid="pitch-modal-close"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {/* Company name */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="pm-company"
              className="text-sm font-medium text-muted-foreground"
            >
              Company name <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              id="pm-company"
              type="text"
              placeholder="e.g. MTN, FNB, Vodacom"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              data-ocid="pitch-modal-company-input"
            />
            {nameError && (
              <span className="text-xs" style={{ color: "#EF4444" }}>
                {nameError}
              </span>
            )}
          </div>

          {/* Contact person */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="pm-contact"
              className="text-sm font-medium text-muted-foreground"
            >
              Contact person <span className="text-xs">(optional)</span>
            </label>
            <input
              id="pm-contact"
              type="text"
              placeholder="e.g. Sipho Ndlovu"
              value={form.contactPerson}
              onChange={(e) => set("contactPerson", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              data-ocid="pitch-modal-contact-input"
            />
          </div>

          {/* Email + Phone row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="pm-email"
                className="text-sm font-medium text-muted-foreground"
              >
                Email <span className="text-xs">(optional)</span>
              </label>
              <input
                id="pm-email"
                type="email"
                placeholder="contact@company.co.za"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                data-ocid="pitch-modal-email-input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="pm-phone"
                className="text-sm font-medium text-muted-foreground"
              >
                Phone <span className="text-xs">(optional)</span>
              </label>
              <input
                id="pm-phone"
                type="tel"
                placeholder="060 123 4567"
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                data-ocid="pitch-modal-phone-input"
              />
            </div>
          </div>

          {/* Date + Expected value row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="pm-date"
                className="text-sm font-medium text-muted-foreground"
              >
                Date pitched
              </label>
              <input
                id="pm-date"
                type="date"
                value={form.pitchDate}
                onChange={(e) => set("pitchDate", e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                data-ocid="pitch-modal-date-input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="pm-value"
                className="text-sm font-medium text-muted-foreground"
              >
                Value R/month <span className="text-xs">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R
                </span>
                <input
                  id="pm-value"
                  type="number"
                  min="0"
                  placeholder="20000"
                  value={form.expectedValueR}
                  onChange={(e) => set("expectedValueR", e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  data-ocid="pitch-modal-value-input"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="pm-status"
              className="text-sm font-medium text-muted-foreground"
            >
              Status
            </label>
            <select
              id="pm-status"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              data-ocid="pitch-modal-status-select"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="pm-notes"
              className="text-sm font-medium text-muted-foreground"
            >
              Notes <span className="text-xs">(optional)</span>
            </label>
            <textarea
              id="pm-notes"
              rows={3}
              placeholder="e.g. They seemed interested in the 6-month package…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              data-ocid="pitch-modal-notes-input"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="action-btn flex-1"
              data-ocid="pitch-modal-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-opacity"
              style={{
                background: isPending
                  ? "#6B7280"
                  : "oklch(var(--sa-burnt-orange))",
                color: "white",
                cursor: isPending ? "not-allowed" : "pointer",
              }}
              data-ocid="pitch-modal-save-btn"
            >
              {isPending ? "Saving…" : editing ? "Save Changes" : "Add Company"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

// ─── Stage summary bar ────────────────────────────────────────────────────────

function StageSummary({ pitches }: { pitches: CompanyPitch[] }) {
  const counts = pitches.reduce<Partial<Record<PitchStatus, number>>>(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const highlights: PitchStatus[] = ["interested", "negotiating", "closed"];
  const items = highlights.filter((s) => (counts[s] ?? 0) > 0);

  if (items.length === 0) return null;

  return (
    <div className="flex gap-3 px-4 pb-3 flex-wrap">
      {items.map((s) => (
        <span
          key={s}
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{
            backgroundColor: `${STATUS_HEX[s]}1A`,
            color: STATUS_HEX[s],
            border: `1px solid ${STATUS_HEX[s]}33`,
          }}
        >
          {counts[s]} {STATUS_LABELS[s]}
        </span>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
      data-ocid="pipeline-empty-state"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: "oklch(var(--sa-burnt-orange) / 0.12)" }}
      >
        <Building2
          className="w-8 h-8"
          style={{ color: "oklch(var(--sa-burnt-orange))" }}
        />
      </div>
      <h3 className="font-display font-bold text-lg mb-2">No pitches yet</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        Start pitching! Generate your pitch deck and add companies you've
        contacted. Your first deal could be R10,000–R50,000/month.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
        style={{ background: "oklch(var(--sa-burnt-orange))", color: "white" }}
        data-ocid="pipeline-empty-add-btn"
        type="button"
      >
        <Plus className="w-4 h-4" />
        Add Your First Company
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CompanyPipelineTrackerProps {
  driverId: string;
}

export default function CompanyPipelineTracker({
  driverId,
}: CompanyPipelineTrackerProps) {
  const [activeFilter, setActiveFilter] = useState<PitchStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPitch, setEditingPitch] = useState<CompanyPitch | null>(null);

  const { data: pitches = [], isLoading } = useDriverPitches(driverId);

  // Count per status for filter badges
  const statusCounts = pitches.reduce<Partial<Record<PitchStatus, number>>>(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const filtered =
    activeFilter === "all"
      ? pitches
      : pitches.filter((p) => p.status === activeFilter);

  const openAdd = () => {
    setEditingPitch(null);
    setModalOpen(true);
  };

  const openEdit = (pitch: CompanyPitch) => {
    setEditingPitch(pitch);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPitch(null);
  };

  return (
    <div className="pipeline-container" data-ocid="pipeline-container">
      {/* Header */}
      <div className="pipeline-header">
        <div className="flex items-center gap-2">
          <UserCircle
            className="w-5 h-5"
            style={{ color: "oklch(var(--gold))" }}
          />
          <h2 className="font-display font-bold text-base">
            Advertising Pipeline
          </h2>
          {pitches.length > 0 && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "oklch(var(--gold) / 0.12)",
                color: "oklch(var(--gold))",
              }}
            >
              {pitches.length}
            </span>
          )}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 active:scale-95"
          style={{
            background: "oklch(var(--sa-burnt-orange))",
            color: "white",
          }}
          data-ocid="pipeline-add-btn"
          type="button"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Stage summary */}
      {pitches.length > 0 && <StageSummary pitches={pitches} />}

      {/* Status filters */}
      <div className="status-filters" data-ocid="pipeline-filters">
        {FILTER_STATUSES.map((s) => {
          const count = s === "all" ? pitches.length : (statusCounts[s] ?? 0);
          return (
            <button
              key={s}
              className={`filter-btn${activeFilter === s ? " active" : ""}`}
              onClick={() => setActiveFilter(s)}
              type="button"
              data-ocid={`pipeline-filter-${s}`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
              {count > 0 && (
                <span
                  className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background:
                      activeFilter === s
                        ? "oklch(var(--primary-foreground) / 0.2)"
                        : "oklch(var(--muted))",
                    color:
                      activeFilter === s
                        ? "oklch(var(--primary-foreground))"
                        : "oklch(var(--muted-foreground))",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonCards />
      ) : filtered.length === 0 ? (
        pitches.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm px-4">
            No{" "}
            {activeFilter !== "all"
              ? STATUS_LABELS[activeFilter as PitchStatus].toLowerCase()
              : ""}{" "}
            pitches.
          </div>
        )
      ) : (
        <div className="pitches-list" data-ocid="pitches-list">
          {filtered.map((pitch) => (
            <PitchCard
              key={pitch.id}
              pitch={pitch}
              driverId={driverId}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <PitchModal
          driverId={driverId}
          editing={editingPitch}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
