/**
 * types.ts — Lead research TypeScript types.
 * Mirrors Motoko types from the backend camofox-leads mixin.
 * LeadStatus uses string literals for easy serialisation.
 */

export type LeadStatus =
  | "pending"
  | "interested"
  | "pitched"
  | "rejected"
  | "dealClosed";

export interface ScoringFactors {
  industryFit: number;
  hiringActivity: number;
  geographicOverlap: number;
  companySize: number;
}

/** Enriched company data returned by the Exa company research API.
 * Optional fields use Candid ?Text serialisation: [] | [string]
 */
export interface ExaCompanyResult {
  name: string;
  url: string;
  /** Candid ?Text — [] | [string] */
  industry: [] | [string];
  /** Candid ?Text — [] | [string] */
  employeeCount: [] | [string];
  /** Candid ?Text — [] | [string] */
  founded: [] | [string];
  /** Candid ?Text — [] | [string] */
  description: [] | [string];
  /** Candid ?Text — [] | [string] */
  contactEmail: [] | [string];
  snippet: string;
}

export interface ScrapedLead {
  id: string;
  driverId: string;
  companyName: string;
  address: string;
  website: string;
  phone: string;
  email: string;
  industry: string;
  source: string;
  /** Composite score 0–100 — higher is better pitch candidate */
  compositeScore: number;
  scoringFactors: ScoringFactors;
  weekNumber: number;
  year: number;
  /** Unix nanoseconds */
  scrapedAt: bigint;
  status: LeadStatus;
  /** Set when source includes Tavily OSINT enrichment */
  tavilyHiringSignal?: boolean;
  /** Short AI-generated snippet about the company from Tavily search */
  tavilySnippet?: string;
  /** Exa company research enrichment — present when backend has run enrichment */
  exaEnriched?: ExaCompanyResult;
}

export interface LeadBatch {
  driverId: string;
  weekNumber: number;
  year: number;
  leads: ScrapedLead[];
  /** Unix nanoseconds */
  generatedAt: bigint;
  totalScraped: number;
  totalRanked: number;
}
