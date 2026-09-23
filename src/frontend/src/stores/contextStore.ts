/**
 * contextStore.ts — Zustand store for Nduna's behavioral context state.
 * Refreshed on page change. Proactive triggers fire on leads, earnings,
 * and advertising pages only (enforced in components/hooks, not here).
 *
 * Keeps last 50 recent actions — enough for pattern detection without
 * unbounded memory growth.
 */

import { create } from "zustand";

const MAX_RECENT_ACTIONS = 50;

export interface ContextAction {
  type: string;
  page: string;
  timestamp: number;
}

export interface ProactiveTrigger {
  triggerType: string;
  message: string;
  page: string;
}

interface ContextStore {
  // ── State ──────────────────────────────────────────────────────────────────
  currentPage: string;
  recentActions: ContextAction[];
  /** Nduna's 7-day behavioral context summary from canister. */
  contextSummary: string;
  /** Live proactive triggers relevant to current page. */
  proactiveTriggers: ProactiveTrigger[];
  /** Unix timestamp (ms) of last context refresh. 0 = never refreshed. */
  lastRefreshed: number;

  // ── Actions ────────────────────────────────────────────────────────────────
  setCurrentPage: (page: string) => void;
  /** Append an action — caps at MAX_RECENT_ACTIONS. */
  addAction: (action: ContextAction) => void;
  setContextSummary: (summary: string) => void;
  setProactiveTriggers: (triggers: ProactiveTrigger[]) => void;
  /** Mark the store as refreshed right now. */
  markRefreshed: () => void;
}

export const useContextStore = create<ContextStore>((set) => ({
  currentPage: "",
  recentActions: [],
  contextSummary: "",
  proactiveTriggers: [],
  lastRefreshed: 0,

  setCurrentPage: (currentPage) => set({ currentPage }),

  addAction: (action) =>
    set((s) => ({
      recentActions:
        s.recentActions.length >= MAX_RECENT_ACTIONS
          ? [...s.recentActions.slice(1), action]
          : [...s.recentActions, action],
    })),

  setContextSummary: (contextSummary) => set({ contextSummary }),

  setProactiveTriggers: (proactiveTriggers) => set({ proactiveTriggers }),

  markRefreshed: () => set({ lastRefreshed: Date.now() }),
}));
