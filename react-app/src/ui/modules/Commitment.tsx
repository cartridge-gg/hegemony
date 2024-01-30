import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Entity, Has, HasValue } from "@dojoengine/recs";
import { useEffect } from "react";
import { ec } from "starknet";
import { useDojo } from "@/dojo/useDojo";
import { useComponentValue, useEntityQuery } from "@dojoengine/react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { Move, useMoveStore } from "@/store";
import { useStateStore } from "@/hooks/useStateStore";
import { useCommitTransaction } from "@/hooks/useCommitTransaction";
import { offset } from "@/utils";
import { useGameState } from "@/hooks/useGameState";
import { useQueryParams } from "@/hooks/useQueryParams";

export const Commitment = () => {
  const {
    setup: {
      clientComponents: { Position, Squad },
      systemCalls: { spawn_new_units },
      client,
    },
    account: { account },
  } = useDojo();

  const {
    totalCycles,
    currentStage,
    isCommitStage,
    isRevealStage,
    isSpawnCycle,
  } = useGameState();

  const { gameId } = useQueryParams();

  const { move, setMove, setMoveByDay, moves, moveToHex } = useStateStore();

  const { movesCommitArray, moveRevealArray } = useCommitTransaction();

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setMove({ ...move, [name]: value });
  };

  useEffect(() => {
    if (move.x && move.y) {
      const hash = getCommitmentHash([
        BigInt(move.qty),
        BigInt(move.x + offset),
        BigInt(move.y + offset),
      ]);

      console.log(BigInt(hash));
      console.log(hash.toString());
      setMove({ ...move, hash: hash.toString() });
    }
  }, [move.x, move.y]);

  const isSelected = useMoveStore((state) => state.selectedHex) || {
    col: 0,
    row: 0,
  };

  const squadsOnHex = useEntityQuery([
    Has(Position),
    HasValue(Position, {
      x: isSelected?.col + offset,
      y: isSelected?.row + offset,
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
      setMove({
        ...move,
        x: moveToHex.col,
        y: moveToHex.row,
        qty: moveToHex.qty,
      });
    }
  }, [moveToHex, moves]);

  return (
    <div className="fixed bottom-0 right-0 p-6 w-96 h-96 bg-white z-10 border border-black overflow-auto">
      <div className="text-xs border p-1 flex justify-between bg-black text-white uppercase">
        {squadOnHex?.squad_id ? (
          <>
            {" "}
            <span>🪖 Squad: {squadOnHex?.squad_id}</span>
            <span>
              Current: ({isSelected?.col}/{isSelected?.row})
            </span>
            <span>Qty: {squadOnHex?.unit_qty}</span>
          </>
        ) : (
          "no squad selected"
        )}
      </div>

      <div className="flex space-x-3 border p-1 px-2 text-xs">
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
        <div className="flex">
          <div className="self-center mr-2">qty:</div>
          <Input
            type="text"
            name="qty"
            value={move?.qty}
            onChange={handleInputChange}
            placeholder="Y Coordinate"
          />
        </div>
        <Button
          disabled={
            (move.x == 0 && move.y == 0) || squadOnHex?.squad_id == undefined
          }
          onClick={() => setMoveByDay(totalCycles, move)}
        >
          Save
        </Button>
      </div>
      <CommitmentMoves />
      {(isCommitStage || isRevealStage) && (
        <Button
          onClick={() =>
            client.move.move_squad_multi({
              account: account,
              call_data: isCommitStage ? movesCommitArray() : moveRevealArray(),
            })
          }
          className="w-full"
        >
          {isCommitStage ? "Commit all" : "Reveal all"} moves
        </Button>
      )}
      {isSpawnCycle && (
        <Button onClick={() => spawn_new_units({ account, game_id: gameId })}>
          spawn units
        </Button>
      )}
    </div>
  );
};

export const CommitmentMoves = () => {
  const loadMovesByDay = useMoveStore((state) => state.loadMovesByDay);

  const { totalCycles, isCommitStage } = useGameState();

  return (
    <div className="my-2">
      <h5>Ready</h5>
      {loadMovesByDay(totalCycles).map((move, index) => (
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

  const { clearByDayUUID, setMoveByDay } = useStateStore();

  const { gameId } = useQueryParams();
  const { totalCycles, isCommitStage } = useGameState();

  const squad = useComponentValue(
    Position,
    getEntityIdFromKeys([
      BigInt(gameId),
      BigInt(account.account.address),
      BigInt(move.squadId),
    ]) as Entity
  );

  return (
    <div className="flex text-xs border ">
      <div className="self-center flex">
        <span className="px-1 border bg-black text-white"> {move.squadId}</span>
        <span className="px-1 bg-red-200">x{move.qty}</span>
        <span className="px-1 bg-orange-200">
          from ({squad && squad?.x - offset}/{squad && squad?.y - offset})
        </span>
        <span className="bg-green-200">
          to
          <span className="px-1 bg-green-200">
            ({move.x}/{move.y})
          </span>
        </span>
      </div>
      {isCommitStage && (
        <>
          <Button
            size={"sm"}
            className="text-xs ml-auto"
            disabled={move.committed}
            onClick={() => {
              try {
                client.move.move_squad_commitment({
                  account: account.account,
                  game_id: gameId,
                  squad_id: move.squadId,
                  hash: BigInt(move.hash),
                });
              } catch (e) {
                console.log(e);
              }

              setMoveByDay(totalCycles, { ...move });
            }}
          >
            {move.committed ? "Committed" : "Commit"}
          </Button>
          <Button
            size={"sm"}
            className="text-xs"
            variant={"destructive"}
            onClick={() => clearByDayUUID(totalCycles, move.uuid)}
          >
            x
          </Button>
        </>
      )}
    </div>
  );
};

export function getCommitmentHash(keys: bigint[]): bigint {
  return ec.starkCurve.poseidonHashMany(keys);
}
