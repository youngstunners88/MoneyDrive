/**
 * useVoiceStore — Zustand store for voice modal UI state only.
 * Keeps voice open/playing/current-text state out of component props.
 * No server state here — usage quota lives in useVoice (React Query).
 */

import { create } from "zustand";

interface VoiceStore {
  /** Whether the voice modal/sheet is open. */
  isOpen: boolean;
  /** True while audio is actively playing back. */
  isPlaying: boolean;
  /** The text currently being spoken, or null when idle. */
  currentText: string | null;

  // ── Setters ──────────────────────────────────────────────────────────────────
  setOpen: (open: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentText: (text: string | null) => void;
  /** Convenience: open modal and set the text to speak. */
  startSpeaking: (text: string) => void;
  /** Convenience: stop and reset. */
  stopSpeaking: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  isOpen: false,
  isPlaying: false,
  currentText: null,

  setOpen: (isOpen) => set({ isOpen }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentText: (currentText) => set({ currentText }),

  startSpeaking: (text) =>
    set({ isOpen: true, isPlaying: true, currentText: text }),

  stopSpeaking: () => set({ isPlaying: false, currentText: null }),
}));
