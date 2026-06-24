import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Single source of truth for contestant vote score limits: 1–10, 0.1 precision.
export const SCORE_MIN = 1;
export const SCORE_MAX = 10;
export const SCORE_STEP = 0.1;

// Quantize to 0.1; returns null if not a finite number in range.
export function normalizeScore(value) {
  const n = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(n) || n < SCORE_MIN || n > SCORE_MAX) return null;
  return n;
}
