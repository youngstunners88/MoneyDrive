/**
 * voiceAgentService.ts — Canonical voice agent service for Nduna.
 * Uses @elevenlabs/elevenlabs-js (NOT deprecated elevenlabs v1.x).
 * API key is NEVER exposed to the frontend — backend generates a signed URL.
 *
 * This is a pure module (not a hook). State lives in voiceStore.ts.
 * The hook useVoiceAgent.ts orchestrates this service with @elevenlabs/react.
 */

// ── Constants ────────────────────────────────────────────────────────────────

/** ElevenLabs Voice ID for Nduna — mJZEpDe9qAKz9yOOwCD8 */
export const VOICE_AGENT_ID = "mJZEpDe9qAKz9yOOwCD8";

/** Model to use for voice agent — eleven_flash_v2 is lowest latency */
export const VOICE_MODEL_ID = "eleven_flash_v2_5";

// ── Types ─────────────────────────────────────────────────────────────────────

export type VoiceAgentStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "speaking"
  | "listening"
  | "error";

export interface VoiceSession {
  status: VoiceAgentStatus;
  transcript: string[];
  error?: string;
}

// ── Minimal actor interface ───────────────────────────────────────────────────

interface VoiceActor {
  getElevenLabsSignedUrl?: () => Promise<{ ok: string } | { err: string }>;
}

// ── Actor injection ───────────────────────────────────────────────────────────

let _actor: VoiceActor | null = null;

/** Called from App.tsx / auth lifecycle after actor is ready. */
export function setVoiceActor(actor: VoiceActor | null): void {
  _actor = actor;
}

// ── Service API ───────────────────────────────────────────────────────────────

/**
 * Fetch a signed ElevenLabs WebSocket URL from the backend canister.
 * The backend holds the API key — it never reaches the browser.
 * Tier enforcement is done server-side.
 *
 * @returns Signed URL string for use with useConversation().startSession({ signedUrl })
 * @throws Error if backend returns an error or method is unavailable
 */
export async function getSignedUrl(): Promise<string> {
  if (!_actor) {
    throw new Error("Voice actor not initialised — call setVoiceActor first.");
  }

  if (!_actor.getElevenLabsSignedUrl) {
    throw new Error(
      "Backend method getElevenLabsSignedUrl not available. Ensure canister is up to date.",
    );
  }

  const result = await _actor.getElevenLabsSignedUrl();

  if ("err" in result) {
    throw new Error(result.err);
  }

  if (!result.ok || result.ok.trim() === "") {
    throw new Error("Backend returned an empty signed URL.");
  }

  return result.ok;
}

/**
 * Build the ElevenLabs conversation config for Nduna's voice agent.
 * This is passed to useConversation() as the agent configuration.
 */
export function buildNdunaConversationConfig() {
  return {
    agentId: VOICE_AGENT_ID,
    overrides: {
      tts: {
        voiceId: VOICE_AGENT_ID,
        modelId: VOICE_MODEL_ID,
      },
      agent: {
        language: "en",
      },
    },
  };
}
