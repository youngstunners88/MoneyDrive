import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AlertCircle, Loader2, Mic, MicOff, Volume2, X } from "lucide-react";
import type { UserProfile } from "../../backend";
import { useVoice } from "./useVoice";

interface VoiceModalProps {
  open: boolean;
  onClose: () => void;
  tier: number;
  isAdmin?: boolean;
  profile?: UserProfile | null;
}

export function VoiceModal({
  open,
  onClose,
  tier,
  isAdmin = false,
  profile,
}: VoiceModalProps) {
  const {
    status,
    transcript,
    response,
    audioFailed,
    startListening,
    stopListening,
    stopSpeaking,
    showUpgradeLimit,
    setShowUpgradeLimit,
    charCount,
    charLimit,
    atLimit,
  } = useVoice({ tier, isAdmin, profile });

  const listening = status === "listening";
  const speaking = status === "speaking";
  const processing = status === "processing";

  const statusLabel = listening
    ? "Listening… speak now"
    : processing
      ? "Processing your question…"
      : speaking
        ? "Speaking your answer…"
        : "Tap the mic and speak";

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent side="bottom" className="rounded-t-3xl pb-10">
        <SheetHeader className="mb-5">
          <SheetTitle className="font-display text-base flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" /> Voice Insight
          </SheetTitle>
        </SheetHeader>

        {/* Upgrade limit notice */}
        {showUpgradeLimit && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
            <MicOff className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-destructive">
                Voice Trial Complete
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You've used your {charLimit}-character monthly trial. Upgrade to
                Pro Driver (R530/mo) for unlimited AI voice.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUpgradeLimit(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tier 1 usage counter */}
        {!isAdmin && tier === 1 && (
          <p className="text-xs text-muted-foreground text-center mb-3">
            {charCount}/{charLimit} chars used this month
          </p>
        )}

        {/* Transcript display */}
        {transcript && (
          <div className="mb-4 rounded-xl bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground mb-0.5">You said:</p>
            <p className="text-sm text-foreground">"{transcript}"</p>
          </div>
        )}

        {/* Audio failed — text fallback (never fail silently) */}
        {audioFailed && response && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Audio unavailable — your response is below:
            </p>
          </div>
        )}

        {/* Response display */}
        {response && (
          <div className="mb-4 rounded-xl bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs text-primary mb-0.5 font-semibold">
              MoneyDrive:
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {response}
            </p>
          </div>
        )}

        {/* Main mic button */}
        <div className="flex flex-col items-center gap-3 mt-2">
          <p className="text-sm text-muted-foreground">{statusLabel}</p>

          <button
            type="button"
            onClick={
              listening
                ? stopListening
                : speaking
                  ? stopSpeaking
                  : atLimit
                    ? () => setShowUpgradeLimit(true)
                    : startListening
            }
            disabled={processing}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-voice btn-press ${
              listening
                ? "bg-red-500 animate-recording-pulse"
                : speaking
                  ? "bg-primary/80 animate-pulse-ring"
                  : processing
                    ? "bg-primary/40 cursor-wait"
                    : "bg-primary hover:opacity-90"
            }`}
            aria-label={listening ? "Stop listening" : "Start voice insight"}
            data-ocid="voice.modal.mic.button"
            data-recording={listening ? "true" : undefined}
          >
            {processing ? (
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            ) : speaking ? (
              <Volume2 className="w-8 h-8 text-white" />
            ) : listening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>

          {tier < 2 && !isAdmin && (
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Browser voice trial active. Upgrade to{" "}
              <span className="text-primary font-semibold">
                Pro Driver (R530/mo)
              </span>{" "}
              for full ElevenLabs AI voice.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
