/**
 * AdvertisingPage.tsx — Full advertising pipeline: pitch deck generator + deal tracker
 * + Competitive Intelligence (Tier 2+) + Smart Recommendations (Tier 3)
 * + Automated Lead Research (Tier 2+, powered by Camofox).
 * + Nduna Sales Coach panel (sales-playbook skill).
 * Analytics tracking for deal events is handled via useUpdatePitchStatus hook.
 */

import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import type { UserProfile } from "../backend";
import CompanyPipelineTracker from "../features/advertising/CompanyPipelineTracker";
import { NdunaSalesCoach } from "../features/advertising/NdunaSalesCoach";
import PitchDeckGenerator from "../features/advertising/PitchDeckGenerator";
import { NdunaEmailLog } from "../features/agentmail";
import CompetitiveIntelligenceDashboard from "../features/competitive/CompetitiveIntelligenceDashboard";
import LeadsList from "../features/leads/LeadsList";
import SmartRecommendations from "../features/smart-recommendations/SmartRecommendations";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { TierGate } from "../routing/TierGate";
import { logPageView } from "../services/behavioralContextService";

interface Props {
  profile?: UserProfile | null;
  tier?: number;
  isAdmin?: boolean;
}

export default function AdvertisingPage({
  profile,
  tier: tierProp,
  isAdmin = false,
}: Props) {
  const { identity } = useInternetIdentity();

  const driverId = identity ? identity.getPrincipal().toText() : "anonymous";
  const driverName = profile?.displayName?.trim() || "Driver";
  const tier = tierProp ?? Number(profile?.subscriptionTier ?? 1);
  const effectiveTier = isAdmin ? Math.max(tier, 3) : tier;

  const [selectedCompany, setSelectedCompany] = useState<string | undefined>();

  // Behavioral context: log page view on mount
  useEffect(() => {
    logPageView("advertising");
  }, []);

  const handleGeneratePitch = (company: string) => {
    setSelectedCompany(company);
    const el = document.getElementById("pitch-deck-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToPitch = () => {
    const el = document.getElementById("pitch-deck-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sectionHeadingStyle = { color: "oklch(0.75 0.12 85 / 0.85)" };

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-6 space-y-8"
      data-ocid="advertising-page"
    >
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
          <Megaphone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Advertising Pipeline
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Turn your car into a R10k–R50k/month income stream.
          </p>
        </div>
      </div>

      {/* Smart Recommendations — Tier 3 only */}
      {effectiveTier >= 3 && (
        <section
          aria-labelledby="smart-recs-heading"
          data-ocid="advertising.smart_recs.section"
        >
          <h2
            id="smart-recs-heading"
            className="text-sm font-bold text-foreground uppercase tracking-widest mb-3"
            style={sectionHeadingStyle}
          >
            Nduna's Top Picks
          </h2>
          <SmartRecommendations onGeneratePitch={handleGeneratePitch} />
        </section>
      )}

      {/* Automated Lead Research — Tier 2+ */}
      <section
        aria-labelledby="leads-heading"
        data-ocid="advertising.leads.section"
      >
        <div className="mb-3">
          <h2
            id="leads-heading"
            className="text-sm font-bold text-foreground uppercase tracking-widest"
            style={sectionHeadingStyle}
          >
            Companies to Pitch This Week
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nduna found these companies in your city — they're ready to hear
            your pitch.
          </p>
        </div>
        <TierGate
          feature="Lead Research"
          requiredTier={2}
          tier={effectiveTier}
          isAdmin={isAdmin}
          onSettings={() => {
            document
              .querySelector('[data-ocid="settings-page"]')
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <LeadsList onPitchStrategy={handleGeneratePitch} />
        </TierGate>
      </section>

      {/* Pitch Deck Section */}
      <section
        id="pitch-deck-section"
        aria-labelledby="pitch-deck-heading"
        data-ocid="advertising.pitch_deck.section"
      >
        <h2
          id="pitch-deck-heading"
          className="text-sm font-bold text-foreground uppercase tracking-widest mb-3"
          style={sectionHeadingStyle}
        >
          Your Pitch Deck
        </h2>
        <PitchDeckGenerator
          driverId={driverId}
          driverName={driverName}
          preselectedCompany={selectedCompany}
          tier={effectiveTier}
        />
      </section>

      {/* Deal Pipeline Section */}
      <section
        aria-labelledby="deal-pipeline-heading"
        data-ocid="advertising.pipeline.section"
      >
        <h2
          id="deal-pipeline-heading"
          className="text-sm font-bold text-foreground uppercase tracking-widest mb-3"
          style={sectionHeadingStyle}
        >
          Deal Pipeline
        </h2>
        <CompanyPipelineTracker driverId={driverId} />
      </section>

      {/* Competitive Intelligence — Tier 2+ */}
      {effectiveTier >= 2 && (
        <section
          aria-labelledby="competitive-heading"
          data-ocid="advertising.competitive.section"
        >
          <h2
            id="competitive-heading"
            className="text-sm font-bold text-foreground uppercase tracking-widest mb-3"
            style={sectionHeadingStyle}
          >
            Network Intelligence
          </h2>
          <CompetitiveIntelligenceDashboard
            onGeneratePitch={() => {
              scrollToPitch();
            }}
          />
        </section>
      )}

      {/* Nduna Sales Coach — Tier 2+ */}
      {effectiveTier >= 2 && (
        <section
          aria-labelledby="sales-coach-heading"
          data-ocid="advertising.sales_coach.section"
        >
          <h2
            id="sales-coach-heading"
            className="text-sm font-bold text-foreground uppercase tracking-widest mb-3"
            style={sectionHeadingStyle}
          >
            Nduna's Sales Coach
          </h2>
          <NdunaSalesCoach selectedCompany={selectedCompany} />
        </section>
      )}

      {/* Nduna's Outreach Emails — Tier 2+ */}
      {effectiveTier >= 2 && (
        <section
          aria-labelledby="email-activity-heading"
          data-ocid="advertising.email_activity.section"
        >
          <h2
            id="email-activity-heading"
            className="text-sm font-bold text-foreground uppercase tracking-widest mb-3"
            style={sectionHeadingStyle}
          >
            Nduna's Outreach Emails
          </h2>
          <NdunaEmailLog />
        </section>
      )}
    </div>
  );
}
