/**
 * VoiceNotePlayer.tsx — Compact inline audio player for eTavern voice notes.
 * Lazy-loads audio only when play is first tapped.
 */

import { Loader2, Pause, Play } from "lucide-react";
import { useCallback, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoiceNotePlayerProps {
  /** storage key (URL) or object URL */
  storageKey: string;
  /** pre-known duration in seconds (optional hint) */
  durationHint?: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatTime(sec: number): string {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

const WAVEFORM_BARS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function VoiceNotePlayer({
  storageKey,
  durationHint,
}: VoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(durationHint ?? 0);
  const [error, setError] = useState(false);

  /** Create and wire up the Audio element, then optionally play. */
  const initAudio = useCallback(
    (autoPlay: boolean) => {
      if (audioRef.current) {
        // Already initialised — just play if needed
        if (autoPlay) {
          audioRef.current
            .play()
            .then(() => setPlaying(true))
            .catch(() => setError(true));
        }
        return;
      }
      setLoading(true);
      const audio = new Audio(storageKey);
      audio.preload = "metadata";

      audio.addEventListener("loadedmetadata", () =>
        setTotal(audio.duration || 0),
      );
      audio.addEventListener("timeupdate", () => setCurrent(audio.currentTime));
      audio.addEventListener("ended", () => {
        setPlaying(false);
        setCurrent(0);
        audio.currentTime = 0;
      });
      audio.addEventListener("error", () => {
        setError(true);
        setLoading(false);
      });
      audio.addEventListener("canplay", () => {
        setLoaded(true);
        setLoading(false);
        setTotal(audio.duration || 0);
        if (autoPlay) {
          audio
            .play()
            .then(() => setPlaying(true))
            .catch(() => setError(true));
        }
      });

      audioRef.current = audio;
    },
    [storageKey],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!loaded || !audio) {
      initAudio(true);
      return;
    }
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setError(true));
    }
  }, [loaded, playing, initAudio]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrent(t);
  }, []);

  const pct = total > 0 ? (current / total) * 100 : 0;

  if (error) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Voice note unavailable
      </p>
    );
  }

  return (
    <div
      className="flex items-center gap-2 bg-muted/40 rounded-xl px-2.5 py-1.5 max-w-[260px]"
      data-ocid="voice_player.container"
    >
      {/* Play/pause */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-7 h-7 rounded-full flex items-center justify-center bg-burnt-orange/90 text-white shrink-0 hover:opacity-80 transition-opacity"
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        data-ocid="voice_player.play_button"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : playing ? (
          <Pause className="w-3 h-3 fill-current" />
        ) : (
          <Play className="w-3 h-3 fill-current ml-0.5" />
        )}
      </button>

      {/* Progress bar */}
      <div className="flex-1 min-w-0 space-y-1">
        <input
          type="range"
          min={0}
          max={total || 1}
          step={0.1}
          value={current}
          onChange={handleSeek}
          disabled={!loaded}
          aria-label="Voice note progress"
          className="w-full h-1 accent-burnt-orange cursor-pointer disabled:cursor-default"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>{formatTime(current)}</span>
          <span>{formatTime(total)}</span>
        </div>
      </div>

      {/* Waveform visual — decorative bars */}
      <div className="flex items-end gap-px h-4 shrink-0">
        {WAVEFORM_BARS.map((i) => (
          <div
            key={i}
            className="w-0.5 rounded-full transition-all duration-300"
            style={{
              height: `${30 + Math.sin(i * 1.1) * 70}%`,
              background:
                i / 8 <= pct / 100
                  ? "oklch(0.6 0.22 35)"
                  : "oklch(0.4 0.02 80)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
