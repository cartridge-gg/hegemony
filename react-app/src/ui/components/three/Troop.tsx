import * as THREE from "three";
import { Billboard } from "./BillBoard";
import { Cylinder } from "@react-three/drei";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

export const Troop = ({ text, position, ...props }: any) => {
  const [hover, setHover] = useState(false);

  const [scalePoint, setScalePoint] = useState(0);

  const meshRef = useRef<any>();
  useFrame(() => {
    // Scale up and down smoothly
    const scale = 1 + Math.sin(Date.now() / 500) * scalePoint;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh
      onPointerEnter={() => {
        setScalePoint(0.05);
        setHover(true);
      }}
      onPointerLeave={() => {
        setScalePoint(0);
        setHover(false);
      }}
      ref={meshRef}
      rotation={[Math.PI / -2, 0, 0]}
      position={position}
    >
      <group>
        {hover && (
          <Billboard text={text} position={new THREE.Vector3(0, -0.4, 2)} />
        )}

        <Cylinder>
          <meshStandardMaterial color="orange" />
        </Cylinder>
      </group>
    </mesh>
  );
};
