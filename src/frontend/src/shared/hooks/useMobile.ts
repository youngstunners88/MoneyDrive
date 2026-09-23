import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * useMobile — returns true if the viewport is mobile-sized (<768px).
 * Uses window.matchMedia for efficient resize detection.
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => window.innerWidth < MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
