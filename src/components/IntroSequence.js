"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";

// Assets in the order the visitor stumbles on them after pressing Enter:
// intro.mp4 is already buffering via the <video preload="auto"> below, so it's
// omitted here; the curtains fly in mid-intro (~7s) and the homepage reveals its
// backdrop + logo right after. Warming them during playback kills the pop-in.
const PRELOAD_SEQUENCE = [
  "/bluecurtains-bg.png",
  "/logo.png",
];

const SEEN_KEY = "ata_intro_seen";
const SAFETY_MS = 12000; // never strand the user on a black screen



export default function IntroSequence({ children }) {
  const [complete, setComplete] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [videoGone, setVideoGone] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);

  useEffect(() => {
    // Pick the cut by device class, not just current orientation: touch-primary
    // devices (phones, iPads) get the vertical cut even when held in landscape,
    // while laptops/desktops (fine pointer) get the horizontal cut. Fall back to
    // a width check for the rare device that reports neither cleanly.
    const isMobileLike =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches ||
      window.innerWidth < 1024;
    setVideoSrc(isMobileLike ? "/Vertical.mp4" : "/Horizontal.mp4");
  }, []);

  const videoRef = useRef(null);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
    setComplete(true);
    setVideoGone(true);
    // Drop the overlay from the DOM after the fade completes.
    setTimeout(() => setShowOverlay(false), 600);
  }, []);

  // Decide on mount whether to play the intro at all.
  useEffect(() => {
    /* Temporarily disabled for testing:
    let seen = null;
    try { seen = sessionStorage.getItem(SEEN_KEY); } catch {}
    const reduce = typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (seen || reduce) {
      doneRef.current = true;
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
      const id = requestAnimationFrame(() => {
        setComplete(true);
        setShowOverlay(false);
      });
      return () => cancelAnimationFrame(id);
    }
    */
    if (hasInteracted) {
      const safety = setTimeout(finish, SAFETY_MS);
      return () => clearTimeout(safety);
    }
  }, [finish, hasInteracted]);

  const handleEnter = () => {
    setHasInteracted(true);
    // Warm the cache in journey order while the intro plays (React 19 hoists these
    // to <link rel="preload">). The video has the dwell time to itself; these get
    // the ~7s of playback before the curtains and homepage need them.
    PRELOAD_SEQUENCE.forEach((href) => ReactDOM.preload(href, { as: "image" }));
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  // (Curtain polling logic removed to allow smooth video playback)

  return (
    <div className="relative">
      {/* Real homepage content — fades in as the final state. */}
      <motion.div
        initial={false}
        animate={{ opacity: complete ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>

      {/* Fullscreen intro overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-[200] bg-black overflow-hidden">
          {!hasInteracted && (
            <div className="absolute inset-0 z-[220] flex items-center justify-center bg-[#080808]">
              <button
                onClick={handleEnter}
                className="text-latent-gold font-display font-black uppercase tracking-widest text-2xl px-10 py-5 border border-latent-gold/30 hover:border-latent-gold hover:bg-latent-gold/10 transition-all rounded-sm shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:shadow-[0_0_50px_rgba(212,175,55,0.4)]"
              >
                Enter The Act
              </button>
            </div>
          )}

          {videoSrc && (
            <motion.video
              ref={videoRef}
              src={videoSrc}
              playsInline
              preload="auto"
              onEnded={finish}
              onError={finish}
              initial={{ opacity: 1 }}
              animate={{ opacity: videoGone ? 0 : 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Curtains removed */}

          {/* Skip Intro */}
          <button
            onClick={finish}
            className="absolute top-5 right-5 z-[210] border border-white/50 text-white/80 hover:text-white hover:border-white font-display font-bold uppercase tracking-widest text-xs px-4 py-2 rounded-sm bg-transparent transition-colors"
          >
            Skip Intro
          </button>
        </div>
      )}
    </div>
  );
}
