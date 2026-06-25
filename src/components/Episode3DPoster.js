"use client";

import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

function PosterMesh({ imageUrl }) {
  const meshRef = useRef();
  
  // Use a fallback texture or the provided image URL.
  const texture = useTexture(imageUrl || "/api/placeholder/400/600");
  const [hovered, setHover] = useState(false);

  // Smoothly interpolate rotation on hover
  useFrame((state, delta) => {
    if (meshRef.current) {
      const targetRotationX = hovered ? (state.pointer.y * Math.PI) / 8 : 0;
      const targetRotationY = hovered ? (state.pointer.x * Math.PI) / 8 : 0;

      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotationX, delta * 5);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotationY, delta * 5);
      
      const targetScale = hovered ? 1.05 : 1;
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, delta * 4));
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <planeGeometry args={[2, 1.2]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

export default function Episode3DPoster({ imageUrl, className }) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* We need to suspend the Canvas if we use useTexture */}
      <Canvas camera={{ position: [0, 0, 1.5], fov: 45 }}>
        <ambientLight intensity={1} />
        <Suspense fallback={<mesh><planeGeometry args={[2, 1.2]} /><meshBasicMaterial color="#111" /></mesh>}>
          {imageUrl ? (
            <PosterMesh imageUrl={imageUrl} />
          ) : (
            <mesh>
              <planeGeometry args={[2, 1.2]} />
              <meshBasicMaterial color="#111" />
            </mesh>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
