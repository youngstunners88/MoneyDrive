// Zustand store for ONLY client-side gateway UI state.
// Never put server data here — that belongs in useGatewayMetrics (React Query).

import { create } from "zustand";
import type { GatewayConfigForm, TestConnectionResult } from "./types";

interface GatewayStore {
  // Config form state (client-side only — never reflects canister state)
  configForm: GatewayConfigForm;
  setConfigFormUrl: (url: string) => void;
  setConfigFormApiKey: (apiKey: string) => void;
  resetConfigForm: () => void;

  // UI loading/feedback state
  isSaving: boolean;
  isTesting: boolean;
  testResult: TestConnectionResult | null;
  setSaving: (v: boolean) => void;
  setTesting: (v: boolean) => void;
  setTestResult: (result: TestConnectionResult | null) => void;
}

export const useGatewayStore = create<GatewayStore>((set) => ({
  configForm: { url: "", apiKey: "" },
  setConfigFormUrl: (url) =>
    set((s) => ({ configForm: { ...s.configForm, url } })),
  setConfigFormApiKey: (apiKey) =>
    set((s) => ({ configForm: { ...s.configForm, apiKey } })),
  resetConfigForm: () => set({ configForm: { url: "", apiKey: "" } }),

  isSaving: false,
  isTesting: false,
  testResult: null,
  setSaving: (isSaving) => set({ isSaving }),
  setTesting: (isTesting) => set({ isTesting }),
  setTestResult: (testResult) => set({ testResult }),
}));
