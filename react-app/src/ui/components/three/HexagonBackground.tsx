import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { extend, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Cone } from "@react-three/drei";
import { useComponentValue, useEntityQuery } from "@dojoengine/react";
import { Has, HasValue } from "@dojoengine/recs";
import { useStateStore } from "@/hooks/useStateStore";
import { useDojo } from "@/dojo/useDojo";
import { Troop } from "./Troop";
import { isEnergySource, offset } from "@/utils";
import { SquadOnHex, troopStateColours } from "./SquadOnHex";
import { snoise } from "@dojoengine/utils";
import { Bloom } from "@react-three/postprocessing";
import { BlurPass, Resizer, KernelSize, Resolution } from "postprocessing";
import { useMoveStore } from "@/store";
import { HexTile } from "@/utils/hex";
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
    steps: 2,
    depth,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 1,
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
      clientComponents: { Position, Base},
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

  const [lineColor, setLineColor] = useState("gray");
  const [backgroundColor, setBackgroundColor] = useState("white");

  const [radiusPosition, setRadiusPosition] = useState(radius);
  const [scalePoint, setScalePoint] = useState(0);
  const [depth, setDepth] = useState(1);
  const [isHighlighted, setIsHighlighted] = useState(false)
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

  const selected = useMoveStore((state) => state.selectedHex)
  const squadOnSelectedHex = useEntityQuery([
    Has(Position),
    HasValue(Position, { x: (selected?.col ?? 0) + 986, y: (selected?.row ?? 0 )+ 986 }),
  ]);
  
  const selectedSquad = findSquadByCoordinates(totalCycles, selected?.col ?? -1, selected?.row ?? -1);

  useEffect(() => {
    // Determine line properties
    if (isSelected({ col, row, qty: 3 })) {
      setLineColor("red");
      setScalePoint(0.05);
    } else {
      setLineColor("white");
      setScalePoint(0);
    }

    // Determine background color based on different conditions
    let backgroundColor = "white";
    let depth = 1;
    if (seed > 60) {
      backgroundColor = "blue";
      depth = 0.4;
    } else if (seed > 40) {
      backgroundColor = "#4F9153";
      depth = 0.7;
    } else if (seed > 30) {
      backgroundColor = "#002D04";
      depth = 1.4;
    } else if (seed > 20) {
      backgroundColor = "#2c4c3b";
      depth = 1.6;
    } else if (seed > 15) {
      backgroundColor = "gray";
      depth = 2;
    } else {
      backgroundColor = "black";
      depth = 3;
    }

    if (isMoveToHex) {
      backgroundColor = "red";
    }
    setDepth(depth);
    setBackgroundColor(backgroundColor);
    
    //Highlight yellow of valid moves (within 3 tiles of selected hex)
    if (selected && squadOnSelectedHex.length > 0) {
      const validMoveTiles = new HexTile(selected.col, selected.row).getValidMoveTiles(3)
      
      if (validMoveTiles.has(new HexTile(col, row).toString())) {
        setIsHighlighted(true)
      } else {
        setIsHighlighted(false)
      }
    }else{
      setIsHighlighted(false)
    }

  }, [selectedHex, moves, isMoveToHex, seed, isSelected, col, row]);

  const isBase = isEnergySource({ x: col + offset, y: row + offset });

  const hexagonGeometry = useMemo(
    () => createHexagonGeometry(radiusPosition, depth),
    [radiusPosition, depth]
  );

  const linePosition = useMemo(() => {
    return new THREE.Vector3(position[0], position[1], depth);
  }, [radiusPosition, depth, position]);

  const hexLine = useRef<any>();

  useFrame(() => {
    const scale = 1 + Math.sin(Date.now() / 100) * scalePoint;
    hexLine.current.scale.set(scale, scale, scale);
  });

  const lineGeometry = useMemo(
    () => createHexagonGeometry(radiusPosition, 0),
    [radiusPosition, depth]
  );

  return (
    <>
      {isBase && (
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[position[0], position[1], 1]}
        >
          <Cone>
            <meshStandardMaterial color="black" />
          </Cone>
        </mesh>
      )}
      {commitmentMove && (
        <Troop
          position={new THREE.Vector3(position[0], position[1], depth)}
          text={`id: ${commitmentMove.squadId} qty: ${commitmentMove.qty}`}
          color={troopStateColours.commited}
        />
      )}
      {squadsOnHex?.length > 0 &&
        squadsOnHex.map((a, index) => (
          <SquadOnHex
            commitmentMove={commitmentMove ? commitmentMove : undefined}
            key={index}
            position={position}
            entity={a}
            depth={depth}
          />
        ))}

      {baseOnHex?.length > 0 && (
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[position[0], position[1], 1]}
        >
          <Cone>
            <meshStandardMaterial color="red" />
          </Cone>
        </mesh>
      )}

      <mesh position={[position[0] - 2, position[1] - 1, depth + 0.2]}>
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
        <meshStandardMaterial color={backgroundColor} opacity={.1} />
        {isHighlighted && (<mesh geometry={hexagonGeometry}>
          <meshBasicMaterial color={"yellow"} transparent={true} opacity={0.5} />
        </mesh>)}
        
      </mesh>
      <mesh>
        <Bloom mipmapBlur luminanceThreshold={1} />
        <lineSegments
          ref={hexLine}
          geometry={new THREE.EdgesGeometry(lineGeometry)}
          material={
            new THREE.LineBasicMaterial({
              color: lineColor,

              linewidth: 5,
              // transparent: true,
            })
          }
          position={linePosition}
        />
      </mesh>
    </>
  );
};
