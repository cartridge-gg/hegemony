import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Move,
  save,
  load,
  loadByDay,
  clearByDaySquadId,
} from "@/utils/commitments/storage";
import { Entity } from "@dojoengine/recs";
import { useEffect, useState } from "react";
import { poseidonHashMany } from "micro-starknet";
import { useDojo } from "@/dojo/useDojo";
import { useComponentValue } from "@dojoengine/react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { offset } from "./Hex";
import { useMoveStore } from "@/store";

export const Commitment = () => {
  const {
    setup: {
      clientComponents: { Position },
      client,
    },
    account,
  } = useDojo();
  const [move, setMove] = useState<Move>({
    squadId: 0,
    x: 0,
    y: 0,
    hash: "",
    timestamp: Date.now(),
    commited: false,
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;

    setMove({ ...move, [name]: value });
  };

  useEffect(() => {
    if (move.x && move.y) {
      const hash = getCommitmentHash([BigInt(move.x), BigInt(move.y)]);
      setMove((prevMove) => ({ ...prevMove, hash: hash.toString() }));
    }
  }, [move.x, move.y]);

  const saveMove = () => {
    save(1, move);
    setMove({
      squadId: 0,
      x: 0,
      y: 0,
      hash: "",
      timestamp: Date.now(),
      commited: false,
    });
  };

  const isSelected = useMoveStore((state) => state.selectedHex);

  return (
    <div className="fixed bottom-0 right-0 p-6 w-96 h-96 bg-white z-10 border border-black overflow-auto">
      <h1>Commitment</h1>
      selected: {isSelected?.x}/{isSelected?.y}
      <Input
        type="text"
        name="squadId"
        value={move?.squadId}
        onChange={handleInputChange}
        placeholder="Squad ID"
      />
      <Input
        type="text"
        name="x"
        value={move?.x}
        onChange={handleInputChange}
        placeholder="X Coordinate"
      />
      <Input
        type="text"
        name="y"
        value={move?.y}
        onChange={handleInputChange}
        placeholder="Y Coordinate"
      />
      <Input
        type="text"
        name="hash"
        value={move?.hash}
        onChange={handleInputChange}
        placeholder="Hash"
        disabled
      />
      <Button onClick={saveMove}>Save Move</Button>
      <CommitmentMoves />
    </div>
  );
};

export const CommitmentMoves = () => {
  const movesObject = load();

  const movesArray = Object.values(movesObject).flatMap((dayMoves) =>
    Object.values(dayMoves)
  );

  return (
    <div className="my-2">
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

  const entityId = getEntityIdFromKeys([
    BigInt(1),
    BigInt(account.account.address),
    BigInt(move.squadId),
  ]) as Entity;

  const squad = useComponentValue(Position, entityId);

  return (
    <div>
      <Button
        size={"sm"}
        variant={"outline"}
        onClick={() => clearByDaySquadId(1, move.squadId)}
      >
        x
      </Button>
      <span className="px-1 bg-black text-white">{move.squadId}</span>
      <span className="px-1 bg-orange-200">
        ({squad?.x - offset}/{squad?.y - offset})
      </span>
      <span>
        move -
        <span className="px-1 bg-green-200">
          ({move.x}/{move.y})
        </span>
      </span>

      <Button
        disabled={move.commited}
        onClick={() => {
          client.move.move_squad_commitment({
            account: account.account,
            game_id: 1,
            squad_id: move.squadId,
            hash: move.hash,
          });
          save(1, { ...move, commited: true });
        }}
      >
        {move.commited ? "Committed" : "Commit"}
      </Button>
    </div>
  );
};

export function getCommitmentHash(keys: bigint[]): bigint {
  return poseidonHashMany(keys);
}
