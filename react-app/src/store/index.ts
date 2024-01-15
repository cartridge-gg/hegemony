import {
  Move,
  clearByDay,
  save,
  clearByDaySquadId,
  load,
} from "@/utils/commitments/storage";
import { create } from "zustand";

// We keep localStorage and zustand in sync so we have reactive state

interface Hex {
  x: number;
  y: number;
}

interface MoveState {
  init: () => void;
  moves: Record<number, Record<number, Move>>;
  setMoves: (moves: Record<number, Record<number, Move>>) => void;
  setMoveByDay: (dayKey: number, move: Move) => void;
  loadMovesByDay: (dayKey: number) => Record<number, Move>;
  findSquadByCoordinates: (day: number, x: number, y: number) => Move | null;
  clearByDay: (dayKey: number) => void;
  clearByDaySquadId: (dayKey: number, squadId: number) => void;
  move: Move;
  selectedHex: Hex | null;
  moveToHex: Hex | null;
  setMoveToHex: (hex: Hex) => void;
  setSelectedHex: (hex: Hex) => void;
  isSelectedHex: (hex: Hex) => boolean;
  setMove: (move: Move) => void;
  clearMove: () => void;
}

export const useMoveStore = create<MoveState>((set, get) => ({
  init: () => {
    const moves = load();
    set({ moves });
  },
  moves: {},
  setMoves: (moves) => set({ moves }),
  setMoveByDay: (dayKey, move) => {
    const { moves } = get();
    const updatedDayMoves = { ...moves[dayKey], [move.squadId]: move };
    set({ moves: { ...moves, [dayKey]: updatedDayMoves } });
    save(dayKey, move);
  },
  loadMovesByDay: (dayKey) => {
    const { moves } = get();
    if (moves[dayKey]) {
      return moves[dayKey];
    }
    return {};
  },
  findSquadByCoordinates: (day, x, y) => {
    const { loadMovesByDay } = get();
    const dayMoves = loadMovesByDay(day);

    for (const key in dayMoves) {
      if (dayMoves[key].x === x && dayMoves[key].y === y) {
        return dayMoves[key];
      }
    }
    return null;
  },
  clearByDay: (dayKey) => {
    const { moves } = get();
    if (moves[dayKey]) {
      const { [dayKey]: omitted, ...newMoves } = moves;
      set({ moves: newMoves });
      clearByDay(dayKey);
    }
  },
  clearByDaySquadId: (dayKey, squadId) => {
    const { moves } = get();
    if (moves[dayKey] && moves[dayKey][squadId]) {
      const { [squadId]: omitted, ...newDayMoves } = moves[dayKey];
      set({ moves: { ...moves, [dayKey]: newDayMoves } });
      clearByDaySquadId(dayKey, squadId);
    }
  },
  move: {
    squadId: 0,
    x: 0,
    y: 0,
    hash: "",
    timestamp: Date.now(),
    committed: false,
    revealed: false,
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
    return selectedHex.x === hex.x && selectedHex.y === hex.y;
  },
  setMove: (move) => set({ move }),
  clearMove: () =>
    set({
      move: {
        squadId: 0,
        x: 0,
        y: 0,
        hash: "",
        timestamp: Date.now(),
        committed: false,
        revealed: false,
      },
    }),
}));
