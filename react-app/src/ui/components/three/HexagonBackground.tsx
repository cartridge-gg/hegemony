import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { extend } from "@react-three/fiber";
import { OrbitControls, Text, Cone } from "@react-three/drei";
import { useEntityQuery } from "@dojoengine/react";
import { Has, HasValue } from "@dojoengine/recs";
import { useStateStore } from "@/hooks/useStateStore";
import { useDojo } from "@/dojo/useDojo";
import { Troop } from "./Troop";
import { offset } from "@/utils";
import { SquadOnHex } from "./SquadOnHex";
import { snoise } from "@dojoengine/utils";
import { useGameState } from "@/hooks/useGameState";
extend({ OrbitControls });

const createHexagonGeometry = (radius: number, depth: number) => {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    // Adjust the angle to start the first point at the top
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();

  // Extrude settings
  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: false,
  };

  // Create a geometry by extruding the shape
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
};

export const HexagonBackground = ({
  position,
  radius,
  col,
  row,
  totalCycles,
}: any) => {
  const {
    setup: {
      clientComponents: { Position, Base },
    },
  } = useDojo();

  const {
    moveToHex,
    setMoveToHex,
    selectedHex,
    isSelected,
    findSquadByCoordinates,
    moves,
    setSelectedHex,
  } = useStateStore();

  const meshRef = useRef<any>();

  const [lineThickness, setLineThickness] = useState(1);
  const [lineColor, setLineColor] = useState("gray");
  const [backgroundColor, setBackgroundColor] = useState("white");
  const [linePosition, setLinePosition] = useState(position);
  const [radiusPosition, setRadiusPosition] = useState(radius);

  // Squads on hex
  const squadsOnHex = useEntityQuery([
    Has(Position),
    HasValue(Position, { x: col + offset, y: row + offset }),
  ]);

  // Base on hex
  const baseOnHex = useEntityQuery([
    HasValue(Base, { x: col + offset, y: row + offset }),
  ]);

  const isMoveToHex = useMemo(() => {
    return (
      moveToHex?.col === col && moveToHex?.row === row && moveToHex !== null
    );
  }, [selectedHex, moveToHex, moves]);

  const commitmentMove = findSquadByCoordinates(totalCycles, col, row);

  const hexagonGeometry = useMemo(
    () => createHexagonGeometry(radiusPosition, 1),
    [radius, radiusPosition]
  );

  const handleLeftClick = () => {
    setSelectedHex({ col, row, qty: 3 });
  };

  const handleRightClick = () => {
    setMoveToHex({ col, row, qty: 3 });
  };

  const MAP_AMPLITUDE = 10;

  const seed = Math.floor(
    ((snoise([col / MAP_AMPLITUDE, 0, row / MAP_AMPLITUDE]) + 1) / 2) * 100
  );

  useEffect(() => {
    // Determine line properties
    if (isSelected({ col, row, qty: 3 })) {
      setLineThickness(5);
      setLineColor("red");
    } else {
      setLineThickness(2);
      setLineColor("white");
    }

    // Determine background color based on different conditions
    let backgroundColor = "white";
    if (isMoveToHex) {
      backgroundColor = "red";
    } else if (seed > 60) {
      backgroundColor = "blue";
    } else if (seed > 40) {
      backgroundColor = "yellow";
    } else if (seed > 30) {
      backgroundColor = "brown";
    } else if (seed > 20) {
      backgroundColor = "purple";
    } else if (seed > 15) {
      backgroundColor = "gray";
    } else {
      backgroundColor = "black";
    }

    setBackgroundColor(backgroundColor);
  }, [selectedHex, moves, isMoveToHex, seed]);

  return (
    <>
      {commitmentMove && (
        <Troop
          position={[position[0], position[1], 1]}
          text={`id: ${commitmentMove.squadId} qty: ${commitmentMove.qty}`}
        />
      )}
      {squadsOnHex?.length > 0 &&
        squadsOnHex.map((a, index) => (
          <SquadOnHex
            commitmentMove={commitmentMove ? commitmentMove : undefined}
            key={index}
            position={position}
            entity={a}
          />
        ))}

      {baseOnHex?.length > 0 && (
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[position[0], position[1], 1.5]}
        >
          <Cone>
            <meshStandardMaterial color="red" />
          </Cone>
        </mesh>
      )}

      <mesh position={[position[0] - 2, position[1] - 1, 1]}>
        <Text fontSize={0.4} color="white" anchorX="center" anchorY="middle">
          {col},{row}
        </Text>
      </mesh>

      <mesh
        onPointerEnter={() => {
          setLineColor("red");
        }}
        onClick={() => handleLeftClick()}
        onContextMenu={(e) => handleRightClick()}
        onPointerLeave={() => {
          if (!isSelected({ col, row, qty: 3 })) {
            setLineColor("white");
          }
        }}
        ref={meshRef}
        position={position}
        geometry={hexagonGeometry}
      >
        <meshStandardMaterial color={backgroundColor} />
      </mesh>
      <lineSegments
        geometry={new THREE.EdgesGeometry(hexagonGeometry)}
        material={
          new THREE.LineBasicMaterial({
            color: lineColor,
            linewidth: lineThickness,
          })
        }
        position={linePosition}
      />
    </>
  );
};
