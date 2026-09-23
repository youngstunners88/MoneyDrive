/**
 * appStore.ts — Zustand store for global app-level state.
 * Currently holds pilotMode, which is fetched from the backend on mount
 * and used to gate Tier 3 features and update subscription copy.
 */

import { create } from "zustand";

interface AppState {
  /** Whether the 90-day free pilot is active. Defaults true (safe) while loading. */
  pilotMode: boolean;
  /** True while the initial getPilotMode query is in flight. */
  pilotModeLoading: boolean;

  setPilotMode: (enabled: boolean) => void;
  setPilotModeLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  pilotMode: true,
  pilotModeLoading: true,

  setPilotMode: (pilotMode) => set({ pilotMode }),
  setPilotModeLoading: (pilotModeLoading) => set({ pilotModeLoading }),
}));
