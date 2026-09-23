/**
 * hermesService — wraps OpenRouter / Hermes AI agent backend calls.
 * All AI messaging goes through the backend canister (actor.queryAIAgent)
 * to keep API keys secure. This service handles message formatting and classification.
 */

import type { DriverMemoryEntry } from "../backend";

// ── Service layer ─────────────────────────────────────────────────────────────

interface ActorWithAI {
  queryAIAgent(
    message: string,
    contextData: string | null,
  ): Promise<{ ok: string } | { err: string }>;
}

/**
 * queryNduna — canonical service wrapper for all AI chat calls.
 * Components and hooks MUST call this instead of actor.queryAIAgent directly.
 * Returns the cleaned response string, or throws on error (for caller to handle).
 *
 * @param contextData — Optional 7-day behavioral context summary from behavioralContextService.
 *   Currently appended to the message body so Nduna receives it as context.
 *   When the backend is updated to accept a separate contextData param, this
 *   will be passed through the dedicated parameter instead.
 */
export async function queryNduna(
  actor: ActorWithAI,
  message: string,
  contextData?: string,
): Promise<string> {
  // Add LVS prefix for high-stakes outputs only (pitch decks, campaigns, income strategy).
  // Routine queries skip LVS to avoid unnecessary latency.
  const lvsPrefix = isHighStakesOutput(message)
    ? "[LVS-ACTIVE] Before responding, internally evaluate 5 distinct angles/approaches " +
      "(≤12 words each), assign probabilities summing to 1.0, ensure at least one < 0.10, " +
      "then select and produce ONLY the single best response. Do NOT show the distribution. " +
      "Then structure your chosen response using the Minto Pyramid Principle (answer first). "
    : "";

  const enrichedMessage = lvsPrefix + message.trim();

  // Prepend behavioral context to the message if available — backend uses it
  // to give Nduna a 7-day window of driver behavior
  const fullMessage = contextData
    ? `[CONTEXT:${contextData.slice(0, 500)}]\n${enrichedMessage}`
    : enrichedMessage;
  const result = await actor.queryAIAgent(fullMessage, null);
  if ("err" in result) {
    throw new Error(result.err);
  }
  return result.ok;
}

export interface HermesServiceMessage {
  role: "user" | "assistant";
  content: string;
}

export type MessageClassification =
  | "routine"
  | "action_item"
  | "deal_opportunity"
  | "high_stakes_output";

/**
 * isHighStakesOutput — returns true when a message warrants LVS (Lean Verbalized Sampling).
 * LVS activates for pitch decks, campaign proposals, income strategy, and Opportunity Hunter.
 * Routine driver queries (earnings today, fuel cost, etc.) do NOT trigger LVS.
 */
export function isHighStakesOutput(message: string): boolean {
  const highStakesTriggers = [
    "pitch deck",
    "presentation",
    "campaign",
    "marketing proposal",
    "income strategy",
    "monthly analysis",
    "wealth",
    "opportunity hunter",
    "investment",
    "passive income",
    "staking",
    "minipay strategy",
    "which companies",
    "best approach",
    "recommend",
    "strategy for",
    "how should i",
    "what should i do",
  ];
  const lower = message.toLowerCase();
  return highStakesTriggers.some((trigger) => lower.includes(trigger));
}

/**
 * Format a conversation history for display / logging.
 * The actual API call is made via actor.queryAIAgent in useHermes.ts.
 */
export function formatConversationContext(
  messages: HermesServiceMessage[],
  maxLength = 5,
): string {
  return messages
    .slice(-maxLength)
    .map((m) => `${m.role === "user" ? "Driver" : "Nduna"}: ${m.content}`)
    .join("\n");
}

/**
 * Build a context-aware prompt prefix for Hermes queries.
 * Injected into the query to give Hermes SA driver context.
 */
export function buildDriverContextPrefix(opts: {
  currency?: string;
  driverName?: string;
}): string {
  const currency = opts.currency ?? "ZAR";
  const name = opts.driverName ?? "Driver";
  return `You are Nduna, a trusted AI assistant for ${name}, a professional Uber/Bolt driver in South Africa. Currency is ${currency}. Be concise, helpful, and relevant to SA roads and driving.`;
}

/**
 * Classify a message based on keyword signals.
 * deal_opportunity: revenue/deal keywords
 * action_item: cost/savings keywords
 * routine: everything else
 */
export function classifyMessage(text: string): MessageClassification {
  const lower = text.toLowerCase();

  const dealKeywords = [
    "surge",
    "opportunity",
    "deal",
    "advertising",
    "brand",
    "sponsor",
    "corporate",
    "contract",
    "partnership",
    "income stream",
    "passive income",
    "revenue",
    "profit",
  ];
  // Match "R10k", "R500k", "R1 000k", "R[0-9]+(k|K)" patterns
  const moneyPattern = /r\d[\d\s]*k(?:\/month|pm)?/i;

  const actionKeywords = [
    "fuel",
    "expense",
    "tip",
    "save",
    "reduce",
    "cut cost",
    "saving",
    "budget",
    "maintain",
    "service",
    "repair",
    "insurance",
    "deduction",
    "sars",
    "tax",
  ];

  if (
    moneyPattern.test(lower) ||
    dealKeywords.some((kw) => lower.includes(kw))
  ) {
    return "deal_opportunity";
  }

  if (actionKeywords.some((kw) => lower.includes(kw))) {
    return "action_item";
  }

  return "routine";
}

