import { Move } from "@/utils/commitments/storage";
import { create } from "zustand";

interface Hex {
  x: number;
  y: number;
}

interface MoveState {
  move: Move | null;
  selectedHex: Hex | null;
  setSelectedHex: (hex: Hex) => void;
  isSelectedHex: (hex: Hex) => boolean;
  setMove: (move: Move) => void;
  clearMove: () => void;
}

export const useMoveStore = create<MoveState>((set, get) => ({
  move: null,
  selectedHex: null,
  setSelectedHex: (selectedHex) => {
    set({ selectedHex: null });
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
  clearMove: () => set({ move: null }),
}));
