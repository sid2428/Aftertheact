"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Types `text` character-by-character once, with a blinking gold cursor that
// fades 2s after completion. `sessionKey` skips the effect (renders instantly)
// if it already ran this session. Reduced-motion users get the text instantly.
// Implemented with setInterval per the spec — no animation library needed.
export default function TypeOnce({ text = "", sessionKey, className = "", speed = 45, delay = 0 }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const seen = sessionKey && typeof window !== "undefined" && sessionStorage.getItem(sessionKey);
    if (reduced || seen) {
      // Defer to a callback so it isn't a synchronous setState in the effect
      // body, and so SSR/hydration both start from the same empty string.
      const t = setTimeout(() => {
        setShown(text);
        setDone(true);
        setShowCursor(false);
      }, 0);
      return () => clearTimeout(t);
    }

    let i = 0;
    let interval;
    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
          if (sessionKey) sessionStorage.setItem(sessionKey, "1");
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, [text, sessionKey, reduced, speed, delay]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setShowCursor(false), 2000);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{shown}</span>
      {showCursor && (
        <span
          aria-hidden="true"
          className="ml-1 inline-block w-[0.06em] animate-pulse-fast bg-latent-gold align-[-0.08em]"
          style={{ height: "1em" }}
        >
          &nbsp;
        </span>
      )}
    </span>
  );
}
