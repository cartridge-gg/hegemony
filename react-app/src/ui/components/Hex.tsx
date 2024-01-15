import { useComponentValue, useEntityQuery } from "@dojoengine/react";
import { useDojo } from "../../dojo/useDojo";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { Entity, Has, HasValue } from "@dojoengine/recs";
import { useEffect, useMemo, useState } from "react";
import { Move } from "@/utils/commitments/storage";
import { useMoveStore } from "@/store";
import { useStateStore } from "@/hooks/useStateStore";

import { snoise } from "@dojoengine/utils";

export const MAP_AMPLITUDE = 16;

export const offset = 995;

export const Hexagon = ({
  size,
  x,
  y,
  row,
  col,
  color,
  onClick,
}: {
  size: number;
  x: number;
  y: number;
  row: number;
  col: number;
  color: string;
  onClick: () => void;
}) => {
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

  const [lineThickness, setLineThickness] = useState(1);
  const [lineColor, setLineColor] = useState("gray");
  const [backgroundColor, setBackgroundColor] = useState("white");

  // Hex
  const width = Math.sqrt(3) * size;
  const height = 2 * size;
  const points = `${width / 2},0 ${width}, ${height / 4} ${width}, ${
    (3 * height) / 4
  } ${width / 2}, ${height} 0, ${(3 * height) / 4} 0, ${height / 4}`;

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

  console.log("commitmentMove", commitmentMove);

  // hex selection
  useEffect(() => {
    if (isSelected({ x: col, y: row })) {
      setLineThickness(3);
      setLineColor("red");
    } else {
      setLineThickness(1);
      setLineColor("gray");
    }
  }, [selectedHex, moves]);

  // hex move
  const handleRightClick = (event: any, x: any, y: any) => {
    event.preventDefault();
    setMoveToHex({ x, y });
  };

  useEffect(() => {
    if (isMoveToHex) {
      setBackgroundColor("lightgreen");
    } else {
      setBackgroundColor("white");
    }
  }, [isMoveToHex, moves]);

  return (
    <svg
      onMouseOver={() => {
        setLineColor("red");
        setLineThickness(3);
      }}
      onMouseOut={() => {
        if (!isSelected({ x: col, y: row })) {
          setLineColor("gray");
          setLineThickness(1);
        }
      }}
      width={width}
      height={height}
      style={{ top: y, left: x, position: "absolute" }}
      onClick={onClick}
      onContextMenu={(e) => handleRightClick(e, col, row)}
    >
      <polygon
        stroke={lineColor}
        strokeWidth={lineThickness}
        points={points}
        fill={commitmentMove ? "orange" : backgroundColor}
      />
      {baseOnHex?.length > 0 && <BaseOnHex width={width} />}
      <text
        x={width / 2}
        y={height * 0.1}
        fill="gray"
        fontSize="10"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {`${col}/${row}`}
      </text>
      {squadsOnHex?.length > 0 &&
        squadsOnHex.map((a, index) => (
          <SquadOnHex
            commitmentMove={commitmentMove ? commitmentMove : undefined}
            key={index}
            width={width}
            entity={a}
          />
        ))}

      {commitmentMove && (
        <CommitmentSquadOnHex
          locked={commitmentMove.committed}
          commitmentMove={commitmentMove}
          width={width}
        />
      )}
    </svg>
  );
};

export const BaseOnHex = ({ width }) => {
  return (
    <text
      x={width / 2}
      y={width / 2}
      fill="black"
      fontSize="30"
      textAnchor="middle"
      dominantBaseline="central"
    >
      🏯
    </text>
  );
};

export const SquadOnHex = ({
  width,
  entity,
  commitmentMove,
}: {
  width: number;
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
    <SquadTextComponent
      pulsing={pulsing}
      qty={squadOnHex?.unit_qty}
      width={width}
      squadId={squadOnHex?.squad_id}
    />
  );
};

export const CommitmentSquadOnHex = ({
  width,
  commitmentMove,
  locked,
}: {
  width: number;
  commitmentMove: Move;
  locked?: boolean;
}) => {
  const {
    setup: {
      clientComponents: { Squad },
      account,
    },
  } = useDojo();

  const entityId = getEntityIdFromKeys([
    BigInt(1),
    BigInt(account.account.address),
    BigInt(commitmentMove.squadId),
  ]) as Entity;

  const squadOnHex = useComponentValue(Squad, entityId);
  return (
    <SquadTextComponent
      qty={squadOnHex?.unit_qty}
      width={width}
      squadId={squadOnHex?.squad_id}
      locked={locked}
    />
  );
};

export const SquadTextComponent = ({
  qty,
  width,
  pulsing,
  squadId,
  locked,
}: {
  qty: number | undefined;
  width: number;
  pulsing?: boolean;
  squadId?: number;
  locked?: boolean;
}) => {
  const circleCX = width / 2; // X-coordinate of the circle's center
  const circleCY = width / 2; // Y-coordinate of the circle's center
  const circleRadius = 15; // Radius of the circle
  const textX = width / 2; // X-coordinate for the quantity text
  const textY = width / 1.2; // Y-coordinate for the quantity text
  const squadIdX = circleCX; // X-coordinate for the squad ID text
  const squadIdY = circleCY; // Y-coordinate for the squad ID text, adjusted to be inside the circle

  return (
    <svg width="100" height="150">
      {/* Circle for the Squad ID */}
      <circle
        cx={circleCX}
        cy={circleCY}
        r={circleRadius}
        stroke="black"
        fill="transparent"
      />
      {/* Text for the Squad ID */}
      <text
        x={squadIdX}
        y={squadIdY}
        textAnchor="middle"
        fill="black"
        fontSize="12"
        dy=".3em"
      >
        {squadId}
      </text>
      {/* Text for the Quantity */}
      <text x={textX} y={textY} textAnchor="middle" fill="black" fontSize="10">
        {locked ? "✅" : "❌"} {qty}
      </text>
    </svg>
  );
};

export const Grid = ({ rows, cols, hexSize }) => {
  const setSelectedHex = useMoveStore((state) => state.setSelectedHex);

  const renderHexagons = () => {
    const hexagons = [];
    const hexHeight = hexSize * 2;
    const hexWidth = Math.sqrt(3) * hexSize;
    const vertDist = hexHeight * 0.75;
    const horizDist = hexWidth;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * horizDist + ((row % 2) * horizDist) / 2;
        const y = row * vertDist;
        hexagons.push(
          <Hexagon
            key={`${row}-${col}`}
            size={hexSize}
            x={x}
            y={y}
            row={row}
            col={col}
            color="white"
            onClick={() => {
              setSelectedHex({ x: col, y: row });
              console.log(`Hexagon at row ${row} and col ${col} clicked`);
            }}
          />
        );
      }
    }

    return hexagons;
  };

  return <div className="relative">{renderHexagons()}</div>;
};
