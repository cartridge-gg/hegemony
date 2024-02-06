import { uuid } from "@latticexyz/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Move {
  squadId: number;
  newSquadId?: number;
  x: number;
  y: number;
  qty: number;
  hash: string;
  timestamp: number;
  committed: boolean;
  revealed: boolean;
  uuid: string;
}

interface Hex {
  col: number;
  row: number;
  qty: number;
}

interface MoveState {
  moves: Record<number, Array<Move>>;
  setMoves: (moves: Record<number, Array<Move>>) => void;
  setMoveByDay: (dayKey: number, move: Move) => void;
  loadMovesByDay: (dayKey: number) => Move[];
  findSquadByCoordinates: (day: number, x: number, y: number) => Move | null;
  clearByDay: (dayKey: number) => void;
  clearByDayUUID: (dayKey: number, uuid: string) => void;
  move: Move;
  selectedHex: Hex | null;
  moveToHex: Hex | null;
  setMoveToHex: (hex: Hex) => void;
  setSelectedHex: (hex: Hex) => void;
  isSelectedHex: (hex: Hex) => boolean;
  setMove: (move: Move) => void;
  clearMove: () => void;
  mapCenter: { x: number; y: number };
  setMapCenter: (center: { x: number; y: number }) => void;
}

export const useMoveStore = create<MoveState>()(
  persist(
    (set, get) => ({
      moves: {},
      setMoves: (moves) => set({ moves }),
      setMoveByDay: (dayKey, move) => {
        const { moves } = get();

        if (!moves[dayKey]) {
          moves[dayKey] = [];
        }
        const uuids = uuid();
        const existingMove = moves[dayKey].find((a) => a.uuid === move.uuid);

        if (existingMove) {
          const index = moves[dayKey].indexOf(existingMove);
          moves[dayKey].splice(index, 1);
          moves[dayKey].push({ ...move, uuid: existingMove.uuid });
        } else {
          moves[dayKey].push({ ...move, uuid: uuids });
        }

        set({ moves: { ...moves } });
      },
      loadMovesByDay: (dayKey) => {
        const { moves } = get();
        if (moves[dayKey]) {
          return moves[dayKey];
        }
        return [];
      },
      findSquadByCoordinates: (day, x, y) => {
        const { loadMovesByDay } = get();
        const dayMoves = loadMovesByDay(day);

        if (!dayMoves) {
          return null;
        }

        // // Iterate over the array of moves for the day
        for (const move of dayMoves) {
          if (move.x === x && move.y === y) {
            return move;
          }
        }
        return null;
      },
      clearByDay: (dayKey) => {
        const { moves } = get();
        if (moves[dayKey]) {
          const { [dayKey]: omitted, ...newMoves } = moves;
          set({ moves: newMoves });
        }
      },
      clearByDayUUID: (dayKey, uuid) => {
        const { moves } = get();
        if (moves[dayKey]) {
          const newDayMoves = moves[dayKey].filter(
            (move) => move.uuid !== uuid
          );
          set({ moves: { ...moves, [dayKey]: newDayMoves } });
        }
      },
      move: {
        squadId: 0,
        x: 0,
        y: 0,
        qty: 0,
        hash: "",
        timestamp: Date.now(),
        committed: false,
        revealed: false,
        uuid: "",
      },
      selectedHex: null,
      moveToHex: null,
      setMoveToHex: (moveToHex) => set({ moveToHex }),
      setSelectedHex: (selectedHex) => {
        set({ selectedHex });
      },
      isSelectedHex: (hex) => {
        const { selectedHex } = get();

        if (!selectedHex) {
          return false;
        }
        return selectedHex.col === hex.col && selectedHex.row === hex.row;
      },
      setMove: (move) => set({ move }),
      mapCenter: { x: 995, y: 995 },
      setMapCenter: (center) => set({ mapCenter: center }),
      clearMove: () =>
        set({
          move: {
            squadId: 0,
            x: 0,
            y: 0,
            qty: 0,
            hash: "",
            timestamp: Date.now(),
            committed: false,
            revealed: false,
            uuid: "",
          },
        }),
    }),
    {
      name: "move-storage", // name of the item in the storage (must be unique)
    }
  )
);
