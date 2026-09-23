/**
 * NdunaEmailLog.tsx — Nduna's email activity widget
 * Shows sent emails (pitch, follow-up, briefing, onboarding, website)
 */

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mail,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface EmailLog {
  id: string;
  emailType: string;
  recipient: string;
  subject: string;
  sentAt: bigint;
  status: string;
}

const EMAIL_TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  pitch: {
    label: "Pitch",
    bg: "oklch(0.6 0.22 35 / 0.15)",
    text: "oklch(0.6 0.22 35)",
    border: "oklch(0.6 0.22 35 / 0.4)",
  },
  followup: {
    label: "Follow-up",
    bg: "oklch(0.75 0.12 85 / 0.15)",
    text: "oklch(0.75 0.12 85)",
    border: "oklch(0.75 0.12 85 / 0.4)",
  },
  "follow-up": {
    label: "Follow-up",
    bg: "oklch(0.75 0.12 85 / 0.15)",
    text: "oklch(0.75 0.12 85)",
    border: "oklch(0.75 0.12 85 / 0.4)",
  },
  briefing: {
    label: "Briefing",
    bg: "oklch(0.5 0.18 230 / 0.15)",
    text: "oklch(0.5 0.18 230)",
    border: "oklch(0.5 0.18 230 / 0.4)",
  },
  onboarding: {
    label: "Onboarding",
    bg: "oklch(0.55 0.14 145 / 0.15)",
    text: "oklch(0.55 0.14 145)",
    border: "oklch(0.55 0.14 145 / 0.4)",
  },
  website: {
    label: "Website",
    bg: "oklch(0.55 0.18 310 / 0.15)",
    text: "oklch(0.55 0.18 310)",
    border: "oklch(0.55 0.18 310 / 0.4)",
  },
};

function getTypeConfig(type: string) {
  const key = type.toLowerCase().replace(/\s+/g, "-");
  return (
    EMAIL_TYPE_CONFIG[key] ?? {
      label: type,
      bg: "oklch(0.22 0.02 85 / 0.3)",
      text: "oklch(0.65 0.03 85)",
      border: "oklch(0.22 0.02 85 / 0.5)",
    }
  );
}

function relativeTime(nanos: bigint): string {
  const ms = Number(nanos / BigInt(1_000_000));
  const diffMs = Date.now() - ms;
  if (diffMs < 0) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-4 w-12 flex-shrink-0" />
    </div>
  );
}

export function NdunaEmailLog() {
  const { actor, isFetching } = useActor();
  const [expanded, setExpanded] = useState(false);

  const { data: logs = [], isLoading } = useQuery<EmailLog[]>({
    queryKey: ["emailLogs"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getEmailLogs();
      return Array.isArray(result) ? result : [];
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
    refetchInterval: 90_000,
  });

  const visible = expanded ? logs : logs.slice(0, 10);
  const hasMore = logs.length > 10;

  return (
    <div
      className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
      data-ocid="nduna_email_log.card"
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b border-border"
        style={{ borderBottomColor: "oklch(0.75 0.12 85 / 0.2)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "oklch(0.75 0.12 85 / 0.12)",
            border: "1px solid oklch(0.75 0.12 85 / 0.25)",
          }}
        >
          <Mail className="w-4 h-4" style={{ color: "oklch(0.75 0.12 85)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm font-bold text-foreground leading-none">
            Nduna's Email Activity
          </h3>
          {!isLoading && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {logs.length === 0
                ? "No emails sent yet"
                : `${logs.length} email${logs.length !== 1 ? "s" : ""} sent`}
            </p>
          )}
        </div>
        {logs.length > 0 && (
          <Badge
            className="text-xs font-mono flex-shrink-0"
            style={{
              background: "oklch(0.75 0.12 85 / 0.12)",
              color: "oklch(0.75 0.12 85)",
              border: "1px solid oklch(0.75 0.12 85 / 0.3)",
            }}
          >
            {logs.length}
          </Badge>
        )}
      </div>

      {/* Body */}
      <div className="px-4">
        {isLoading ? (
          <div data-ocid="nduna_email_log.loading_state">
            {Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div
            className="py-8 text-center"
            data-ocid="nduna_email_log.empty_state"
          >
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-30 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nduna hasn't sent any emails yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1 opacity-70">
              Set up a pitch to get started.
            </p>
          </div>
        ) : (
          <>
            <ul
              className="divide-y divide-border"
              data-ocid="nduna_email_log.list"
            >
              {visible.map((log, idx) => {
                const cfg = getTypeConfig(log.emailType);
                const isSent = log.status?.toLowerCase() === "sent";
                return (
                  <li
                    key={log.id ?? idx}
                    className="flex items-center gap-3 py-3 animate-fade-up"
                    style={{ animationDelay: `${idx * 40}ms` }}
                    data-ocid={`nduna_email_log.item.${idx + 1}`}
                  >
                    {/* Type badge */}
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 uppercase tracking-wide"
                      style={{
                        background: cfg.bg,
                        color: cfg.text,
                        border: `1px solid ${cfg.border}`,
                      }}
                    >
                      {cfg.label}
                    </span>

                    {/* Email info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {log.recipient}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {log.subject}
                      </p>
                    </div>

                    {/* Time + status */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(log.sentAt)}
                      </span>
                      {isSent ? (
                        <CheckCircle2
                          className="w-3.5 h-3.5"
                          style={{ color: "oklch(0.55 0.14 145)" }}
                          aria-label="Sent"
                        />
                      ) : (
                        <XCircle
                          className="w-3.5 h-3.5"
                          style={{ color: "oklch(0.52 0.2 20)" }}
                          aria-label="Failed"
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150 border-t border-border mt-1"
                style={{ color: "oklch(0.75 0.12 85)" }}
                data-ocid="nduna_email_log.see_all_toggle"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> See all{" "}
                    {logs.length} emails
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
