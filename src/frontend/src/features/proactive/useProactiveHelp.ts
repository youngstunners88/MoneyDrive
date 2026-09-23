/**
 * useProactiveHelp — evaluates and manages proactive help triggers.
 *
 * Waits 90 seconds of user inactivity, then queries the canister for
 * page-relevant triggers. Any user interaction (mousemove / keydown / touchstart)
 * resets the idle timer.
 *
 * Only fires on high-value pages: earnings, leads, advertising.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getProactiveTriggers } from "../../services/behavioralContextService";
import { useActor } from "../../shared/hooks/useActor";
import { useContextStore } from "../../stores/contextStore";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProactiveTrigger {
  triggerType: string;
  message: string;
  page: string;
}

const HIGH_VALUE_PAGES = ["earnings", "leads", "advertising"] as const;
type HighValuePage = (typeof HIGH_VALUE_PAGES)[number];

function isHighValuePage(page: string): page is HighValuePage {
  return HIGH_VALUE_PAGES.includes(page as HighValuePage);
}

const IDLE_DELAY_MS = 90_000;

// ── Dismissed triggers cache (sessionStorage, 24-hour TTL) ────────────────────

const DISMISSED_KEY = "proactive_dismissed";

interface DismissedRecord {
  [triggerType: string]: number; // timestamp of dismissal
}

function getDismissed(): DismissedRecord {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DismissedRecord;
    // Prune entries older than 24h
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const pruned: DismissedRecord = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v > cutoff) pruned[k] = v;
    }
    return pruned;
  } catch {
    return {};
  }
}

function saveDismissed(record: DismissedRecord): void {
  try {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(record));
  } catch {
    // Never block UI for storage errors
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useProactiveHelp(currentPage: string) {
  const { actor } = useActor();
  const [triggers, setTriggers] = useState<ProactiveTrigger[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFiredRef = useRef(false);
  const setProactiveTriggers = useContextStore((s) => s.setProactiveTriggers);
  const setCurrentPageInStore = useContextStore((s) => s.setCurrentPage);

  // Sync current page to contextStore on mount / page change
  useEffect(() => {
    setCurrentPageInStore(currentPage);
  }, [currentPage, setCurrentPageInStore]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchTriggers = useCallback(async () => {
    if (!actor || !isHighValuePage(currentPage)) return;

    const raw = await getProactiveTriggers();
    const dismissed = getDismissed();
    const now = Date.now();

    // Filter to current page, exclude recently dismissed
    const relevant = raw
      .filter((t) => t.page === currentPage || t.page === "all")
      .filter((t) => {
        const dismissedAt = dismissed[t.triggerType];
        return !dismissedAt || now - dismissedAt > 24 * 60 * 60 * 1000;
      })
      .map<ProactiveTrigger>((t) => ({
        triggerType: t.triggerType,
        message: t.message,
        page: t.page,
      }));

    if (relevant.length > 0) {
      setTriggers(relevant);
      setProactiveTriggers(relevant);
    }
  }, [actor, currentPage, setProactiveTriggers]);

  const startIdleTimer = useCallback(() => {
    clearTimer();
    if (!isHighValuePage(currentPage) || hasFiredRef.current) return;
    timerRef.current = setTimeout(async () => {
      hasFiredRef.current = true;
      await fetchTriggers();
    }, IDLE_DELAY_MS);
  }, [clearTimer, currentPage, fetchTriggers]);

  // Idle detection — reset timer on any user activity. Also resets state on page change.
  useEffect(() => {
    // Reset per-page state
    hasFiredRef.current = false;
    setTriggers([]);

    if (!isHighValuePage(currentPage)) return;

    const reset = () => startIdleTimer();
    startIdleTimer();

    window.addEventListener("mousemove", reset, { passive: true });
    window.addEventListener("keydown", reset, { passive: true });
    window.addEventListener("touchstart", reset, { passive: true });

    return () => {
      clearTimer();
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("touchstart", reset);
    };
  }, [currentPage, startIdleTimer, clearTimer]);

  const dismissTrigger = useCallback((triggerType: string) => {
    const dismissed = getDismissed();
    dismissed[triggerType] = Date.now();
    saveDismissed(dismissed);
    setTriggers((prev) => prev.filter((t) => t.triggerType !== triggerType));
  }, []);

  const dismissAll = useCallback(() => {
    const dismissed = getDismissed();
    const now = Date.now();
    for (const t of triggers) {
      dismissed[t.triggerType] = now;
    }
    saveDismissed(dismissed);
    setTriggers([]);
  }, [triggers]);

  return {
    triggers,
    hasTriggers: triggers.length > 0 && isHighValuePage(currentPage),
    dismissTrigger,
    dismissAll,
  };
}
