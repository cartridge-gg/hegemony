import { useMoveStore } from "@/store";
import { useEffect } from "react";

export const useStateStore = () => {
  const isSelected = useMoveStore((state) => state.isSelectedHex);
  const selectedHex = useMoveStore((state) => state.selectedHex);
  const setMoveToHex = useMoveStore((state) => state.setMoveToHex);
  const moveToHex = useMoveStore((state) => state.moveToHex);

  const init = useMoveStore((state) => state.init);
  const moves = useMoveStore((state) => state.moves);
  const setMoves = useMoveStore((state) => state.setMoves);
  const setMoveByDay = useMoveStore((state) => state.setMoveByDay);
  const loadMovesByDay = useMoveStore((state) => state.loadMovesByDay);
  const findSquadByCoordinates = useMoveStore(
    (state) => state.findSquadByCoordinates
  );
  const clearByDay = useMoveStore((state) => state.clearByDay);
  const clearByDaySquadId = useMoveStore((state) => state.clearByDaySquadId);

  const setMove = useMoveStore((state) => state.setMove);
  const move = useMoveStore((state) => state.move);
  const clearMove = useMoveStore((state) => state.clearMove);

  useEffect(() => {
    init();
  }, [init]);

  return {
    isSelected,
    selectedHex,
    setMoveToHex,
    moveToHex,
    init,
    moves,
    setMoves,
    setMoveByDay,
    loadMovesByDay,
    findSquadByCoordinates,
    clearByDay,
    clearByDaySquadId,
    setMove,
    move,
    clearMove,
  };
};
