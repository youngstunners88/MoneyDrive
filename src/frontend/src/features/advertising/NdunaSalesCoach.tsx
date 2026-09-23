/**
 * NdunaSalesCoach.tsx
 * Collapsible sales coaching panel pulled from the sales-playbook skill.
 * Shows BANT qualification checklist, objection handling cards, and follow-up templates.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mail,
  Square,
  Target,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface NdunaSalesCoachProps {
  selectedCompany?: string;
}

const BANT_CHECKS = [
  {
    id: "decision_maker",
    label: "Decision maker identified (not receptionist)",
  },
  { id: "budget", label: "Budget confirmed or next cycle known" },
  { id: "discovery", label: "Discovery call or WhatsApp response received" },
  { id: "proposal", label: "Proposal sent" },
  { id: "followup", label: "Follow-up scheduled (Day 3 / 7 / 14)" },
  { id: "objections", label: "Key objections handled" },
  { id: "pilot", label: "30-day pilot proposed" },
] as const;

type CheckId = (typeof BANT_CHECKS)[number]["id"];

const OBJECTION_CARDS = [
  {
    id: "dont_advertise",
    trigger: '"We don\'t advertise in cars."',
    response:
      "That's exactly why there's an opportunity — your competitors haven't saturated this channel yet. You'd be one of the first in your industry doing this in SA.",
  },
  {
    id: "budget_allocated",
    trigger: '"Our budget is already allocated."',
    response:
      "When does your next budget cycle open? I'll time my proposal around that. In the meantime, I'll send a one-pager so you're ready to evaluate it quickly.",
  },
  {
    id: "how_effective",
    trigger: '"How do we know it\'s effective?"',
    response:
      "MoneyDrive tracks route data, trip count, and passenger demographics per driver. I can show you a monthly reach report — more trackable than a billboard.",
  },
  {
    id: "too_expensive",
    trigger: '"It\'s too expensive."',
    response:
      "R5,000/month = R0.63 per impression. Google Display Network charges R5–R15 per click. You're getting brand recall at a fraction of digital ad costs.",
  },
  {
    id: "check_boss",
    trigger: '"I need to check with my boss."',
    response:
      "Of course. I'll send a one-page proposal you can forward directly — pricing, reach metrics, and a 30-day pilot offer. What's the best email for you?",
  },
] as const;

const FOLLOWUP_TEMPLATES = [
  {
    day: "Day 3",
    subject: "Re: In-Car Advertising — Quick Question",
    body: "Following up on the in-car advertising opportunity. I put together a quick one-page proposal for your review. Does your team have a campaign planned for next month? Happy to jump on a quick call.",
  },
  {
    day: "Day 7",
    subject: "[Company] x MoneyDrive — 30-Day Pilot Option",
    body: "I've put together a 30-day pilot option specifically for your brand — lower entry point, full tracking report at the end, no long-term commitment. Reply 'interested' and I'll send the details.",
  },
  {
    day: "Day 14",
    subject: "Last nudge — Advertising Spot",
    body: "I have one more slot available in your coverage area. After this I'll offer it to another company in your industry. Reply 'yes' to lock it in, or I'll check back next quarter.",
  },
];

export function NdunaSalesCoach({ selectedCompany }: NdunaSalesCoachProps) {
  const [expanded, setExpanded] = useState(false);
  const [checks, setChecks] = useState<Set<CheckId>>(new Set());
  const [openObjection, setOpenObjection] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<
    "qualify" | "objections" | "followup"
  >("qualify");

  const toggleCheck = (id: CheckId) => {
    setChecks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const checkedCount = checks.size;
  const dealStrength =
    checkedCount >= 5 ? "Hot" : checkedCount >= 3 ? "Warm" : "Cold";
  const strengthColor =
    dealStrength === "Hot"
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      : dealStrength === "Warm"
        ? "bg-gold/10 text-gold border-gold/30"
        : "bg-muted text-muted-foreground border-border";

  return (
    <div
      className="rounded-2xl border border-border overflow-hidden bg-card shadow-card"
      data-ocid="advertising.sales_coach.panel"
    >
      {/* Header / toggle */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-semibold"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        data-ocid="advertising.sales_coach.toggle"
      >
        <span className="flex items-center gap-2 text-foreground">
          <Bot className="w-4 h-4 text-primary" />
          Nduna's Sales Coach
          {selectedCompany && (
            <Badge
              variant="outline"
              className="text-[10px] border-primary/30 text-primary"
            >
              {selectedCompany}
            </Badge>
          )}
          {checkedCount > 0 && (
            <Badge variant="outline" className={`text-[10px] ${strengthColor}`}>
              {dealStrength} Lead
            </Badge>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Section tabs */}
          <div className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border">
            {(
              [
                {
                  id: "qualify",
                  icon: <Target className="w-3.5 h-3.5" />,
                  label: "Qualify",
                },
                {
                  id: "objections",
                  icon: <HelpCircle className="w-3.5 h-3.5" />,
                  label: "Objections",
                },
                {
                  id: "followup",
                  icon: <Mail className="w-3.5 h-3.5" />,
                  label: "Follow-Up",
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 justify-center ${
                  activeSection === tab.id
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid={`advertising.sales_coach.tab.${tab.id}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Section: Qualify (BANT checklist) */}
          {activeSection === "qualify" && (
            <div
              className="space-y-3"
              data-ocid="advertising.sales_coach.qualify.panel"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                  Deal Qualification Checklist
                </p>
                <div
                  className={`text-xs px-2.5 py-1 rounded-full font-bold border ${strengthColor}`}
                >
                  {checkedCount}/7 — {dealStrength}
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dealStrength === "Hot"
                      ? "bg-emerald-500"
                      : dealStrength === "Warm"
                        ? "bg-gold"
                        : "bg-muted-foreground/40"
                  }`}
                  style={{ width: `${(checkedCount / 7) * 100}%` }}
                />
              </div>
              <div className="space-y-2">
                {BANT_CHECKS.map((check, i) => {
                  const checked = checks.has(check.id);
                  return (
                    <button
                      key={check.id}
                      type="button"
                      onClick={() => toggleCheck(check.id)}
                      className="w-full flex items-center gap-3 text-left rounded-lg p-2.5 transition-colors hover:bg-muted/40"
                      data-ocid={`advertising.sales_coach.check.${String(i + 1)}`}
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span
                        className={`text-xs ${checked ? "text-foreground font-medium" : "text-muted-foreground"}`}
                      >
                        {check.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                <strong>Hot</strong> = 5+ checks. <strong>Warm</strong> = 3–4.{" "}
                <strong>Cold</strong> = ≤2 — park for 90 days.
              </p>
            </div>
          )}

          {/* Section: Objections */}
          {activeSection === "objections" && (
            <div
              className="space-y-2"
              data-ocid="advertising.sales_coach.objections.panel"
            >
              <p className="text-xs font-semibold text-foreground mb-1">
                Tap an objection to see the response
              </p>
              {OBJECTION_CARDS.map((card) => (
                <div
                  key={card.id}
                  className="rounded-xl border border-border overflow-hidden"
                  data-ocid={`advertising.sales_coach.objection.${card.id}`}
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-foreground bg-muted/30 hover:bg-muted/50 transition-colors text-left gap-2"
                    onClick={() =>
                      setOpenObjection(
                        openObjection === card.id ? null : card.id,
                      )
                    }
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                      {card.trigger}
                    </span>
                    {openObjection === card.id ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {openObjection === card.id && (
                    <div className="px-3 py-3 bg-primary/5 border-t border-border">
                      <p className="text-xs text-foreground leading-relaxed">
                        <Zap className="w-3 h-3 text-primary inline mr-1.5 shrink-0" />
                        {card.response}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Section: Follow-Up Templates */}
          {activeSection === "followup" && (
            <div
              className="space-y-3"
              data-ocid="advertising.sales_coach.followup.panel"
            >
              <p className="text-xs font-semibold text-foreground">
                AgentMail Follow-Up Sequence
              </p>
              {FOLLOWUP_TEMPLATES.map((template, i) => (
                <div
                  key={template.day}
                  className="rounded-xl border border-border p-3 bg-muted/20 space-y-2"
                  data-ocid={`advertising.sales_coach.followup.${String(i + 1)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-primary/30 text-primary"
                    >
                      {template.day}
                    </Badge>
                    <p className="text-[11px] font-semibold text-foreground flex-1 min-w-0 truncate ml-2">
                      {template.subject}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {template.body}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(template.body);
                    }}
                    data-ocid={`advertising.sales_coach.followup.copy.${String(i + 1)}`}
                  >
                    <Mail className="w-3 h-3" />
                    Copy Template
                  </Button>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                Nduna sends these automatically via AgentMail when you set a
                follow-up reminder in the Deal Pipeline.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
