/**
 * VoiceAgentModal — Full conversational ElevenLabs voice agent UI.
 * Tier 2+ only. Uses @elevenlabs/react useConversation hook.
 * Mobile: fullscreen overlay. Desktop: centered modal.
 */

import { Mic, MicOff, PhoneOff, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "../../shared/hooks/useActor";

// ── Types ──────────────────────────────────────────────────────────────────────

export type AgentStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "error";

interface ConversationTurn {
  id: string;
  role: "user" | "agent";
  text: string;
  ts: Date;
}

interface VoiceAgentModalProps {
  open: boolean;
  onClose: () => void;
  tier: number;
  isAdmin?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const VOICE_AGENT_ID = "mJZEpDe9qAKz9yOOwCD8";
const MAX_TURNS_DISPLAYED = 5;

// ── Status label map ───────────────────────────────────────────────────────────

function statusLabel(status: AgentStatus): string {
  switch (status) {
    case "connecting":
      return "Connecting...";
    case "listening":
      return "Listening...";
    case "speaking":
      return "Nduna is speaking...";
    case "error":
      return "Connection error — tap retry";
    default:
      return "Tap to start a conversation";
  }
}

// ── Tier guard ─────────────────────────────────────────────────────────────────

function TierGuard({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-8 py-12 text-center">
      <div
        className="w-20 h-20 rounded-full overflow-hidden border-2 mx-auto"
        style={{ borderColor: "oklch(0.75 0.12 85 / 0.4)" }}
      >
        <img
          src="https://i.imgur.com/u98U7S6.png"
          alt="Nduna"
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <h2 className="font-display font-bold text-xl text-foreground mb-2">
          Voice is a Tier 2 Benefit
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          Upgrade to{" "}
          <span className="text-primary font-semibold">
            Pro Driver (R530/month)
          </span>{" "}
          to unlock full ElevenLabs AI voice conversations with Nduna.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.60 0.22 35))",
            color: "oklch(0.08 0.01 85)",
          }}
          data-ocid="voice.upgrade.button"
        >
          <Zap className="w-4 h-4" />
          Upgrade to Pro Driver
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="voice.tier_guard.close_button"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

// ── Transcript turn ────────────────────────────────────────────────────────────

