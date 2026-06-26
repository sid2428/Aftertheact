"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// A pinned, scroll-driven numbered explainer. As you scroll through the
// section it stays fixed while a large outlined numeral (01 / 02 / 03) advances,
// a dashed gold line tracks progress, and the heading + copy cross-fade between
// steps. The scroll mechanic is owned by GSAP ScrollTrigger (pin + scrub) per
// the toolset split; the visual cross-fade is plain CSS transitions driven off
// the active index. Re-skinned entirely in the site's dark/gold/crimson voice.
//
// Reduced-motion users get a plain stacked layout with no pinning or scrubbing.
export default function ScrollStepper({ eyebrow, heading, steps = [] }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced || steps.length === 0) return;
    let cancelled = false;
    let ctx;

    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !sectionRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          pin: pinRef.current,
          pinSpacing: false,
          scrub: true,
          onUpdate: (self) => {
            setProgress(self.progress);
            setActive(
              Math.min(steps.length - 1, Math.floor(self.progress * steps.length))
            );
          },
        });
      }, sectionRef);

      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      if (ctx) ctx.revert();
    };
  }, [reduced, steps.length]);

  if (steps.length === 0) return null;

  // ── Reduced-motion / no-JS-friendly fallback: plain stacked sections ──────
  if (reduced) {
    return (
      <section className="relative">
        <StepperHeader eyebrow={eyebrow} heading={heading} />
        <div className="mt-12 space-y-16">
          {steps.map((s, i) => (
            <div key={i} className="grid items-center gap-8 lg:grid-cols-2">
              <div className="relative h-[34vh] min-h-[200px]">
                <Numeral n={i + 1} active />
              </div>
              <div className="flex flex-col">
                <StepCopy step={s} active />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} style={{ height: `${steps.length * 90}vh` }} className="relative">
      <div ref={pinRef} className="relative flex h-screen flex-col justify-center overflow-hidden">
        {/* Soft directional glow that shifts as steps advance. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-700"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 35%, rgba(212,175,55,0.10), transparent 70%), radial-gradient(55% 45% at 85% 75%, rgba(139,30,45,0.12), transparent 70%)",
          }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-6 sm:px-12">
          <StepperHeader eyebrow={eyebrow} heading={heading} />

          <div className="mt-10 grid items-center gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-16">
            {/* Left — outlined numeral over a dashed progress line. */}
            <div className="relative">
              {/* Dashed track + gold progress fill. */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                <div className="h-px w-full border-t border-dashed border-latent-gold/30" />
                <div
                  className="absolute top-0 h-px bg-gradient-to-r from-latent-gold/0 via-latent-gold to-latent-gold-light shadow-[0_0_8px_rgba(212,175,55,0.7)]"
                  style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
                />
              </div>

              {/* Stacked numerals, cross-fading. */}
              <div className="relative h-[38vh] min-h-[220px]">
                {steps.map((_, i) => (
                  <Numeral key={i} n={i + 1} active={i === active} />
                ))}
              </div>
            </div>

            {/* Right — label pill, heading, paragraph, cross-fading. */}
            <div className="relative min-h-[220px]">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className="absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-out"
                  style={{
                    opacity: i === active ? 1 : 0,
                    transform: i === active ? "translateY(0)" : "translateY(28px)",
                    pointerEvents: i === active ? "auto" : "none",
                  }}
                  aria-hidden={i !== active}
                >
                  <StepCopy step={s} active={i === active} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepperHeader({ eyebrow, heading }) {
  if (!eyebrow && !heading) return null;
  return (
    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
      {eyebrow && (
        <span className="rounded-full border border-latent-gold/30 bg-latent-gold/10 px-3 py-1 font-display text-[11px] uppercase tracking-widest text-latent-gold">
          {eyebrow}
        </span>
      )}
      {heading && (
        <h2 className="font-display text-2xl uppercase tracking-widest text-white sm:text-3xl">
          {heading}
        </h2>
      )}
    </div>
  );
}

function Numeral({ n, active }) {
  return (
    <span
      className="absolute inset-0 flex items-center font-display leading-none text-transparent transition-all duration-700 ease-out"
      style={{
        WebkitTextStroke: "2px rgba(212,175,55,0.85)",
        fontSize: "min(34vw, 22rem)",
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0) scale(1)" : "translateY(18px) scale(0.96)",
        filter: active ? "drop-shadow(0 0 30px rgba(212,175,55,0.25))" : "none",
      }}
      aria-hidden="true"
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

function StepCopy({ step }) {
  return (
    <>
      {step.label && (
        <span className="mb-5 inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-display text-xs uppercase tracking-widest text-white/70">
          {step.label}
        </span>
      )}
      <h3 className="font-display text-3xl uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
        {step.title}
      </h3>
      <p className="mt-5 max-w-md font-sans text-base leading-relaxed text-white/60 sm:text-lg">
        {step.body}
      </p>
    </>
  );
}
