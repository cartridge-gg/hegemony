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

    return updatedMoves.map((move) => {
      return {
        entrypoint: "move_squad_reveal",
        contractAddress: getContractByName(manifest, "move"),
        calldata: [
          gameId,
          move.squadId,
          move.qty,
          move.x + offset,
          move.y + offset,
        ],
      };
    });
  };

  const movesCommitArray = (): Call[] => {
    console.log(moves);
    // Create a new array with updated items
    const updatedMoves = moves.map((move) => ({
      ...move,
      committed: true,
    }));

    console.log(updatedMoves);

    // Update the state with the new array
    updatedMoves.forEach((updatedMove) => {
      setMoveByDay(totalCycles, updatedMove);
    });

    console.log(
      updatedMoves.map((move) => ({
        entrypoint: "move_squad_commitment",
        contractAddress: getContractByName(manifest, "move"),
        calldata: [gameId, move.squadId, num.toBigInt(move.hash)],
      }))
    );

    return updatedMoves.map((move) => ({
      entrypoint: "move_squad_commitment",
      contractAddress: getContractByName(manifest, "move"),
      calldata: [gameId, move.squadId, num.toBigInt(move.hash)],
    }));
  };

  return {
    movesCommitArray,
    moveRevealArray,
  };
};
