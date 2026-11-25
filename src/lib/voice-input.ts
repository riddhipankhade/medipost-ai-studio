// src/lib/voice-input.ts
//
// Speech-to-text for the Content Studio brief. One interface, two engines.
//
// WHY TWO ENGINES
//   In the iOS app the page runs inside WKWebView, where `webkitSpeechRecognition`
//   EXISTS on window but never works — no permission prompt, no results
//   (WebKit bug 239816, open since 2022). Feature detection lies there, so a
//   mic driven by the Web Speech API would appear in the App Store build and
//   silently do nothing. Platform is therefore checked before capability:
//
//     native (iOS / Android app) -> @capgo/capacitor-speech-recognition
//     browser                    -> Web Speech API
//     anything else              -> unsupported, caller hides the mic
//
//   Both are free. Nothing here calls a paid speech API.
//
// LANGUAGES
//   The ten Content Studio languages are mapped to BCP-47 below, all Indian
//   locales. Whether a device can actually transcribe a given one depends on
//   the OS version and which language packs the user has installed — it is not
//   something we control or can promise. `isLanguageSupported` asks the device
//   rather than assuming, and the caller is expected to disable the mic (with a
//   reason) instead of returning nonsense.

import { Capacitor } from "@capacitor/core";

export type VoiceEngine = "native" | "web" | "none";

export type VoiceError =
  | "permission-denied"
  | "no-speech"
  | "language-unsupported"
  | "not-supported"
  | "failed";

export type VoiceSessionHandlers = {
  /** Fires repeatedly while the person is speaking. Use for live feedback only. */
  onPartial?: (text: string) => void;
  /** Fires once with the finished transcript. */
  onFinal: (text: string) => void;
  onError?: (error: VoiceError) => void;
  /** Fires when the engine stops listening, for any reason. */
  onEnd?: () => void;
};

export type VoiceSession = { stop: () => void };

/* ─────────────────────────────────────────────────────────────────────────
   Languages
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Content Studio language -> BCP-47 locale.
 *
 * Keys must match CONTENT_LANGUAGES in src/routes/_app.generate.tsx exactly.
 * Indian locales throughout: a doctor dictating English in Ahmedabad is better
 * served by en-IN than en-US.
 */
export const VOICE_LOCALES: Record<string, string> = {
  English:   "en-IN",
  Hindi:     "hi-IN",
  Marathi:   "mr-IN",
  Kannada:   "kn-IN",
  Tamil:     "ta-IN",
  Telugu:    "te-IN",
  Bengali:   "bn-IN",
  Gujarati:  "gu-IN",
  Punjabi:   "pa-IN",
  Malayalam: "ml-IN",
};

export function localeFor(contentLanguage: string | undefined): string {
  return VOICE_LOCALES[contentLanguage ?? "English"] ?? "en-IN";
}

/* ─────────────────────────────────────────────────────────────────────────
   Capability
   ───────────────────────────────────────────────────────────────────────── */

type WebSpeechCtor = new () => any;

function webSpeechCtor(): WebSpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function detectEngine(): VoiceEngine {
  // Platform first, capability second — see the WKWebView note at the top.
  if (Capacitor.isNativePlatform()) return "native";
  return webSpeechCtor() ? "web" : "none";
}

let nativePluginPromise: Promise<any> | null = null;

/**
 * Loaded on demand so the web bundle never pulls in the native plugin, and so
 * a missing dependency degrades to "no mic" rather than a blank page.
 */
async function nativePlugin(): Promise<any | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!nativePluginPromise) {
    nativePluginPromise = import("@capgo/capacitor-speech-recognition")
      .then((m) => m.SpeechRecognition)
      .catch((e) => {
        console.error("[voice] native speech plugin unavailable:", e);
        return null;
      });
  }
  return nativePluginPromise;
}

/** True when the device can transcribe at all. */
export async function isVoiceAvailable(): Promise<boolean> {
  const engine = detectEngine();
  if (engine === "none") return false;
  if (engine === "web") return true;

  const plugin = await nativePlugin();
  if (!plugin) return false;
  try {
    const { available } = await plugin.available();
    return !!available;
  } catch {
    return false;
  }
}

/**
 * Whether a specific language can be transcribed on this device.
 *
 * Deliberately optimistic when the device won't say. Android 13+ stopped
 * exposing the locale list, and browsers never had one — in both cases the
 * honest answer is "unknown", and refusing to show a mic because we couldn't
 * check would disable the feature for most users. A wrong guess here surfaces
 * as a `language-unsupported` error at start time, which the caller shows.
 */
