// src/hooks/useVoiceInput.ts
//
// React wrapper around src/lib/voice-input.ts.
//
// Gives a component four things: whether to show a mic at all, whether it is
// currently listening, the live transcript while speaking, and a toggle.
//
// Usage:
//   const voice = useVoiceInput({
//     language: form.language,
//     onResult: (text) => update("topic", text),
//   });
//   {voice.available && <button onClick={voice.toggle} />}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isVoiceAvailable,
  isLanguageSupported,
  localeFor,
  startVoiceSession,
  voiceErrorMessage,
  type VoiceError,
  type VoiceSession,
} from "@/lib/voice-input";

type Options = {
  /** The Content Studio language, e.g. "Hindi". Changing it re-checks support. */
  language?: string;
  /** Called once with the finished transcript. */
  onResult: (text: string) => void;
  /** Shown to the person when something goes wrong. Wire to your toast. */
  onError?: (message: string) => void;
};

export function useVoiceInput({ language, onResult, onError }: Options) {
  const [available, setAvailable] = useState(false);
  const [languageOk, setLanguageOk] = useState(true);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");

  const sessionRef = useRef<VoiceSession | null>(null);
  // Held in a ref so the callbacks handed to the engine never go stale, which
  // would otherwise write a transcript into an old closure's state.
  const cb = useRef({ onResult, onError });
  cb.current = { onResult, onError };

  // Can this device transcribe at all?
  useEffect(() => {
    let cancelled = false;
    isVoiceAvailable()
      .then((ok) => { if (!cancelled) setAvailable(ok); })
      .catch(() => { if (!cancelled) setAvailable(false); });
    return () => { cancelled = true; };
  }, []);

  // Can it transcribe THIS language? Re-checked whenever the brief's language
  // changes, so the mic disables itself rather than producing nonsense.
  useEffect(() => {
    let cancelled = false;
    if (!available) return;
    isLanguageSupported(localeFor(language))
      .then((ok) => { if (!cancelled) setLanguageOk(ok); })
      .catch(() => { if (!cancelled) setLanguageOk(true); });
    return () => { cancelled = true; };
  }, [available, language]);

  // Stop the mic if the component unmounts mid-sentence.
  useEffect(() => () => { sessionRef.current?.stop(); }, []);

  const stop = useCallback(() => {
    sessionRef.current?.stop();
  }, []);

  const start = useCallback(async () => {
    if (listening) return;
    setPartial("");
    setListening(true);

    const fail = (e: VoiceError) => {
      cb.current.onError?.(voiceErrorMessage(e, language ?? "English"));
    };

    try {
      sessionRef.current = await startVoiceSession(language, {
        onPartial: setPartial,
        onFinal: (text) => cb.current.onResult(text),
        onError: fail,
        onEnd: () => {
          setListening(false);
          setPartial("");
          sessionRef.current = null;
        },
      });
    } catch (e) {
      console.error("[voice] could not start:", e);
      setListening(false);
      setPartial("");
      fail("failed");
    }
  }, [language, listening]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else void start();
  }, [listening, start, stop]);

  return {
    /** Show the mic button only when true. */
    available,
    /** False when the device can't handle the selected Content Language. */
    languageOk,
    listening,
    /** Live text while speaking — for feedback, not for saving. */
    partial,
    start,
    stop,
    toggle,
  };
}
