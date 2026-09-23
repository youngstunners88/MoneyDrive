/**
 * voiceService — ElevenLabs TTS via the backend canister.
 * The API key is never exposed to frontend. All TTS calls go through actor.elevenLabsTextToSpeech.
 * This service handles audio playback from the binary response using AudioContext (autoplay-safe).
 */

// ── Service layer ─────────────────────────────────────────────────────────────

interface ActorWithTTS {
  elevenLabsTextToSpeech(
    text: string,
  ): Promise<{ ok: Uint8Array } | { err: string }>;
}

/**
 * synthesizeSpeech — canonical service wrapper for all TTS calls.
 * Components and hooks MUST call this instead of actor.elevenLabsTextToSpeech directly.
 * Returns the audio bytes on success, or throws on error.
 */
export async function synthesizeSpeech(
  actor: ActorWithTTS,
  text: string,
): Promise<Uint8Array> {
  const result = await actor.elevenLabsTextToSpeech(text);
  if ("err" in result) {
    throw new Error(result.err);
  }
  const bytes = (result as { ok: Uint8Array }).ok;
  if (!bytes || bytes.length === 0) {
    throw new Error("ElevenLabs returned empty audio bytes");
  }
  return bytes;
}

/**
 * Play audio from a Uint8Array (MP3 bytes returned by ElevenLabs via backend).
 * Uses AudioContext for reliable playback — handles browser autoplay policy via resume().
 * Returns a Promise that resolves when audio finishes, or rejects on error.
 */
export async function playAudioBytes(bytes: Uint8Array): Promise<void> {
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioCtx) {
    throw new Error("AudioContext not supported");
  }

  const audioCtx = new AudioCtx();

  try {
    // Resume context to bypass browser autoplay policy
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    // Ensure we have a clean ArrayBuffer copy (avoid detached buffer issues)
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;

    let decoded: AudioBuffer;
    try {
      decoded = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (decodeErr) {
      console.error("[voiceService] decodeAudioData failed:", decodeErr);
      throw new Error("Failed to decode audio data");
    }

    const source = audioCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(audioCtx.destination);

    return new Promise<void>((resolve, reject) => {
      source.onended = () => {
        try {
          audioCtx.close();
        } catch {
          // ignore
        }
        resolve();
      };
      source.addEventListener("error", (e) => {
        console.error("[voiceService] AudioBufferSourceNode error:", e);
        try {
          audioCtx.close();
        } catch {
          // ignore
        }
        reject(new Error("Audio source error"));
      });
      source.start(0);
    });
  } catch (err) {
    try {
      audioCtx.close();
    } catch {
      // ignore
    }
    throw err;
  }
}

/**
 * Speak text using the browser's built-in Speech Synthesis API.
 * Used as a fallback when ElevenLabs is unavailable or bytes fail to play.
 */
export function speakWithBrowser(text: string, onEnd?: () => void): boolean {
  if (!window.speechSynthesis) {
    console.warn("[voiceService] speechSynthesis not supported");
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-ZA";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Stop any ongoing browser speech synthesis.
 */
export function stopBrowserSpeech(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
