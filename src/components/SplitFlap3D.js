"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Text, OrthographicCamera } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

// A single digit split-flap
function SplitFlapDigit({ value, targetValue, position, delay = 0 }) {
  const topFlapRef = useRef();
  const bottomFlapRef = useRef();
  const [currentVal, setCurrentVal] = useState("0");
  const [nextVal, setNextVal] = useState("0");
  const [flipping, setFlipping] = useState(false);
  const [flipProgress, setFlipProgress] = useState(0);

  // Trigger flip sequence when targetValue changes
  useEffect(() => {
    if (value === undefined) return;
    const strVal = value.toString();
    if (strVal !== currentVal && !flipping) {
      setTimeout(() => {
        setNextVal(strVal);
        setFlipping(true);
        setFlipProgress(0);
      }, delay);
    }
  }, [value, currentVal, flipping, delay]);

  useFrame((state, delta) => {
    if (flipping) {
      const newProgress = flipProgress + delta * 3; // Flip speed
      if (newProgress >= Math.PI) {
        setFlipping(false);
        setCurrentVal(nextVal);
        setFlipProgress(0);
        if (topFlapRef.current) topFlapRef.current.rotation.x = 0;
      } else {
        setFlipProgress(newProgress);
        if (topFlapRef.current) topFlapRef.current.rotation.x = -newProgress;
      }
    }
  });

  return (
    <group position={position}>
      {/* Background/Base */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[0.8, 1.2]} />
        <meshBasicMaterial color="#0A0A0A" />
      </mesh>

      {/* Top Half (Static Background showing next value during flip) */}
      <mesh position={[0, 0.3, -0.05]}>
        <planeGeometry args={[0.76, 0.56]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <Text position={[0, 0.3, 0]} fontSize={0.8} color="#fff" clipRect={[-0.4, -0.3, 0.4, 0.3]}>
        {flipping && flipProgress > Math.PI / 2 ? nextVal : currentVal}
      </Text>

      {/* Bottom Half (Static) */}
      <mesh position={[0, -0.3, -0.05]}>
        <planeGeometry args={[0.76, 0.56]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <Text position={[0, -0.3, 0]} fontSize={0.8} color="#fff" clipRect={[-0.4, -0.3, 0.4, 0.3]}>
        {flipping && flipProgress > Math.PI / 2 ? nextVal : currentVal}
      </Text>

      {/* Flipping Flap */}
      <group position={[0, 0, 0.05]} ref={topFlapRef}>
        <mesh position={[0, 0.3, 0]}>
          <planeGeometry args={[0.76, 0.56]} />
          <meshBasicMaterial color="#111" side={THREE.DoubleSide} />
        </mesh>
        <Text position={[0, 0.3, 0.01]} fontSize={0.8} color="#fff" clipRect={[-0.4, -0.3, 0.4, 0.3]}>
          {currentVal}
        </Text>
      </group>

      {/* Separator line */}
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[0.8, 0.02]} />
        <meshBasicMaterial color="#0A0A0A" />
      </mesh>
    </group>
  );
}

// Group of digits for a specific score
function ScoreBoardBank({ label, score, position, highlight = false, delayOffset = 0 }) {
  const scoreStr = parseFloat(score || 0).toFixed(1).toString();
  const chars = scoreStr.split('');

  return (
    <group position={position}>
      <Text position={[0, 0.9, 0]} fontSize={0.25} color={highlight ? "#8B1E2D" : "#666"} anchorX="center">
        {label.toUpperCase()}
      </Text>
      
      {/* Container Box */}
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[chars.length * 0.9 + 0.2, 1.4]} />
        <meshBasicMaterial color={highlight ? "#8B1E2D" : "#000"} />
      </mesh>

      {chars.map((char, i) => (
        <SplitFlapDigit 
          key={i} 
          value={char} 
          position={[(i - (chars.length - 1) / 2) * 0.85, 0, 0]} 
          delay={delayOffset + i * 150} 
        />
      ))}
    </group>
  );
}

export default function SplitFlap3D({ appearance }) {
  return (
    <div className="w-full h-48 sm:h-56 bg-[#0A0A0A] border border-brand-border overflow-hidden relative rounded-md shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <Canvas>
        <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={60} />
        <ambientLight intensity={1} />
        
        <Center>
          <group position={[0, -0.2, 0]}>
            <ScoreBoardBank 
              label="Peoples Verdict" 
              score={appearance.peoples_verdict_weighted} 
              position={[-3, 0, 0]} 
              delayOffset={500} 
            />
            
            <ScoreBoardBank 
              label="Judge Avg" 
              score={appearance.judge_average} 
              position={[0, 0, 0]} 
              delayOffset={1200} 
            />
            
            <ScoreBoardBank 
              label="Latent Score" 
              score={appearance.latent_score} 
              position={[3, 0, 0]} 
              highlight={true} 
              delayOffset={2000} 
            />
          </group>
        </Center>
      </Canvas>
    </div>
  );
}