export async function isLanguageSupported(locale: string): Promise<boolean> {
  if (detectEngine() !== "native") return true;

  const plugin = await nativePlugin();
  if (!plugin) return false;

  try {
    const { languages } = await plugin.getSupportedLanguages();
    if (!languages?.length) return true;        // Android 13+ returns nothing
    const want = locale.toLowerCase();
    const base = want.split("-")[0];
    return languages.some((l: string) => {
      const have = String(l).toLowerCase().replace("_", "-");
      return have === want || have.split("-")[0] === base;
    });
  } catch {
    return true;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Starting a session
   ───────────────────────────────────────────────────────────────────────── */

async function startNative(
  locale: string,
  h: VoiceSessionHandlers,
): Promise<VoiceSession> {
  const plugin = await nativePlugin();
  if (!plugin) {
    h.onError?.("not-supported");
    h.onEnd?.();
    return { stop: () => {} };
  }

  let perm = await plugin.checkPermissions();
  if (perm.speechRecognition !== "granted") {
    perm = await plugin.requestPermissions();
  }
  if (perm.speechRecognition !== "granted") {
    h.onError?.("permission-denied");
    h.onEnd?.();
    return { stop: () => {} };
  }

  const handles: any[] = [];
  let finished = false;
  let latest = "";

  const finish = (text: string) => {
    if (finished) return;
    finished = true;
    for (const x of handles) x?.remove?.();
    const t = text.trim();
    if (t) h.onFinal(t);
    else h.onError?.("no-speech");
    h.onEnd?.();
  };

  handles.push(
    await plugin.addListener("partialResults", (e: any) => {
      const text = e?.matches?.[0] ?? e?.accumulatedText ?? "";
      if (!text) return;
      latest = text;
      h.onPartial?.(text);
      // forceStop() flushes the cached transcript with forced: true — that is
      // the final result for a session the user ended.
      if (e?.forced) finish(text);
    }),
  );

  handles.push(
    await plugin.addListener("error", (e: any) => {
      if (finished) return;
      finished = true;
      for (const x of handles) x?.remove?.();
      const code = String(e?.code ?? "").toLowerCase();
      h.onError?.(
        code.includes("permission") ? "permission-denied"
        : code.includes("no_match") || code.includes("speech-timeout") ? "no-speech"
        : code.includes("language") ? "language-unsupported"
        : "failed",
      );
      h.onEnd?.();
    }),
  );

  try {
    // popup:false keeps recognition inline — the Android system dialog would
    // cover the brief the doctor is filling in.
    const res = await plugin.start({
      language: locale,
      partialResults: true,
      popup: false,
      maxResults: 1,
    });
    finish(res?.matches?.[0] ?? latest);
  } catch (e: any) {
    if (!finished) {
      console.error("[voice] native start failed:", e);
      const msg = String(e?.message ?? e).toLowerCase();
      h.onError?.(msg.includes("locale") || msg.includes("language")
        ? "language-unsupported" : "failed");
      finished = true;
      for (const x of handles) x?.remove?.();
      h.onEnd?.();
    }
  }

  return {
    stop: () => {
      // forceStop emits whatever was heard so far; a plain stop can discard it.
      plugin.forceStop?.().catch(() => plugin.stop?.().catch(() => {}));
    },
  };
}

function startWeb(locale: string, h: VoiceSessionHandlers): VoiceSession {
  const Ctor = webSpeechCtor();
  if (!Ctor) {
    h.onError?.("not-supported");
    h.onEnd?.();
    return { stop: () => {} };
  }

  const rec = new Ctor();
  rec.lang = locale;
  rec.interimResults = true;
  // A brief is one utterance. continuous:true leaves the mic open and, on
  // Android Chrome, keeps restarting until it is stopped manually.
  rec.continuous = false;
  rec.maxAlternatives = 1;

  let finalText = "";
  let ended = false;

  rec.onresult = (ev: any) => {
    let interim = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    const shown = (finalText + interim).trim();
    if (shown) h.onPartial?.(shown);
  };

  rec.onerror = (ev: any) => {
    if (ended) return;
    ended = true;
    const err = String(ev?.error ?? "");
    h.onError?.(
      err === "not-allowed" || err === "service-not-allowed" ? "permission-denied"
      : err === "no-speech" ? "no-speech"
      : err === "language-not-supported" ? "language-unsupported"
      : "failed",
    );
    h.onEnd?.();
  };

  rec.onend = () => {
    if (ended) return;
    ended = true;
    const t = finalText.trim();
    if (t) h.onFinal(t);
    else h.onError?.("no-speech");
    h.onEnd?.();
  };

  try {
    rec.start();
  } catch (e) {
    console.error("[voice] web start failed:", e);
    if (!ended) {
      ended = true;
      h.onError?.("failed");
      h.onEnd?.();
    }
  }

  return { stop: () => { try { rec.stop(); } catch { /* already stopped */ } } };
}

/**
 * Starts listening. Resolves once the session is running; results arrive
 * through the handlers. Call `stop()` on the returned session to finish early.
 */
export async function startVoiceSession(
  contentLanguage: string | undefined,
  h: VoiceSessionHandlers,
): Promise<VoiceSession> {
  const locale = localeFor(contentLanguage);
  const engine = detectEngine();

  if (engine === "native") return startNative(locale, h);
  if (engine === "web")    return startWeb(locale, h);

  h.onError?.("not-supported");
  h.onEnd?.();
  return { stop: () => {} };
}

/** Customer-facing wording for each failure. Never shows a raw engine error. */
export function voiceErrorMessage(e: VoiceError, language = "English"): string {
  switch (e) {
    case "permission-denied":
      return "Microphone access is blocked. Allow it in your browser or phone settings, then try again.";
    case "no-speech":
      return "I didn't catch anything — try again and speak right after tapping the mic.";
    case "language-unsupported":
      return `Your device can't transcribe ${language} yet. Switch Content Language to English, or type the topic instead.`;
    case "not-supported":
      return "Voice input isn't available on this device. Please type the topic instead.";
    default:
      return "Voice input didn't work just then. Please try again, or type the topic.";
  }
}
