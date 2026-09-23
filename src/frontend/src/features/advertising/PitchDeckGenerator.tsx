/**
 * PitchDeckGenerator.tsx
 *
 * Generates a branded advertising pitch deck for the driver.
 * Enhanced with Exposure Intelligence (Tier 3) and Nduna's Strategy (Tier 3).
 * Shows a mobile-responsive preview and produces a downloadable jsPDF.
 * Action buttons: Download PDF | Share via WhatsApp | Email to Company
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jsPDF } from "jspdf";
import {
  ChevronDown,
  Download,
  Info,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  type ExposureMetrics,
  SAZone,
  SA_ZONE_LABELS,
} from "../geolocation/types";
import {
  useExposureMetrics,
  useRouteOptIn,
  useUpdateRouteOptIn,
} from "../geolocation/useGeolocation";
import { useHermes } from "../hermes/useHermes";

// ─── Pricing tiers ────────────────────────────────────────────────────────────

const PRICING_TIERS = [
  {
    label: "Starter",
    monthly: "R10,000",
    duration: "3 months",
    total: "R30,000",
    perDay: "R330",
    highlight: false,
  },
  {
    label: "Growth",
    monthly: "R20,000",
    duration: "6 months",
    total: "R120,000",
    perDay: "R655",
    highlight: true,
  },
  {
    label: "Premium",
    monthly: "R50,000",
    duration: "12 months",
    total: "R600,000",
    perDay: "R1,640",
    highlight: false,
  },
] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

interface PitchDeckGeneratorProps {
  driverId: string;
  driverName: string;
  /** Pre-selected company name passed in from SmartRecommendations */
  preselectedCompany?: string;
  tier?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatExposure(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function buildWhatsAppText(
  driverName: string,
  totalTrips: number,
  exposure: number,
): string {
  return encodeURIComponent(
    `Hi, I'm ${driverName} — a professional rideshare driver reaching out about an advertising opportunity on my vehicle.\n\n📊 My stats:\n• ${totalTrips} trips/month\n• ~${formatExposure(exposure)} passenger exposures/month\n• Daily routes through high-traffic business districts\n\nI'd love to discuss a car-wrap partnership. Please reply and I'll send you my full MoneyDrive pitch deck with pricing and exposure details.`,
  );
}

function buildEmailBody(
  driverName: string,
  totalTrips: number,
  exposure: number,
): string {
  return encodeURIComponent(
    `Hi,\n\nMy name is ${driverName} and I'm a professional rideshare driver exploring advertising partnerships.\n\nHere are my key stats:\n- ${totalTrips} trips per month\n- Approx. ${formatExposure(exposure)} passenger & pedestrian exposures\n- Routes covering major business corridors\n\nI believe my vehicle represents a high-value, targeted advertising platform. I'd be happy to send across my full pitch deck including pricing tiers (R10,000–R50,000/month).\n\nPlease reply to this email or call/WhatsApp me to discuss further.\n\nKind regards,\n${driverName}`,
  );
}

function buildNdunaStrategyLines(
  zone: SAZone | undefined,
  monthlyPassengers: number,
  exposure: ExposureMetrics | undefined,
): string[] {
  const zoneName =
    zone && zone !== SAZone.Generic ? SA_ZONE_LABELS[zone] : "South Africa";

  // Broader SA company selection by zone — covers all SA industries
  const topCompanyByZone: Partial<Record<SAZone, string>> = {
    [SAZone.Sandton]: "Standard Bank or Discovery",
    [SAZone.Midrand]: "FNB or Vodacom Business",
    [SAZone.CapeTownCBD]: "Capitec or Shoprite",
    [SAZone.JohannesburgCBD]: "Nedbank or Absa",
    [SAZone.PretoriaCBD]: "Momentum or Sanlam",
    [SAZone.DurbanBeachfront]: "Old Mutual or Pick n Pay",
    [SAZone.Umhlanga]: "Outsurance or Telkom",
    [SAZone.Soweto]: "MTN or Cell C",
  };

  const topCompany =
    zone && zone !== SAZone.Generic
      ? (topCompanyByZone[zone] ?? "MTN, FNB, Vodacom, or Standard Bank")
      : "MTN, FNB, Vodacom, or Standard Bank";

  const lines: string[] = [];

  lines.push(
    `Based on your ${zoneName} route and ${monthlyPassengers.toLocaleString()} monthly passengers, your vehicle is a premium advertising platform.`,
  );
  lines.push(
    `Companies like ${topCompany} respond best to drivers in high-traffic corridors — your zone qualifies.`,
  );

  if (exposure) {
    const peakExposure = Math.round(exposure.monthlyExposure * 0.12);
    lines.push(
      `Lead with the 6pm peak hour data — ${formatExposure(peakExposure)} people see your car during that window alone.`,
    );
  } else {
    lines.push(
      `Lead with peak-hour data — that's when brand visibility is highest for advertisers.`,
    );
  }

  lines.push(
    "Recommended approach: Open with ROI comparison vs. billboard advertising — it closes deals faster.",
  );
  lines.push(
    "Follow-up strategy: If no reply in 3 days, follow up referencing the Monday morning peak data — companies respond to specifics.",
  );

  return lines;
}

// ─── PDF generation ───────────────────────────────────────────────────────────

function generatePDF(
  driverName: string,
  totalTrips: number,
  exposure: number,
  peakHourRanges: string[],
  topEarningDays: string[],
  tier: number,
  exposureMetrics: ExposureMetrics | undefined,
  isUsingFallback: boolean,
  zone: SAZone | undefined,
  targetCompany?: string,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const BURNT = "#D85A30";
  const GOLD = "#BA7517";
  const FOREST = "#1A6B2A";
  const NAVY = "#0F1419";
  const OFF_WHITE = "#F5F4F0";
  const MUTED = "#6B7280";
  const W = 210;
  const MARGIN = 18;
  const CONTENT_W = W - MARGIN * 2;

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(NAVY);
  doc.rect(0, 0, W, 38, "F");

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BURNT);
  doc.text("Money", MARGIN, 20);
  const mW = doc.getTextWidth("Money");
  doc.setTextColor(GOLD);
  doc.text("Drive", MARGIN + mW, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(OFF_WHITE);
  doc.text("Earnings Optimization + Income Expansion System", MARGIN, 28);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const headerLine = targetCompany
    ? `${driverName} — Advertising Opportunity · ${targetCompany}`
    : `${driverName} — Advertising Opportunity`;
  doc.text(headerLine, MARGIN, 35);

  // ── Section 1: Advertising Value ─────────────────────────────────────────
  let y = 50;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BURNT);
  doc.text("ADVERTISING VALUE", MARGIN, y);
  y += 5;

  doc.setDrawColor(BURNT);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 6;

  const statsRows: [string, string][] = [
    ["Monthly Trips", `${totalTrips} trips`],
    [
      "Estimated Monthly Exposure",
      `${formatExposure(exposure)} people see your vehicle`,
    ],
    [
      "Peak Earning Hours",
      peakHourRanges.length > 0 ? peakHourRanges.slice(0, 3).join(", ") : "N/A",
    ],
    [
      "Top Earning Days",
      topEarningDays.length > 0 ? topEarningDays.slice(0, 3).join(", ") : "N/A",
    ],
  ];

  doc.setFontSize(10);
  for (const [label, value] of statsRows) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(NAVY);
    doc.text(`${label}:`, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(value, MARGIN + 65, y);
    y += 7;
  }

  // ── Section 2: Why Advertise on This Vehicle ─────────────────────────────
  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BURNT);
  doc.text("WHY ADVERTISE ON THIS VEHICLE", MARGIN, y);
  y += 5;
  doc.setDrawColor(BURNT);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 6;

  const bullets = [
    "Moving billboard through premium business districts every day",
    "Consistent high-traffic routes — Sandton, CBD, Midrand, and more",
    "Face-to-face engagement with passengers in an undistracted environment",
    "Car wrap advertising visible to pedestrians, drivers & passengers 24/7",
  ];

  doc.setFontSize(10);
  for (const bullet of bullets) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(NAVY);
    doc.text(`\u2022  ${bullet}`, MARGIN, y);
    y += 6.5;
  }

  // ── Section 3: Exposure Intelligence (Tier 2+) ───────────────────────────
  if (exposureMetrics && tier >= 2) {
    y += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(FOREST);
    doc.text("EXPOSURE INTELLIGENCE", MARGIN, y);
    y += 5;
    doc.setDrawColor(FOREST);
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
    y += 6;

    // Traffic intelligence box
    const boxH = tier >= 3 ? 34 : 28;
    doc.setFillColor("#F0F9F2");
    doc.rect(MARGIN, y, CONTENT_W / 2 - 2, boxH, "F");
    doc.setDrawColor(FOREST);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, y, CONTENT_W / 2 - 2, boxH, "S");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(FOREST);
    doc.text("Traffic Intelligence", MARGIN + 2, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(NAVY);
    doc.setFontSize(8);
    doc.text(
      `Daily vehicles: ${exposureMetrics.dailyVehicles.toLocaleString()}`,
      MARGIN + 2,
      y + 11,
    );
    doc.text(
      `Daily pedestrians: ${exposureMetrics.dailyPedestrians.toLocaleString()}`,
      MARGIN + 2,
      y + 17,
    );
    doc.text(
      `Monthly exposure: ${formatExposure(exposureMetrics.monthlyExposure)}`,
      MARGIN + 2,
      y + 23,
    );
    if (tier >= 3) {
      doc.setTextColor(MUTED);
      doc.setFontSize(7);
      doc.text(
        isUsingFallback
          ? "* Conservative estimates"
          : `Confidence: ${Math.round(exposureMetrics.confidenceScore * 100)}%`,
        MARGIN + 2,
        y + 30,
      );
    }

    // ROI comparison box
    const roiX = MARGIN + CONTENT_W / 2 + 2;
    const roiW = CONTENT_W / 2 - 2;
    doc.setFillColor("#FFF8E8");
    doc.rect(roiX, y, roiW, boxH, "F");
    doc.setDrawColor(GOLD);
    doc.setLineWidth(0.3);
    doc.rect(roiX, y, roiW, boxH, "S");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(GOLD);
    doc.text("ROI Comparison", roiX + 2, y + 5);

    const billboardCity = zone ? SA_ZONE_LABELS[zone].split(" ")[0] : "SA";
    const efficiency =
      exposureMetrics.monthlyExposure > 0
        ? Math.round(exposureMetrics.monthlyExposure / 200_000)
        : 3;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(NAVY);
    doc.setFontSize(7.5);
    doc.text(`Billboard (${billboardCity}):`, roiX + 2, y + 11);
    doc.text("200k exp. @ R50,000/mo", roiX + 2, y + 16);
    doc.text("Your car:", roiX + 2, y + 22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(FOREST);
    doc.text(
      `${formatExposure(exposureMetrics.monthlyExposure)} @ R20,000/mo`,
      roiX + 2,
      y + 27,
    );
    if (tier >= 3 && efficiency > 1) {
      doc.setFontSize(7);
      doc.setTextColor(GOLD);
      doc.text(`${efficiency}x more cost-efficient`, roiX + 2, y + 33);
    }

    y += boxH + 6;
  }

  // ── Section 4: Nduna's Strategy (Tier 3 only) ────────────────────────────
  if (tier >= 3) {
    y += 2;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(GOLD);
    doc.text("NDUNA'S STRATEGY", MARGIN, y);
    y += 5;
    doc.setDrawColor(GOLD);
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
    y += 6;

    const strategyLines = buildNdunaStrategyLines(
      zone,
      Number(exposure),
      exposureMetrics,
    );

    doc.setFontSize(9);
    for (const line of strategyLines) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(NAVY);
      const wrapped = doc.splitTextToSize(line, CONTENT_W - 4);
      for (const wrappedLine of wrapped) {
        doc.text(`\u2022  ${wrappedLine}`, MARGIN, y);
        y += 5.5;
      }
    }
    y += 2;
  }

  // ── Section 5: Pricing ────────────────────────────────────────────────────
  // Check if we need a new page
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BURNT);
  doc.text("ADVERTISING PACKAGES", MARGIN, y);
  y += 5;
  doc.setDrawColor(BURNT);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 5;

  const COL_WIDTHS = [36, 36, 36, 36, 28];
  const COLS = ["Package", "Duration", "Monthly", "Total", "Per Day"];
  const HEADER_H = 8;
  doc.setFillColor(GOLD);
  doc.rect(MARGIN, y, CONTENT_W, HEADER_H, "F");

  let cx = MARGIN;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  for (let i = 0; i < COLS.length; i++) {
    doc.text(COLS[i], cx + 2, y + 5.5);
    cx += COL_WIDTHS[i];
  }
  y += HEADER_H;

  for (const t of PRICING_TIERS) {
    const rowH = 9;
    const isHighlight = t.highlight;
    if (isHighlight) {
      doc.setFillColor(BURNT);
    } else {
      doc.setFillColor(OFF_WHITE);
    }
    doc.rect(MARGIN, y, CONTENT_W, rowH, "F");

    const rowData = [t.label, t.duration, t.monthly, t.total, t.perDay];
    cx = MARGIN;
    doc.setFontSize(9);
    doc.setFont("helvetica", isHighlight ? "bold" : "normal");
    doc.setTextColor(isHighlight ? "#FFFFFF" : NAVY);
    for (let i = 0; i < rowData.length; i++) {
      doc.text(rowData[i], cx + 2, y + 6);
      cx += COL_WIDTHS[i];
    }
    doc.setDrawColor(isHighlight ? BURNT : "#D1D5DB");
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, y, CONTENT_W, rowH, "S");
    y += rowH;
  }

  // ── Section 6: Next Steps ─────────────────────────────────────────────────
  y += 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BURNT);
  doc.text("NEXT STEPS", MARGIN, y);
  y += 5;
  doc.setDrawColor(BURNT);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(NAVY);
  doc.text(
    "Ready to put your brand in front of thousands of people a month?",
    MARGIN,
    y,
  );
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BURNT);
  doc.text(
    "Contact us via MoneyDrive to start your partnership today.",
    MARGIN,
    y,
  );
  y += 10;

  doc.setFillColor(BURNT);
  doc.rect(MARGIN, y, CONTENT_W, 10, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(
    "Reply to this pitch or contact MoneyDrive — we'll connect you within 48 hours.",
    MARGIN + 4,
    y + 6.5,
  );

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(
      `Powered by MoneyDrive | Earnings Optimization System | Generated ${new Date().toLocaleDateString("en-ZA")}`,
      MARGIN,
      290,
    );
  }

  doc.save(`MoneyDrive-${driverName.replace(/\s+/g, "-")}-Pitch.pdf`);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PitchSkeleton() {
  return (
    <div className="pitch-deck-container animate-fade-up" aria-busy="true">
      <div
        className="pitch-deck-preview"
        style={{ background: "oklch(0.14 0.01 85)", minHeight: 420 }}
      >
        <div
          className="skeleton-loader rounded mb-4"
          style={{ height: 48, width: "70%" }}
        />
        <div
          className="skeleton-loader rounded mb-3"
          style={{ height: 18, width: "50%" }}
        />
        <div
          className="skeleton-loader rounded mb-2"
          style={{ height: 14, width: "90%" }}
        />
        <div
          className="skeleton-loader rounded mb-2"
          style={{ height: 14, width: "80%" }}
        />
        <div
          className="skeleton-loader rounded mb-5"
          style={{ height: 14, width: "60%" }}
        />
        <div
          className="skeleton-loader rounded mb-4"
          style={{ height: 80, width: "100%" }}
        />
        <div
          className="skeleton-loader rounded"
          style={{ height: 60, width: "100%" }}
        />
      </div>
      <div className="pitch-actions">
        <div
          className="skeleton-loader rounded"
          style={{ height: 44, flex: 1 }}
        />
        <div
          className="skeleton-loader rounded"
          style={{ height: 44, flex: 1 }}
        />
        <div
          className="skeleton-loader rounded"
          style={{ height: 44, flex: 1 }}
        />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function PitchEmptyState() {
  return (
    <div
      className="pitch-deck-container animate-fade-up"
      data-ocid="pitch-deck-empty"
    >
      <div
        className="flex flex-col items-center justify-center gap-4 p-8 text-center"
        style={{ minHeight: 320 }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 64,
            height: 64,
            background: "oklch(var(--sa-burnt-orange) / 0.12)",
            border: "1.5px solid oklch(var(--sa-burnt-orange) / 0.35)",
          }}
        >
          <Info size={28} className="text-burnt-orange" />
        </div>
        <div>
          <h3 className="font-display text-base font-semibold text-foreground mb-1">
            Your stats power the pitch
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Drive more trips to unlock your advertising pitch deck. Once Nduna
            has enough data, you'll generate a professional deck ready to send
            to MTN, FNB, Vodacom, and more.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{
            background: "oklch(var(--gold) / 0.08)",
            border: "1px solid oklch(var(--gold) / 0.2)",
          }}
        >
          <TrendingUp size={16} className="text-gold" />
          <span className="text-xs text-gold font-medium">
            Keep logging trips — your deck unlocks automatically
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Zone selector ────────────────────────────────────────────────────────────

interface ZoneSelectorProps {
  value: SAZone;
  onChange: (z: SAZone) => void;
  isSaving: boolean;
  onSave: () => void;
}

function ZoneSelector({
  value,
  onChange,
  isSaving,
  onSave,
}: ZoneSelectorProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl mb-4"
      style={{
        background: "oklch(var(--gold) / 0.07)",
        border: "1px solid oklch(var(--gold) / 0.25)",
      }}
      data-ocid="pitch-zone-selector"
    >
      <MapPin size={16} className="text-gold shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground mb-1">
          Select your primary route zone
        </p>
        <Select value={value} onValueChange={(v) => onChange(v as SAZone)}>
          <SelectTrigger className="h-8 text-xs" data-ocid="pitch-zone-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SAZone).map((z) => (
              <SelectItem key={z} value={z} className="text-xs">
                {SA_ZONE_LABELS[z]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-colors"
        style={{
          background: "oklch(0.60 0.22 85)",
          color: "#fff",
          opacity: isSaving ? 0.6 : 1,
        }}
        data-ocid="pitch-zone-save"
      >
        {isSaving ? "Saving..." : "Set Zone"}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PitchDeckGenerator({
  driverId: _driverId,
  driverName,
  preselectedCompany,
  tier = 1,
}: PitchDeckGeneratorProps) {
  const { analyticsProfile, profileLoading } = useHermes(3);

  // Target company name — pre-filled from SmartRecommendations or typed manually
  const [targetCompany, setTargetCompany] = useState<string>(
    preselectedCompany ?? "",
  );

  // Sync when a new company is selected from SmartRecommendations
  useEffect(() => {
    if (preselectedCompany) {
      setTargetCompany(preselectedCompany);
      // Scroll to the pitch section so the user sees the filled-in company name
      const el = document.getElementById("pitch-deck-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [preselectedCompany]);

  // Route opt-in
  const { data: routeOptIn } = useRouteOptIn();
  const updateRouteOptIn = useUpdateRouteOptIn();

  const [localZone, setLocalZone] = useState<SAZone>(
    routeOptIn?.primaryRoute ?? SAZone.Generic,
  );

  const activeZone = routeOptIn?.primaryRoute ?? localZone;
  const showZoneSelector = !routeOptIn;

  // Exposure metrics — only fetch for Tier 2+
  const {
    data: exposureMetrics,
    isLoading: exposureLoading,
    isUsingFallback,
  } = useExposureMetrics(tier >= 2 ? activeZone : undefined);

  const handleSaveZone = () => {
    updateRouteOptIn.mutate({ primaryRoute: localZone });
  };

  if (profileLoading || (tier >= 2 && exposureLoading))
    return <PitchSkeleton />;

  if (
    !analyticsProfile ||
    (analyticsProfile.totalTrips === 0n &&
      analyticsProfile.estimatedCarExposure === 0n)
  ) {
    return <PitchEmptyState />;
  }

  const totalTrips = Number(analyticsProfile.totalTrips);
  const exposure = Number(analyticsProfile.estimatedCarExposure);
  const peakHourRanges: string[] = analyticsProfile.peakHourRanges ?? [];
  const topEarningDays: string[] = analyticsProfile.topEarningDays ?? [];
  const totalEarnings = Number(analyticsProfile.totalEarnings ?? 0n);

  const avgMonthly =
    totalTrips > 0
      ? Math.round((totalEarnings / 100 / totalTrips) * totalTrips)
      : 0;

  const ndunaStrategyLines =
    tier >= 3
      ? buildNdunaStrategyLines(activeZone, totalTrips, exposureMetrics)
      : [];

  const handleDownloadPDF = () => {
    generatePDF(
      driverName,
      totalTrips,
      exposure,
      peakHourRanges,
      topEarningDays,
      tier,
      tier >= 2 ? exposureMetrics : undefined,
      isUsingFallback,
      activeZone,
      targetCompany || undefined,
    );
  };

  const handleWhatsApp = () => {
    const text = buildWhatsAppText(driverName, totalTrips, exposure);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Advertising Partnership Opportunity");
    const body = buildEmailBody(driverName, totalTrips, exposure);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div
      className="pitch-deck-container animate-fade-up"
      data-ocid="pitch-deck-generator"
      id="pitch-deck-section"
    >
      {/* Zone selector (only if no route set yet) */}
      {showZoneSelector && (
        <ZoneSelector
          value={localZone}
          onChange={setLocalZone}
          isSaving={updateRouteOptIn.isPending}
          onSave={handleSaveZone}
        />
      )}

      {/* ── Preview ─────────────────────────────────────────────────────── */}
      <div className="pitch-deck-preview">
        {/* Header */}
        <div
          className="pitch-section"
          style={{
            background: "#0F1419",
            borderRadius: 8,
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div className="flex items-baseline gap-0 mb-1">
            <span
              className="font-display text-2xl font-bold"
              style={{ color: "#D85A30" }}
            >
              Money
            </span>
            <span
              className="font-display text-2xl font-bold"
              style={{ color: "#BA7517" }}
            >
              Drive
            </span>
          </div>
          <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
            Earnings Optimization + Income Expansion System
          </p>
          <p className="font-semibold text-sm" style={{ color: "#F9FAFB" }}>
            {driverName} — Advertising Opportunity
            {targetCompany && (
              <span style={{ color: "#BA7517" }}> · {targetCompany}</span>
            )}
          </p>
        </div>

        {/* Company name input */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl mb-1"
          style={{
            background: "oklch(0.60 0.22 85 / 0.07)",
            border: "1px solid oklch(0.60 0.22 85 / 0.25)",
          }}
          data-ocid="pitch-company-name-input"
        >
          <Megaphone size={15} style={{ color: "#D85A30", flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <label
              htmlFor="target-company"
              className="text-xs font-semibold text-foreground block mb-1"
            >
              Target company (optional)
            </label>
            <input
              id="target-company"
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              placeholder="e.g. MTN, FNB, Vodacom…"
              className="w-full text-xs rounded-lg px-2 py-1.5 bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Target company name for pitch deck"
            />
          </div>
        </div>

        {/* Advertising Value */}
        <div className="pitch-section">
          <p className="pitch-section-title">Advertising Value</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: <Zap size={16} style={{ color: "#D85A30" }} />,
                label: "Monthly Trips",
                value: `${totalTrips.toLocaleString()}`,
              },
              {
                icon: <TrendingUp size={16} style={{ color: "#BA7517" }} />,
                label: "Passenger Exposures",
                value: `~${formatExposure(exposure)}/mo`,
              },
              {
                icon: null,
                label: "Peak Hours",
                value:
                  peakHourRanges.length > 0
                    ? peakHourRanges.slice(0, 2).join(", ")
                    : "Not enough data",
              },
              {
                icon: null,
                label: "Top Days",
                value:
                  topEarningDays.length > 0
                    ? topEarningDays.slice(0, 2).join(", ")
                    : "Not enough data",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  padding: "0.75rem",
                }}
              >
                <div className="flex items-center gap-1 mb-1">
                  {stat.icon}
                  <span
                    className="text-xs font-medium uppercase"
                    style={{ color: "#6B7280", letterSpacing: "0.5px" }}
                  >
                    {stat.label}
                  </span>
                </div>
                <p
                  className="font-display font-bold text-sm"
                  style={{ color: "#111827" }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {avgMonthly > 0 && (
            <div
              className="mt-3 px-3 py-2 rounded-lg flex items-center gap-2"
              style={{
                background: "rgba(186,117,23,0.08)",
                border: "1px solid rgba(186,117,23,0.25)",
              }}
            >
              <TrendingUp size={14} style={{ color: "#BA7517" }} />
              <span className="text-xs" style={{ color: "#78350F" }}>
                Avg. monthly earnings:{" "}
                <strong>R{avgMonthly.toLocaleString()}</strong> — showing
                consistent activity to advertisers
              </span>
            </div>
          )}
        </div>

        {/* Exposure Intelligence (Tier 2+) */}
        {tier >= 2 && exposureMetrics && (
          <div
            className="pitch-section"
            style={{
              border: "1px solid rgba(26,107,42,0.2)",
              borderRadius: 8,
              padding: "1rem",
              marginBottom: "1rem",
              background: "rgba(26,107,42,0.03)",
            }}
            data-ocid="pitch-exposure-section"
          >
            <p className="pitch-section-title" style={{ color: "#1A6B2A" }}>
              Exposure Intelligence
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Traffic data box */}
              <div
                style={{
                  background: "#F0F9F2",
                  border: "1px solid rgba(26,107,42,0.2)",
                  borderRadius: 8,
                  padding: "0.75rem",
                }}
              >
                <p
                  className="text-xs font-bold mb-2"
                  style={{ color: "#1A6B2A" }}
                >
                  Traffic Intelligence
                </p>
                <div className="space-y-1.5">
                  {[
                    [
                      "Daily vehicles",
                      exposureMetrics.dailyVehicles.toLocaleString(),
                    ],
                    [
                      "Daily pedestrians",
                      exposureMetrics.dailyPedestrians.toLocaleString(),
                    ],
                    [
                      "Monthly exposure",
                      formatExposure(exposureMetrics.monthlyExposure),
                    ],
                    [
                      "Confidence",
                      `${Math.round(exposureMetrics.confidenceScore * 100)}%`,
                    ],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="flex justify-between items-center"
                    >
                      <span className="text-xs" style={{ color: "#6B7280" }}>
                        {label}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#111827" }}
                      >
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
                {isUsingFallback && (
                  <p className="text-[10px] mt-2" style={{ color: "#9CA3AF" }}>
                    * Conservative estimates — set your zone for real data
                  </p>
                )}
              </div>

              {/* ROI comparison box */}
              <div
                style={{
                  background: "#FFF8E8",
                  border: "1px solid rgba(186,117,23,0.25)",
                  borderRadius: 8,
                  padding: "0.75rem",
                }}
              >
                <p
                  className="text-xs font-bold mb-2"
                  style={{ color: "#BA7517" }}
                >
                  ROI vs. Billboard
                </p>
                <div className="space-y-2">
                  <div>
                    <p
                      className="text-[10px] font-medium"
                      style={{ color: "#6B7280" }}
                    >
                      Billboard (
                      {activeZone !== SAZone.Generic
                        ? SA_ZONE_LABELS[activeZone].split(" ")[0]
                        : "SA"}
                      ):
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "#374151" }}
                    >
                      200k exp. @ R50,000/mo
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-medium"
                      style={{ color: "#6B7280" }}
                    >
                      Your car:
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "#1A6B2A" }}
                    >
                      {formatExposure(exposureMetrics.monthlyExposure)} @
                      R20,000/mo
                    </p>
                  </div>
                  {exposureMetrics.monthlyExposure > 200_000 && (
                    <div
                      className="px-2 py-1 rounded text-center text-[10px] font-bold"
                      style={{
                        background: "rgba(26,107,42,0.1)",
                        color: "#1A6B2A",
                      }}
                    >
                      {Math.round(exposureMetrics.monthlyExposure / 200_000)}x
                      more efficient
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nduna's Strategy (Tier 3 only) */}
        {tier >= 3 && ndunaStrategyLines.length > 0 && (
          <div
            className="pitch-section"
            style={{
              border: "1px solid rgba(186,117,23,0.3)",
              borderRadius: 8,
              padding: "1rem",
              marginBottom: "1rem",
              background: "rgba(186,117,23,0.04)",
            }}
            data-ocid="pitch-nduna-strategy"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 22,
                  height: 22,
                  background: "rgba(186,117,23,0.15)",
                  border: "1px solid rgba(186,117,23,0.3)",
                }}
              >
                <ChevronDown size={12} style={{ color: "#BA7517" }} />
              </div>
              <p
                className="pitch-section-title mb-0"
                style={{ color: "#BA7517" }}
              >
                Nduna's Strategy
              </p>
              <span
                className="text-[10px] rounded-full px-2 py-0.5 font-semibold ml-auto"
                style={{
                  background: "rgba(186,117,23,0.15)",
                  color: "#78350F",
                }}
              >
                TIER 3
              </span>
            </div>
            <ul className="space-y-2">
              {ndunaStrategyLines.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span
                    style={{
                      color: "#BA7517",
                      fontSize: 10,
                      marginTop: 3,
                      flexShrink: 0,
                    }}
                  >
                    ●
                  </span>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "#374151" }}
                  >
                    {line}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pricing table */}
        <div className="pitch-section">
          <p className="pitch-section-title">Advertising Packages</p>
          <div className="overflow-x-auto">
            <table className="pitch-pricing-table" style={{ color: "#111827" }}>
              <thead>
                <tr>
                  {["Package", "Duration", "Monthly", "Total", "Per Day"].map(
                    (h) => (
                      <th key={h}>{h}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {PRICING_TIERS.map((t) => (
                  <tr
                    key={t.label}
                    style={
                      t.highlight
                        ? {
                            background: "#D85A30",
                            color: "#FFF",
                            fontWeight: 600,
                          }
                        : { background: "#F9FAFB" }
                    }
                  >
                    <td
                      style={{
                        border: "1px solid #E5E7EB",
                        padding: "0.65rem 0.75rem",
                        fontWeight: t.highlight ? 700 : 500,
                        color: t.highlight ? "#FFF" : "#111827",
                      }}
                    >
                      {t.label}
                    </td>
                    <td
                      style={{
                        border: "1px solid #E5E7EB",
                        padding: "0.65rem 0.75rem",
                        color: t.highlight ? "#FFF" : "#374151",
                      }}
                    >
                      {t.duration}
                    </td>
                    <td
                      style={{
                        border: "1px solid #E5E7EB",
                        padding: "0.65rem 0.75rem",
                        fontWeight: 600,
                        color: t.highlight ? "#FFF" : "#D85A30",
                      }}
                    >
                      {t.monthly}
                    </td>
                    <td
                      style={{
                        border: "1px solid #E5E7EB",
                        padding: "0.65rem 0.75rem",
                        color: t.highlight ? "#FFF" : "#374151",
                      }}
                    >
                      {t.total}
                    </td>
                    <td
                      style={{
                        border: "1px solid #E5E7EB",
                        padding: "0.65rem 0.75rem",
                        color: t.highlight
                          ? "rgba(255,255,255,0.85)"
                          : "#6B7280",
                        fontSize: "0.8rem",
                      }}
                    >
                      {t.perDay}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Next steps */}
        <div className="pitch-section">
          <p className="pitch-section-title">Next Steps</p>
          <p
            className="text-sm mb-3"
            style={{ color: "#374151", lineHeight: 1.6 }}
          >
            Ready to put your brand in front of thousands of people every month?
            Reply to this pitch or contact us through MoneyDrive — we'll connect
            you with the driver within 48 hours.
          </p>
          <div
            className="rounded-lg px-4 py-3 text-sm font-semibold text-center"
            style={{ background: "#D85A30", color: "#FFF" }}
          >
            Contact via MoneyDrive to start your partnership today
          </div>
        </div>

        {/* Footer watermark */}
        <p className="text-center text-xs mt-2" style={{ color: "#9CA3AF" }}>
          Powered by MoneyDrive · Earnings Optimization System ·{" "}
          {new Date().toLocaleDateString("en-ZA")}
        </p>
      </div>

      {/* ── Action buttons ──────────────────────────────────────────────────── */}
      <div className="pitch-actions" data-ocid="pitch-deck-actions">
        <button
          type="button"
          className="pitch-btn pitch-btn-primary btn-press flex items-center justify-center gap-2"
          onClick={handleDownloadPDF}
          data-ocid="pitch-download-btn"
          aria-label="Download pitch deck as PDF"
        >
          <Download size={16} />
          <span>Download PDF</span>
        </button>

        <button
          type="button"
          className="pitch-btn btn-press flex items-center justify-center gap-2"
          onClick={handleWhatsApp}
          data-ocid="pitch-whatsapp-btn"
          aria-label="Share pitch via WhatsApp"
          style={{
            background: "oklch(0.52 0.18 155 / 0.12)",
            color: "oklch(0.52 0.18 155)",
            border: "1px solid oklch(0.52 0.18 155 / 0.35)",
          }}
        >
          <MessageCircle size={16} />
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          className="pitch-btn btn-press flex items-center justify-center gap-2"
          onClick={handleEmail}
          data-ocid="pitch-email-btn"
          aria-label="Email pitch to company"
          style={{
            background: "transparent",
            color: "oklch(var(--foreground))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <Mail size={16} />
          <span>Email</span>
        </button>
      </div>
    </div>
  );
}
