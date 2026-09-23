/**
 * routes.ts — Centralised route definitions for MoneyDrive.
 * All tab names and public routes are defined here.
 * Import Tab type and route constants from this module everywhere.
 */

export type Tab =
  | "dashboard"
  | "earnings"
  | "intelligence"
  | "ai-assistant"
  | "sales"
  | "schedule"
  | "qr-menu"
  | "events"
  | "fuel"
  | "expenses"
  | "staking"
  | "academy"
  | "advertising"
  | "video"
  | "hyperframes"
  | "website-builder"
  | "messaging"
  | "referral"
  | "documents"
  | "fleet"
  | "opportunities"
  | "etavern"
  | "admin-analytics"
  | "admin-marketing"
  | "admin-pilot-mode"
  | "settings";

export type SpecialRoute =
  | { type: "passenger"; driverName: string }
  | { type: "passenger-token"; token: string }
  | { type: "terms" }
  | { type: "refund" }
  | { type: "manual" }
  | { type: "presentation"; shareToken: string }
  | null;

/**
 * Detect special public routes from the current URL path.
 * Must be called before any React rendering (module-level).
 */
export function detectSpecialRoute(): SpecialRoute {
  const path = window.location.pathname;
  // Match /menu/t/:token BEFORE the generic /menu/:driverName pattern
  const tokenMenuMatch = path.match(/^\/menu\/t\/(.+)$/);
  if (tokenMenuMatch)
    return {
      type: "passenger-token",
      token: decodeURIComponent(tokenMenuMatch[1]),
    };
  const menuMatch = path.match(/^\/menu\/(.+)$/);
  if (menuMatch)
    return { type: "passenger", driverName: decodeURIComponent(menuMatch[1]) };
  const presentationMatch = path.match(/^\/presentation\/(.+)$/);
  if (presentationMatch)
    return {
      type: "presentation",
      shareToken: decodeURIComponent(presentationMatch[1]),
    };
  if (path === "/terms") return { type: "terms" };
  if (path === "/refund") return { type: "refund" };
  if (path === "/manual") return { type: "manual" };
  return null;
}

/** Tab definitions with minimum tier requirements */
export interface TabDef {
  id: Tab;
  label: string;
  minTier: number;
}

export const ALL_TABS: TabDef[] = [
  { id: "dashboard", label: "Dashboard", minTier: 1 },
  { id: "earnings", label: "Earnings", minTier: 1 },
  { id: "intelligence", label: "Intelligence", minTier: 3 },
  { id: "ai-assistant", label: "Nduna", minTier: 3 },
  { id: "events", label: "Events", minTier: 1 },
  { id: "expenses", label: "Expenses", minTier: 1 },
  { id: "fuel", label: "Fuel", minTier: 1 },
  { id: "staking", label: "Save & Earn", minTier: 1 },
  { id: "academy", label: "Wealth Academy", minTier: 1 },
  { id: "qr-menu", label: "QR Menu", minTier: 2 },
  { id: "sales", label: "Sales", minTier: 2 },
  { id: "schedule", label: "Schedule", minTier: 2 },
  { id: "advertising", label: "Advertising", minTier: 2 },
  { id: "messaging", label: "Messages", minTier: 1 },
  { id: "video", label: "Content", minTier: 2 },
  { id: "hyperframes", label: "AI Video Studio", minTier: 3 },
  { id: "website-builder", label: "Website Builder", minTier: 3 },
  { id: "referral", label: "Referral", minTier: 1 },
  { id: "documents", label: "Document Vault", minTier: 2 },
  { id: "fleet", label: "Fleet", minTier: 2 },
  { id: "opportunities", label: "Opportunities", minTier: 3 },
  { id: "etavern", label: "eTavern", minTier: 1 },
  { id: "admin-analytics", label: "Analytics", minTier: 3 },
  { id: "admin-marketing", label: "Marketing HQ", minTier: 3 },
  { id: "admin-pilot-mode", label: "Pilot Mode", minTier: 3 },
  { id: "settings", label: "Settings", minTier: 1 },
];

/** Tabs that require tier gating before rendering */
export const GATED_TABS: Record<Tab, number> = {
  dashboard: 1,
  earnings: 1,
  intelligence: 3,
  "ai-assistant": 3,
  sales: 2,
  schedule: 2,
  "qr-menu": 2,
  events: 1,
  fuel: 1,
  expenses: 1,
  staking: 1,
  academy: 1,
  advertising: 2,
  messaging: 1,
  video: 2,
  hyperframes: 3,
  "website-builder": 3,
  referral: 1,
  documents: 2,
  fleet: 2,
  opportunities: 3,
  etavern: 1,
  "admin-analytics": 3,
  "admin-marketing": 3,
  "admin-pilot-mode": 3,
  settings: 1,
};

/** Return true if the given tier can access the tab */
export function canAccessTab(
  tab: Tab,
  tier: number,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  return tier >= (GATED_TABS[tab] ?? 1);
}
