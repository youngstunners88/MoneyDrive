/**
 * VoiceNoteRecorder.tsx — Audio capture for eTavern voice notes.
 * Uses MediaRecorder API. Audio is stored as a local object URL — the key
 * passed to onKeyReady is a blob:// URL that the VoiceNotePlayer can use.
 * Falls back gracefully when MediaRecorder is not supported.
 */

import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Mic, Square, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecorderState =
  | "idle"
  | "unsupported"
  | "requesting-permission"
  | "recording"
  | "recorded"
  | "uploaded";

interface VoiceNoteRecorderProps {
  onKeyReady: (storageKey: string, durationSec: number) => void;
  onDiscard: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

const MAX_DURATION = 120; // seconds

// ─── Component ────────────────────────────────────────────────────────────────

export function VoiceNoteRecorder({
  onKeyReady,
  onDiscard,
}: VoiceNoteRecorderProps) {
  const [state, setState] = useState<RecorderState>(() =>
    typeof MediaRecorder === "undefined" ? "unsupported" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progressPct, setProgressPct] = useState(0);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const elapsedRef = useRef<number>(0);

  // Auto-stop at 2 min
  useEffect(() => {
    if (state === "recording") {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          elapsedRef.current = next;
          setProgressPct(Math.min((next / MAX_DURATION) * 100, 100));
          if (next >= MAX_DURATION) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Cleanup on unmount — revoke object URLs and stop mic
  useEffect(() => {
    return () => {
      for (const t of streamRef.current?.getTracks() ?? []) t.stop();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    setState("requesting-permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      elapsedRef.current = 0;
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        blobRef.current = blob;
        for (const t of stream.getTracks()) t.stop();
        setDuration(elapsedRef.current);
        setState("recorded");
      };

      recorder.start(500);
      setElapsed(0);
      setProgressPct(0);
      setState("recording");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setErrorMsg(
          "Microphone access denied. Please allow mic access in your browser settings.",
        );
      } else {
        setErrorMsg("Could not start recording. Please try again.");
      }
      setState("idle");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
  }, []);

  const discard = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    blobRef.current = null;
    setElapsed(0);
    setProgressPct(0);
    setDuration(0);
    setState("idle");
    onDiscard();
  }, [onDiscard]);

  const confirmUse = useCallback(() => {
    if (!blobRef.current) return;
    // Revoke any previous URL
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(blobRef.current);
    objectUrlRef.current = url;
    onKeyReady(url, duration);
    setState("uploaded");
  }, [duration, onKeyReady]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (state === "unsupported") {
    return (
      <p className="text-xs text-muted-foreground italic">
        Voice notes not supported in this browser.
      </p>
    );
  }

  if (state === "uploaded") {
    return (
      <div
        className="flex items-center gap-2 text-sm font-medium py-1"
        style={{ color: "oklch(0.65 0.18 145)" }}
      >
        <CheckCircle className="w-4 h-4" />
        Voice note attached
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="space-y-2">
        <p className="text-destructive text-xs">{errorMsg}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setErrorMsg(null)}
          data-ocid="voice_recorder.retry_button"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (state === "idle") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={startRecording}
        className="gap-2 border-dashed"
        data-ocid="voice_recorder.start_button"
      >
        <Mic className="w-4 h-4" style={{ color: "oklch(0.6 0.22 35)" }} />
        Add Voice Note
      </Button>
    );
  }

  if (state === "requesting-permission") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Requesting microphone...
      </div>
    );
  }

  if (state === "recording") {
    return (
      <div className="space-y-2" data-ocid="voice_recorder.recording">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-mono font-semibold text-foreground">
            {formatTime(elapsed)}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            max 2:00
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-destructive transition-all duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={stopRecording}
            className="gap-1.5"
            data-ocid="voice_recorder.stop_button"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            Stop
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={discard}
            data-ocid="voice_recorder.discard_button"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (state === "recorded") {
    return (
      <div className="space-y-2" data-ocid="voice_recorder.preview">
        <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-3 py-2">
          <Mic
            className="w-4 h-4 shrink-0"
            style={{ color: "oklch(0.6 0.22 35)" }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground">
              Voice note recorded
            </div>
            <div className="text-xs text-muted-foreground">
              {formatTime(duration)}
            </div>
          </div>
          {/* Mini waveform simulation */}
          <div className="flex items-end gap-px h-5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
              <div
                key={i}
                className="w-px rounded-full"
                style={{
                  height: `${20 + Math.sin(i * 0.8) * 60}%`,
                  background: "oklch(0.6 0.22 35 / 0.6)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={confirmUse}
            className="gap-1.5"
            data-ocid="voice_recorder.confirm_button"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Use this
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={discard}
            className="gap-1.5 text-muted-foreground"
            data-ocid="voice_recorder.re_record_button"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Re-record
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
