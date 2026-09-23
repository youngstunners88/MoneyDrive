import { WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

/**
 * OfflineBanner
 *
 * Persistent banner shown at the top of the screen when the driver
 * has no network connection. Disappears automatically when signal returns.
 *
 * Burnt orange (bg-primary) when offline; green (bg-success) only briefly
 * while slide-up animation plays on reconnect — never shows green while
 * already online from first load.
 */
export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  // true only during the 400 ms slide-away transition after reconnecting
  const [isReconnecting, setIsReconnecting] = useState(false);
  // track whether we've ever gone offline so we don't flash green on first load
  const wentOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wentOffline.current = true;
      setIsReconnecting(false);
      setVisible(true);
    } else if (wentOffline.current) {
      // We were offline and are now back — briefly show green then slide away
      setIsReconnecting(true);
      const t = setTimeout(() => {
        setVisible(false);
        setIsReconnecting(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      data-ocid="offline.banner"
      className={[
        "fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 px-4 py-2.5",
        "text-sm font-semibold text-white shadow-lg transition-all duration-300",
        isReconnecting ? "bg-green-600" : "bg-primary",
      ].join(" ")}
      style={{
        transform: isReconnecting ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>
        {isReconnecting
          ? "Back online — syncing…"
          : "You are offline — changes will sync when your signal returns"}
      </span>
    </div>
  );
}
