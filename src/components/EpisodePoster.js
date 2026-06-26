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
export default function EpisodePoster({ imageUrl, className = "" }) {
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
        <div className="flex h-full w-full items-center justify-center font-display uppercase tracking-widest text-white/15">
          No Poster
        </div>
      )}
    </div>
  );
}
