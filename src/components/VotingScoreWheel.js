"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

/* ─────────────────────────────────────────────
   Audio — tick on scroll, thud on lock
───────────────────────────────────────────── */
function playTone({ freq = 440, type = "sine", duration = 0.06, volume = 0.12, sweepTo = null }) {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(freq, t);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
    osc.onended = () => { try { ctx.close(); } catch (_) {} };
  } catch (_) {}
}

function playTick() {
  playTone({ freq: 800, type: "square", duration: 0.02, volume: 0.25, sweepTo: 200 });
  playTone({ freq: 1400, type: "triangle", duration: 0.03, volume: 0.15, sweepTo: 400 });
}

function playStamp() {
  playTone({ freq: 120, type: "sine", duration: 0.6, volume: 0.8, sweepTo: 20 });
  playTone({ freq: 60, type: "square", duration: 0.4, volume: 0.6, sweepTo: 10 });
  playTone({ freq: 300, type: "triangle", duration: 0.2, volume: 0.4, sweepTo: 40 });
}

function playLock() {
  playTone({ freq: 400, type: "sine", duration: 0.1, volume: 0.5, sweepTo: 800 });
  setTimeout(() => {
    playTone({ freq: 800, type: "sine", duration: 0.2, volume: 0.5, sweepTo: 1600 });
  }, 100);
}

/* ─────────────────────────────────────────────
   Constants & helpers
───────────────────────────────────────────── */

export const SLOT_H = 88;
const VISIBLE_SLOTS = 5;
export const DRUM_H = SLOT_H * VISIBLE_SLOTS;

const INT_OPTS = Array.from({ length: 10 }, (_, i) => i + 1);
const DEC_OPTS = Array.from({ length: 10 }, (_, i) => i);

