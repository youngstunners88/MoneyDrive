/**
 * NdunaMarketingHQ.tsx — Campaign Engine control center.
 * Admin-only. Route: admin-marketing tab.
 * Nduna proposes campaigns → admin approves/rejects → campaigns execute.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Loader2,
  Mail,
  MessageSquare,
  Pause,
  Play,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
  Twitter,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CampaignStatus, MessageAngle as MessageAngleEnum } from "../backend.d";
import {
  ANGLE_COLORS,
  ANGLE_LABELS,
  CHANNEL_LABELS,
  type Campaign,
  type CampaignConfig,
  type MessageAngle,
  STATUS_COLORS,
  formatDate,
} from "../features/campaign/types";
import {
  useApproveCampaign,
  useCampaignConfig,
  useCampaignFailureLog,
  useGenerateWeeklyReport,
  useListCampaigns,
  usePauseAllCampaigns,
  useProposeCampaign,
  useRejectCampaign,
  useRequestChanges,
  useResumeAllCampaigns,
  useSetCampaignConfig,
} from "../features/campaign/useCampaign";
import { XPostingPanel } from "../features/x-posting/XPostingPanel";

// ── Types ──────────────────────────────────────────────────────────────────────

type HQTab = "pending" | "active" | "performance" | "x-posting" | "settings";

interface Props {
  isAdmin: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "whatsapp") return <MessageSquare className="w-3 h-3" />;
  if (channel === "email") return <Mail className="w-3 h-3" />;
  return (
    <span className="flex gap-0.5">
      <MessageSquare className="w-3 h-3" />
      <Mail className="w-3 h-3" />
    </span>
  );
}

function AngleBadge({ angle }: { angle: MessageAngle }) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold ${ANGLE_COLORS[angle]}`}
    >
      {ANGLE_LABELS[angle]}
    </Badge>
  );
}

function SegmentChip({ segment }: { segment: Campaign["segment"] }) {
  return (
    <Badge
      variant="outline"
      className="text-[10px] bg-primary/10 text-primary border-primary/30 font-semibold"
    >
      {segment.archetype} · {segment.city} · {segment.platform} · Tier{" "}
      {Number(segment.tier)}
    </Badge>
  );
}

// ── CampaignApprovalCard ──────────────────────────────────────────────────────

function CampaignApprovalCard({ campaign }: { campaign: Campaign }) {
  const [mode, setMode] = useState<"idle" | "changes" | "reject">("idle");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [expanded, setExpanded] = useState(false);

  const approve = useApproveCampaign();
  const reject = useRejectCampaign();
  const requestChanges = useRequestChanges();

  const handleApprove = () => {
    approve.mutate(
      { id: campaign.id },
      {
        onSuccess: () =>
          toast.success("Campaign approved! It will go live shortly."),
        onError: (e) => toast.error(`Approval failed: ${e.message}`),
      },
    );
  };

  const handleRequestChanges = () => {
    if (!notes.trim()) {
      toast.error("Please describe what needs to change.");
      return;
    }
    requestChanges.mutate(
      { id: campaign.id, notes },
      {
        onSuccess: () => {
          toast.success("Changes requested. Nduna will revise and resubmit.");
          setMode("idle");
          setNotes("");
        },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      },
    );
  };

  const handleReject = () => {
    if (!reason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    reject.mutate(
      { id: campaign.id, reason },
      {
        onSuccess: () => {
          toast.success("Campaign rejected.");
          setMode("idle");
          setReason("");
        },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      },
    );
  };

  const isBusy =
    approve.isPending || reject.isPending || requestChanges.isPending;

  return (
    <div
      className="bg-card rounded-2xl border-l-4 border-l-amber-500 border border-border shadow-card overflow-hidden"
      data-ocid={`campaign.approval.card.${campaign.id}`}
    >
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-2 items-center">
            <SegmentChip segment={campaign.segment} />
            {campaign.isAbTest && (
              <Badge
                variant="outline"
                className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30 gap-1"
              >
                <FlaskConical className="w-2.5 h-2.5" />
                A/B Test
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AngleBadge angle={campaign.angle} />
            <Badge
              variant="outline"
              className="text-[10px] gap-1 text-muted-foreground border-border"
            >
              <ChannelIcon channel={campaign.channel} />
              {CHANNEL_LABELS[campaign.channel]}
            </Badge>
          </div>
        </div>

        {/* Reach + date */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-gold" />
            <span className="font-semibold text-foreground">
              {Number(campaign.segment.estimatedCount).toLocaleString()}
            </span>{" "}
            est. drivers
          </span>
          <span>Proposed {formatDate(campaign.createdAt)}</span>
        </div>

        {/* Creative preview */}
        {campaign.creative && (
          <div className="bg-muted/40 rounded-xl p-3 border border-border">
            <p className="text-xs font-bold text-foreground leading-snug mb-1">
              {campaign.creative.copySubjectLine}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {campaign.creative.copyHook.slice(0, 120)}
              {campaign.creative.copyHook.length > 120 ? "…" : ""}
            </p>
            {(campaign.creative.imageUrl || campaign.creative.videoUrl) && (
              <div className="flex items-center gap-2 mt-2">
                {campaign.creative.imageUrl && (
                  <img
                    src={campaign.creative.imageUrl}
                    alt="Campaign visual"
                    className="w-16 h-16 rounded-lg object-cover border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                {campaign.creative.videoUrl && (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-purple-400 border-purple-500/30"
                  >
                    Video ready
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* A/B variant body (expanded) */}
        {expanded && campaign.creative && campaign.isAbTest && (
          <div className="bg-muted/20 rounded-xl p-3 border border-border text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground text-xs mb-1">
              Full copy (Variant A)
            </p>
            <p>{campaign.creative.copyBody}</p>
          </div>
        )}

        {/* Expand toggle */}
        {campaign.creative && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> Show full copy
              </>
            )}
          </button>
        )}

        {/* Action buttons */}
        {mode === "idle" && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={handleApprove}
              disabled={isBusy}
              data-ocid={`campaign.approve_button.${campaign.id}`}
            >
              {approve.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs"
              onClick={() => setMode("changes")}
              disabled={isBusy}
              data-ocid={`campaign.request_changes_button.${campaign.id}`}
            >
              Request Changes
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
              onClick={() => setMode("reject")}
              disabled={isBusy}
              data-ocid={`campaign.reject_button.${campaign.id}`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </Button>
          </div>
        )}

        {/* Request changes form */}
        {mode === "changes" && (
          <div
            className="space-y-2 pt-1"
            data-ocid={`campaign.changes_form.${campaign.id}`}
          >
            <Textarea
              placeholder="What needs to change? Be specific — Nduna will revise and resubmit."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[80px]"
              data-ocid={`campaign.changes_notes.${campaign.id}`}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="text-xs"
                onClick={handleRequestChanges}
                disabled={requestChanges.isPending}
                data-ocid={`campaign.changes_submit.${campaign.id}`}
              >
                {requestChanges.isPending && (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                )}
                Submit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setMode("idle")}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Reject form */}
        {mode === "reject" && (
          <div
            className="space-y-2 pt-1"
            data-ocid={`campaign.reject_form.${campaign.id}`}
          >
            <Textarea
              placeholder="Rejection reason (Nduna will log this for learning)."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs min-h-[72px] border-destructive/40"
              data-ocid={`campaign.reject_reason.${campaign.id}`}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs"
                onClick={handleReject}
                disabled={reject.isPending}
                data-ocid={`campaign.confirm_reject.${campaign.id}`}
              >
                {reject.isPending && (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                )}
                Confirm Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setMode("idle")}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ActiveCampaignCard ────────────────────────────────────────────────────────

function ActiveCampaignCard({ campaign }: { campaign: Campaign }) {
  const [expanded, setExpanded] = useState(false);
  const pauseAll = usePauseAllCampaigns();
  const resumeAll = useResumeAllCampaigns();

  const isActive = campaign.status === "active";

  const handleToggle = () => {
    if (isActive) {
      pauseAll.mutate(undefined, {
        onSuccess: () => toast.success("Campaign paused."),
        onError: () => toast.error("Failed to pause campaign."),
      });
    } else {
      resumeAll.mutate(undefined, {
        onSuccess: () => toast.success("Campaign resumed."),
        onError: () => toast.error("Failed to resume campaign."),
      });
    }
  };

  const accentClass = isActive
    ? "border-l-emerald-500"
    : "border-l-muted-foreground";

  return (
    <div
      className={`bg-card rounded-2xl border-l-4 ${accentClass} border border-border shadow-card overflow-hidden`}
      data-ocid={`campaign.active.card.${campaign.id}`}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-foreground">
              {campaign.segment.archetype} · {campaign.segment.city}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <SegmentChip segment={campaign.segment} />
              <AngleBadge angle={campaign.angle} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] capitalize ${STATUS_COLORS[campaign.status]}`}
            >
              {campaign.status}
            </Badge>
            <button
              type="button"
              onClick={handleToggle}
              disabled={pauseAll.isPending || resumeAll.isPending}
              className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg bg-muted/40 border border-border text-[11px] font-medium hover:bg-muted transition-colors"
              title={
                isActive
                  ? "Pauses all active campaigns"
                  : "Resumes all paused campaigns"
              }
              aria-label={
                isActive ? "Pause All campaigns" : "Resume All campaigns"
              }
              data-ocid={`campaign.toggle_button.${campaign.id}`}
            >
              {isActive ? (
                <>
                  <Pause className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400">Pause All</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Resume All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Published date */}
        {campaign.publishedAt && (
          <p className="text-[11px] text-muted-foreground">
            Published {formatDate(campaign.publishedAt)}
          </p>
        )}

        {/* A/B winner badge */}
        {campaign.isAbTest && campaign.abWinner && (
          <Badge
            variant="outline"
            className="text-[10px] bg-primary/10 text-primary border-primary/30 gap-1"
          >
            <Trophy className="w-2.5 h-2.5" />
            A/B Winner
          </Badge>
        )}

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          data-ocid={`campaign.details_toggle.${campaign.id}`}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Hide details
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> View details
            </>
          )}
        </button>

        {expanded && campaign.creative && (
          <div className="bg-muted/30 rounded-xl p-3 border border-border text-[11px] text-muted-foreground leading-relaxed space-y-1">
            <p className="font-bold text-foreground text-xs">
              {campaign.creative.copySubjectLine}
            </p>
            <p className="font-medium text-foreground/80">
              {campaign.creative.copyHook}
            </p>
            <p>{campaign.creative.copyBody}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Performance Tab ───────────────────────────────────────────────────────────

function PerformanceTab() {
  const { data: allCampaigns = [], isLoading: campaignsLoading } =
    useListCampaigns();
  const { data: failureLogs = [], isLoading: failureLoading } =
    useCampaignFailureLog();
  const generateReport = useGenerateWeeklyReport();

  const handleGenerateReport = () => {
    generateReport.mutate(undefined, {
      onSuccess: () =>
        toast.success("Weekly report generated! Check your email."),
      onError: (e) => toast.error(`Failed to generate report: ${e.message}`),
    });
  };

  // Aggregate stats
  const totalSends = 0;
  const totalConversions = 0;
  const totalRevenue = 0;

  // Angle performance (placeholder — wire to real metrics when available)
  const angles: MessageAngle[] = [
    MessageAngleEnum.earnings_proof,
    MessageAngleEnum.feature_benefit,
    MessageAngleEnum.referral_incentive,
    MessageAngleEnum.limited_time_offer,
  ];

  const angleStats = angles.map((a) => ({
    angle: a,
    count: allCampaigns.filter((c) => c.angle === a).length,
    conversion: 0,
  }));

  const maxAngleCount = Math.max(...angleStats.map((a) => a.count), 1);

  const channelStats = [
    {
      channel: "WhatsApp",
      count: allCampaigns.filter((c) => c.channel === "whatsapp").length,
      color: "bg-emerald-500",
    },
    {
      channel: "Email",
      count: allCampaigns.filter((c) => c.channel === "email").length,
      color: "bg-blue-500",
    },
    {
      channel: "Both",
      count: allCampaigns.filter((c) => c.channel === "both").length,
      color: "bg-primary",
    },
  ];

  const maxChannel = Math.max(...channelStats.map((c) => c.count), 1);

  return (
    <div className="space-y-4" data-ocid="campaign.performance.panel">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Campaigns",
            value: allCampaigns.length,
            icon: <BarChart3 className="w-4 h-4 text-primary" />,
            color: "bg-primary/10",
          },
          {
            label: "Total Sends",
            value: totalSends,
            icon: <TrendingUp className="w-4 h-4 text-gold" />,
            color: "bg-gold/10",
          },
          {
            label: "Conversions",
            value: totalConversions,
            icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
            color: "bg-emerald-500/10",
          },
          {
            label: "Revenue (R)",
            value: `R${totalRevenue.toLocaleString()}`,
            icon: <Trophy className="w-4 h-4 text-gold" />,
            color: "bg-gold/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}
            >
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="font-display font-bold text-lg text-foreground leading-tight">
                {campaignsLoading ? "—" : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Top angles */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">
            Message Angle Distribution
          </h3>
          <div className="space-y-2">
            {angleStats.map(({ angle, count }) => (
              <div
                key={angle}
                className="flex items-center gap-3"
                data-ocid={`campaign.performance.angle.${angle}`}
              >
                <AngleBadge angle={angle} />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${(count / maxAngleCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Channel performance */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">
            Channel Performance
          </h3>
          <div className="space-y-2">
            {channelStats.map(({ channel, count, color }) => (
              <div
                key={channel}
                className="flex items-center gap-3"
                data-ocid={`campaign.performance.channel.${channel.toLowerCase()}`}
              >
                <span className="text-xs text-foreground w-20 shrink-0">
                  {channel}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${(count / maxChannel) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Failure log */}
      <Card className="shadow-card" data-ocid="campaign.failure_log.panel">
        <CardContent className="p-4">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">
            Campaign Failure Log
          </h3>
          {failureLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : failureLogs.length === 0 ? (
            <div
              className="py-6 text-center"
              data-ocid="campaign.failure_log.empty_state"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No failures logged
              </p>
              <p className="text-xs text-muted-foreground">
                All campaigns have run cleanly
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {failureLogs.slice(0, 10).map((log, idx) => (
                <div
                  key={`${log.campaignId}-${idx}`}
                  className="rounded-xl bg-destructive/5 border border-destructive/20 px-3 py-2.5"
                  data-ocid={`campaign.failure_log.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                    <AngleBadge angle={log.angle} />
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDate(log.loggedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-destructive">{log.reason}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {log.segment.archetype} · {log.segment.city}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly report */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="gap-2 text-xs"
          onClick={handleGenerateReport}
          disabled={generateReport.isPending}
          data-ocid="campaign.generate_report_button"
        >
          {generateReport.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <BarChart3 className="w-3.5 h-3.5" />
          )}
          Generate Weekly Report
        </Button>
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

function SettingsTab() {
  const { data: config, isLoading } = useCampaignConfig();
  const setConfig = useSetCampaignConfig();
  const pauseAll = usePauseAllCampaigns();
  const [form, setForm] = useState<CampaignConfig>({
    maxActiveCampaignsPerDay: BigInt(3),
    maxMessagesPerSegmentPerWeek: BigInt(2),
    enabled: true,
    weeklyReportEnabled: true,
    adminEmail: "",
  });
  const [confirmPauseAll, setConfirmPauseAll] = useState(false);

  // Sync form when config loads
  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const handleSave = () => {
    setConfig.mutate(form, {
      onSuccess: () => toast.success("Campaign settings saved."),
      onError: (e) => toast.error(`Failed to save: ${e.message}`),
    });
  };

  const handlePauseAll = () => {
    pauseAll.mutate(undefined, {
      onSuccess: () => {
        toast.success("All active campaigns paused.");
        setConfirmPauseAll(false);
      },
      onError: () => toast.error("Failed to pause campaigns."),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5" data-ocid="campaign.settings.panel">
      <Card className="shadow-card">
        <CardContent className="p-5 space-y-5">
          {/* Master switch */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Campaign Engine
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                When disabled, Nduna cannot propose new campaigns
              </p>
            </div>
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => setForm({ ...form, enabled: v })}
              data-ocid="campaign.settings.enabled_switch"
            />
          </div>

          {/* Max campaigns / day */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Max active campaigns per day
            </Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={Number(form.maxActiveCampaignsPerDay)}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxActiveCampaignsPerDay: BigInt(
                    Math.max(1, Number(e.target.value) || 1),
                  ),
                })
              }
              className="max-w-[120px]"
              data-ocid="campaign.settings.max_campaigns_input"
            />
          </div>

          {/* Max messages / segment / week */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Max messages per segment per week
            </Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={Number(form.maxMessagesPerSegmentPerWeek)}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxMessagesPerSegmentPerWeek: BigInt(
                    Math.max(1, Number(e.target.value) || 1),
                  ),
                })
              }
              className="max-w-[120px]"
              data-ocid="campaign.settings.max_messages_input"
            />
          </div>

          {/* Weekly report */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  Weekly performance report
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nduna emails a summary every Monday morning
                </p>
              </div>
              <Switch
                checked={form.weeklyReportEnabled}
                onCheckedChange={(v) =>
                  setForm({ ...form, weeklyReportEnabled: v })
                }
                data-ocid="campaign.settings.weekly_report_switch"
              />
            </div>
            {form.weeklyReportEnabled && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Report email address
                </Label>
                <Input
                  type="email"
                  placeholder="admin@moneydrive.co.za"
                  value={form.adminEmail}
                  onChange={(e) =>
                    setForm({ ...form, adminEmail: e.target.value })
                  }
                  data-ocid="campaign.settings.admin_email_input"
                />
              </div>
            )}
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleSave}
            disabled={setConfig.isPending}
            data-ocid="campaign.settings.save_button"
          >
            {setConfig.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="shadow-card border-destructive/30">
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-sm text-destructive mb-2">
            Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Pausing all campaigns stops all active sends immediately.
          </p>
          {!confirmPauseAll ? (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-2"
              onClick={() => setConfirmPauseAll(true)}
              data-ocid="campaign.pause_all_button"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause All Active Campaigns
            </Button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-destructive font-semibold">
                Are you sure?
              </p>
              <Button
                size="sm"
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs"
                onClick={handlePauseAll}
                disabled={pauseAll.isPending}
                data-ocid="campaign.pause_all_confirm_button"
              >
                {pauseAll.isPending && (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                )}
                Confirm Pause All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setConfirmPauseAll(false)}
                data-ocid="campaign.pause_all_cancel_button"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NdunaMarketingHQ({ isAdmin }: Props) {
  const [activeTab, setActiveTab] = useState<HQTab>("pending");

  const { data: pendingCampaigns = [], isLoading: pendingLoading } =
    useListCampaigns(CampaignStatus.pending_approval);
  const { data: activeCampaigns = [], isLoading: activeLoading } =
    useListCampaigns(CampaignStatus.active);
  const proposeCampaign = useProposeCampaign();
  const pauseAll = usePauseAllCampaigns();
  const resumeAll = useResumeAllCampaigns();

  const handlePropose = () => {
    proposeCampaign.mutate(undefined, {
      onSuccess: () =>
        toast.success("Nduna has proposed a new campaign. Check Pending tab."),
      onError: (e) =>
        toast.error(`Nduna couldn't plan a campaign: ${e.message}`),
    });
  };

  const handlePauseAll = () => {
    pauseAll.mutate(undefined, {
      onSuccess: () => toast.success("All campaigns paused."),
      onError: () => toast.error("Failed to pause campaigns."),
    });
  };

  const handleResumeAll = () => {
    resumeAll.mutate(undefined, {
      onSuccess: () => toast.success("All campaigns resumed."),
      onError: () => toast.error("Failed to resume campaigns."),
    });
  };

  if (!isAdmin) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-16 text-center"
        data-ocid="campaign.error_state"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-2">
          Admin Only
        </h2>
        <p className="text-muted-foreground text-sm">
          Nduna Marketing HQ is only accessible to MoneyDrive administrators.
        </p>
      </div>
    );
  }

  const tabs: {
    id: HQTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      id: "pending",
      label: "Pending",
      icon: <Sparkles className="w-3.5 h-3.5" />,
      count: pendingCampaigns.length,
    },
    {
      id: "active",
      label: "Active",
      icon: <Play className="w-3.5 h-3.5" />,
      count: activeCampaigns.length,
    },
    {
      id: "performance",
      label: "Performance",
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
    {
      id: "x-posting",
      label: "X Posting",
      icon: <Twitter className="w-3.5 h-3.5" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div
      className="max-w-4xl mx-auto px-4 py-6 space-y-6"
      data-ocid="campaign.page"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Nduna Marketing HQ
            </h1>
            <p className="text-xs text-muted-foreground">
              Campaign Engine · Admin approval required before publish
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-2 text-xs font-semibold"
          onClick={handlePropose}
          disabled={proposeCampaign.isPending}
          data-ocid="campaign.ask_nduna_button"
        >
          {proposeCampaign.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Ask Nduna to Plan
        </Button>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border overflow-x-auto"
        role="tablist"
        data-ocid="campaign.tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 justify-center whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid={`campaign.tab.${tab.id}`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Pending Approval */}
      {activeTab === "pending" && (
        <div
          className="space-y-4 animate-fade-in"
          data-ocid="campaign.pending.panel"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
              Campaigns Waiting for Your Review
              {pendingCampaigns.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30"
                >
                  {pendingCampaigns.length}
                </Badge>
              )}
            </h2>
          </div>

          {pendingLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : pendingCampaigns.length === 0 ? (
            <div
              className="bg-card rounded-2xl border border-border p-10 text-center space-y-4"
              data-ocid="campaign.pending.empty_state"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-foreground">
                  Nduna is ready to plan
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click "Ask Nduna to Plan" and he'll propose a targeted
                  campaign for your review.
                </p>
              </div>
              <Button
                size="sm"
                className="gap-2 mx-auto"
                onClick={handlePropose}
                disabled={proposeCampaign.isPending}
                data-ocid="campaign.pending.plan_button"
              >
                {proposeCampaign.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Ask Nduna to Plan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCampaigns.map((c) => (
                <CampaignApprovalCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Active Campaigns */}
      {activeTab === "active" && (
        <div
          className="space-y-4 animate-fade-in"
          data-ocid="campaign.active.panel"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-display font-bold text-sm text-foreground">
              Active Campaigns
            </h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                onClick={handlePauseAll}
                disabled={pauseAll.isPending}
                data-ocid="campaign.pause_all_top_button"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause All
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                onClick={handleResumeAll}
                disabled={resumeAll.isPending}
                data-ocid="campaign.resume_all_button"
              >
                <Play className="w-3.5 h-3.5" />
                Resume All
              </Button>
            </div>
          </div>

          {activeLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : activeCampaigns.length === 0 ? (
            <div
              className="bg-card rounded-2xl border border-border p-10 text-center"
              data-ocid="campaign.active.empty_state"
            >
              <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground">
                No active campaigns
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Approve a campaign from the Pending tab to get one running.
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              {activeCampaigns.map((c) => (
                <ActiveCampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Performance */}
      {activeTab === "performance" && (
        <div className="animate-fade-in">
          <PerformanceTab />
        </div>
      )}

      {/* Tab: X Posting */}
      {activeTab === "x-posting" && (
        <div
          className="animate-fade-in space-y-4"
          data-ocid="campaign.x_posting.panel"
        >
          <div className="flex items-center gap-3 pb-1">
            <div className="w-9 h-9 rounded-xl bg-muted/40 border border-border flex items-center justify-center shrink-0">
              <Twitter className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-foreground">
                Nduna on X
              </p>
              <p className="text-xs text-muted-foreground">
                Layer 4 — Nduna earns from 0xWork, funds his own X account,
                posts autonomously
              </p>
            </div>
          </div>
          <XPostingPanel compact={false} />
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === "settings" && (
        <div className="animate-fade-in">
          <SettingsTab />
        </div>
      )}
    </div>
  );
}
