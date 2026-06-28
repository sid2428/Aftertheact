"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function JudgePanel({ members = [] }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  // Desktop only (≥768px, motion allowed): the judges row scrolls horizontally
  //  • wheel over the row  → manual horizontal scroll, page locked, releases to
  //    the page at either end.
  //  • scrolling the page  → a marquee parallax slides the row as the section
  //    passes through the viewport, WITHOUT locking the page (reads scroll, never
  //    prevents it). Suspended while the pointer is over the row so the manual
  //    wheel owns it. On mobile/reduced-motion neither runs — native swipe only.
  useEffect(() => {
    if (reduced) return;
    const track = trackRef.current;
    const section = sectionRef.current;
    if (!track || !section) return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    const range = () => track.scrollWidth - track.clientWidth;
    const MARQUEE = 0.2; // scroll-linked drift runs at a quarter of full-range speed
    let hovering = false;
    let target = track.scrollLeft;
    let raf = 0;

    // Ease the actual scroll toward `target` so both the wheel and the marquee
    // glide instead of jumping. Stops itself once settled to avoid a forever-rAF.
    const tick = () => {
      const diff = target - track.scrollLeft;
      track.scrollLeft += diff * 0.15;
      if (Math.abs(diff) > 0.5) {
        raf = requestAnimationFrame(tick);
      } else {
        track.scrollLeft = target;
        raf = 0;
      }
    };
    const animate = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const onWheel = (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const max = range();
      if ((target <= 0 && d < 0) || (target >= max && d > 0)) return; // at an end → let the page scroll
      e.preventDefault();
      e.stopPropagation(); // keep Lenis from also scrolling the page
      target = Math.max(0, Math.min(max, target + d));
      animate();
    };

    const onScroll = () => {
      if (hovering) return; // manual wheel owns the row while pointed at
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh - rect.top) / (vh + rect.height); // 0 entering → 1 leaving
      target = (p < 0 ? 0 : p > 1 ? 1 : p) * range() * MARQUEE;
      animate();
    };

    const onEnter = () => { hovering = true; };
    const onLeave = () => { hovering = false; };

    track.addEventListener("wheel", onWheel, { passive: false });
    track.addEventListener("pointerenter", onEnter);
    track.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("pointerenter", onEnter);
      track.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reduced, members.length]);

  if (!members.length) return null;

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-6 sm:px-12 mt-24">
      <div className="flex items-end justify-between border-b border-latent-gold/20 pb-3 mb-10">
        <h2 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tighter text-white">The Panel</h2>
        <Link href="/panel" className="font-display font-black uppercase tracking-widest text-xs text-latent-gold hover:text-latent-gold-light transition-colors">
          Rate the Panel →
        </Link>
      </div>

      <div ref={trackRef} className="flex gap-6 sm:gap-8 overflow-x-auto pb-8 pt-4 px-4 -mx-4 no-scrollbar snap-x snap-mandatory md:snap-none">
        {members.map((m, i) => (
          <motion.div
            key={m.id || i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 200px 0px 200px" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="group shrink-0 w-52 sm:w-64 snap-center perspective-1000"
          >
            <div className="relative transform-gpu transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:-translate-y-3">
              {/* Glow Behind Card */}
              <div className="absolute inset-0 bg-latent-gold/20 blur-xl rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              
              {/* Framed portrait */}
              <div className="relative z-10 aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] shadow-[0_15px_35px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover:border-latent-gold/50 group-hover:shadow-[0_20px_40px_rgba(212,175,55,0.2)]">
                {m.image ? (
                  <img src={m.image} alt={m.name} className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110 group-hover:brightness-110" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display font-black text-6xl text-white/5">{m.name?.[0] || "?"}</div>
                )}
                {/* Vignette bottom gradient */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
                
                {/* Text inside the card instead of below it for a sleeker look */}
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
                  <div className="font-display font-black uppercase tracking-tighter text-2xl text-white truncate drop-shadow-md">{m.name}</div>
                  {m.instagram_handle && (
                    <a
                      href={`https://instagram.com/${m.instagram_handle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block font-mono text-[11px] text-latent-gold/70 hover:text-latent-gold transition-colors mt-1 opacity-0 group-hover:opacity-100 delay-100"
                    >
                      {m.instagram_handle}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
