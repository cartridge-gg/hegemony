import { Canvas, extend } from "@react-three/fiber";
import {
  OrbitControls,
  OrthographicCamera,
  MapControls,
  Bounds,
  Environment,
  Stage,
} from "@react-three/drei";
import { HexagonBackground } from "../components/three/HexagonBackground";
import { MovementArrows } from "../components/three/Arrows";
import { useGameState } from "@/hooks/useGameState";
extend({ OrbitControls });

const HexagonGrid = ({ rows, cols, hexRadius }: any) => {
  const { totalCycles } = useGameState();

  const hexagons = [];
  const hexHeight = hexRadius * 2;
  const hexWidth = Math.sqrt(3) * hexRadius;
  const vertDist = hexHeight * 0.75;
  const horizDist = hexWidth;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * horizDist + ((row % 2) * horizDist) / 2;
      const y = -(row * vertDist);
      hexagons.push(
        <HexagonBackground
          key={`${row}-${col}`}
          position={[x, y, 0]}
          radius={hexRadius}
          col={col}
          row={row}
          totalCycles={totalCycles}
        />
      );
    }
  }
  return <>{hexagons}</>;
};

export const Game = () => {
  return (
    <Canvas>
      <color attach="background" args={["#ADD8E6"]} />
      <OrthographicCamera
        makeDefault
        position={[0, 200, 100]}
        zoom={2}
        near={3}
        far={3}
      />
      <mesh>
        <MapControls makeDefault />
        <ambientLight color={"white"} intensity={1} />
        <directionalLight position={[213.3, 80.0, 264.4]} />
        <mesh rotation={[Math.PI / -2, 0, 0]}>
          <Bounds fit clip observe margin={1}>
            <HexagonGrid rows={30} cols={30} hexRadius={3} />
          </Bounds>
          <MovementArrows />
        </mesh>
        <Environment preset="dawn" />
      </mesh>
    </Canvas>
  );
};
