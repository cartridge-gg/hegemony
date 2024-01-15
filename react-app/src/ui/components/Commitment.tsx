import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Move } from "@/utils/commitments/storage";
import { Entity, Has, HasValue } from "@dojoengine/recs";
import { useEffect, useState } from "react";
import { poseidonHashMany } from "micro-starknet";
import { useDojo } from "@/dojo/useDojo";
import { useComponentValue, useEntityQuery } from "@dojoengine/react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { offset } from "./Hex";
import { useMoveStore } from "@/store";
import { useStateStore } from "@/hooks/useStateStore";
import { useCommitTransaction } from "@/hooks/useCommitTransaction";

export const Commitment = () => {
  const {
    setup: {
      clientComponents: { Position, Squad },
      client,
    },
    account: { account },
  } = useDojo();

  const { move, setMove, setMoveByDay, moves, moveToHex } = useStateStore();

  const { movesCommitArray, moveRevealArray } = useCommitTransaction();

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setMove({ ...move, [name]: value });
  };

  useEffect(() => {
    if (move.x && move.y) {
      const hash = getCommitmentHash([BigInt(move.x), BigInt(move.y)]);
      setMove({ ...move, hash: hash.toString() });
    }
  }, [move.x, move.y]);

  const isSelected = useMoveStore((state) => state.selectedHex) || {
    x: 0,
    y: 0,
  };

  const squadsOnHex = useEntityQuery([
    Has(Position),
    HasValue(Position, {
      x: isSelected?.x + offset,
      y: isSelected?.y + offset,
    }),
  ]);

  const squadOnHex = useComponentValue(Squad, squadsOnHex[0]);

  useEffect(() => {
    if (squadOnHex) {
      setMove({ ...move, squadId: squadOnHex.squad_id });
    } else {
      setMove({ ...move, squadId: 0 });
    }
  }, [squadOnHex, moves]);

  useEffect(() => {
    if (moveToHex) {
      setMove({ ...move, x: moveToHex.x, y: moveToHex.y });
    }
  }, [moveToHex, moves]);

  return (
    <div className="fixed bottom-0 right-0 p-6 w-96 h-96 bg-white z-10 border border-black overflow-auto">
      🪖 Squad: {squadOnHex?.squad_id} | Current: ({isSelected?.x}/
      {isSelected?.y})
      <div className="flex space-x-3 border p-1 px-2">
        <div className="flex">
          <div className="self-center mr-2">x:</div>
          <Input
            type="text"
            name="x"
            value={move?.x}
            onChange={handleInputChange}
            placeholder="X Coordinate"
          />
        </div>
        <div className="flex">
          <div className="self-center mr-2">y:</div>
          <Input
            type="text"
            name="y"
            value={move?.y}
            onChange={handleInputChange}
            placeholder="Y Coordinate"
          />
        </div>
        <Button onClick={() => setMoveByDay(1, move)}>Save Move</Button>
      </div>
      <CommitmentMoves />
      <Button
        onClick={() =>
          client.move.move_squad_multi({
            account: account,
            call_data: movesCommitArray(),
          })
        }
        className="w-full"
      >
        commit all
      </Button>
    </div>
  );
};

export const CommitmentMoves = () => {
  const moves = useMoveStore((state) => state.moves);

  const movesArray = Object.values(moves).flatMap((dayMoves) =>
    Object.values(dayMoves)
  );

  return (
    <div className="my-2">
      <h5>Ready</h5>
      {movesArray.map((move, index) => (
        <CommitmentMove key={index} move={move} />
      ))}
    </div>
  );
};

export const CommitmentMove = ({ move }: { move: Move }) => {
  const {
    setup: {
      clientComponents: { Position },
      client,
    },
    account,
  } = useDojo();

  const { clearByDaySquadId, setMoveByDay } = useStateStore();

  const entityId = getEntityIdFromKeys([
    BigInt(1),
    BigInt(account.account.address),
    BigInt(move.squadId),
  ]) as Entity;

  const squad = useComponentValue(Position, entityId);

  return (
    <div className="flex text-xs border p-1">
      <div className="self-center">
        <span className="px-1">🪖 {move.squadId}</span>
        <span className="px-1 bg-orange-200">
          ({squad && squad?.x - offset}/{squad && squad?.y - offset})
        </span>
        <span>
          move to{" "}
          <span className="px-1 bg-green-200">
            ({move.x}/{move.y})
          </span>
        </span>
      </div>

      <Button
        size={"sm"}
        className="text-xs ml-auto"
        disabled={move.committed}
        onClick={() => {
          try {
            client.move.move_squad_commitment({
              account: account.account,
              game_id: 1,
              squad_id: move.squadId,
              hash: BigInt(move.hash),
            });
          } catch (e) {
            console.log(e);
          }

          setMoveByDay(1, { ...move });
        }}
      >
        {move.committed ? "Committed" : "Commit"}
      </Button>
      <Button
        size={"sm"}
        className="text-xs"
        variant={"destructive"}
        onClick={() => clearByDaySquadId(1, move.squadId)}
      >
        x
      </Button>
    </div>
  );
};

export function getCommitmentHash(keys: bigint[]): bigint {
  return poseidonHashMany(keys);
}
