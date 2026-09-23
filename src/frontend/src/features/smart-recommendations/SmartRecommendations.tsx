/**
 * SmartRecommendations.tsx
 *
 * Tier 3 component. Shows Nduna's top company pitch opportunities for the week,
 * scored and ranked by driver-company match. "Generate Pitch" pre-fills company
 * in PitchDeckGenerator and scrolls to the pitch section.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Flame, RefreshCw, Sparkles, Target } from "lucide-react";
import type { SmartRecommendation } from "./types";
import { useSmartRecommendations } from "./useSmartRecommendations";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDealRange(value: number): string {
  const low = Math.round(value * 0.8);
  const high = Math.round(value * 1.2);
  const fmtK = (n: number) =>
    n >= 1000 ? `R${(n / 1000).toFixed(0)}k` : `R${n}`;
  return `${fmtK(low)} – ${fmtK(high)}/month`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UrgencyBadge({ urgency }: { urgency: string }) {
  const isHigh = urgency === "high";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={
        isHigh
          ? {
              background: "rgba(217,90,48,0.15)",
              color: "#D85A30",
              border: "1px solid rgba(217,90,48,0.3)",
            }
          : {
              background: "rgba(186,117,23,0.12)",
              color: "#BA7517",
              border: "1px solid rgba(186,117,23,0.25)",
            }
      }
    >
      {isHigh && <Flame size={9} />}
      {isHigh ? "Hot opportunity" : "Good fit"}
    </span>
  );
}

function MatchBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            background:
              clamped >= 75
                ? "linear-gradient(90deg, #1A6B2A, #34A853)"
                : "linear-gradient(90deg, #BA7517, #D97706)",
          }}
        />
      </div>
      <span
        className="text-[11px] font-bold shrink-0"
        style={{ color: clamped >= 75 ? "#1A6B2A" : "#BA7517" }}
      >
        {clamped}%
      </span>
    </div>
  );
}

function RecommendationCard({
  rec,
  onGeneratePitch,
}: {
  rec: SmartRecommendation;
  onGeneratePitch: (company: string) => void;
}) {
  return (
    <div
      className="rounded-2xl p-4 space-y-3 transition-shadow hover:shadow-md"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
      data-ocid={`smart-rec-card-${rec.companyName.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Company badge */}
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: "rgba(186,117,23,0.18)",
              color: "#BA7517",
              border: "1px solid rgba(186,117,23,0.35)",
            }}
          >
            <Target size={11} />
            {rec.companyName}
          </span>
          <UrgencyBadge urgency={rec.urgency} />
        </div>
        <span
          className="text-[11px] font-semibold"
          style={{ color: "#9CA3AF" }}
        >
          {fmtDealRange(rec.score.estimatedDealValue)}
        </span>
      </div>

      {/* Match score */}
      <div className="space-y-1">
        <p className="text-[11px] font-medium" style={{ color: "#9CA3AF" }}>
          Match score
        </p>
        <MatchBar score={rec.score.matchScore} />
      </div>

      {/* Data point & pitch */}
      <div className="space-y-1.5">
        {rec.dataPoint && (
          <div
            className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs leading-relaxed"
            style={{
              background: "rgba(26,107,42,0.08)",
              border: "1px solid rgba(26,107,42,0.15)",
              color: "#9CA3AF",
            }}
          >
            <Sparkles
              size={11}
              style={{ color: "#1A6B2A", marginTop: 1, flexShrink: 0 }}
            />
            {rec.dataPoint}
          </div>
        )}
        {rec.pitch && (
          <p
            className="text-xs leading-relaxed italic"
            style={{ color: "#D1D5DB" }}
          >
            "{rec.pitch}"
          </p>
        )}
      </div>

      {/* Generate pitch CTA */}
      <button
        type="button"
        onClick={() => onGeneratePitch(rec.companyName)}
        className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
        style={{
          background: "rgba(186,117,23,0.2)",
          color: "#BA7517",
          border: "1px solid rgba(186,117,23,0.4)",
        }}
        data-ocid={`smart-rec-generate-pitch-${rec.companyName.toLowerCase().replace(/\s+/g, "-")}`}
      >
        Generate Pitch for {rec.companyName} →
      </button>
    </div>
  );
}

// ─── Loading skeletons ────────────────────────────────────────────────────────

function RecommendationsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-6 text-center space-y-3"
      style={{
        background: "rgba(186,117,23,0.04)",
        border: "1px dashed rgba(186,117,23,0.25)",
      }}
      data-ocid="smart-recs-empty"
    >
      <div
        className="mx-auto flex items-center justify-center rounded-full"
        style={{
          width: 48,
          height: 48,
          background: "rgba(186,117,23,0.1)",
          border: "1px solid rgba(186,117,23,0.25)",
        }}
      >
        <Sparkles size={20} style={{ color: "#BA7517" }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "#F9FAFB" }}>
          Nduna is building your profile
        </p>
        <p
          className="text-xs leading-relaxed mt-1"
          style={{ color: "#9CA3AF" }}
        >
          Close a trip or add your route to start getting personalised company
          recommendations. Nduna learns from your data weekly.
        </p>
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: "rgba(217,90,48,0.07)",
        border: "1px solid rgba(217,90,48,0.2)",
      }}
      data-ocid="smart-recs-error"
    >
      <AlertCircle size={18} style={{ color: "#D85A30", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#F9FAFB" }}>
          Couldn't load recommendations
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
          Nduna will try again shortly.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors hover:bg-white/5"
        style={{ color: "#D85A30", border: "1px solid rgba(217,90,48,0.3)" }}
        data-ocid="smart-recs-retry"
        aria-label="Retry loading recommendations"
      >
        <RefreshCw size={11} />
        Retry
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SmartRecommendationsProps {
  /** Called with the selected company name to pre-fill PitchDeckGenerator */
  onGeneratePitch?: (company: string) => void;
}

export default function SmartRecommendations({
  onGeneratePitch,
}: SmartRecommendationsProps) {
  const { data, isLoading, isError, refetch } = useSmartRecommendations();

  const handleGeneratePitch = (company: string) => {
    if (onGeneratePitch) {
      onGeneratePitch(company);
    }
    // Scroll to pitch section
    const pitchEl = document.getElementById("pitch-deck-section");
    if (pitchEl) {
      pitchEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      className="space-y-4 animate-fade-up"
      data-ocid="smart-recommendations"
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: "#BA7517" }} />
            <h3
              className="font-display font-bold text-base"
              style={{ color: "#F9FAFB" }}
            >
              Nduna's Top Picks This Week
            </h3>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(186,117,23,0.15)", color: "#78350F" }}
            >
              TIER 3
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            Personalised company matches based on your driver profile
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
          aria-label="Refresh recommendations"
          data-ocid="smart-recs-refresh"
        >
          <RefreshCw size={13} style={{ color: "#9CA3AF" }} />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <RecommendationsSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {data.slice(0, 3).map((rec) => (
            <RecommendationCard
              key={rec.companyName}
              rec={rec}
              onGeneratePitch={handleGeneratePitch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
