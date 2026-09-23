import { useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { playAudioBytes, speakWithBrowser } from "../../services/voiceService";
import { useActor } from "../../shared/hooks/useActor";

const TIER1_MONTHLY_CHAR_LIMIT = 500;

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionResultEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface ActorWithVoice {
  getVoiceUsage(): Promise<{ date: bigint; count: bigint }>;
  incrementVoiceUsage(): Promise<bigint>;
  elevenLabsTextToSpeech(
    text: string,
  ): Promise<{ ok: Uint8Array } | { err: string }>;
}

export type VoiceStatus = "idle" | "listening" | "processing" | "speaking";

interface UseVoiceOptions {
  tier: number;
  isAdmin?: boolean;
  profile?: { voiceEnabled?: boolean; currencyCode?: string } | null;
}

/**
 * Build a helpful voice response from the transcribed command.
 * Runs purely on the frontend — no AI routing required.
 */
function buildVoiceResponse(cmd: string): string {
  const lower = cmd.toLowerCase().trim();

  if (lower.includes("hello") || lower.includes("hi ") || lower === "hi") {
    return "Hello! I'm MoneyDrive. Ask me anything about your earnings, fuel, expenses, or your shift.";
  }
  if (
    lower.includes("earning") ||
    lower.includes("money") ||
    lower.includes("revenue")
  ) {
    return "Open your Earnings tab to see today's totals, trip count, and your daily goal progress.";
  }
  if (
    lower.includes("fuel") ||
    lower.includes("petrol") ||
    lower.includes("diesel")
  ) {
    return "Head to the Fuel Calculator tab to work out your fuel cost and profit per trip.";
  }
  if (lower.includes("expense") || lower.includes("cost")) {
    return "Your Expenses tab tracks all your running costs so you always know your true profit.";
  }
  if (lower.includes("trip") || lower.includes("log")) {
    return "Tap the plus button in Quick Actions to log a new trip instantly.";
  }
  if (lower.includes("surge") || lower.includes("busy")) {
    return "Check the Events tab for upcoming local events — those are your best surge opportunities.";
  }
  if (
    lower.includes("event") ||
    lower.includes("concert") ||
    lower.includes("sport")
  ) {
    return "Your Events tab shows upcoming events in your city so you can plan your shifts around them.";
  }
  if (
    lower.includes("stake") ||
    lower.includes("icp") ||
    lower.includes("crypto")
  ) {
    return "Visit the Learn and Stake tab to see live ICP prices, calculate staking rewards, and track your neurons.";
  }
  if (lower.includes("schedule") || lower.includes("shift")) {
    return "Use the Schedule tab to plan your driving shifts and never miss a peak time.";
  }
  if (
    lower.includes("academy") ||
    lower.includes("education") ||
    lower.includes("learn")
  ) {
    return "Visit Driver Wealth Academy for Rich Dad Poor Dad, Alex Hormozi, Myron Golden, and the Rich Dad Channel — your financial education hub.";
  }
  if (lower.includes("help") || lower.includes("what can you")) {
    return "I can help you with earnings, fuel costs, expenses, trip logging, events, and staking. Just ask!";
  }
  if (
    lower.includes("product") ||
    lower.includes("sell") ||
    lower.includes("menu") ||
    lower.includes("sales")
  ) {
    return "Open your QR Menu tab to manage your in-car products and let passengers scan to order from you.";
  }
  if (
    lower.includes("tier") ||
    lower.includes("upgrade") ||
    lower.includes("plan")
  ) {
    return "Go to Settings to view and upgrade your subscription plan for more features.";
  }
  if (lower.includes("name")) {
    return "I'm MoneyDrive — your personal command center for professional rideshare driving.";
  }

  return `Got it — "${cmd}". Ask me about earnings, fuel, expenses, events, or products and I'll point you in the right direction.`;
}

export function useVoice({ tier, isAdmin = false, profile }: UseVoiceOptions) {
  const { actor: rawActor } = useActor();
  const actor = rawActor as (ActorWithVoice & typeof rawActor) | null;
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const statusRef = useRef<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [audioFailed, setAudioFailed] = useState(false);
  const [showUpgradeLimit, setShowUpgradeLimit] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const { data: voiceUsage, refetch: refetchUsage } = useQuery({
    queryKey: ["voiceUsage"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVoiceUsage();
    },
    enabled: !!actor,
  });

  const [localCharCount, setLocalCharCount] = useState<number | null>(null);
  const charCount =
    localCharCount !== null ? localCharCount : Number(voiceUsage?.count ?? 0);
  const atLimit =
    !isAdmin && tier === 1 && charCount >= TIER1_MONTHLY_CHAR_LIMIT;

  const stopCurrentAudio = useCallback(() => {
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  /**
   * Speak text via ElevenLabs (Tier 2+ / admin) or browser synthesis (Tier 1 trial).
   * CRITICAL: Does NOT route through Hermes. Direct TTS only.
   * On ANY failure: sets audioFailed=true so UI shows text immediately (never silent failure).
   */
  const speak = useCallback(
    async (text: string) => {
      stopCurrentAudio();
      setStatus("speaking");
      setAudioFailed(false);

      const useElevenLabs = (tier >= 2 || isAdmin) && !!actor;

      if (useElevenLabs) {
        try {
          console.log(
            "[voice] Requesting ElevenLabs TTS for:",
            text.slice(0, 50),
          );
          const result = await actor.elevenLabsTextToSpeech(text);

          if ("err" in result) {
            console.warn("[voice] ElevenLabs returned error:", result.err);
            // Try browser TTS as secondary fallback
            const browserOk = speakWithBrowser(text, () => setStatus("idle"));
            if (!browserOk) {
              // No audio available — surface text fallback immediately
              setAudioFailed(true);
              setStatus("idle");
            }
            return;
          }

          const audioBytes = (result as { ok: Uint8Array }).ok;
          if (!audioBytes || audioBytes.length === 0) {
            console.warn("[voice] ElevenLabs returned empty bytes");
            const browserOk = speakWithBrowser(text, () => setStatus("idle"));
            if (!browserOk) {
              setAudioFailed(true);
              setStatus("idle");
            }
            return;
          }

          console.log(
            "[voice] Playing ElevenLabs audio, bytes:",
            audioBytes.length,
          );
          try {
            await playAudioBytes(audioBytes);
            console.log("[voice] Audio playback complete");
            setStatus("idle");
          } catch (playErr) {
            console.error("[voice] AudioContext playback failed:", playErr);
            // Secondary fallback: browser TTS
            const browserOk = speakWithBrowser(text, () => setStatus("idle"));
            if (!browserOk) {
              // No audio at all — surface text immediately
              setAudioFailed(true);
              setStatus("idle");
            }
          }
        } catch (err) {
          console.error("[voice] ElevenLabs TTS call failed:", err);
          const browserOk = speakWithBrowser(text, () => setStatus("idle"));
          if (!browserOk) {
            setAudioFailed(true);
            setStatus("idle");
          }
        }
      } else {
        // Tier 1: browser synthesis trial
        const ok = speakWithBrowser(text, () => setStatus("idle"));
        if (!ok) {
          // Browser TTS also unavailable — show text
          setAudioFailed(true);
          toast.info(
            "Audio unavailable in this browser — your response is shown below.",
          );
          setStatus("idle");
        }
      }
    },
    [tier, isAdmin, actor, stopCurrentAudio],
  );

  /**
   * Process transcribed command: build a local response and speak it back.
   * Does NOT call Hermes/AI — local response only.
   */
  const processCommand = useCallback(
    async (cmd: string) => {
      setStatus("processing");
      setAudioFailed(false);
      try {
        const responseText = buildVoiceResponse(cmd);
        setResponse(responseText);
        await speak(responseText);
      } catch (err) {
        console.error("[voice] processCommand error:", err);
        setAudioFailed(true);
        setStatus("idle");
      }
    },
    [speak],
  );

  const startListening = useCallback(async () => {
    if (!isAdmin && tier === 1 && atLimit) {
      setShowUpgradeLimit(true);
      return;
    }
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      toast.error("Voice input not supported on this browser. Try Chrome.");
      return;
    }
    stopCurrentAudio();
    setTranscript("");
    setResponse("");
    setAudioFailed(false);
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language || "en-ZA";
    recognitionRef.current = recognition;

    recognition.onresult = async (ev: SpeechRecognitionResultEvent) => {
      const text = ev.results[0][0].transcript;
      setTranscript(text);
      if (!isAdmin && tier === 1) {
        const textLen = text.length;
        if (charCount + textLen > TIER1_MONTHLY_CHAR_LIMIT) {
          setShowUpgradeLimit(true);
          setStatus("idle");
          return;
        }
        if (actor) {
          try {
            await actor.incrementVoiceUsage();
            setLocalCharCount((prev) => (prev ?? charCount) + textLen);
            refetchUsage();
          } catch {
            // Non-critical — continue with voice response even if tracking fails
          }
        }
      }
      await processCommand(text);
    };
    recognition.onerror = (e) => {
      console.warn("[voice] SpeechRecognition error:", e);
      setStatus("idle");
    };
    recognition.onend = () => {
      if (statusRef.current === "listening") {
        statusRef.current = "idle";
        setStatus("idle");
      }
    };
    recognition.start();
    statusRef.current = "listening";
    setStatus("listening");
  }, [
    tier,
    isAdmin,
    atLimit,
    actor,
    charCount,
    refetchUsage,
    processCommand,
    stopCurrentAudio,
  ]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    statusRef.current = "idle";
    setStatus("idle");
  }, []);

  const stopSpeaking = useCallback(() => {
    stopCurrentAudio();
    setStatus("idle");
  }, [stopCurrentAudio]);

  const voiceEnabled = profile?.voiceEnabled !== false;

  return {
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
    charLimit: TIER1_MONTHLY_CHAR_LIMIT,
    atLimit,
    voiceEnabled,
  };
}
