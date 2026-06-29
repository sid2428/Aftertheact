"use client";

import { useState, useCallback } from "react";

// A drop-in <img> replacement for user-uploaded / dynamic images that:
//  1. Retries once on error (with a cache-busting query param to bypass
//     any edge-cached 404/error response).
//  2. Shows a graceful first-letter fallback if the retry also fails.
//
// Static assets that ship with the deploy (logo.png, curtain PNGs, etc.)
// don't need this — they're always present. Use this for images whose URLs
// come from the DB or Redis (judges, contestants, avatars, thumbnails).
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;

export default function ResilientImg({ src, alt = "", fallbackLetter, className = "", ...rest }) {
  const [retries, setRetries] = useState(0);
  const [failed, setFailed] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = useCallback(() => {
    if (retries < MAX_RETRIES) {
      // Wait, then retry with a cache-busting param to bypass any
      // edge-cached error response.
      setTimeout(() => {
        const sep = src.includes("?") ? "&" : "?";
        setCurrentSrc(`${src}${sep}_retry=${retries + 1}&_t=${Date.now()}`);
        setRetries((r) => r + 1);
      }, RETRY_DELAY_MS);
    } else {
      setFailed(true);
    }
  }, [retries, src]);

  // Derive the fallback letter from alt text or the explicit prop.
  const letter = fallbackLetter || alt?.[0] || "?";

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[#111] ${className}`}
        style={{ aspectRatio: rest.width && rest.height ? `${rest.width}/${rest.height}` : undefined }}
        {...rest}
      >
        <span className="font-display text-4xl font-black text-white/15">{letter}</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...rest}
    />
  );
}
