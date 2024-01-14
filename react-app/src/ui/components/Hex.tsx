import { useComponentValue, useEntityQuery } from "@dojoengine/react";
import { useDojo } from "../../dojo/useDojo";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { Entity, Has, HasValue } from "@dojoengine/recs";
import { useEffect, useMemo, useState } from "react";
import {
  Move,
  findSquadByCoordinates,
  loadByDay,
} from "@/utils/commitments/storage";
import { useMoveStore } from "@/store";

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

  const isSelected = useMoveStore((state) => state.isSelectedHex);
  const selectedHex = useMoveStore((state) => state.selectedHex);

  const width = Math.sqrt(3) * size;
  const height = 2 * size;
  const points = `${width / 2},0 ${width}, ${height / 4} ${width}, ${
    (3 * height) / 4
  } ${width / 2}, ${height} 0, ${(3 * height) / 4} 0, ${height / 4}`;

  const textX = width / 2;
  const textY = height * 0.1;

  const [squads, setSquads] = useState<Entity[]>([]);

  const squadsOnHex = useEntityQuery([
    Has(Position),
    HasValue(Position, { x: col + offset, y: row + offset }),
  ]);

  const baseOnHex = useEntityQuery([
    HasValue(Base, { x: col + offset, y: row + offset }),
  ]);

  if (squads.length > 0) {
    setSquads(squads);
  }

  const [lineThickness, setLineThickness] = useState(2);
  const [lineColor, setLineColor] = useState("gray");
  const [backgroundColor, setBackgroundColor] = useState("white");

  const dayMoves: any = loadByDay(1);

  const [commitmentMove, setCommitmentMove] = useState<Move | null>(null);

  useMemo(() => {
    if (dayMoves) {
      const move = findSquadByCoordinates(dayMoves, col, row);

      if (move !== null) {
        setCommitmentMove(move);
      }
    }
  }, []);

  useEffect(() => {
    if (isSelected({ x: col, y: row })) {
      setLineThickness(4);
      setLineColor("red");
    } else {
      setLineThickness(2);
      setLineColor("gray");
    }
  }, [selectedHex]);

  return (
    <svg
      onMouseOver={() => {
        setBackgroundColor("yellow");
      }}
      onMouseOut={() => {
        setBackgroundColor("white");
      }}
      width={width}
      height={height}
      style={{ top: y, left: x, position: "absolute" }}
      onClick={onClick}
    >
      <polygon
        stroke={lineColor}
        strokeWidth={lineThickness}
        points={points}
        fill={commitmentMove ? "orange" : backgroundColor}
      />
      {baseOnHex?.length > 0 && <BaseOnHex width={width} />}
      <text
        x={textX}
        y={textY}
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
        <CommitmentSquadOnHex commitmentMove={commitmentMove} width={width} />
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
    />
  );
};

export const CommitmentSquadOnHex = ({
  width,
  commitmentMove,
}: {
  width: number;
  commitmentMove: Move;
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
  return <SquadTextComponent qty={squadOnHex?.unit_qty} width={width} />;
};

export const SquadTextComponent = ({
  qty,
  width,
  pulsing,
}: {
  qty: number | undefined;
  width: number;
  pulsing?: boolean;
}) => {
  return (
    <text
      x={width / 2}
      y={width / 2}
      fill="black"
      fontSize="20"
      textAnchor="middle"
      dominantBaseline="central"
      className={pulsing ? "pulsing-text" : ""}
    >
      🪖 {qty}
    </text>
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

  return <div style={{ position: "relative" }}>{renderHexagons()}</div>;
};