export function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatCountdown(ms) {
  if (ms == null || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)} · ${pad(m % 60)} · ${pad(s % 60)}`;
  return `${pad(m)} · ${pad(s % 60)}`;
}

function useCountdown(revealAt) {
  const [remaining, setRemaining] = useState(() => {
    if (!revealAt) return null;
    const diff = new Date(revealAt).getTime() - Date.now();
    return diff > 0 ? diff : 0;
  });
  useEffect(() => {
    if (!revealAt) return;
    const tick = () => {
      const diff = new Date(revealAt).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [revealAt]);
  return remaining;
}

// Tracks whether the viewport is narrow (phones / small tablets) so the wheel
// can switch from its side-by-side desktop layout to a stacked one.
function useIsNarrow(maxWidth = 760) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [maxWidth]);
  return narrow;
}

/* ─────────────────────────────────────────────
   Component 2 — HeaderBar
───────────────────────────────────────────── */
function HeaderBar({ showTitle, seasonLabel, revealAt, narrow = false }) {
  const remaining = useCountdown(revealAt);
  const countdown = formatCountdown(remaining);

  return (
    <div
      style={{
        position: "relative",
        height: 52,
        zIndex: 10,
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: narrow ? "0 14px" : "0 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#E53935",
            boxShadow: "0 0 8px rgba(229,57,53,0.8)",
            animation: "livePulse 1.2s ease-in-out infinite",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-anton)",
            fontSize: 13,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.75)",
          }}
        >
          {showTitle || "After The Act"}
        </span>
      </div>

      {!narrow && (
        <span
          style={{
            fontFamily: "var(--font-rajdhani)",
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
          }}
        >
          {seasonLabel || "Live Verdict"}
        </span>
      )}

      {countdown && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-rajdhani)",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#D4AF37",
            }}
          >
            {countdown}
          </span>
          <span
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: 11,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            LEFT
          </span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Component 3 — ActCard
───────────────────────────────────────────── */
function ActCard({ initial, name, tagline, compact = false }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: compact ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: compact ? 16 : 20,
        padding: compact ? "0 8px" : "0 32px",
      }}
    >
      <div
        className="glass-surface"
        style={{
          width: compact ? "84px" : "min(240px, 80%)",
          flexShrink: 0,
          aspectRatio: "1 / 1",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-anton)",
            fontSize: compact ? "2.6rem" : "clamp(5rem, 14vw, 9rem)",
            color: "rgba(255,255,255,0.18)",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {initial || "?"}
        </span>
      </div>

      <div style={{ textAlign: compact ? "left" : "center" }}>
        <h2
          style={{
            fontFamily: "var(--font-anton)",
            fontSize: compact ? "1.5rem" : "clamp(1.6rem, 3.5vw, 2.6rem)",
            color: "#ffffff",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            lineHeight: 1.05,
            marginBottom: compact ? 4 : 8,
          }}
        >
          {name || "Act Name"}
        </h2>
        {tagline && (
          <p
            style={{
              fontFamily: "var(--font-rajdhani)",
              fontSize: 12,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#D4AF37",
              fontWeight: 600,
            }}
          >
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Component 4 — DrumColumn
───────────────────────────────────────────── */
export function DrumColumn({ options, onLocked, isLocked, lockedValue, autoSpin, id, ariaLabel }) {
  const ATTRACT_NUMS = [...shuffled(options), ...shuffled(options), ...shuffled(options)];

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const attractRafRef = useRef(null);
  const velRef = useRef(0);
  const posRef = useRef(0);
  const isDragging = useRef(false);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const lastWheelTime = useRef(0);
  const phaseRef = useRef(autoSpin ? "attract" : "interactive");

  const [phase, setPhase] = useState(autoSpin ? "attract" : "interactive");
  const [selectedIndex, setSelectedIndex] = useState(() =>
    lockedValue != null ? options.indexOf(lockedValue) : Math.floor(options.length / 2)
  );
  const selectedIndexRef = useRef(selectedIndex);
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);
  const [attractOffset, setAttractOffset] = useState(0);

  const reducedMotion = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  // Same value as the ref above, but usable during render. Reading a ref's
  // `.current` while rendering is unsupported in React 19 (it can render stale);
  // the ref stays for the imperative animation code (effects/callbacks), where
  // ref reads are the correct pattern. Lazy init so it's computed once.
  const [prefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    if (!autoSpin || phase !== "attract" || reducedMotion.current) return;
    let startTime = null;
    const SPEED = 0.055;
    const loopLen = options.length * SLOT_H;
    function anim(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const offset = -((elapsed * SPEED) % loopLen);
      setAttractOffset(offset);
      attractRafRef.current = requestAnimationFrame(anim);
    }
    attractRafRef.current = requestAnimationFrame(anim);
    return () => { if (attractRafRef.current) cancelAnimationFrame(attractRafRef.current); };
  }, [autoSpin, phase, options.length]);

  const applyTranslate = useCallback((y) => {
    if (trackRef.current) trackRef.current.style.transform = `translateY(${y}px)`;
  }, []);

  const getSnapPos = useCallback((rawPos) => {
    const centre = DRUM_H / 2;
    const raw = -rawPos + centre - SLOT_H / 2;
    const idx = Math.round(raw / SLOT_H);
    const clamped = Math.max(0, Math.min(options.length - 1, idx));
    const snappedPos = -(clamped * SLOT_H - centre + SLOT_H / 2);
    return { idx: clamped, pos: snappedPos };
  }, [options.length]);

  const runSpring = useCallback((from, target, onDone) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (reducedMotion.current) {
      const start = performance.now();
      const dur = 200;
      function step(ts) {
        const t = Math.min(1, (ts - start) / dur);
        const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        applyTranslate(from + (target - from) * e);
        if (t < 1) rafRef.current = requestAnimationFrame(step);
        else { applyTranslate(target); onDone?.(); }
      }
      rafRef.current = requestAnimationFrame(step);
      return;
    }
    let pos = from;
    let vel = velRef.current * 0.5;
    const STIFFNESS = 0.18;
    const DAMPING = 0.65;
    let last = performance.now();
    function step(ts) {
      const dt = Math.min(ts - last, 32);
      last = ts;
      const force = (target - pos) * STIFFNESS;
      vel = vel * DAMPING + force;
      pos += vel * (dt / 16);
      applyTranslate(pos);
      if (Math.abs(vel) < 0.15 && Math.abs(pos - target) < 0.8) {
        applyTranslate(target);
        onDone?.();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
  }, [applyTranslate]);

  const snapAndLock = useCallback((fromPos, velocity) => {
    if (reducedMotion.current) {
      const { idx, pos: snapPos } = getSnapPos(fromPos);
      velRef.current = 0;
      runSpring(fromPos, snapPos, () => {
        posRef.current = snapPos;
        setSelectedIndex(idx);
        setPhase("snapped");
        onLocked(options[idx]);
        playTick();
      });
      return;
    }
    let pos = fromPos;
    let vel = velocity;
    const FRICTION = 0.82;
    let last = performance.now();
    function decel(ts) {
      const dt = Math.min(ts - last, 32);
      last = ts;
      vel *= Math.pow(FRICTION, dt / 16);
      pos += vel * (dt / 16);
      applyTranslate(pos);
      if (Math.abs(vel) < 0.8) {
        const { idx: fi, pos: fPos } = getSnapPos(pos);
        velRef.current = 0;
        runSpring(pos, fPos, () => {
          applyTranslate(fPos);
          posRef.current = fPos;
          setSelectedIndex(fi);
          setPhase("snapped");
          onLocked(options[fi]);
          playTick();
        });
        return;
      }
      rafRef.current = requestAnimationFrame(decel);
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(decel);
  }, [applyTranslate, getSnapPos, onLocked, options, runSpring]);

  const onPointerDown = useCallback((e) => {
    if (isLocked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (phaseRef.current === "attract") {
      if (attractRafRef.current) cancelAnimationFrame(attractRafRef.current);
      const initPos = -(Math.floor(options.length / 2) * SLOT_H - DRUM_H / 2 + SLOT_H / 2);
      posRef.current = initPos;
      applyTranslate(initPos);
      setPhase("interactive");
      phaseRef.current = "interactive";
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    isDragging.current = true;
    lastY.current = e.clientY;
    lastTime.current = performance.now();
    velRef.current = 0;
  }, [applyTranslate, isLocked, options.length]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const now = performance.now();
    const dy = e.clientY - lastY.current;
    const dt = Math.max(now - lastTime.current, 1);
    velRef.current = (dy / dt) * 16;
    posRef.current += dy;
    applyTranslate(posRef.current);
    lastY.current = e.clientY;
    lastTime.current = now;
  }, [applyTranslate]);

  const onPointerUp = useCallback((e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    e.currentTarget?.releasePointerCapture?.(e.pointerId);
    snapAndLock(posRef.current, velRef.current);
  }, [snapAndLock]);

  const moveToIndex = useCallback((rawIdx) => {
    const clamped = Math.max(0, Math.min(options.length - 1, rawIdx));
    if (phaseRef.current === "attract") {
      if (attractRafRef.current) cancelAnimationFrame(attractRafRef.current);
      setPhase("interactive");
      phaseRef.current = "interactive";
    }
    const targetPos = -(clamped * SLOT_H - DRUM_H / 2 + SLOT_H / 2);
    velRef.current = 0;
    runSpring(posRef.current ?? targetPos, targetPos, () => {
      posRef.current = targetPos;
      setSelectedIndex(clamped);
      setPhase("snapped");
      onLocked(options[clamped]);
      playTick();
    });
    setSelectedIndex(clamped);
  }, [onLocked, options, runSpring]);

  const onKeyDown = useCallback((e) => {
    if (isLocked) return;
    let newIdx = selectedIndex;
    if (e.key === "ArrowDown") newIdx = selectedIndex + 1;
    else if (e.key === "ArrowUp") newIdx = selectedIndex - 1;
    else if (e.key === "Home") newIdx = 0;
    else if (e.key === "End") newIdx = options.length - 1;
    else return;
    e.preventDefault();
    moveToIndex(newIdx);
  }, [isLocked, moveToIndex, options.length, selectedIndex]);

  // Mouse-wheel / trackpad scrolling — move one number per notch, and stop the
  // page from scrolling while the pointer is over the drum.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      if (isLocked) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastWheelTime.current < 80) return;
      lastWheelTime.current = now;
      const dir = e.deltaY > 0 ? 1 : -1;
      moveToIndex(selectedIndexRef.current + dir);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [isLocked, moveToIndex]);

  useEffect(() => {
    if (!autoSpin && trackRef.current) {
      const initIdx = lockedValue != null ? options.indexOf(lockedValue) : Math.floor(options.length / 2);
      const initPos = -(initIdx * SLOT_H - DRUM_H / 2 + SLOT_H / 2);
      posRef.current = initPos;
      applyTranslate(initPos);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLocked && lockedValue != null && trackRef.current) {
      const idx = options.indexOf(lockedValue);
      if (idx >= 0) {
        const targetPos = -(idx * SLOT_H - DRUM_H / 2 + SLOT_H / 2);
        applyTranslate(targetPos);
        posRef.current = targetPos;
        setSelectedIndex(idx);
      }
    }
  }, [isLocked, lockedValue, options, applyTranslate]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (attractRafRef.current) cancelAnimationFrame(attractRafRef.current);
    };
  }, []);

  const isSnapped = phase === "snapped";

  return (
    <div
      id={id}
      ref={containerRef}
      role="listbox"
      aria-label={ariaLabel}
      aria-activedescendant={isSnapped ? `${id}-opt-${selectedIndex}` : undefined}
      tabIndex={isLocked ? -1 : 0}
      onKeyDown={onKeyDown}
      // Stops the global Lenis smooth-scroll from also moving the page while the
      // wheel/trackpad is spinning the drum — only the drum should react.
      data-lenis-prevent
      style={{
        position: "relative",
        width: 110,
        height: DRUM_H,
        cursor: isLocked ? "default" : "grab",
        outline: "none",
        flexShrink: 0,
        overflow: "hidden",
        touchAction: "none",
        background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0) 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
      }}
    >

      {/* Selection highlight */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          height: SLOT_H - 10,
          borderRadius: 10,
          border: `1.5px solid ${isSnapped ? "#D4AF37" : "rgba(255,255,255,0.08)"}`,
          background: isSnapped ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
          transition: "border-color 200ms ease-out, background 200ms ease-out",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* Attract spin */}
      {phase === "attract" && !prefersReducedMotion ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${attractOffset}px)`,
            willChange: "transform",
          }}
        >
          {ATTRACT_NUMS.map((num, i) => (
            <div
              key={i}
              style={{
                height: SLOT_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-rajdhani)",
                fontSize: 56,
                fontWeight: 700,
                color: "rgba(255,255,255,0.42)",
                userSelect: "none",
              }}
            >
              {num}
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            touchAction: "none",
            userSelect: "none",
            cursor: isLocked ? "default" : "grab",
          }}
        >
          {options.map((num, idx) => {
            const isSel = isSnapped && idx === selectedIndex;
            const isAdj = isSnapped && Math.abs(idx - selectedIndex) === 1;
            const isFar = isSnapped && Math.abs(idx - selectedIndex) >= 2;
            return (
              <div
                key={num}
                id={`${id}-opt-${idx}`}
                role="option"
                aria-selected={isSel}
                style={{
                  height: SLOT_H,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-rajdhani)",
                  fontSize: isSel ? 66 : 56,
                  fontWeight: 700,
                  color: isSel ? "#F5D97B" : "rgba(255,255,255,0.55)",
                  opacity: isSel ? 1 : isAdj ? 0.5 : isFar ? 0.3 : 0.55,
                  transform: `scale(${isSel ? 1.12 : 1})`,
                  transition:
                    "font-size 200ms ease-out, color 200ms ease-out, opacity 200ms ease-out, transform 200ms ease-out",
                  userSelect: "none",
                  position: "relative",
                  zIndex: isSel ? 4 : 1,
                }}
              >
                {num}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Component 5 — DecimalDot
───────────────────────────────────────────── */
function DecimalDot() {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.4)",
        flexShrink: 0,
        alignSelf: "center",
        marginTop: 8,
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Component 6 — HintText
───────────────────────────────────────────── */
function HintText({ visible, sealed, text }) {
  return (
    <div
      style={{
        marginTop: 40,
        textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 300ms ease, transform 300ms ease",
        fontFamily: "var(--font-rajdhani)",
        fontSize: 12,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
      }}
    >
      {sealed ? (
        "Verdict Locked"
      ) : text ? (
        text
      ) : (
        "Scroll or drag to select"
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Component 7 — ScoreDisplay
───────────────────────────────────────────── */
function ScoreDisplay({ intPart, decPart, visible }) {
  const score = intPart != null && decPart != null ? `${intPart}.${decPart}` : null;
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: visible && score ? 1 : 0,
        transition: "opacity 400ms ease-out",
        pointerEvents: "none",
        zIndex: 0,
        textAlign: "center",
        userSelect: "none",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-rajdhani)",
          fontSize: "clamp(9rem, 22vw, 18rem)",
          fontWeight: 700,
          color: "rgba(212,175,55,0.07)",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          display: "block",
        }}
      >
        {score}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Component 8 — Starburst SVG
───────────────────────────────────────────── */
function Starburst({ visible }) {
  if (!visible) return null;
  const SPIKES = 14;
  const cx = 150, cy = 150;
  const rad = (a) => (a * Math.PI) / 180;
  const paths = Array.from({ length: SPIKES }, (_, i) => {
    const angle = (i * 360) / SPIKES;
    const inner = 28 + Math.sin(i * 2.3) * 9;
    const outer = 88 + Math.sin(i * 1.7 + 1) * 24;
    const tipW = 3.5 + Math.sin(i * 3.1) * 1.5;
    const lx = cx + inner * Math.cos(rad(angle - tipW));
    const ly = cy + inner * Math.sin(rad(angle - tipW));
    const rx = cx + inner * Math.cos(rad(angle + tipW));
    const ry = cy + inner * Math.sin(rad(angle + tipW));
    const tx = cx + outer * Math.cos(rad(angle));
    const ty = cy + outer * Math.sin(rad(angle));
    return `M ${lx} ${ly} L ${tx} ${ty} L ${rx} ${ry} Z`;
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: 300,
        height: 300,
        zIndex: 19,
        pointerEvents: "none",
        animation: "starburstFlash 450ms cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <svg width="300" height="300" viewBox="0 0 300 300">
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={
              i % 3 === 0
                ? "rgba(255,245,200,0.88)"
                : "rgba(255,230,140,0.65)"
            }
          />
        ))}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Component 9 — LockedStamp
───────────────────────────────────────────── */
function LockedStamp({ visible }) {
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (visible) {
      playStamp();
      const t1 = setTimeout(() => setShowBurst(true), 240);
      const t2 = setTimeout(() => setShowBurst(false), 700);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setShowBurst(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <Starburst visible={showBurst} />
      <div
        style={{
          position: "relative",
          zIndex: 21,
          animation: "stampEntry 650ms cubic-bezier(0.55,0,1,0.45) both",
          animationFillMode: "forwards",
        }}
      >
        <div
          style={{
            padding: "4px",
            borderRadius: 12,
            border: "3px solid #E53935",
            boxShadow:
              "0 0 0 1px rgba(229,57,53,0.25), inset 0 0 0 2px rgba(229,57,53,0.12), 0 0 50px rgba(229,57,53,0.45)",
            background: "rgba(8,8,8,0.9)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              padding: "12px 40px 14px",
              borderRadius: 8,
              border: "1.5px solid rgba(229,57,53,0.45)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0,
              minWidth: 240,
            }}
          >
            <div
              style={{
                width: "100%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(229,57,53,0.55), transparent)",
                marginBottom: 8,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(3rem, 8vw, 5.5rem)",
                color: "#E53935",
                letterSpacing: "0.14em",
                lineHeight: 1,
                textShadow:
                  "2px 3px 0px rgba(80,0,0,0.85), 0 0 24px rgba(229,57,53,0.25)",
                userSelect: "none",
              }}
            >
              LOCKED
            </span>
            <div
              style={{
                width: "100%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(229,57,53,0.55), transparent)",
                marginTop: 8,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Component 10 — SealButton
───────────────────────────────────────────── */
function SealButton({ disabled, onClick, sealed, needsAuth }) {
  return (
    <button
      id="seal-verdict-btn"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        width: "min(340px, 80%)",
        marginTop: 28,
        padding: "16px 32px",
        border: "none",
        borderRadius: 10,
        fontFamily: "var(--font-anton)",
        fontSize: "clamp(1.1rem, 2.5vw, 1.45rem)",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        cursor: disabled ? "default" : "pointer",
        background: sealed ? "#2a2a2a" : disabled ? "#3a1416" : "#E53935",
        color: sealed ? "rgba(255,255,255,0.3)" : disabled ? "rgba(255,255,255,0.45)" : "#ffffff",
        boxShadow: sealed || disabled ? "none" : "0 8px 28px rgba(229,57,53,0.35)",
        transition: "background 200ms ease, color 200ms ease, box-shadow 200ms ease, transform 120ms ease",
        outline: "none",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !sealed) {
          e.currentTarget.style.background = "#F44336";
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(229,57,53,0.55)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !sealed) {
          e.currentTarget.style.background = "#E53935";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(229,57,53,0.35)";
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.97)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <span role="img" aria-hidden style={{ fontSize: "1.2em", lineHeight: 1 }}>🔒</span>
      <span style={{ transform: "translateY(1px)", display: "inline-block" }}>
        {sealed
          ? "Verdict Sealed"
          : disabled
            ? "Set Your Score"
            : needsAuth
              ? "Log In to Vote"
              : "Seal the Verdict"}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Root — VotingScoreWheel
───────────────────────────────────────────── */
export default function VotingScoreWheel({
  act = { name: "Act Name", tagline: "The Stage Awaits", initial: "A" },
  episodeId,
  contestantId,
  revealAt,
  userVoteScore = null,
  isEpisodeClosed = false,
  showTitle = "After The Act",
  seasonLabel = "Live Verdict",
  isAuthenticated = false,
  onVoteLocked,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const narrow = useIsNarrow();
  const hasExistingVote = userVoteScore != null;
  const existingInt = hasExistingVote ? Math.floor(userVoteScore) : null;
  const existingDec = hasExistingVote
    ? Math.round((userVoteScore % 1) * 10)
    : null;

  const [intPart, setIntPart] = useState(existingInt);
  const [decPart, setDecPart] = useState(existingDec);
  const [sealed, setSealed] = useState(hasExistingVote);
  const [showStamp, setShowStamp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // The LOCKED stamp is a flash — show it for 3s, then clear it.
  useEffect(() => {
    if (!showStamp) return;
    const t = setTimeout(() => setShowStamp(false), 3000);
    return () => clearTimeout(t);
  }, [showStamp]);

  const leftLocked = intPart !== null;
  const rightLocked = decPart !== null;
  const bothLocked = leftLocked && rightLocked;

  const handleIntLocked = useCallback((val) => {
    setIntPart(val);
    if (val === 10) setDecPart(0);
  }, []);

  const handleDecLocked = useCallback((val) => {
    if (intPart === 10) return;
    setDecPart(val);
  }, [intPart]);

  const handleSeal = useCallback(async () => {
    if (sealed || isSubmitting || !bothLocked) return;

    // Voting is gated behind auth — bounce to login, come back to this episode.
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    playLock();

    setIsSubmitting(true);
    setError(null);

    const score = parseFloat(`${intPart}.${decPart}`);
    setShowStamp(true);
    setSealed(true);

    if (episodeId && contestantId) {
      try {
        const { submitVote } = await import("@/app/actions/vote");
        const result = await submitVote(episodeId, contestantId, score);
        if (
          !result.success &&
          result.error !== "You have already voted for this contestant."
        ) {
          setError(result.error || "Something went wrong.");
        }
      } catch (_) {}
    }

    setIsSubmitting(false);
    onVoteLocked?.(score);
  }, [bothLocked, contestantId, episodeId, intPart, decPart, isAuthenticated, isSubmitting, onVoteLocked, pathname, router, sealed]);

  if (isEpisodeClosed) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "#0A0A0A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <HeaderBar showTitle={showTitle} seasonLabel={seasonLabel} revealAt={revealAt} narrow={narrow} />
        <span
          style={{
            fontFamily: "var(--font-anton)",
            fontSize: 28,
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Voting has closed
        </span>
        {hasExistingVote && (
          <span
            style={{
              fontFamily: "var(--font-rajdhani)",
              fontSize: 18,
              color: "#D4AF37",
              fontWeight: 700,
            }}
          >
            Your verdict: {userVoteScore?.toFixed(1)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <HeaderBar showTitle={showTitle} seasonLabel={seasonLabel} revealAt={revealAt} narrow={narrow} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(212,175,55,0.04) 0%, transparent 60%), " +
            "radial-gradient(ellipse at 70% 50%, rgba(229,57,53,0.03) 0%, transparent 60%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: narrow ? "column" : "row",
          padding: narrow ? "20px 16px 32px" : "32px 0 40px",
          gap: narrow ? 8 : 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            flex: narrow ? "0 0 auto" : "0 0 40%",
            width: narrow ? "100%" : undefined,
            maxWidth: narrow ? "100%" : "40%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRight: narrow ? "none" : "1px solid rgba(255,255,255,0.07)",
            borderBottom: narrow ? "1px solid rgba(255,255,255,0.07)" : "none",
            paddingBottom: narrow ? 16 : 0,
            position: "relative",
          }}
        >
          <ActCard
            initial={act.initial || act.name?.[0] || "?"}
            name={act.name}
            tagline={act.tagline}
            compact={narrow}
          />
        </div>

        <div
          style={{
            flex: narrow ? "0 0 auto" : "0 0 60%",
            width: narrow ? "100%" : undefined,
            maxWidth: narrow ? "100%" : "60%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <ScoreDisplay intPart={intPart} decPart={decPart} visible={bothLocked} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              position: "relative",
              zIndex: 1,
            }}
          >
            <DrumColumn
              id="drum-integer"
              ariaLabel="Whole number digit (1 to 10)"
              options={INT_OPTS}
              onLocked={handleIntLocked}
              isLocked={sealed}
              lockedValue={intPart}
              autoSpin={false}
            />

            <DecimalDot />

            <DrumColumn
              id="drum-decimal"
              ariaLabel="Decimal digit (0 to 9)"
              options={DEC_OPTS}
              onLocked={handleDecLocked}
              isLocked={sealed || intPart === 10}
              lockedValue={decPart}
              autoSpin={false}
            />
          </div>

          <HintText 
            visible={!sealed} 
            sealed={sealed} 
            text={
              !leftLocked 
                ? "Scroll or drag a number to start" 
                : !rightLocked 
                  ? "Now select the decimal" 
                  : ""
            } 
          />


          {error && (
            <p
              style={{
                marginTop: 14,
                fontFamily: "var(--font-rajdhani)",
                fontSize: 11,
                letterSpacing: "0.14em",
                color: "#E53935",
                textTransform: "uppercase",
              }}
            >
              {error}
            </p>
          )}

          <SealButton
            disabled={!bothLocked || isSubmitting}
            onClick={handleSeal}
            sealed={sealed}
            needsAuth={!isAuthenticated}
          />
        </div>
      </div>

      <LockedStamp visible={showStamp} />
    </div>
  );
}
