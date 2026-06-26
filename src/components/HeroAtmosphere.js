"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// The single, deliberate R3F atmosphere layer for the site (see brief §2/§5):
// soft golden motes drifting through real depth, with gentle pointer parallax
// and a slow light "breathe". It's meant to be felt, not noticed — one shared
// canvas behind the hero, not a WebGL showcase. Capped particle count + clamped
// DPR keep it cheap; it pauses entirely when the hero scrolls off-screen.

const COUNT = 110;
const SPREAD = { x: 16, y: 10, z: 6 };

// Built once at module load (client-only — this file is dynamically imported
// with ssr:false), so the random layout never runs during React render.
const FIELD = (() => {
  const positions = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * SPREAD.x;
    positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD.y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD.z;
    speeds[i] = 0.15 + Math.random() * 0.45;
  }
  return { positions, speeds };
})();

// A soft round glow sprite so motes read as light, not square dots.
function useMoteTexture() {
  return useMemo(() => {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    // Keep the core a saturated gold (not near-white) so additive stacking reads
    // as warm light, never a white bloom.
    g.addColorStop(0, "rgba(212,175,55,0.9)");
    g.addColorStop(0.3, "rgba(184,134,11,0.45)");
    g.addColorStop(1, "rgba(184,134,11,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function Motes({ reduced }) {
  const pointsRef = useRef(null);
  const groupRef = useRef(null);
  const texture = useMoteTexture();
  const { viewport } = useThree();

  useFrame((state, delta) => {
    if (reduced) return;
    const pts = pointsRef.current;
    if (pts) {
      const arr = pts.geometry.attributes.position.array;
      const dt = Math.min(delta, 0.05);
      for (let i = 0; i < COUNT; i++) {
        let y = arr[i * 3 + 1] + FIELD.speeds[i] * dt;
        if (y > SPREAD.y / 2) y = -SPREAD.y / 2; // wrap to the bottom
        arr[i * 3 + 1] = y;
      }
      pts.geometry.attributes.position.needsUpdate = true;
    }
    if (groupRef.current) {
      // Slow ambient drift, plus a touch of pointer parallax when the canvas
      // receives pointer events (it's pointer-events-none over the hero, so this
      // mostly reduces to the ambient drift — alive, never distracting).
      const t = state.clock.elapsedTime;
      const tx = state.pointer.x * 0.2 + Math.sin(t * 0.1) * 0.16;
      const ty = state.pointer.y * 0.12 + Math.cos(t * 0.08) * 0.09;
      groupRef.current.rotation.y += (tx - groupRef.current.rotation.y) * 0.03;
      groupRef.current.rotation.x += (-ty - groupRef.current.rotation.x) * 0.03;
      // Light "breathe": opacity eases up and down very slowly. Kept low so the
      // additively-blended motes stay a faint gold dust and never stack toward
      // white — the hero must read dark + gold, not washed out.
      if (pts) pts.material.opacity = 0.16 + Math.sin(t * 0.4) * 0.06;
    }
  });

  // Scale the field to roughly fill the viewport so it reads at any size.
  const scale = Math.max(1, viewport.width / 12);

  return (
    <group ref={groupRef} scale={scale}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={COUNT} array={FIELD.positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          size={0.18}
          sizeAttenuation
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#D4AF37"
        />
      </points>
    </group>
  );
}

export default function HeroAtmosphere({ className = "" }) {
  const wrapRef = useRef(null);
  // Client-only component (ssr:false), so reading matchMedia in the lazy
  // initializer is safe and avoids a setState-in-effect.
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [visible, setVisible] = useState(true);

  // Pause the render loop entirely while the hero is off-screen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        frameloop={reduced || !visible ? "never" : "always"}
        style={{ width: "100%", height: "100%" }}
      >
        <fog attach="fog" args={["#0A0A0A", 6, 16]} />
        <Motes reduced={reduced} />
      </Canvas>
    </div>
  );
}
