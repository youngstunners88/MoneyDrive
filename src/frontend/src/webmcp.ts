/**
 * WebMCP integration for MoneyDrive.
 * Registers 5 tools via navigator.modelContext.provideContext() so AI agents
 * can access key MoneyDrive actions directly from the browser.
 *
 * Spec: https://webmachinelearning.github.io/webmcp/
 * Blog: https://developer.chrome.com/blog/webmcp-epp
 *
 * Tools are registered on App mount (before login) with graceful auth checks.
 */

import type { backendInterface } from "./backend";

interface ToolContent {
  type: "text";
  text: string;
}

interface ToolResult {
  content: ToolContent[];
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (input: Record<string, unknown>) => Promise<ToolResult>;
}

interface ModelContextAPI {
  provideContext(tools: ToolDefinition[]): void;
}

declare global {
  interface Navigator {
    modelContext?: ModelContextAPI;
  }
}

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

function err(error: string, reason?: string): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ error, reason }) }],
  };
}

// Keep a reference so we can re-register when actor/tier changes
let currentActor: backendInterface | null = null;
let currentTier = 0;
let registered = false;

function getTools(): ToolDefinition[] {
  return [
    // Tool 1: check_earnings — all authenticated users
    {
      name: "check_earnings",
      description:
        "Get the driver's total earnings (ZAR) and trip count from MoneyDrive. Requires Internet Identity authentication.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        if (!currentActor)
          return err("Not authenticated", "Login with Internet Identity first");
        try {
          const [totalEarnings, tripCount] =
            await currentActor.getEarningsTotal();
          return ok({
            totalEarnings,
            tripCount: Number(tripCount),
            currency: "ZAR",
          });
        } catch (e) {
          return err("Failed to fetch earnings", String(e));
        }
      },
    },

    // Tool 2: check_subscription_tier — all authenticated users
    {
      name: "check_subscription_tier",
      description:
        "Get the driver's current subscription tier (1=Hustler R350/mo, 2=Grinder R530/mo, 3=Boss R800/mo). Requires authentication.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        if (!currentActor)
          return err("Not authenticated", "Login with Internet Identity first");
        try {
          const profile = await currentActor.getCallerUserProfile();
          if (!profile)
            return err("Profile not found", "Complete onboarding first");
          const tier = Number(profile.subscriptionTier);
          const names: Record<number, string> = {
            1: "Hustler",
            2: "Grinder",
            3: "Boss",
          };
          return ok({
            tier,
            tierName: names[tier] ?? "Unknown",
            currency: profile.currencyCode,
          });
        } catch (e) {
          return err("Failed to fetch subscription tier", String(e));
        }
      },
    },

    // Tool 3: view_events — all authenticated users
    {
      name: "view_events",
      description:
        "Get upcoming South African events from the MoneyDrive calendar for surge pricing intelligence.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        if (!currentActor)
          return err("Not authenticated", "Login with Internet Identity first");
        try {
          const [custom, fetched] = await Promise.all([
            currentActor.getCustomEvents(),
            currentActor.getFetchedEvents(),
          ]);
          const events = [
            ...fetched.map((e) => ({
              id: e.id,
              title: e.title,
              date: e.date,
              city: e.city,
              source: "auto",
            })),
            ...custom.map((e) => ({
              id: e.eventId,
              title: e.title,
              date: e.date,
              city: "",
              source: "custom",
            })),
          ];
          return ok({ events, count: events.length });
        } catch (e) {
          return err("Failed to fetch events", String(e));
        }
      },
    },

    // Tool 4: view_leads — Tier 3 gated
    {
      name: "view_leads",
      description:
        "Get the weekly top advertising leads for the driver. Tier 3 (Boss) only.",
      inputSchema: {
        type: "object",
        properties: {
          weekNumber: {
            type: "integer",
            description: "ISO week number (1-53)",
          },
          year: { type: "integer", description: "Full year e.g. 2026" },
        },
      },
      execute: async (input) => {
        if (!currentActor)
          return err("Not authenticated", "Login with Internet Identity first");
        if (currentTier < 3)
          return err(
            "Not authorized",
            "Tier 3 (Boss) required to access leads",
          );
        try {
          const now = new Date();
          const weekNumber = BigInt(
            typeof input.weekNumber === "number"
              ? input.weekNumber
              : Math.ceil(now.getDate() / 7),
          );
          const year = BigInt(
            typeof input.year === "number" ? input.year : now.getFullYear(),
          );
          const leads = await currentActor.getDriverLeads(weekNumber, year);
          return ok({ leads, count: leads.length });
        } catch (e) {
          return err("Failed to fetch leads", String(e));
        }
      },
    },

    // Tool 5: query_nduna — Tier 3 gated
    {
      name: "query_nduna",
      description:
        "Ask Nduna (MoneyDrive's AI advisor) a question about earnings optimization, advertising deals, or rideshare strategy. Tier 3 (Boss) only.",
      inputSchema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The question or message to send to Nduna",
          },
        },
        required: ["message"],
      },
      execute: async (input) => {
        if (!currentActor)
          return err("Not authenticated", "Login with Internet Identity first");
        if (currentTier < 3)
          return err("Not authorized", "Tier 3 (Boss) required to query Nduna");
        const message = typeof input.message === "string" ? input.message : "";
        if (!message.trim())
          return err("Invalid input", "message must be a non-empty string");
        try {
          const result = await currentActor.queryAIAgent(message, null);
          if (result.__kind__ === "err") return err("Nduna error", result.err);
          return ok({ response: result.ok });
        } catch (e) {
          return err("Failed to query Nduna", String(e));
        }
      },
    },
  ];
}

/**
 * Register all MoneyDrive tools with the WebMCP API.
 * Safe to call multiple times — provideContext replaces the previous set.
 * Call early on page load; tools gracefully handle unauthenticated state.
 */
export function initWebMCP(
  actor: backendInterface | null,
  userTier: number,
): void {
  currentActor = actor;
  currentTier = userTier;

  if (!("modelContext" in navigator) || !navigator.modelContext) return;

  try {
    navigator.modelContext.provideContext(getTools());
    registered = true;
  } catch {
    // WebMCP not supported or unavailable — fail silently
    registered = false;
  }
}

/**
 * Register tools early (before auth) so agents can discover them.
 * Unauthenticated tools return a helpful auth error.
 */
export function initWebMCPEarly(): void {
  if (!("modelContext" in navigator) || !navigator.modelContext) return;
  if (registered) return;

  try {
    navigator.modelContext.provideContext(getTools());
  } catch {
    // Silently ignore — WebMCP unavailable
  }
}

/** @deprecated Use initWebMCP instead. Kept for backward compatibility. */
export function cleanupWebMCP(): void {
  // provideContext replaces the context; no explicit cleanup needed
  // Kept for compatibility with App.tsx useEffect cleanup
}
