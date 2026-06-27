"use client";

import Image from "next/image";

// A lightweight poster image for episode cards.
//
// This used to be a full WebGL scene (three.js + react-three-fiber) running a
// per-frame render loop on every card just to tilt a poster — duplicated, since
// the EpisodeCard wrapping it already does a CSS/Framer-Motion pointer-tilt on
// the whole card. We now lean into that card tilt and add a gentle hover push
// here with a plain transform, the same pattern ScoreboardRow.js uses, so the
// grid stays cheap no matter how many cards render.
export default function EpisodePoster({ imageUrl, label, className = "" }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#111] ${className}`}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover/card:scale-[1.06]"
        />
      ) : (
        <PosterFallback label={label} />
      )}
    </div>
  );
}

// A designed stand-in for episodes that don't have art yet — a lit stage with
// drawn curtains in the brand palette, so an imageless card still reads as
// "intentional" rather than "broken". Replaces the old literal "No Poster" text,
// which made the whole product look like a prototype.
function PosterFallback({ label }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,rgba(212,175,55,0.16),transparent_55%),linear-gradient(160deg,#1a0d10_0%,#0c0709_62%,#080808_100%)]">
      {/* Curtain folds */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(139,30,45,0) 0px, rgba(139,30,45,0.32) 14px, rgba(0,0,0,0.45) 28px, rgba(139,30,45,0) 42px)",
        }}
      />
      {/* Spotlight wash from above */}
      <div
        aria-hidden
        className="absolute -top-1/3 left-1/2 h-[140%] w-[60%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.16),transparent_70%)]"
      />
      {/* Center medallion */}
      <div className="relative z-10 flex flex-col items-center gap-2.5 px-4 text-center">
        <svg
          width="38"
          height="38"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-latent-gold/70 drop-shadow-[0_0_12px_rgba(212,175,55,0.35)]"
          aria-hidden
        >
          {/* A simple star spotlight glyph */}
          <path d="M12 2.5l2.4 6.1 6.6.3-5.1 4.2 1.7 6.4L12 16.3 6.5 19.5l1.7-6.4L3.1 8.9l6.6-.3L12 2.5z" />
        </svg>
        {label ? (
          <span className="font-display text-base uppercase tracking-[0.3em] text-latent-gold/80">
            {label}
          </span>
        ) : null}
        <span className="font-display text-[10px] uppercase tracking-[0.25em] text-white/30">
          Poster coming soon
        </span>
      </div>
    </div>
  );
}
