import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend } from "@react-three/fiber";

import {
  OrbitControls,
  PerspectiveCamera,
  MapControls,
  Bounds,
  Text,
  Cylinder,
  Cone,
  Billboard,
} from "@react-three/drei";
import { useComponentValue, useEntityQuery } from "@dojoengine/react";
import { Entity, Has, HasValue } from "@dojoengine/recs";
import { offset } from "./Hex";
import { useStateStore } from "@/hooks/useStateStore";
import { useDojo } from "@/dojo/useDojo";
import { useMoveStore } from "@/store";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { Move } from "@/utils/commitments/storage";
import ArcArrow from "./Arc";
extend({ OrbitControls });

const createHexagonGeometry = (radius) => {
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

  return new THREE.ShapeGeometry(shape);
};

const Hexagon = ({ position, radius, col, row }) => {
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
  } = useStateStore();

  const moves = useMoveStore((state) => state.moves);
  const setSelectedHex = useMoveStore((state) => state.setSelectedHex);

  const [lineThickness, setLineThickness] = useState(1);
  const [lineColor, setLineColor] = useState("gray");
  const [backgroundColor, setBackgroundColor] = useState("white");

  const [linePosition, setLinePosition] = useState(position);

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
    return moveToHex?.x === col && moveToHex?.y === row && moveToHex !== null;
  }, [selectedHex, moveToHex, moves]);

  const commitmentMove = findSquadByCoordinates(1, col, row);

  //   console.log("commitmentMove", commitmentMove);

  // hex selection
  useEffect(() => {
    if (isSelected({ x: col, y: row })) {
      setLineThickness(5);
      setLineColor("red");
    } else {
      setLineThickness(2);
      setLineColor("white");
    }
  }, [selectedHex, moves]);

  useEffect(() => {
    if (isMoveToHex) {
      setBackgroundColor("lightgreen");
    } else {
      setBackgroundColor("white");
    }
  }, [isMoveToHex, moves]);

  const meshRef = useRef();

  const hexagonGeometry = useMemo(
    () => createHexagonGeometry(radius),
    [radius]
  );

  const wireframeMaterial = new THREE.LineBasicMaterial({
    color: lineColor, // Stroke color
    linewidth: lineThickness, // Adjust
  });

  const wireframeGeometry = new THREE.EdgesGeometry(hexagonGeometry);

  return (
    <>
      {commitmentMove && (
        <mesh
          rotation={[Math.PI / -2, 0, 0]}
          position={[position[0], position[1], 0.1]}
        >
          <group>
            <Billboard follow position={[0, 0, 2]}>
              <Text
                fontSize={1}
                outlineColor="#000000"
                outlineOpacity={1}
                outlineWidth="5%"
              >
                {commitmentMove.squadId}
              </Text>
            </Billboard>
            <Cylinder>
              <meshStandardMaterial color="orange" />
            </Cylinder>
          </group>
        </mesh>
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
          position={[position[0], position[1], 1]}
        >
          <Cone>
            <meshStandardMaterial color="red" />
          </Cone>
        </mesh>
      )}

      <mesh position={[position[0] - 2, position[1] - 1, 0.1]}>
        <Text fontSize={0.4} color="white" anchorX="center" anchorY="middle">
          {col},{row}
        </Text>
      </mesh>

      <mesh
        onPointerEnter={() => {
          setLineColor("red");
        }}
        onClick={() => setSelectedHex({ x: col, y: row })}
        onContextMenu={(e) => setMoveToHex({ x: col, y: row })}
        onPointerLeave={() => {
          if (!isSelected({ x: col, y: row })) {
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
        geometry={wireframeGeometry}
        material={wireframeMaterial}
        position={linePosition}
      />
    </>
  );
};

export const SquadOnHex = ({
  position,
  entity,
  commitmentMove,
}: {
  position: any;
  entity: Entity;
  commitmentMove?: Move;
}) => {
  const {
    setup: {
      clientComponents: { Squad },
    },
    account,
  } = useDojo();

  let pulsing = false;

  if (commitmentMove) {
    const entityId = getEntityIdFromKeys([
      BigInt(1),
      BigInt(account.account.address),
      BigInt(commitmentMove?.squadId),
    ]) as Entity;

    pulsing = entityId === entity;

    console.log("pulsing", pulsing);
  }

  const squadOnHex = useComponentValue(Squad, entity);

  return (
    <mesh
      rotation={[Math.PI / -2, 0, 0]}
      position={[position[0], position[1], 0.1]}
    >
      <Billboard follow position={[0, 0, 2]}>
        <Text
          fontSize={1}
          outlineColor="#000000"
          outlineOpacity={1}
          outlineWidth="5%"
        >
          {squadOnHex?.squad_id}
        </Text>
      </Billboard>
      <Cylinder>
        <meshStandardMaterial color="black" />
      </Cylinder>
    </mesh>
  );
};

const HexagonGrid = ({ rows, cols, hexRadius }) => {
  const hexagons = [];
  const hexHeight = hexRadius * 2;
  const hexWidth = Math.sqrt(3) * hexRadius;
  const vertDist = hexHeight * 0.75;
  const horizDist = hexWidth;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * horizDist + ((row % 2) * horizDist) / 2;
      const y = row * vertDist;
      hexagons.push(
        <Hexagon
          key={`${row}-${col}`}
          position={[x, y, 0]}
          radius={hexRadius}
          col={col}
          row={row}
        />
      );
    }
  }
  return <>{hexagons}</>;
};

export const ThreeGrid = () => {
  return (
    <Canvas shadows>
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
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <mesh rotation={[Math.PI / -2, 0, 0]}>
          <Bounds fit clip observe margin={1}>
            <HexagonGrid rows={30} cols={30} hexRadius={3} />
          </Bounds>
          <CreateMovementArrows />
        </mesh>
      </mesh>
    </Canvas>
  );
};

export const CreateMovementArrows = () => {
  const {
    setup: {
      clientComponents: { Squad },
    },
    account,
  } = useDojo();

  const squadsOnHex = useEntityQuery([
    Has(Squad),
    HasValue(Squad, { owner: BigInt(account.account.address) }),
  ]);

  return (
    <>
      {squadsOnHex.map((entity, index) => {
        return <CreateArrow entity={entity} key={index} />;
      })}
    </>
  );
};

export const CreateArrow = ({ entity }: any) => {
  const {
    setup: {
      clientComponents: { Position },
    },
  } = useDojo();

  const { loadMovesByDay } = useStateStore();
  const squadOnHex = useComponentValue(Position, entity);
  const movesArray = Object.values(loadMovesByDay(1));
  const squad = movesArray.find((a) => a.squadId === squadOnHex?.squad_id);

  const startPosition = getHexagonPosition(
    squadOnHex?.y - offset,
    squadOnHex?.x - offset,
    3
  );
  const endPosition = squad?.squadId
    ? getHexagonPosition(squad?.y, squad?.x, 3)
    : { x: startPosition.x, y: startPosition.y };

  return (
    <ArcArrow
      start={[startPosition.x, startPosition.y, 0]}
      end={[endPosition.x, endPosition.y, 0]}
      displacement={3}
    />
  );
};

const getHexagonPosition = (row, col, hexRadius) => {
  const hexHeight = hexRadius * 2;
  const hexWidth = Math.sqrt(3) * hexRadius;
  const vertDist = hexHeight * 0.75;
  const horizDist = hexWidth;

  const x = col * horizDist + ((row % 2) * horizDist) / 2;
  const y = row * vertDist;

  return { x, y };
};
