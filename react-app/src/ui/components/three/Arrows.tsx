import { useComponentValue, useEntityQuery } from "@dojoengine/react";
import { Entity, Has, HasValue } from "@dojoengine/recs";
import { useStateStore } from "@/hooks/useStateStore";
import { useDojo } from "@/dojo/useDojo";
import ArcArrow from "../Arc";
import { offset } from "@/utils";
import { useGameState } from "@/hooks/useGameState";

export const MovementArrows = () => {
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
        return <MovementArrow entity={entity} key={index} />;
      })}
    </>
  );
};

export const MovementArrow = ({ entity }: { entity: Entity }) => {
  const {
    setup: {
      clientComponents: { Position },
    },
  } = useDojo();
  const { totalCycles } = useGameState();
  const { loadMovesByDay } = useStateStore();
  const squadOnHex = useComponentValue(Position, entity);
  const movesArray = loadMovesByDay(totalCycles);
  const squad = movesArray.filter((a) => a.squadId === squadOnHex?.squad_id);

  const startPosition = getHexagonPosition({
    row: (squadOnHex && squadOnHex?.y - offset) || 0,
    col: (squadOnHex && squadOnHex?.x - offset) || 0,
    hexRadius: 3,
  });

  return (
    <>
      {squad.map((a, index) => {
        const endPosition = a?.squadId
          ? getHexagonPosition({ row: a?.y, col: a?.x, hexRadius: 3 })
          : { x: startPosition.x, y: startPosition.y };
        return (
          <ArcArrow
            key={index}
            start={[startPosition.x, startPosition.y, 1]}
            end={[endPosition.x, endPosition.y, 1]}
            displacement={3}
          />
        );
      })}
    </>
  );
};

const getHexagonPosition = ({
  row,
  col,
  hexRadius,
}: {
  row: number;
  col: number;
  hexRadius: number;
}) => {
  const hexHeight = hexRadius * 2;
  const hexWidth = Math.sqrt(3) * hexRadius;
  const vertDist = hexHeight * 0.75;
  const horizDist = hexWidth;

  const x = col * horizDist + ((row % 2) * horizDist) / 2;
  const y = row * vertDist;

  return { x, y };
};
