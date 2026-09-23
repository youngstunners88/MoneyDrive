/**
 * orbisStore — Zustand store for Orbis Intelligence config (client-side preferences only).
 * API key status is fetched from the backend via React Query — never stored here.
 * This store manages frontend-only prefs: PQS toggle, fallback model selector.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ORBIS_FALLBACK_MODELS = [
  { id: "llama-3.3-70b", name: "Llama 3.3 70B (default)" },
  { id: "gemma-3-27b", name: "Gemma 3 27B" },
  { id: "mistral-7b", name: "Mistral 7B" },
  { id: "qwen-2.5-72b", name: "Qwen 2.5 72B" },
] as const;

export type OrbisFallbackModelId = (typeof ORBIS_FALLBACK_MODELS)[number]["id"];

interface OrbisState {
  /** Whether PQS (Prompt Quality Score) pre-flight check is enabled */
  pqsEnabled: boolean;
  /** Which Orbis fallback model to prefer */
  selectedFallbackModel: OrbisFallbackModelId;

  // ── Actions ────────────────────────────────────────────────────────────────
  setPqsEnabled: (enabled: boolean) => void;
  setSelectedFallbackModel: (model: OrbisFallbackModelId) => void;
}

export const useOrbisStore = create<OrbisState>()(
  persist(
    (set) => ({
      pqsEnabled: true,
      selectedFallbackModel: "llama-3.3-70b",

      setPqsEnabled: (enabled) => set({ pqsEnabled: enabled }),
      setSelectedFallbackModel: (model) =>
        set({ selectedFallbackModel: model }),
    }),
    {
      name: "moneydriver-orbis-prefs",
      partialize: (state) => ({
        pqsEnabled: state.pqsEnabled,
        selectedFallbackModel: state.selectedFallbackModel,
      }),
    },
  ),
);
