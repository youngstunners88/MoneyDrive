/**
 * analyticsService.ts — Thin, fire-and-forget analytics event layer.
 * Never blocks UI, never throws, batches events and flushes every 5s.
 * Actor is injected via setActor() — never imported directly here.
 */

import { setContextActor } from "./behavioralContextService";
export { setContextActor };

export type AnalyticsCategory =
  | "user_action"
  | "nduna_query"
  | "error"
  | "deal_event"
  | "lead_event"
  | "video_event"
  | "performance";

export interface AnalyticsEvent {
  category: AnalyticsCategory;
  action: string;
  metadata?: Record<string, string | number | boolean>;
  durationMs?: number;
  success?: boolean;
  errorMessage?: string;
}

/** Minimal actor interface — only the method analytics needs. */
interface AnalyticsActor {
  logUserAction?: (
    category: string,
    action: string,
    metadata: string,
    durationMs: number,
    success: boolean,
    errorMessage: string,
  ) => Promise<unknown>;
}

// ── Internal state ───────────────────────────────────────────────────────────

let _actor: AnalyticsActor | null = null;
const _queue: AnalyticsEvent[] = [];
const MAX_QUEUE = 50;
const FLUSH_INTERVAL_MS = 5_000;
const BATCH_SIZE = 10;

/** Called from App.tsx once actor is ready after auth. */
export function setAnalyticsActor(actor: AnalyticsActor | null): void {
  _actor = actor;
  // Wire behavioral context service on same auth lifecycle.
  // Cast to unknown first — setContextActor accepts any object with optional
  // behavioral methods; structurally compatible even though the nominal types differ.
  setContextActor(actor as Parameters<typeof setContextActor>[0]);
  if (actor && _queue.length > 0) {
    // Flush any events that accumulated before auth
    _flushQueue();
  }
}

// ── Core flush logic ─────────────────────────────────────────────────────────

async function _sendEvent(event: AnalyticsEvent): Promise<void> {
  if (!_actor?.logUserAction) return; // method not yet on canister — silent skip
  try {
    await _actor.logUserAction(
      event.category,
      event.action,
      JSON.stringify(event.metadata ?? {}),
      event.durationMs ?? 0,
      event.success ?? true,
      event.errorMessage ?? "",
    );
  } catch {
    // Silent — never let analytics failures surface to users
    console.warn("[analytics] failed to send event:", event.action);
  }
}

function _flushQueue(): void {
  if (!_actor || _queue.length === 0) return;
  const batch = _queue.splice(0, BATCH_SIZE);
  for (const event of batch) {
    // Fire-and-forget — no await
    void _sendEvent(event);
  }
}

// Start the periodic flush timer
if (typeof window !== "undefined") {
  setInterval(_flushQueue, FLUSH_INTERVAL_MS);
}

// ── Public API ───────────────────────────────────────────────────────────────

function track(event: AnalyticsEvent): void {
  try {
    if (_actor) {
      // Actor ready — queue it for the next batch flush
      if (_queue.length < MAX_QUEUE) _queue.push(event);
      // Trigger immediate flush when batch reaches BATCH_SIZE
      if (_queue.length >= BATCH_SIZE) _flushQueue();
    } else {
      // Not yet authenticated — buffer up to MAX_QUEUE
      if (_queue.length < MAX_QUEUE) _queue.push(event);
    }
  } catch {
    // Never throw
  }
}

export const analytics = { track };

/**
 * trackVoiceSession — Convenience helper to log a completed voice session.
 * Call this when the driver ends a voice session.
 */
export function trackVoiceSession(
  durationSecs: number,
  transcriptCount: number,
): void {
  track({
    category: "user_action",
    action: "voice_session",
    metadata: {
      durationSecs,
      transcriptCount,
    },
    durationMs: durationSecs * 1_000,
    success: true,
  });
}
