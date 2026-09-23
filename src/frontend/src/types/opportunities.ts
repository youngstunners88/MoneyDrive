/**
 * Opportunity Hunter — shared TypeScript types.
 * These mirror the backend OpportunityFinding and OpportunityCategory enums.
 */

export type OpportunityCategory =
  | "newPlatform"
  | "intercityRoute"
  | "platformPromotion"
  | "incomeCategory"
  | "businessLead"
  | "regulatoryChange";

export interface OpportunityFinding {
  id: string;
  driverId: string;
  category: OpportunityCategory;
  title: string;
  description: string;
  relevanceScore: bigint;
  source: string;
  discoveredAt: bigint;
  expiresAt: bigint;
  dismissed: boolean;
}

export interface OpportunityHunterStatus {
  configured: boolean;
  lastRun: bigint;
  lastError: string;
}

export const OPPORTUNITY_CATEGORY_LABELS: Record<OpportunityCategory, string> =
  {
    newPlatform: "New Platform",
    intercityRoute: "Intercity Route",
    platformPromotion: "Platform Promotion",
    incomeCategory: "Income Category",
    businessLead: "Business Lead",
    regulatoryChange: "Regulatory Change",
  };

export const OPPORTUNITY_CATEGORY_COLORS: Record<OpportunityCategory, string> =
  {
    newPlatform: "text-primary bg-primary/10",
    intercityRoute: "text-accent bg-accent/10",
    platformPromotion: "text-green-400 bg-green-400/10",
    incomeCategory: "text-orange-400 bg-orange-400/10",
    businessLead: "text-blue-400 bg-blue-400/10",
    regulatoryChange: "text-red-400 bg-red-400/10",
  };
