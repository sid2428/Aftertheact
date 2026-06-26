"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// One effect only (spec P1.3): a left-to-right clipPath wipe when the element
// first enters the viewport. On mobile this degrades to a plain opacity fade
// because clipPath can be GPU-expensive on older phones. Fires once.
//
// Reveal is driven by our own IntersectionObserver + a timeout fallback rather
// than framer's `whileInView`: nested inside opacity-animated parents, the
// built-in viewport trigger can miss its initial intersection and leave the
// element permanently hidden. The fallback guarantees content is never stuck
// invisible in production, even if the observer never fires.
export default function RevealOnView({ children, className = "" }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const [mobile, setMobile] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return; // reduced-motion renders plain + visible below
    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setRevealed(true);
    };
    const el = ref.current;
    let io;
    if (el) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            reveal();
            io.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      io.observe(el);
    }
    // Safety net: never leave content hidden if the observer misfires.
    const fallback = setTimeout(reveal, 1500);
    return () => {
      if (io) io.disconnect();
      clearTimeout(fallback);
    };
  }, [reduced]);

  if (reduced) return <div className={className}>{children}</div>;

  const animate = mobile
    ? { opacity: revealed ? 1 : 0, clipPath: "inset(0 0% 0 0)" }
    : { opacity: 1, clipPath: revealed ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={animate}
      transition={{ duration: mobile ? 0.4 : 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
