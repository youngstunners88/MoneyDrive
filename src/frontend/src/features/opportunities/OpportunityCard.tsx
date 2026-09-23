/**
 * OpportunityCard.tsx — Intelligence briefing card for a single opportunity finding.
 * Township fintech energy — each card is an actionable signal, not a list item.
 */

import {
  Bot,
  Clock,
  Cloud,
  ExternalLink,
  Search,
  Server,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import type {
  OpportunityCategory,
  OpportunityFinding,
} from "../../types/opportunities";

// ─── Category config ───────────────────────────────────────────────────────────

interface CategoryMeta {
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  emoji: string;
}

const CATEGORY_META: Record<OpportunityCategory, CategoryMeta> = {
  newPlatform: {
    label: "New Platform",
    textClass: "text-[oklch(0.75_0.12_85)]",
    bgClass: "bg-[oklch(0.75_0.12_85/0.12)]",
    borderClass: "border-[oklch(0.75_0.12_85/0.35)]",
    emoji: "🚀",
  },
  intercityRoute: {
    label: "Route Opportunity",
    textClass: "text-[oklch(0.55_0.18_240)]",
    bgClass: "bg-[oklch(0.55_0.18_240/0.12)]",
    borderClass: "border-[oklch(0.55_0.18_240/0.35)]",
    emoji: "🛣️",
  },
  platformPromotion: {
    label: "Platform Promo",
    textClass: "text-burnt-orange",
    bgClass: "bg-[oklch(0.6_0.22_35/0.12)]",
    borderClass: "border-[oklch(0.6_0.22_35/0.35)]",
    emoji: "🔥",
  },
  incomeCategory: {
    label: "New Income",
    textClass: "text-success",
    bgClass: "bg-[oklch(0.55_0.14_145/0.12)]",
    borderClass: "border-[oklch(0.55_0.14_145/0.35)]",
    emoji: "💰",
  },
  businessLead: {
    label: "Business Lead",
    textClass: "text-[oklch(0.65_0.18_300)]",
    bgClass: "bg-[oklch(0.65_0.18_300/0.12)]",
    borderClass: "border-[oklch(0.65_0.18_300/0.35)]",
    emoji: "🏢",
  },
  regulatoryChange: {
    label: "Policy Update",
    textClass: "text-muted-foreground",
    bgClass: "bg-muted/30",
    borderClass: "border-border",
    emoji: "📋",
  },
};

const ACCENT_COLORS: Record<OpportunityCategory, string> = {
  newPlatform: "oklch(0.75 0.12 85 / 0.6)",
  intercityRoute: "oklch(0.55 0.18 240 / 0.6)",
  platformPromotion: "oklch(0.6 0.22 35 / 0.6)",
  incomeCategory: "oklch(0.55 0.14 145 / 0.6)",
  businessLead: "oklch(0.65 0.18 300 / 0.6)",
  regulatoryChange: "oklch(0.55 0.04 85 / 0.4)",
};

// ─── Score bar ─────────────────────────────────────────────────────────────────

function RelevanceBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const colorClass =
    pct >= 75
      ? "bg-[oklch(0.75_0.12_85)]"
      : pct >= 45
        ? "bg-[oklch(0.6_0.22_35)]"
        : "bg-[oklch(0.55_0.14_145)]";

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
          aria-label={`Relevance score ${pct} out of 100`}
        />
      </div>
      <span className="text-xs font-bold text-muted-foreground tabular-nums w-8 text-right">
        {pct}
      </span>
    </div>
  );
}

// ─── Expiry indicator ──────────────────────────────────────────────────────────

function ExpiryLabel({ expiresAt }: { expiresAt: bigint }) {
  const msLeft = Number(expiresAt) - Date.now();
  const daysLeft = Math.floor(msLeft / 86_400_000);
  if (daysLeft < 0) return <span className="text-destructive/80">Expired</span>;
  if (daysLeft === 0)
    return <span className="text-destructive/80">Expires today</span>;
  if (daysLeft === 1)
    return <span className="text-[oklch(0.6_0.22_35)]">Expires tomorrow</span>;
  return <span>Expires in {daysLeft} days</span>;
}

// ─── Source badge ──────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: string }) {
  const lower = source.toLowerCase();
  if (lower.includes("browserbase") || lower === "browserbase") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25">
        <Cloud className="w-2.5 h-2.5" />
        Browserbase
      </span>
    );
  }
  if (lower.includes("tavily") || lower === "tavily") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
        style={{
          background: "oklch(0.6 0.22 35 / 0.10)",
          color: "oklch(0.55 0.20 35)",
          borderColor: "oklch(0.6 0.22 35 / 0.30)",
        }}
      >
        <Search className="w-2.5 h-2.5" />
        Tavily
      </span>
    );
  }
  if (lower.includes("vps") || lower === "vps") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
        <Server className="w-2.5 h-2.5" />
        VPS Hunter
      </span>
    );
  }
  return null;
}

interface OpportunityCardProps {
  finding: OpportunityFinding;
  index: number;
  onDismiss: (id: string) => void;
  onAskNduna: (finding: OpportunityFinding) => void;
  isDismissing?: boolean;
}

export function OpportunityCard({
  finding,
  index,
  onDismiss,
  onAskNduna,
  isDismissing = false,
}: OpportunityCardProps) {
  const meta = CATEGORY_META[finding.category];
  const score = Number(finding.relevanceScore);

  return (
    <article
      className={`relative rounded-xl border bg-card shadow-card card-hover-lift animate-fade-up stagger-${Math.min(index + 1, 6)} overflow-hidden`}
      data-ocid={`opportunity.item.${index + 1}`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: ACCENT_COLORS[finding.category] }}
        aria-hidden="true"
      />

      <div className="pl-5 pr-4 py-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${meta.textClass} ${meta.bgClass} ${meta.borderClass}`}
            data-ocid={`opportunity.category_badge.${index + 1}`}
          >
            <span aria-hidden="true">{meta.emoji}</span>
            {meta.label}
          </span>
          <button
            type="button"
            onClick={() => onDismiss(finding.id)}
            disabled={isDismissing}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
            aria-label="Dismiss opportunity"
            data-ocid={`opportunity.dismiss_button.${index + 1}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="font-display font-bold text-foreground text-base leading-tight mb-1.5 pr-2">
          {finding.title}
        </h3>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
          {finding.description}
        </p>

        {/* Relevance bar */}
        <div className="mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Relevance
          </span>
          <RelevanceBar score={score} />
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground min-w-0 flex-wrap">
            {/* Source badge */}
            <SourceBadge source={finding.source} />

            {finding.source.startsWith("http") ? (
              <a
                href={finding.source}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors truncate max-w-[120px]"
                data-ocid={`opportunity.source_link.${index + 1}`}
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Source</span>
              </a>
            ) : (
              <span className="flex items-center gap-1 truncate max-w-[120px]">
                <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                <span className="truncate">
                  {finding.source || "Nduna scan"}
                </span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0 opacity-60" />
              <ExpiryLabel expiresAt={finding.expiresAt} />
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 text-xs gap-1.5 h-7 flex-shrink-0"
            onClick={() => onAskNduna(finding)}
            data-ocid={`opportunity.ask_nduna_button.${index + 1}`}
          >
            <Bot className="w-3 h-3" />
            Ask Nduna
          </Button>
        </div>
      </div>
    </article>
  );
}

export { CATEGORY_META };
