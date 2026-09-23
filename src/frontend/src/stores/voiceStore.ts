/**
 * voiceStore.ts — Zustand store for voice session UI state ONLY.
 * Completely separate from useChatStore — voice state doesn't bleed into chat.
 *
 * Max 20 transcript entries kept in memory to avoid unbounded growth.
 */

import { create } from "zustand";
import type { VoiceAgentStatus } from "../services/voiceAgentService";

const MAX_TRANSCRIPT_ENTRIES = 20;

interface VoiceStore {
  // ── State ──────────────────────────────────────────────────────────────────
  status: VoiceAgentStatus;
  transcript: string[];
  isMuted: boolean;
  /** Seconds elapsed since voice session connected. Updated externally. */
  sessionDuration: number;
  error: string | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  setStatus: (status: VoiceAgentStatus) => void;
  /** Append a line to transcript — caps at MAX_TRANSCRIPT_ENTRIES. */
  addTranscript: (line: string) => void;
  setMuted: (isMuted: boolean) => void;
  setError: (error: string | null) => void;
  setSessionDuration: (seconds: number) => void;
  /** Full reset to initial state — call on session end. */
  resetSession: () => void;
}

const initialState = {
  status: "idle" as VoiceAgentStatus,
  transcript: [] as string[],
  isMuted: false,
  sessionDuration: 0,
  error: null as string | null,
};

export const useVoiceStore = create<VoiceStore>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  addTranscript: (line) =>
    set((s) => ({
      transcript:
        s.transcript.length >= MAX_TRANSCRIPT_ENTRIES
          ? [...s.transcript.slice(1), line]
          : [...s.transcript, line],
    })),

  setMuted: (isMuted) => set({ isMuted }),

  setError: (error) => set({ error, status: error ? "error" : "idle" }),

  setSessionDuration: (sessionDuration) => set({ sessionDuration }),

  resetSession: () => set(initialState),
}));
