/**
 * ProactiveHelpCard — subtle floating card for proactive Nduna suggestions.
 *
 * Appears after 90 seconds of idle on high-value pages (earnings, leads, advertising).
 * Fixed bottom-right on desktop, bottom-center on mobile.
 * Driver can dismiss for 24h with one tap.
 */

import { MessageCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProactiveTrigger } from "./useProactiveHelp";

interface ProactiveHelpCardProps {
  triggers: ProactiveTrigger[];
  onAskNduna: (message: string) => void;
  onDismiss: (triggerType: string) => void;
  currentPage: string;
}

const HIGH_VALUE_PAGES = ["earnings", "leads", "advertising"];

export default function ProactiveHelpCard({
  triggers,
  onAskNduna,
  onDismiss,
  currentPage,
}: ProactiveHelpCardProps) {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const mountedRef = useRef(false);

  const shouldRender =
    triggers.length > 0 && HIGH_VALUE_PAGES.includes(currentPage);

  // Slide in after a brief mount delay for the CSS transition to work
  useEffect(() => {
    if (!shouldRender) {
      setVisible(false);
      return;
    }
    const id = setTimeout(() => {
      setVisible(true);
      mountedRef.current = true;
    }, 80);
    return () => clearTimeout(id);
  }, [shouldRender]);

  // Reset index when trigger list grows or shrinks
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, Math.max(0, triggers.length - 1)));
  }, [triggers]);

  const currentTrigger = triggers[currentIndex];

  const handleAsk = useCallback(() => {
    if (!currentTrigger) return;
    onAskNduna(currentTrigger.message);
    onDismiss(currentTrigger.triggerType);
  }, [currentTrigger, onAskNduna, onDismiss]);

  const handleDismiss = useCallback(() => {
    if (!currentTrigger) return;
    setVisible(false);
    // Wait for slide-out before removing
    setTimeout(() => {
      onDismiss(currentTrigger.triggerType);
    }, 320);
  }, [currentTrigger, onDismiss]);

  if (!shouldRender) return null;
  if (!currentTrigger) return null;

  return (
    <div
      role="complementary"
      aria-label="Nduna suggestion"
      data-ocid="proactive.card"
      className={[
        // Positioning: bottom-right desktop, bottom-center mobile
        "fixed z-50 w-[calc(100vw-2rem)] max-w-sm",
        "right-4 bottom-20 sm:bottom-6",
        "sm:left-auto left-1/2 sm:translate-x-0 -translate-x-1/2",
        // Transition
        "transition-transform duration-300 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      ].join(" ")}
      style={{
        // Gold border, navy background
        background: "oklch(0.13 0.018 240)",
        border: "1.5px solid oklch(0.75 0.12 85 / 0.55)",
        borderRadius: "16px",
        boxShadow:
          "0 8px 32px oklch(0.75 0.12 85 / 0.12), 0 2px 8px oklch(0 0 0 / 0.4)",
      }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Nduna avatar */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border"
          style={{ borderColor: "oklch(0.75 0.12 85 / 0.5)" }}
          aria-hidden="true"
        >
          <img
            src="https://i.imgur.com/u98U7S6.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-semibold uppercase tracking-wide mb-1"
            style={{ color: "oklch(0.75 0.12 85)" }}
          >
            Nduna suggests
          </p>
          <p
            className="text-sm leading-snug"
            style={{ color: "oklch(0.88 0.01 240)" }}
          >
            {currentTrigger.message}
          </p>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleAsk}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.68 0.14 82))",
                color: "oklch(0.08 0.01 85)",
              }}
              data-ocid="proactive.ask_nduna.button"
              aria-label="Open Nduna chat with this question"
            >
              <MessageCircle className="w-3 h-3" aria-hidden="true" />
              Ask Nduna
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "oklch(0.20 0.015 240)",
                color: "oklch(0.55 0.01 240)",
                border: "1px solid oklch(0.28 0.015 240)",
              }}
              data-ocid="proactive.dismiss.button"
              aria-label="Dismiss this suggestion for 24 hours"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close icon */}
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 -mt-0.5 -mr-0.5 p-1 rounded-full transition-colors"
          style={{ color: "oklch(0.45 0.01 240)" }}
          aria-label="Close suggestion"
          data-ocid="proactive.close.button"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Multi-trigger indicator */}
      {triggers.length > 1 && (
        <div
          className="flex items-center justify-center gap-1.5 pb-3"
          aria-label={`Suggestion ${currentIndex + 1} of ${triggers.length}`}
        >
          {triggers.map((t, i) => (
            <button
              key={t.triggerType}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to suggestion ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                width: i === currentIndex ? "16px" : "6px",
                height: "6px",
                background:
                  i === currentIndex
                    ? "oklch(0.75 0.12 85)"
                    : "oklch(0.30 0.015 240)",
              }}
              data-ocid={`proactive.dot.${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
