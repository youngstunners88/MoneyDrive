/**
 * OpportunityList.tsx — Filtered, sorted, and grouped opportunity findings.
 * When filter is "all", groups by category with section headers.
 */

import { Skeleton } from "../../components/ui/skeleton";
import type {
  OpportunityCategory,
  OpportunityFinding,
} from "../../types/opportunities";
import { CATEGORY_META, OpportunityCard } from "./OpportunityCard";

export type FilterCategory = "all" | OpportunityCategory;
export type SortMode = "relevance" | "recent";

interface Props {
  findings: OpportunityFinding[];
  isLoading: boolean;
  filter: FilterCategory;
  sort: SortMode;
  onDismiss: (id: string) => Promise<void>;
  onAskNduna: (finding: OpportunityFinding) => void;
  dismissingId?: string;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-lg" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-28 rounded-md" />
      </div>
    </div>
  );
}

// ─── Group header ──────────────────────────────────────────────────────────────

function CategoryGroupHeader({ category }: { category: OpportunityCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <span className="text-base" aria-hidden="true">
        {meta.emoji}
      </span>
      <h4
        className={`text-xs font-bold uppercase tracking-wider ${meta.textClass}`}
      >
        {meta.label}
      </h4>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sortFindings(findings: OpportunityFinding[], sort: SortMode) {
  return [...findings].sort((a, b) =>
    sort === "relevance"
      ? Number(b.relevanceScore) - Number(a.relevanceScore)
      : Number(b.discoveredAt) - Number(a.discoveredAt),
  );
}

const CATEGORY_ORDER: OpportunityCategory[] = [
  "newPlatform",
  "platformPromotion",
  "incomeCategory",
  "intercityRoute",
  "businessLead",
  "regulatoryChange",
];

// ─── Main component ────────────────────────────────────────────────────────────

export function OpportunityList({
  findings,
  isLoading,
  filter,
  sort,
  onDismiss,
  onAskNduna,
  dismissingId,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="opportunity.loading_state">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const active = findings.filter((f) => !f.dismissed);
  const filtered =
    filter === "all" ? active : active.filter((f) => f.category === filter);
  const sorted = sortFindings(filtered, sort);

  if (sorted.length === 0) {
    return null; // Parent handles empty states
  }

  // Grouped display when filter is "all"
  if (filter === "all") {
    const groups: Record<string, OpportunityFinding[]> = {};
    for (const f of sorted) {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    }

    let globalIndex = 0;
    return (
      <div className="space-y-2" data-ocid="opportunity.list">
        {CATEGORY_ORDER.filter((cat) => groups[cat]?.length).map((cat) => (
          <section key={cat}>
            <CategoryGroupHeader category={cat} />
            <div className="space-y-3">
              {groups[cat].map((finding) => {
                const idx = globalIndex++;
                return (
                  <OpportunityCard
                    key={finding.id}
                    finding={finding}
                    index={idx}
                    onDismiss={onDismiss}
                    onAskNduna={onAskNduna}
                    isDismissing={dismissingId === finding.id}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    );
  }

  // Flat list for filtered category
  return (
    <div className="space-y-3" data-ocid="opportunity.list">
      {sorted.map((finding, idx) => (
        <OpportunityCard
          key={finding.id}
          finding={finding}
          index={idx}
          onDismiss={onDismiss}
          onAskNduna={onAskNduna}
          isDismissing={dismissingId === finding.id}
        />
      ))}
    </div>
  );
}
