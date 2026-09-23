/**
 * LeadsPage.tsx — Standalone leads page with Exa enrichment badges and
 * detailed company insights panel.
 * Used when navigating directly to the leads section.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Calendar,
  ExternalLink,
  Mail,
  Phone,
  RefreshCw,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "../components/ui/skeleton";
import type {
  ExaCompanyResult,
  LeadStatus,
  ScrapedLead,
} from "../features/leads/types";
import {
  useDriverLeads,
  useTriggerLeadRefresh,
  useUpdateLeadStatus,
} from "../features/leads/useLeads";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "pending", label: "New" },
  { value: "interested", label: "Interested" },
  { value: "pitched", label: "Pitched" },
  { value: "rejected", label: "Rejected" },
  { value: "dealClosed", label: "Deal Closed" },
];

function getStatusClass(status: LeadStatus): string {
  switch (status) {
    case "interested":
      return "interested";
    case "pitched":
      return "pitched";
    case "rejected":
      return "rejected";
    case "dealClosed":
      return "deal-closed";
    default:
      return "";
  }
}

function getStatusLabel(status: LeadStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? "New";
}

// ─── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const tier = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  return (
    <span className={`lead-score ${tier}`} aria-label={`Score ${score}`}>
      {score}
    </span>
  );
}

// ─── Exa Insights subsection ───────────────────────────────────────────────────

function ExaInsights({ data }: { data: ExaCompanyResult }) {
  const fields: {
    label: string;
    value: string | undefined;
    icon: React.ReactNode;
  }[] = [
    {
      label: "Industry",
      value: data.industry[0] ?? undefined,
      icon: <Building2 className="w-3 h-3" />,
    },
    {
      label: "Employees",
      value: data.employeeCount[0] ?? undefined,
      icon: <Users className="w-3 h-3" />,
    },
    {
      label: "Founded",
      value: data.founded[0] ?? undefined,
      icon: <Calendar className="w-3 h-3" />,
    },
    {
      label: "Contact",
      value: data.contactEmail[0] ?? undefined,
      icon: <Mail className="w-3 h-3" />,
    },
  ];

  return (
    <div
      className="mt-3 rounded-xl p-3 space-y-2.5"
      style={{
        background: "oklch(0.60 0.22 35 / 0.06)",
        border: "1px solid oklch(0.60 0.22 35 / 0.25)",
      }}
      data-ocid="lead-exa-insights.panel"
    >
      <div className="flex items-center gap-1.5">
        <Sparkles
          className="w-3.5 h-3.5"
          style={{ color: "oklch(0.60 0.22 35)" }}
        />
        <span
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "oklch(0.60 0.22 35)" }}
        >
          Exa Insights
        </span>
      </div>

      {data.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {data.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-1.5">
        {fields.map(({ label, value, icon }) => (
          <div key={label} className="flex items-start gap-1.5">
            <span
              className="mt-0.5 shrink-0"
              style={{ color: "oklch(0.60 0.22 35 / 0.8)" }}
            >
              {icon}
            </span>
            <div className="min-w-0">
              <p
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "oklch(0.60 0.22 35 / 0.7)" }}
              >
                {label}
              </p>
              <p className="text-xs text-foreground truncate">
                {value?.trim() ? (
                  value
                ) : (
                  <span className="text-muted-foreground italic">
                    Not available
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {data.snippet && (
        <p
          className="text-[11px] italic rounded-lg px-2.5 py-2 leading-relaxed"
          style={{
            background: "oklch(0.60 0.22 35 / 0.08)",
            color: "oklch(0.40 0.12 35)",
            borderLeft: "2px solid oklch(0.60 0.22 35 / 0.4)",
          }}
        >
          "{data.snippet}"
        </p>
      )}
    </div>
  );
}

// ─── Exa Verified badge ────────────────────────────────────────────────────────

function ExaVerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-default"
      style={{
        background: "oklch(0.60 0.22 35 / 0.15)",
        color: "oklch(0.50 0.22 35)",
        border: "1px solid oklch(0.60 0.22 35 / 0.35)",
      }}
      title="Company data sourced from Exa — verified and enriched"
      aria-label="Verified by Exa"
      data-ocid="lead-exa-badge"
    >
      <Sparkles className="w-2.5 h-2.5" />
      Verified by Exa
    </span>
  );
}

// ─── Lead card ─────────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: ScrapedLead;
  onPitchStrategy?: (companyName: string) => void;
}

function LeadCard({ lead, onPitchStrategy }: LeadCardProps) {
  const updateStatus = useUpdateLeadStatus();
  const [localStatus, setLocalStatus] = useState<LeadStatus>(lead.status);
  const [showExa, setShowExa] = useState(false);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (newStatus === localStatus) return;
    setLocalStatus(newStatus);
    try {
      await updateStatus.mutateAsync({ leadId: lead.id, status: newStatus });
      toast.success(`Marked as ${getStatusLabel(newStatus)}`);
    } catch {
      setLocalStatus(lead.status);
      toast.error("Failed to update status");
    }
  };

  const city = lead.address
    ? lead.address.split(",").slice(-2).join(",").trim()
    : "";

  return (
    <article
      className="lead-card animate-fade-up"
      data-ocid={`lead-card.${lead.id}`}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 mb-3">
        <ScoreBadge score={lead.compositeScore} />
        <div className="flex-1 min-w-0">
          {/* Enrichment badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {lead.exaEnriched && <ExaVerifiedBadge />}
            {lead.source === "tavily" && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: "oklch(0.60 0.22 35 / 0.15)",
                  color: "oklch(0.60 0.22 35)",
                  border: "1px solid oklch(0.60 0.22 35 / 0.35)",
                }}
                data-ocid={`lead-tavily-badge.${lead.id}`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                AI Enhanced
              </span>
            )}
            {lead.tavilyHiringSignal && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: "oklch(0.50 0.18 145 / 0.15)",
                  color: "oklch(0.40 0.18 145)",
                  border: "1px solid oklch(0.50 0.18 145 / 0.35)",
                }}
                data-ocid={`lead-hiring-badge.${lead.id}`}
              >
                🟢 Hiring
              </span>
            )}
          </div>

          <h3 className="font-display font-bold text-foreground text-base leading-tight truncate">
            {lead.companyName}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs capitalize">
              {lead.industry}
            </Badge>
            {city && (
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {city}
              </span>
            )}
          </div>
          {/* Tavily AI snippet */}
          {lead.tavilySnippet && (
            <p className="text-xs text-muted-foreground italic mt-1.5 line-clamp-2">
              {lead.tavilySnippet}
            </p>
          )}
        </div>
      </div>

      {/* Contact row */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
        {lead.website && (
          <a
            href={
              lead.website.startsWith("http")
                ? lead.website
                : `https://${lead.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary transition-colors"
            aria-label={`Visit ${lead.companyName} website`}
          >
            <ExternalLink className="w-3 h-3" />
            Website
          </a>
        )}
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Phone className="w-3 h-3" />
            {lead.phone}
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="flex items-center gap-1 hover:text-primary transition-colors truncate max-w-[180px]"
          >
            <Mail className="w-3 h-3" />
            <span className="truncate">{lead.email}</span>
          </a>
        )}
      </div>

      {/* Status row + actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <fieldset
          className="flex gap-1.5 flex-wrap border-0 p-0 m-0"
          aria-label="Lead status"
          data-ocid={`lead-status.${lead.id}`}
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              disabled={updateStatus.isPending}
              className={`lead-status-badge ${getStatusClass(opt.value)} cursor-pointer transition-opacity ${
                localStatus === opt.value
                  ? "opacity-100 ring-1 ring-current"
                  : "opacity-50 hover:opacity-80"
              }`}
              aria-pressed={localStatus === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </fieldset>

        <div className="flex items-center gap-2 flex-wrap">
          {lead.exaEnriched && (
            <button
              type="button"
              onClick={() => setShowExa((v) => !v)}
              className="text-[11px] font-semibold underline underline-offset-2 transition-colors"
              style={{ color: "oklch(0.50 0.22 35)" }}
              data-ocid={`lead-exa-toggle.${lead.id}`}
            >
              {showExa ? "Hide Exa Insights" : "Show Exa Insights"}
            </button>
          )}
          {onPitchStrategy && (
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 text-xs gap-1.5 h-7"
              onClick={() => onPitchStrategy(lead.companyName)}
              data-ocid={`lead-pitch.${lead.id}`}
            >
              <Target className="w-3 h-3" />
              Get Pitch Strategy
            </Button>
          )}
        </div>
      </div>

      {/* Exa Insights expandable section */}
      {showExa && lead.exaEnriched && <ExaInsights data={lead.exaEnriched} />}
    </article>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function LeadSkeleton() {
  return (
    <div className="lead-card">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-3 mb-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-6 w-24 rounded ml-auto" />
      </div>
    </div>
  );
}

// ─── Main page component ───────────────────────────────────────────────────────

interface LeadsPageProps {
  onPitchStrategy?: (companyName: string) => void;
  weekNumber?: number;
  year?: number;
}

export default function LeadsPage({
  onPitchStrategy,
  weekNumber,
  year,
}: LeadsPageProps) {
  const { data: leads, isLoading } = useDriverLeads(weekNumber, year);
  const triggerRefresh = useTriggerLeadRefresh();

  const handleRefresh = async () => {
    try {
      const msg = await triggerRefresh.mutateAsync();
      toast.success(msg || "Lead refresh started — check back in a moment.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refresh failed");
    }
  };

  const exaEnrichedCount = leads?.filter((l) => l.exaEnriched).length ?? 0;

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-6 space-y-5"
      data-ocid="leads.page"
    >
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold text-foreground">
            Companies to Pitch
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {leads && leads.length > 0
              ? `${leads.length} companies found this week${exaEnrichedCount > 0 ? ` · ${exaEnrichedCount} Exa-enriched` : ""}`
              : "Nduna's weekly lead research — ready to pitch"}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-border/60 hover:border-primary/40 gap-1.5 text-xs h-8 shrink-0"
          onClick={handleRefresh}
          disabled={triggerRefresh.isPending}
          data-ocid="leads.refresh.button"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${triggerRefresh.isPending ? "animate-spin" : ""}`}
          />
          {triggerRefresh.isPending ? "Finding..." : "Refresh"}
        </Button>
      </div>

      {/* Exa enrichment info bar */}
      {exaEnrichedCount > 0 && (
        <div
          className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-xs"
          style={{
            background: "oklch(0.60 0.22 35 / 0.08)",
            border: "1px solid oklch(0.60 0.22 35 / 0.25)",
            color: "oklch(0.40 0.12 35)",
          }}
          data-ocid="leads.exa_info.panel"
        >
          <Sparkles
            className="w-4 h-4 shrink-0"
            style={{ color: "oklch(0.60 0.22 35)" }}
          />
          <span>
            <strong>{exaEnrichedCount}</strong> of these companies have been
            enriched with Exa company research — tap{" "}
            <strong>"Show Exa Insights"</strong> on any verified lead for
            detailed company data.
          </span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3" data-ocid="leads.loading_state">
          {[1, 2, 3].map((i) => (
            <LeadSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!leads || leads.length === 0) && (
        <div
          className="flex flex-col items-center justify-center gap-4 py-12 text-center"
          data-ocid="leads.empty_state"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Target className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground mb-1">
              No leads yet for this week
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Tap <strong>Refresh</strong> and Nduna will find companies in your
              city ready to hear your pitch.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 gap-2"
            onClick={handleRefresh}
            disabled={triggerRefresh.isPending}
            data-ocid="leads.empty_refresh.button"
          >
            <RefreshCw
              className={`w-4 h-4 ${triggerRefresh.isPending ? "animate-spin" : ""}`}
            />
            {triggerRefresh.isPending ? "Searching..." : "Find Companies"}
          </Button>
        </div>
      )}

      {/* Lead cards */}
      {!isLoading && leads && leads.length > 0 && (
        <div className="space-y-3" data-ocid="leads.list">
          {leads.map((lead, index) => (
            <div
              key={lead.id}
              className={`stagger-${Math.min(index + 1, 6)}`}
              data-ocid={`leads.item.${index + 1}`}
            >
              <LeadCard lead={lead} onPitchStrategy={onPitchStrategy} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
