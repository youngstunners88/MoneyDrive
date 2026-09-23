/**
 * useVoiceAgent.ts — Replaces useVoice.ts with a proper ElevenLabs voice agent.
 *
 * Since @elevenlabs/react is not installed, this implements the ElevenLabs
 * Conversational AI WebSocket protocol directly using the browser's native
 * WebSocket API.
 *
 * Pipeline:
 *   1. Driver taps mic → startVoiceSession()
 *   2. Backend generates signed WebSocket URL via getElevenLabsSignedUrl()
 *   3. WebSocket opens to ElevenLabs Conversational AI endpoint
 *   4. Web Speech Recognition captures driver speech → sent as text
 *   5. ElevenLabs agent responds → audio played via AudioContext
 *   6. All AI routing goes through queryNduna (hermesService) via client_tool
 *
 * Tier check: Tier 1 gets text-only chat. Voice requires Tier 2+.
 */

import { useCallback, useEffect, useRef } from "react";
import {
  getContextSummary,
  logFeatureInteract,
} from "../services/behavioralContextService";
import { queryNduna } from "../services/hermesService";
import { VOICE_AGENT_ID, getSignedUrl } from "../services/voiceAgentService";
import { useActor } from "../shared/hooks/useActor";
import { useVoiceStore } from "../stores/voiceStore";

// ── Browser speech recognition types ─────────────────────────────────────────
// SpeechRecognition globals are declared in src/features/voice/useVoice.ts.
// We reference them via typeof window.SpeechRecognition to avoid re-declaring.

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseVoiceAgentOptions {
  /** Driver's subscription tier. Tier 2+ required for voice. */
  driverTier: number;
  isAdmin?: boolean;
}

interface UseVoiceAgentReturn {
  canUseVoice: boolean;
  status: ReturnType<typeof useVoiceStore.getState>["status"];
  transcript: string[];
  isMuted: boolean;
  sessionDuration: number;
  error: string | null;
  startVoiceSession: () => Promise<void>;
  endVoiceSession: () => void;
  toggleMute: () => void;
}

export function useVoiceAgent({
  driverTier,
  isAdmin = false,
}: UseVoiceAgentOptions): UseVoiceAgentReturn {
  const { actor } = useActor();
  const { status, transcript, isMuted, sessionDuration, error } =
    useVoiceStore();
  const {
    setStatus,
    addTranscript,
    setMuted,
    setError,
    setSessionDuration,
    resetSession,
  } = useVoiceStore.getState();

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Using the existing SpeechRecognitionInstance type from useVoice.ts's global declaration
  const recognitionRef = useRef<InstanceType<
    NonNullable<typeof window.SpeechRecognition>
  > | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionActiveRef = useRef(false);

  const canUseVoice = isAdmin || driverTier >= 2;

  // ── Audio playback ────────────────────────────────────────────────────────

  const playAudioChunk = useCallback(async (base64Audio: string) => {
    try {
      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;
      const bytes = Uint8Array.from(atob(base64Audio), (c) => c.charCodeAt(0));
      const buffer = await ctx.decodeAudioData(bytes.buffer);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err) {
      console.warn("[useVoiceAgent] audio playback error:", err);
    }
  }, []);

  // ── Send text to ElevenLabs via WebSocket ─────────────────────────────────

  const sendUserText = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(
        JSON.stringify({
          user_audio_chunk: btoa(text), // text input mode
          type: "user_audio_chunk",
        }),
      );
      addTranscript(`Driver: ${text}`);
    },
    [addTranscript],
  );

  // ── Start speech recognition ──────────────────────────────────────────────

  const startRecognition = useCallback(() => {
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = navigator.language || "en-ZA";
    recognitionRef.current = rec;

    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      if (!text.trim()) return;
      setStatus("listening");

      // Route through Nduna AI (hermesService) — not local keyword rules
      if (actor) {
        try {
          const context = await getContextSummary();
          const prompt = context ? `[Context: ${context}]\n\n${text}` : text;
          addTranscript(`Driver: ${text}`);
          setStatus("speaking");
          const response = await queryNduna(actor, prompt);
          addTranscript(`Nduna: ${response}`);
          // Let ElevenLabs speak the response if session is active
          if (
            sessionActiveRef.current &&
            wsRef.current?.readyState === WebSocket.OPEN
          ) {
            wsRef.current.send(
              JSON.stringify({
                type: "tts",
                text: response,
                voice_id: VOICE_AGENT_ID,
              }),
            );
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          addTranscript(`Error: ${msg}`);
        } finally {
          if (sessionActiveRef.current) setStatus("connected");
        }
      } else {
        sendUserText(text);
      }
    };

    rec.onerror = () => {
      if (sessionActiveRef.current) setStatus("connected");
    };

    rec.onend = () => {
      // Restart continuous listening while session is active
      if (sessionActiveRef.current && status !== "speaking") {
        try {
          rec.start();
        } catch {
          // ignore restart errors
        }
      }
    };

    try {
      rec.start();
      setStatus("listening");
    } catch (err) {
      console.warn("[useVoiceAgent] speech recognition start error:", err);
    }
  }, [actor, addTranscript, setStatus, sendUserText, status]);

  // ── Session controls ──────────────────────────────────────────────────────

  const startVoiceSession = useCallback(async () => {
    if (!canUseVoice) return;

    resetSession();
    setStatus("connecting");
    sessionActiveRef.current = true;
    logFeatureInteract("voice", "start_session");

    try {
      // Fetch signed URL from backend — API key never reaches the browser
      const signedUrl = await getSignedUrl();

      const ws = new WebSocket(signedUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        durationTimerRef.current = setInterval(() => {
          setSessionDuration(useVoiceStore.getState().sessionDuration + 1);
        }, 1_000);
        startRecognition();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as {
            type?: string;
            audio?: string;
            text?: string;
            error?: string;
          };

          if (data.type === "audio" && data.audio) {
            setStatus("speaking");
            void playAudioChunk(data.audio).then(() => {
              if (sessionActiveRef.current) setStatus("connected");
            });
          } else if (data.type === "transcript" && data.text) {
            addTranscript(`Nduna: ${data.text}`);
          } else if (data.type === "error") {
            setError(data.error ?? "ElevenLabs error");
          }
        } catch {
          // Non-JSON frame — ignore
        }
      };

      ws.onerror = () => {
        setError("Voice connection error — please try again.");
        sessionActiveRef.current = false;
      };

      ws.onclose = () => {
        sessionActiveRef.current = false;
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }
        if (status !== "error") setStatus("idle");
      };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to start voice session";
      setError(msg);
      sessionActiveRef.current = false;
      console.error("[useVoiceAgent] startVoiceSession failed:", err);
    }
  }, [
    canUseVoice,
    resetSession,
    setStatus,
    setError,
    startRecognition,
    playAudioChunk,
    setSessionDuration,
    addTranscript,
    status,
  ]);

  const endVoiceSession = useCallback(() => {
    sessionActiveRef.current = false;

    recognitionRef.current?.stop();
    recognitionRef.current = null;

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        void audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    resetSession();
  }, [resetSession]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setMuted(next);
    // Mute by suspending / resuming AudioContext
    if (audioCtxRef.current) {
      if (next) {
        void audioCtxRef.current.suspend();
      } else {
        void audioCtxRef.current.resume();
      }
    }
  }, [isMuted, setMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endVoiceSession();
    };
  }, [endVoiceSession]);

  return {
    canUseVoice,
    status,
    transcript,
    isMuted,
    sessionDuration,
    error,
    startVoiceSession,
    endVoiceSession,
    toggleMute,
  };
}
