import { Move, useMoveStore } from "@/store";
import { getContractByName } from "@dojoengine/core";
import { dojoConfig } from "../../dojoConfig";
import { Call } from "starknet";
import { useQueryParams } from "./useQueryParams";

export const useCommitTransaction = () => {
  const { manifest } = dojoConfig();
  const { gameId } = useQueryParams();
  const gameDay = 1;

  const loadMovesByDay = useMoveStore((state) => state.loadMovesByDay);
  const setMoveByDay = useMoveStore((state) => state.setMoveByDay);

  const moveRevealArray = (): Call[] => {
    const moves = loadMovesByDay(gameDay);

    moves.forEach((move) => {
      setMoveByDay(gameDay, { ...move, revealed: true });
    });

    return moves.map((move) => {
      return {
        entrypoint: "move_squad_reveal",
        contractAddress: getContractByName(manifest, "move"),
        calldata: [gameDay, move.squadId, move.qty, move.x, move.y],
      };
    });
  };

  const movesCommitArray = (): Call[] => {
    const moves = loadMovesByDay(gameDay);

    moves.forEach((move) => {
      setMoveByDay(gameDay, { ...move, committed: true });
    });

    return moves.map((move) => {
      return {
        entrypoint: "move_squad_commitment",
        contractAddress: getContractByName(manifest, "move"),
        calldata: [gameDay, move.squadId, move.hash],
      };
    });
  };

  return {
    movesCommitArray,
    moveRevealArray,
  };
};
