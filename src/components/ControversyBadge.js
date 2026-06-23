"use client";

import { useEffect, useRef } from "react";
import anime from "animejs/lib/anime.es.js";

export default function ControversyBadge() {
  const textRef = useRef(null);

  useEffect(() => {
    if (!textRef.current) return;

    // Split text into individual spans for character-level animation
    const text = textRef.current.innerText;
    textRef.current.innerHTML = text.split("").map(char => `<span class="inline-block">${char === ' ' ? '&nbsp;' : char}</span>`).join("");

    // Create the glitch effect
    const animation = anime.timeline({
      loop: false
    });

    animation.add({
      targets: textRef.current.querySelectorAll("span"),
      translateY: () => anime.random(-5, 5),
      translateX: () => anime.random(-5, 5),
      opacity: () => anime.random(0.2, 1),
      color: () => {
        const colors = ['#fff', '#000', '#8B1E2D'];
        return colors[Math.floor(Math.random() * colors.length)];
      },
      duration: 50,
      delay: anime.stagger(20, { from: 'center' })
    })
    .add({
      targets: textRef.current.querySelectorAll("span"),
      translateY: 0,
      translateX: 0,
      opacity: 1,
      color: '#fff',
      duration: 100,
      easing: 'easeOutExpo'
    });

    return () => {
      // Cleanup Anime.js timeline
      animation.pause();
      // Reset DOM to prevent memory leaks if remounted
      if (textRef.current) textRef.current.innerHTML = text;
    };
  }, []);

  return (
    <div className="bg-latent-crimson text-white font-display font-black uppercase tracking-widest p-2 text-center text-sm border border-latent-crimson/50 overflow-hidden relative rounded-sm shadow-[0_0_15px_rgba(139,30,45,0.6)]">
      <div className="absolute inset-0 bg-white/10 mix-blend-overlay opacity-0 glitch-flash pointer-events-none"></div>
      <span ref={textRef} className="relative z-10 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Controversy Detected (Delta &gt; 3.0)</span>
    </div>
  );
}