function TurnBubble({ turn }: { turn: ConversationTurn }) {
  const isUser = turn.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mr-2 self-end border"
          style={{ borderColor: "oklch(0.75 0.12 85 / 0.3)" }}
        >
          <img
            src="https://i.imgur.com/u98U7S6.png"
            alt="Nduna"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div
        className="max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
        style={
          isUser
            ? {
                background:
                  "linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.68 0.14 82))",
                color: "oklch(0.08 0.01 85)",
                borderRadius: "1rem 1rem 0.25rem 1rem",
              }
            : {
                background: "oklch(0.14 0.012 82)",
                border: "1px solid oklch(0.22 0.02 85)",
                color: "oklch(0.85 0.04 85)",
                borderRadius: "1rem 1rem 1rem 0.25rem",
              }
        }
      >
        {turn.text}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function VoiceAgentModal({
  open,
  onClose,
  tier,
  isAdmin = false,
}: VoiceAgentModalProps) {
  const { actor } = useActor();
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // We build the conversation manually via ElevenLabs WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const canUseVoice = isAdmin || tier >= 2;

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  // Session timer
  useEffect(() => {
    if (status === "listening" || status === "speaking") {
      timerRef.current = setInterval(() => {
        setSessionDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      endSession();
      setTurns([]);
      setSessionDuration(0);
      setErrorMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addTurn = useCallback((role: "user" | "agent", text: string) => {
    setTurns((prev) => {
      const next: ConversationTurn[] = [
        ...prev,
        { id: `${Date.now()}-${role}`, role, text, ts: new Date() },
      ];
      return next.slice(-MAX_TURNS_DISPLAYED);
    });
  }, []);

  const endSession = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    }
    // Stop mic
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        /* ignore */
      }
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) track.stop();
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        /* ignore */
      }
      audioCtxRef.current = null;
    }
    setStatus("idle");
    setIsMuted(false);
  }, []);

  const startSession = useCallback(async () => {
    if (!canUseVoice) return;
    setStatus("connecting");
    setErrorMessage(null);

    try {
      // 1. Fetch signed URL from backend
      let signedUrl: string | null = null;
      if (actor && "getElevenLabsSignedUrl" in actor) {
        const result = await (
          actor as {
            getElevenLabsSignedUrl: () => Promise<
              { ok: string } | { err: string }
            >;
          }
        ).getElevenLabsSignedUrl();
        if ("ok" in result) {
          signedUrl = result.ok;
        }
      }

      // Fallback: direct agent URL (uses VOICE_AGENT_ID only, no key exposure)
      const wsUrl =
        signedUrl ??
        `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${VOICE_AGENT_ID}`;

      // 2. Open mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) throw new Error("AudioContext not supported");
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioCtx.destination);

      // 3. Connect WebSocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("listening");
        // Send initial config
        ws.send(
          JSON.stringify({
            type: "conversation_initiation_client_data",
            conversation_config_override: {
              agent: {
                prompt: {
                  prompt:
                    "You are Nduna, a male SA township-energy AI assistant for MoneyDrive. Help drivers maximize their earnings. Be direct, practical, and speak in SA English.",
                },
                first_message:
                  "Sawubona! I'm Nduna. What can I help you with today?",
              },
            },
          }),
        );
      };

      // Stream mic audio to ElevenLabs
      processor.onaudioprocess = (e) => {
        if (
          !wsRef.current ||
          wsRef.current.readyState !== WebSocket.OPEN ||
          isMuted
        )
          return;
        const pcm = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, pcm[i] * 32768));
        }
        const b64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
        ws.send(JSON.stringify({ user_audio_chunk: b64 }));
      };

      // Handle messages from ElevenLabs
      ws.onmessage = async (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as {
            type: string;
            audio?: string;
            audio_event?: { audio_base_64: string };
            user_transcription_event?: { user_transcript: string };
            agent_response_event?: { agent_response: string };
          };

          if (msg.type === "audio" && msg.audio) {
            setStatus("speaking");
            await playBase64Audio(msg.audio, audioCtxRef.current);
            setStatus("listening");
          } else if (
            msg.type === "audio_event" &&
            msg.audio_event?.audio_base_64
          ) {
            setStatus("speaking");
            await playBase64Audio(
              msg.audio_event.audio_base_64,
              audioCtxRef.current,
            );
            setStatus("listening");
          } else if (
            msg.type === "user_transcription_event" &&
            msg.user_transcription_event?.user_transcript
          ) {
            addTurn("user", msg.user_transcription_event.user_transcript);
          } else if (
            msg.type === "agent_response_event" &&
            msg.agent_response_event?.agent_response
          ) {
            addTurn("agent", msg.agent_response_event.agent_response);
          }
        } catch {
          // Ignore malformed frames
        }
      };

      ws.onerror = () => {
        setStatus("error");
        setErrorMessage(
          "Voice connection failed. Check your network and try again.",
        );
        endSession();
      };

      ws.onclose = () => {
        if (status !== "idle") setStatus("idle");
      };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not start voice session";
      setErrorMessage(msg);
      setStatus("error");
      endSession();
    }
  }, [canUseVoice, actor, isMuted, addTurn, endSession, status]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  // Format session timer
  const mm = String(Math.floor(sessionDuration / 60)).padStart(2, "0");
  const ss = String(sessionDuration % 60).padStart(2, "0");

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm w-full cursor-default"
        onClick={onClose}
        aria-label="Close voice modal"
        tabIndex={-1}
      />

      {/* Modal — fullscreen on mobile, centered card on desktop */}
      <dialog
        open
        className="fixed z-50 inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] md:max-h-[90vh] flex flex-col m-0 p-0 border-0 bg-transparent w-full max-w-full h-full md:h-auto"
        style={{
          background: "oklch(0.09 0.012 78)",
          borderRadius: "0",
          ...(typeof window !== "undefined" && window.innerWidth >= 768
            ? {
                border: "1px solid oklch(0.75 0.12 85 / 0.25)",
                borderRadius: "1.5rem",
                boxShadow:
                  "0 0 60px oklch(0.75 0.12 85 / 0.15), 0 24px 48px rgba(0,0,0,0.5)",
              }
            : {}),
        }}
        aria-label="Nduna Voice Session"
        data-ocid="voice.agent.dialog"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b"
          style={{
            background: "oklch(0.11 0.015 75)",
            borderColor: "oklch(0.75 0.12 85 / 0.15)",
            borderRadius: "1.5rem 1.5rem 0 0",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0"
              style={{ borderColor: "oklch(0.75 0.12 85 / 0.5)" }}
            >
              <img
                src="https://i.imgur.com/u98U7S6.png"
                alt="Nduna"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-foreground leading-none">
                Nduna Voice
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {status === "listening" || status === "speaking"
                  ? `${mm}:${ss}`
                  : "AI Voice Assistant"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors hover:bg-white/10"
            aria-label="Close voice modal"
            data-ocid="voice.agent.close_button"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          {!canUseVoice ? (
            <TierGuard onClose={onClose} />
          ) : (
            <>
              {/* Avatar + status */}
              <div className="flex flex-col items-center pt-8 pb-4 px-5">
                {/* Pulsing avatar when speaking */}
                <div
                  className="relative mb-4"
                  aria-live="polite"
                  aria-label={statusLabel(status)}
                >
                  <div
                    className="w-24 h-24 rounded-full overflow-hidden border-4 transition-all duration-300"
                    style={{
                      borderColor:
                        status === "speaking"
                          ? "oklch(0.75 0.12 85 / 0.8)"
                          : status === "listening"
                            ? "oklch(0.60 0.22 35 / 0.7)"
                            : "oklch(0.75 0.12 85 / 0.3)",
                      animation:
                        status === "speaking"
                          ? "ndunaAvatarPulse 1s ease-in-out infinite"
                          : "none",
                      boxShadow:
                        status === "speaking"
                          ? "0 0 24px oklch(0.75 0.12 85 / 0.35)"
                          : "none",
                    }}
                  >
                    <img
                      src="https://i.imgur.com/u98U7S6.png"
                      alt="Nduna"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Listening ring */}
                  {status === "listening" && (
                    <div
                      className="absolute inset-0 rounded-full border-2 animate-ping"
                      style={{ borderColor: "oklch(0.60 0.22 35 / 0.4)" }}
                    />
                  )}
                  {/* Connecting spinner */}
                  {status === "connecting" && (
                    <div
                      className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: "oklch(0.75 0.12 85 / 0.5)" }}
                    />
                  )}
                </div>

                {/* Status badge */}
                <div
                  className="px-4 py-1.5 rounded-full text-xs font-semibold mb-1"
                  style={{
                    background:
                      status === "speaking"
                        ? "oklch(0.75 0.12 85 / 0.15)"
                        : status === "listening"
                          ? "oklch(0.60 0.22 35 / 0.15)"
                          : status === "error"
                            ? "oklch(0.45 0.18 25 / 0.2)"
                            : "oklch(0.18 0.015 80)",
                    border: `1px solid ${
                      status === "speaking"
                        ? "oklch(0.75 0.12 85 / 0.3)"
                        : status === "listening"
                          ? "oklch(0.60 0.22 35 / 0.4)"
                          : status === "error"
                            ? "oklch(0.45 0.18 25 / 0.4)"
                            : "oklch(0.28 0.02 80)"
                    }`,
                    color:
                      status === "speaking"
                        ? "oklch(0.75 0.12 85)"
                        : status === "listening"
                          ? "oklch(0.78 0.14 40)"
                          : status === "error"
                            ? "oklch(0.75 0.15 25)"
                            : "oklch(0.60 0.03 80)",
                  }}
                  data-ocid="voice.agent.status"
                >
                  {statusLabel(status)}
                </div>

                {errorMessage && (
                  <p
                    className="text-xs text-center mt-1 max-w-xs leading-relaxed"
                    style={{ color: "oklch(0.70 0.14 25)" }}
                  >
                    {errorMessage}
                  </p>
                )}
              </div>

              {/* Transcript */}
              {turns.length > 0 && (
                <div
                  className="flex-1 mx-4 mb-4 rounded-2xl overflow-y-auto px-4 py-3"
                  style={{
                    background: "oklch(0.07 0.01 80)",
                    border: "1px solid oklch(0.20 0.018 82)",
                    maxHeight: "220px",
                    minHeight: "100px",
                  }}
                  data-ocid="voice.agent.transcript"
                  aria-label="Conversation transcript"
                >
                  {turns.map((turn) => (
                    <TurnBubble key={turn.id} turn={turn} />
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              )}

              {/* Empty state when idle with no turns */}
              {turns.length === 0 && status === "idle" && (
                <div
                  className="mx-4 mb-4 rounded-2xl px-4 py-6 text-center"
                  style={{
                    background: "oklch(0.07 0.01 80)",
                    border: "1px solid oklch(0.20 0.018 82)",
                  }}
                >
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Start a session to talk to Nduna.
                    <br />
                    Ask about earnings, surge spots, or anything about your
                    driving business.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls — only shown for eligible tiers */}
        {canUseVoice && (
          <div
            className="flex-shrink-0 px-6 py-5 flex items-center justify-center gap-5 border-t"
            style={{
              background: "oklch(0.08 0.01 78)",
              borderColor: "oklch(0.20 0.018 82)",
              borderRadius: "0 0 1.5rem 1.5rem",
            }}
          >
            {/* Start / active session controls */}
            {status === "idle" || status === "error" ? (
              <button
                type="button"
                onClick={startSession}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.60 0.22 35), oklch(0.50 0.18 35))",
                  color: "white",
                  boxShadow: "0 4px 20px oklch(0.60 0.22 35 / 0.35)",
                }}
                data-ocid="voice.start_session.button"
              >
                <Mic className="w-5 h-5" />
                Start Voice Session
              </button>
            ) : (
              <>
                {/* Mute toggle */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: isMuted
                      ? "oklch(0.45 0.18 25 / 0.2)"
                      : "oklch(0.18 0.015 80)",
                    border: `2px solid ${isMuted ? "oklch(0.55 0.18 25 / 0.5)" : "oklch(0.28 0.02 80)"}`,
                  }}
                  aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                  aria-pressed={isMuted}
                  data-ocid="voice.mute.toggle"
                >
                  {isMuted ? (
                    <MicOff
                      className="w-5 h-5"
                      style={{ color: "oklch(0.70 0.15 25)" }}
                    />
                  ) : (
                    <Mic className="w-5 h-5 text-foreground" />
                  )}
                </button>

                {/* End call */}
                <button
                  type="button"
                  onClick={() => {
                    endSession();
                    onClose();
                  }}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.45 0.20 25), oklch(0.38 0.18 25))",
                    boxShadow: "0 4px 16px oklch(0.45 0.20 25 / 0.4)",
                  }}
                  aria-label="End voice session"
                  data-ocid="voice.end_session.button"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>

      <style>{`
        @keyframes ndunaAvatarPulse {
          0%, 100% { transform: scale(1.0); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </>
  );
}

// ── Audio helper ───────────────────────────────────────────────────────────────

async function playBase64Audio(
  b64: string,
  ctx: AudioContext | null,
): Promise<void> {
  if (!ctx) return;
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const buffer = await ctx.decodeAudioData(bytes.buffer);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    await new Promise<void>((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  } catch {
    // Ignore decode errors on non-audio frames
  }
}
