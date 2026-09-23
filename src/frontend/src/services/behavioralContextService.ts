/**
 * behavioralContextService.ts — Behavioral context capture and retrieval.
 * Pure module (not a hook). Actor injected via setContextActor after auth.
 * All calls are fire-and-forget — never throw, never block UI.
 *
 * Behavioral events persist 7 days (enforced server-side).
 * Proactive triggers fire on leads, earnings, advertising pages only.
 */

// ── Minimal actor interface ───────────────────────────────────────────────────

interface ContextActor {
  logBehavioralEvent?: (
    eventType: string,
    page: string,
    details: string,
    timestamp: bigint,
  ) => Promise<void>;
  logOutcomeEvent?: (
    recommendationId: string,
    outcome: string,
  ) => Promise<void>;
  getContextSummary?: () => Promise<string>;
  getProactiveTriggers?: () => Promise<
    Array<{ triggerType: string; message: string; page: string }>
  >;
}

// ── Internal state ────────────────────────────────────────────────────────────

let _actor: ContextActor | null = null;

/** Called from App.tsx / auth lifecycle, same pattern as setAnalyticsActor. */
export function setContextActor(actor: ContextActor | null): void {
  _actor = actor;
}

// ── Internal fire-and-forget helper ──────────────────────────────────────────

async function _logEvent(
  eventType: string,
  page: string,
  details: string,
): Promise<void> {
  if (!_actor?.logBehavioralEvent) return;
  try {
    await _actor.logBehavioralEvent(
      eventType,
      page,
      details,
      BigInt(Date.now()),
    );
  } catch {
    // Silent — behavioral logging must never surface errors to drivers
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Log a page view. Call this on every route change.
 * Does not block — fire-and-forget.
 */
export function logPageView(page: string): void {
  void _logEvent("page_view", page, "");
}

/**
 * Log a feature interaction within a page.
 * Does not block — fire-and-forget.
 */
export function logFeatureInteract(page: string, feature: string): void {
  void _logEvent("feature_interact", page, feature);
}

/**
 * Log that a recommendation was received and shown to the driver.
 * Does not block — fire-and-forget.
 */
export function logRecommendationReceived(
  recommendationId: string,
  text: string,
): void {
  void _logEvent(
    "recommendation_received",
    "nduna",
    `${recommendationId}:${text.slice(0, 100)}`,
  );
}

/**
 * Log what the driver did with a recommendation.
 * 'acted' — followed the advice. 'dismissed' — explicitly closed/ignored.
 * 'not_yet' — acknowledged but didn't act immediately.
 */
export async function logOutcome(
  recommendationId: string,
  outcome: "acted" | "dismissed" | "not_yet",
): Promise<void> {
  if (!_actor?.logOutcomeEvent) return;
  try {
    await _actor.logOutcomeEvent(recommendationId, outcome);
  } catch {
    // Silent
  }
}

/**
 * Fetch Nduna's 7-day behavioral context summary from the canister.
 * Returns empty string if unavailable — never throws.
 */
export async function getContextSummary(): Promise<string> {
  if (!_actor?.getContextSummary) return "";
  try {
    return await _actor.getContextSummary();
  } catch {
    return "";
  }
}

/**
 * Fetch proactive triggers relevant to the driver's current context.
 * Returns empty array if unavailable — never throws.
 */
export async function getProactiveTriggers(): Promise<
  Array<{ triggerType: string; message: string; page: string }>
> {
  if (!_actor?.getProactiveTriggers) return [];
  try {
    return await _actor.getProactiveTriggers();
  } catch {
    return [];
  }
}
