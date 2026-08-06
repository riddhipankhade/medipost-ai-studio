import { useEffect, useState } from "react";

/**
 * Cycles through `words`, typing and deleting one character at a time —
 * drives an animated placeholder for text inputs. Pauses (keeps whatever
 * was last rendered) while `active` is false, so callers can freeze the
 * animation once the user starts typing their own value.
 */
export function useTypewriter(
  words: string[],
  active: boolean,
  opts?: { typingSpeed?: number; deletingSpeed?: number; pauseMs?: number },
): string {
  const { typingSpeed = 45, deletingSpeed = 25, pauseMs = 1500 } = opts ?? {};
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  // Restart cleanly whenever the example set itself changes (specialty/workflow switch).
  useEffect(() => {
    setText("");
    setDeleting(false);
    setWordIndex(0);
  }, [words]);

  useEffect(() => {
    if (!active || words.length === 0) return;
    const current = words[wordIndex % words.length];
    let timer: ReturnType<typeof setTimeout>;

    if (!deleting && text === current) {
      timer = setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && text === "") {
      setDeleting(false);
      setWordIndex((i) => (i + 1) % words.length);
    } else {
      const next = deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1);
      timer = setTimeout(() => setText(next), deleting ? deletingSpeed : typingSpeed);
    }
    return () => clearTimeout(timer);
  }, [text, deleting, wordIndex, active, words, typingSpeed, deletingSpeed, pauseMs]);

  return text;
}
