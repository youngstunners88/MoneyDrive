/**
 * RecommendationFeedback.tsx
 * Captures driver outcomes on Nduna recommendations.
 * Every submission closes the feedback loop that trains Nduna to improve.
 */

import { useState } from "react";
import { toast } from "sonner";
import { useRecordOutcome } from "../advertising/useAdvertising";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecommendationFeedbackProps {
  recommendationId: string;
  recommendationType: "surge" | "product" | "advertising";
  content: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  driverId: string;
  onDismiss?: () => void;
}

type ActionChoice = "tried" | "skipped" | "partial";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONFIDENCE_STYLES: Record<
  "HIGH" | "MEDIUM" | "LOW",
  { bg: string; color: string; label: string }
> = {
  HIGH: {
    bg: "oklch(0.25 0.08 145)",
    color: "oklch(0.75 0.15 145)",
    label: "HIGH",
  },
  MEDIUM: {
    bg: "oklch(0.25 0.1 45)",
    color: "oklch(0.75 0.2 45)",
    label: "MEDIUM",
  },
  LOW: {
    bg: "oklch(0.2 0 0)",
    color: "oklch(0.6 0 0)",
    label: "LOW",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecommendationFeedback({
  recommendationId,
  content,
  confidence,
  driverId,
  onDismiss,
}: RecommendationFeedbackProps) {
  const [action, setAction] = useState<ActionChoice | null>(null);
  const [revenue, setRevenue] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { mutate: recordOutcome, isPending } = useRecordOutcome();

  const confStyle = CONFIDENCE_STYLES[confidence];

  function handleSubmit() {
    if (!action) return;

    const revenueVal =
      action === "tried" && revenue.trim()
        ? BigInt(Math.round(Number.parseFloat(revenue) * 100))
        : undefined;

    recordOutcome(
      {
        recommendationId,
        driverId,
        action,
        revenue: revenueVal ?? undefined,
        notes: notes.trim() || undefined,
        recordedAt: BigInt(Date.now()),
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          setTimeout(() => {
            if (onDismiss) {
              onDismiss();
            } else {
              setSubmitted(false);
              setAction(null);
              setRevenue("");
              setNotes("");
            }
          }, 2000);
        },
        onError: () => {
          toast.error("Failed to save outcome. Please try again.");
        },
      },
    );
  }

  // ─── Success state ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div
        className="feedback-card submitted"
        aria-live="polite"
        data-ocid="feedback-success"
      >
        <output className="success-message text-success">
          <span aria-hidden="true">✓</span>
          <span>Thank you! Your feedback helps Nduna improve.</span>
        </output>
      </div>
    );
  }

  // ─── Main form ─────────────────────────────────────────────────────────────

  return (
    <div className="feedback-card" data-ocid="feedback-card">
      {/* Header row */}
      <div className="recommendation-header">
        <span
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          Nduna Recommendation
        </span>
        <span
          className="confidence-badge"
          style={{
            background: confStyle.bg,
            color: confStyle.color,
          }}
          data-ocid="confidence-badge"
        >
          {confStyle.label}
        </span>
      </div>

      {/* Recommendation content */}
      <div
        className="recommendation-content"
        style={{ background: "oklch(var(--muted) / 0.4)" }}
        data-ocid="recommendation-content"
      >
        <p className="text-sm leading-relaxed">{content}</p>
      </div>

      {/* Feedback form */}
      <div className="feedback-form">
        {/* Question */}
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend
            className="text-sm font-medium"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Did you try this recommendation?
          </legend>

          <div className="action-options mt-2">
            {(
              [
                { value: "tried", label: "Yes, I drove" },
                { value: "skipped", label: "No, I didn't" },
                {
                  value: "partial",
                  label: "Partially — different time/location",
                },
              ] as const
            ).map(({ value, label }) => (
              <label
                key={value}
                className="radio-option"
                data-ocid={`radio-${value}`}
              >
                <input
                  type="radio"
                  name={`action-${recommendationId}`}
                  value={value}
                  checked={action === value}
                  onChange={() => setAction(value)}
                  className="accent-burnt-orange w-4 h-4"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Revenue input — only when "tried" */}
        {action === "tried" && (
          <div className="revenue-input-group" data-ocid="revenue-input-group">
            <label
              htmlFor={`revenue-${recommendationId}`}
              className="text-xs font-medium"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              How much did you earn? (optional)
            </label>
            <div className="revenue-input-wrapper flex items-center gap-1">
              <span
                className="text-sm font-semibold"
                style={{ color: "oklch(var(--foreground))" }}
                aria-hidden="true"
              >
                R
              </span>
              <input
                id={`revenue-${recommendationId}`}
                type="number"
                min="0"
                step="1"
                placeholder="500"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="flex-1 rounded-md px-3 py-2 text-sm"
                style={{
                  background: "oklch(var(--input) / 0.5)",
                  border: "1px solid oklch(var(--border))",
                  color: "oklch(var(--foreground))",
                  outline: "none",
                }}
                data-ocid="revenue-input"
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="notes-group" data-ocid="notes-group">
          <label
            htmlFor={`notes-${recommendationId}`}
            className="text-xs font-medium"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Additional notes (optional)
          </label>
          <textarea
            id={`notes-${recommendationId}`}
            rows={3}
            placeholder="E.g., Weather was bad, Area was quiet"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md px-3 py-2 text-sm resize-none"
            style={{
              background: "oklch(var(--input) / 0.5)",
              border: "1px solid oklch(var(--border))",
              color: "oklch(var(--foreground))",
              outline: "none",
            }}
            data-ocid="notes-textarea"
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={action === null || isPending}
          className="w-full rounded-md py-3 text-sm font-semibold transition-opacity btn-press"
          style={{
            background:
              action === null || isPending
                ? "oklch(var(--muted))"
                : "oklch(var(--sa-burnt-orange))",
            color:
              action === null || isPending
                ? "oklch(var(--muted-foreground))"
                : "oklch(0.98 0 0)",
            cursor: action === null || isPending ? "not-allowed" : "pointer",
            opacity: action === null || isPending ? 0.6 : 1,
          }}
          data-ocid="submit-outcome"
        >
          {isPending ? "Saving..." : "Save Outcome"}
        </button>
      </div>
    </div>
  );
}
