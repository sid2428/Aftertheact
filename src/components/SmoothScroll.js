"use client";

import { useEffect } from "react";

// Global smooth/inertia scroll via Lenis, driven by GSAP's ticker and wired to
// ScrollTrigger so pinned/scrubbed sections (see ScrollStepper) stay in sync
// with the smoothed scroll position. Owns nothing visual — it only changes how
// scrolling *feels*. Disabled entirely for reduced-motion users, who get the
// browser's native scroll.
export default function SmoothScroll({ children }) {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let cancelled = false;
    let destroy = () => {};

    (async () => {
      const Lenis = (await import("lenis")).default;
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      const raf = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      destroy = () => {
        gsap.ticker.remove(raf);
        lenis.off("scroll", onScroll);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      destroy();
    };
  }, []);

  return children;
}
