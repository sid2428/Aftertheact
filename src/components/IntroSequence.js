"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";

const MAX_VIDEO_RETRIES = 2;
const VIDEO_RETRY_DELAY_MS = 1500;

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

// Deploy-time cache-buster for intro videos. On Vercel, NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
// is set automatically on every deploy. When you push new video files, the next
// deploy produces a new SHA → new video URL → users download the fresh cut
// instead of serving a stale cached version. Falls back to empty string (no
// query param) in local dev.
const DEPLOY_ID = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || "";

// A portrait viewport (taller than it is wide) gets the vertical cut, landscape
// gets the horizontal one. Direct dimension comparison is more reliable on
// mobile than the "(orientation: portrait)" media query, which some browsers
// report inconsistently during load.
function pickVideoSrc() {
  if (typeof window === "undefined") return null;
  const portrait = window.innerHeight >= window.innerWidth;
  const base = portrait ? "/vertical-v2.mp4" : "/horizontal-v2.mp4";
  return DEPLOY_ID ? `${base}?v=${DEPLOY_ID}` : base;
}



export default function IntroSequence({ children }) {
  const [complete, setComplete] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [videoGone, setVideoGone] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);

  useEffect(() => {
    // Pick the cut by the actual shape of the viewport, since the videos are
    // orientation-specific: a portrait viewport (taller than wide) gets the
    // vertical cut, landscape gets the horizontal one. We compare the real
    // viewport dimensions (more reliable across mobile browsers than the
    // orientation media query) and re-evaluate on resize/rotate so the right
    // cut is queued before the intro starts playing.
    const apply = () =>
      setVideoSrc(pickVideoSrc());

    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  const videoRef = useRef(null);
  const doneRef = useRef(false);
  const videoRetriesRef = useRef(0);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
    setComplete(true);
    setVideoGone(true);
    // Drop the overlay from the DOM after the fade completes.
    setTimeout(() => setShowOverlay(false), 600);
  }, []);

  // On video error, retry once with a cache-busting param (bypasses any
  // edge-cached error response), then give up and skip gracefully.
  const handleVideoError = useCallback(() => {
    if (videoRetriesRef.current < MAX_VIDEO_RETRIES && videoSrc) {
      videoRetriesRef.current += 1;
      setTimeout(() => {
        const sep = videoSrc.includes("?") ? "&" : "?";
        const retryUrl = `${videoSrc.split("?")[0]}${sep}_retry=${videoRetriesRef.current}&_t=${Date.now()}`;
        setVideoSrc(retryUrl);
      }, VIDEO_RETRY_DELAY_MS);
    } else {
      finish();
    }
  }, [videoSrc, finish]);

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

    const video = videoRef.current;
    if (!video) return;

    // Re-pick the cut now, in case the device rotated between mount and the tap,
    // and make sure the element actually has that source loaded.
    const src = pickVideoSrc();
    if (src) {
      setVideoSrc(src);
      const current = video.currentSrc || video.src;
      if (!current.endsWith(src)) {
        video.src = src;
        video.load();
      }
    }

    // This play() is driven by a real user gesture (the Enter tap), so browsers
    // allow it to start WITH sound — that's how the music plays. If the browser
    // still refuses the unmuted play (some power-saving modes do), retry muted so
    // the video is at least visible rather than skipping the intro entirely.
    video.muted = false;
    video.volume = 1;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        video.muted = true;
        video.play().catch((err) => {
          console.warn("Video failed to play, skipping intro:", err);
          finish();
        });
      });
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
              onError={handleVideoError}
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