/**
 * Strip internal classification/confidence tags AND chain-of-thought artifacts from AI response text
 * before display. Uses a broad approach — removes XML-style blocks, bracket tokens,
 * reasoning-starter lines, and markdown formatting so Nduna's responses render as clean
 * plain text on mobile and desktop.
 *
 * This is a defense-in-depth layer — the backend catches most artifacts, this is a backup.
 */
export function stripNdunaFormatting(text: string): string {
  let result = text;

  // Step 0: HTML entity decode — must come FIRST so subsequent regex matches work on real chars
  result = result
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#60;/g, "<")
    .replace(/&#62;/g, ">")
    .replace(/\\</g, "<")
    .replace(/\\>/g, ">");

  // Step 1: Remove entire XML-style tagged blocks (broad — any tag pair)
  result = result.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, "");

  // Step 2: Remove any remaining standalone XML-style tag tokens
  result = result.replace(/<[^>]+\/?>/g, "");

  // Step 2b: Catch-all for any residual XML pairs or self-closing tags missed above
  result = result.replace(/<[^>]+>[^<]*<\/[^>]+>/g, "");
  result = result.replace(/<[^>]+\/>/g, "");

  // Step 3: Remove square-bracket metadata tokens like [HIGH], [MEDIUM], [CRITICAL] etc.
  result = result.replace(/\[[A-Z][A-Z0-9_\s]{1,20}\]/g, "");

  // Step 4: Remove lines that start with reasoning patterns
  const reasoningPrefixes = [
    "Let me ",
    "Let me think",
    "I need to ",
    "First I ",
    "First, I ",
    "I should ",
    "I'm going to ",
    "I'll ",
    "Thinking about",
    "I will reason",
    "My approach",
    "Step 1:",
    "Step 2:",
    "Step 3:",
    "To answer",
    "Analyzing",
    "Looking at",
    "Based on my reasoning",
    "Nduna thinks",
    "Nduna should",
    "Nduna needs",
  ];
  const lines = result.split("\n");
  const filteredLines = lines.filter(
    (line) =>
      !reasoningPrefixes.some((prefix) => line.trimStart().startsWith(prefix)),
  );
  result = filteredLines.join("\n");

  // Step 5: Remove markdown bold: **text** → text
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1");

  // Step 6: Remove markdown italic: *text* → text (single asterisk)
  result = result.replace(/\*([^*\n]+)\*/g, "$1");

  // Step 7: Remove markdown headers: # Heading → Heading
  result = result.replace(/^#{1,6}\s+/gm, "");

  // Step 8: Collapse 3+ consecutive blank lines to 2
  result = result.replace(/\n{3,}/g, "\n\n");

  // Step 9: Collapse multiple spaces to single space
  result = result.replace(/\s{2,}/g, " ");

  // Step 10 (FINAL): Pronoun replacement — she/her/hers/herself → he/him/his/himself
  // Nduna is MALE — enforce at display layer as defense-in-depth
  result = result.replace(/\bshe\b/gi, (m) =>
    m[0] === m[0].toUpperCase() ? "He" : "he",
  );
  result = result.replace(/\bher\b/gi, (m) =>
    m[0] === m[0].toUpperCase() ? "Him" : "him",
  );
  result = result.replace(/\bhers\b/gi, (m) =>
    m[0] === m[0].toUpperCase() ? "His" : "his",
  );
  result = result.replace(/\bherself\b/gi, (m) =>
    m[0] === m[0].toUpperCase() ? "Himself" : "himself",
  );

  return result.trim();
}

/** @deprecated Use stripNdunaFormatting instead. Kept for backwards compatibility. */
export function stripClassificationTags(text: string): string {
  return stripNdunaFormatting(text);
}

/**
 * Group driver memory entries by category and format as a readable list.
 */
export function formatMemoryEntries(entries: DriverMemoryEntry[]): string {
  if (entries.length === 0) return "No memory entries yet.";

  const grouped: Record<string, DriverMemoryEntry[]> = {};
  for (const entry of entries) {
    const cat = entry.category || "general";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(entry);
  }

  return Object.entries(grouped)
    .map(([cat, items]) => {
      const header = cat.charAt(0).toUpperCase() + cat.slice(1);
      const lines = items.map((e) => `  • ${e.key}: ${e.value}`).join("\n");
      return `${header}:\n${lines}`;
    })
    .join("\n\n");
}

/**
 * Parse a structured canister skill result into displayable format.
 * Splits on newlines, extracts bullet points, provides raw fallback.
 */
export function formatSkillResult(
  result: string,
  skillName: string,
): { title: string; bullets: string[]; raw: string } {
  const lines = result
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines
    .filter(
      (l) =>
        l.startsWith("•") ||
        l.startsWith("-") ||
        l.startsWith("*") ||
        /^\d+\./.test(l),
    )
    .map((l) => l.replace(/^[•\-*]\s*/, "").replace(/^\d+\.\s*/, ""));

  const title =
    lines.find(
      (l) =>
        !l.startsWith("•") &&
        !l.startsWith("-") &&
        !l.startsWith("*") &&
        !/^\d+\./.test(l),
    ) ?? skillName;

  return {
    title,
    bullets: bullets.length > 0 ? bullets : lines.slice(0, 5),
    raw: result,
  };
}
