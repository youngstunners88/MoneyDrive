/**
 * usePilotMode.ts — Fetches pilot mode from the backend on app mount,
 * caches in Zustand appStore, and exposes a clean hook.
 *
 * Defaults to `true` (safe/pilot-on) while loading so the UI never
 * accidentally shows gated Tier 3 features before the query resolves.
 */

import { useEffect } from "react";
import { useActor } from "../shared/hooks/useActor";
import { useAppStore } from "../stores/appStore";

/** Actor subset we need — `getPilotMode` may not exist yet on older canisters. */
type ActorWithPilot = {
  getPilotMode?: () => Promise<boolean>;
  setPilotMode?: (
    enabled: boolean,
  ) => Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
};

export function usePilotMode(): { pilotMode: boolean; loading: boolean } {
  const { actor, isFetching: actorFetching } = useActor();
  const { pilotMode, pilotModeLoading, setPilotMode, setPilotModeLoading } =
    useAppStore();

  useEffect(() => {
    if (actorFetching || !actor) return;

    const actorExt = actor as unknown as ActorWithPilot;
    if (typeof actorExt.getPilotMode !== "function") {
      // Backend method not deployed yet — treat as pilot OFF (safe default)
      setPilotMode(false);
      setPilotModeLoading(false);
      return;
    }

    let cancelled = false;
    setPilotModeLoading(true);
    actorExt
      .getPilotMode()
      .then((val) => {
        if (!cancelled) {
          setPilotMode(val);
          setPilotModeLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPilotMode(false);
          setPilotModeLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [actor, actorFetching, setPilotMode, setPilotModeLoading]);

  return { pilotMode, loading: pilotModeLoading };
}
