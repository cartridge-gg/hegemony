import { Move, useMoveStore } from "@/store";
import { getContractByName } from "@dojoengine/core";
import { dojoConfig } from "../../dojoConfig";
import { Call, num } from "starknet";
import { useQueryParams } from "./useQueryParams";
import { useGameState } from "./useGameState";
import { useMemo } from "react";
import { offset } from "@/utils";

export const useCommitTransaction = () => {
  const { manifest } = dojoConfig();
  const { gameId } = useQueryParams();

  const { totalCycles, currentStage, isCommitStage, isResolveStage } =
    useGameState();

  const loadMovesByDay = useMoveStore((state) => state.loadMovesByDay);
  const setMoveByDay = useMoveStore((state) => state.setMoveByDay);

  const moves = useMemo(() => {
    return loadMovesByDay(totalCycles);
  }, [totalCycles]);

  const moveRevealArray = (): Call[] => {
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
        contractAddress: getContractByName(manifest, "move"),
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
  };

  const movesCommitArray = (): Call[] => {
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
      contractAddress: getContractByName(manifest, "move"),
      calldata: [
        gameId,
        move.squadId,
        move.newSquadId ? move.newSquadId : move.squadId,
        num.toBigInt(move.hash),
      ],
    }));

    console.log(movesMap);

    return movesMap;
  };

  return {
    movesCommitArray,
    moveRevealArray,
  };
};
