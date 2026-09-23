/**
 * Presentation feature types for Nduna Presentation Builder.
 */

export type SlideType =
  | "title"
  | "value-proposition"
  | "audience-data"
  | "pricing-options"
  | "call-to-action";

export interface Slide {
  slideType: SlideType;
  title: string;
  bullets: string[];
  speakerNotes: string;
  dataPoint?: string; // highlighted stat or number
}

export interface PresentationData {
  id: string;
  slides: Slide[];
  generatedAt: number; // epoch ms
  shareToken: string;
  companyName: string;
  driverName: string;
}

export interface PresentationInput {
  driverName: string;
  city: string;
  routes: string[];
  tripsPerMonth: number;
  avgPassengers: number;
  vehicleModel: string;
  targetCompanyName: string;
  targetIndustry: string;
  estimatedMonthlyExposure: number;
  proposedDealValue: number;
}

/** Parse AI-generated JSON into slides, with fallback */
export function parsePresentationResponse(
  raw: string,
  input: PresentationInput,
): Slide[] {
  try {
    const json = raw.match(/\[[\s\S]*\]/)?.[0];
    if (json) {
      const parsed = JSON.parse(json) as unknown[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Slide[];
      }
    }
  } catch {
    // fall through to default slides
  }
  return buildDefaultSlides(input);
}

function buildDefaultSlides(input: PresentationInput): Slide[] {
  return [
    {
      slideType: "title",
      title: `${input.driverName} × ${input.targetCompanyName}`,
      bullets: [
        "Moving advertising proposal",
        "Reach your audience on the road",
      ],
      speakerNotes:
        "Introduce yourself as a professional driver serving the city.",
      dataPoint: input.city,
    },
    {
      slideType: "value-proposition",
      title: "Why Advertise With Me?",
      bullets: [
        `${input.tripsPerMonth.toLocaleString()} trips per month`,
        `${input.avgPassengers.toLocaleString()} passengers reach per month`,
        `Serving ${input.city} — your target market`,
        "Engaged, captive audience inside the vehicle",
        "Exterior branding visible at intersections, malls, airports",
      ],
      speakerNotes: "Explain that passengers are engaged and captive.",
      dataPoint: `${input.tripsPerMonth} trips/mo`,
    },
    {
      slideType: "audience-data",
      title: "Your Audience Numbers",
      bullets: [
        `${input.estimatedMonthlyExposure.toLocaleString()} monthly impressions (vehicles + pedestrians)`,
        `Billboards in ${input.city}: ~200,000 impressions for R50,000/mo`,
        `Your car: ${input.estimatedMonthlyExposure.toLocaleString()} impressions for R${input.proposedDealValue.toLocaleString()}/mo`,
        `${Math.round((input.estimatedMonthlyExposure / 200000) * 10) / 10}× more efficient than billboard`,
      ],
      speakerNotes: "Show ROI comparison vs traditional billboard advertising.",
      dataPoint: `${input.estimatedMonthlyExposure.toLocaleString()} impressions`,
    },
    {
      slideType: "pricing-options",
      title: "Pricing Options",
      bullets: [
        `Option A: Interior only — R${Math.round(input.proposedDealValue * 0.5).toLocaleString()}/month`,
        `Option B: Exterior branding — R${input.proposedDealValue.toLocaleString()}/month`,
        `Option C: Full wrap + interior — R${Math.round(input.proposedDealValue * 1.5).toLocaleString()}/month`,
        "3-month pilot available to get started",
        "Monthly reporting included",
      ],
      speakerNotes:
        "Present three options, always let them choose. Start with the middle option.",
      dataPoint: `R${input.proposedDealValue.toLocaleString()}/mo`,
    },
    {
      slideType: "call-to-action",
      title: "Let's Make This Happen",
      bullets: [
        `Contact: ${input.driverName}`,
        `Operating in: ${input.city}`,
        "Reply to start a 3-month pilot",
        "First campaign live within 2 weeks of agreement",
      ],
      speakerNotes: "Close with urgency — limited slots available.",
      dataPoint: "Ready to start",
    },
  ];
}
