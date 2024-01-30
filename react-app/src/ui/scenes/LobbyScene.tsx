import { Canvas, extend } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  MapControls,
  Bounds,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";
import { HexagonBackground } from "../components/three/HexagonBackground";
import { MovementArrows } from "../components/three/Arrows";
import { useGameState } from "@/hooks/useGameState";
import { useMemo } from "react";
extend({ OrbitControls });

const createHexagonGeometry = () => {
  const verticesOfCube = [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
    -1, 1, 1,
  ];

  const indicesOfFaces = [
    2, 1, 0, 0, 3, 2, 0, 4, 7, 7, 3, 0, 0, 1, 5, 5, 4, 0, 1, 2, 6, 6, 5, 1, 2,
    3, 7, 7, 6, 2, 4, 5, 6, 6, 7, 4,
  ];
  // Create a geometry by extruding the shape
  return new THREE.PolyhedronGeometry(verticesOfCube, indicesOfFaces, 6, 2);
};

export const LobbyScene = () => {
  const hexagonGeometry = useMemo(() => createHexagonGeometry(), []);
  return (
    <Canvas shadows color={"black"}>
      <mesh>
        <PerspectiveCamera
          makeDefault
          position={[25, 270, 270]}
          zoom={2}
          aspect={1.77}
          near={3}
          far={3}
        />
        <MapControls enableRotate={false} makeDefault target={[0, 0, 0]} />
        <ambientLight color={"white"} intensity={1} />
        <pointLight
          rotation={[Math.PI / -2, 0, 0]}
          position={[10, 20, 10]}
          intensity={20}
        />
        <color attach="background" args={["#ADD8E6"]} />
        <mesh geometry={hexagonGeometry}>
          <meshStandardMaterial color={"blue"} />
        </mesh>
        <Environment preset="dawn" />
      </mesh>
    </Canvas>
  );
};
