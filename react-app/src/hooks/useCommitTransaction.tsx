import { Move, useMoveStore } from "@/store";
import { getContractByName } from "@dojoengine/core";
import { dojoConfig } from "../../dojoConfig";
import { Call, num } from "starknet";
import { useQueryParams } from "./useQueryParams";
import { useGameState } from "./useGameState";
import { useCallback, useMemo } from "react";
import { offset } from "@/utils";
import { useDojo } from "@/dojo/useDojo";

export const useCommitTransaction = () => {
  const {
    setup: { client },
    account: { account },
  } = useDojo();

  const { manifest } = dojoConfig();
  const { gameId } = useQueryParams();

  const { totalCycles, isCommitStage } = useGameState();

  const loadMovesByDay = useMoveStore((state) => state.loadMovesByDay);
  const setMoveByDay = useMoveStore((state) => state.setMoveByDay);

  const moves = useMemo(() => {
    return loadMovesByDay(totalCycles);
  }, [totalCycles, loadMovesByDay]);

  const moveRevealArray = useCallback(() => {
    const updatedMoves = moves.map((move) => ({
      ...move,
      revealed: true,
    }));

    console.log(updatedMoves);

    updatedMoves.forEach((updatedMove) => {
      setMoveByDay(totalCycles, updatedMove);
    });

    const movesMap = updatedMoves.map((move) => {
      return {
        entrypoint: "move_squad_reveal",
        contractAddress: getContractByName(manifest, "move").address,
        calldata: [
          gameId,
          move.newSquadId ? move.newSquadId : move.squadId,
          move.qty,
          move.x + offset,
          move.y + offset,
        ],
      };
    });

    console.log(movesMap);

    return movesMap;
  }, [moves, gameId, manifest, setMoveByDay, totalCycles]);

  const movesCommitArray = useCallback(() => {
    const updatedMoves = moves.map((move) => ({
      ...move,
      committed: true,
    }));

    console.log(updatedMoves);

    updatedMoves.forEach((updatedMove) => {
      setMoveByDay(totalCycles, updatedMove);
    });

    const movesMap = updatedMoves.map((move) => ({
      entrypoint: "move_squad_commitment",
      contractAddress: getContractByName(manifest, "move").address,
      calldata: [
        gameId,
        move.squadId,
        move.newSquadId ? move.newSquadId : move.squadId,
        num.toBigInt(move.hash),
      ],
    }));

    console.log(movesMap);

    return movesMap;
  }, [moves, gameId, manifest, setMoveByDay, totalCycles]);

  const executeCommitTransaction = useCallback(() => {
    return client.move.move_squad_multi({
      account,
      call_data: isCommitStage ? movesCommitArray() : moveRevealArray(),
    });
  }, [isCommitStage, movesCommitArray, moveRevealArray, account, client.move]);

  return {
    executeCommitTransaction,
    movesCommitArray,
    moveRevealArray,
  };
};
