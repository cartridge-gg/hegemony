export interface Move {
  squadId: number;
  x: number;
  y: number;
  hash: string;
  timestamp: number;
  committed: boolean;
  revealed: boolean;
}

// local storage

const STORAGE_KEY = "commitments";

export function load(): Record<number, Record<number, Move>> {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    const parsedData = JSON.parse(data);
    // Check if parsedData is an object, not an array
    if (typeof parsedData === "object" && !Array.isArray(parsedData)) {
      return parsedData;
    }
  }
  return {};
}

export function save(dayKey: number, move: Move): void {
  let allMoves = load();

  // Ensuring allMoves is an object, not an array
  if (Array.isArray(allMoves)) {
    allMoves = {}; // Reset to an empty object if it's an array
  }

  if (!allMoves[dayKey]) {
    allMoves[dayKey] = {};
  }

  allMoves[dayKey][move.squadId] = move;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(allMoves));
}

export function loadByDay(
  dayKey?: number
): Record<number, Move> | Record<number, Record<number, Move>> {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    const allMoves = JSON.parse(data);

    // If a specific day key is provided, return the moves for that day
    if (dayKey !== undefined && allMoves[dayKey]) {
      return allMoves[dayKey];
    }

    // If no day key is provided, return all moves
    return {};
  }
  return {};
}

export function findSquadByCoordinates(
  dayMoves: Record<number, Move>,
  x: number,
  y: number
): Move | null {
  for (const key in dayMoves) {
    if (Object.prototype.hasOwnProperty.call(dayMoves, key)) {
      const move = dayMoves[key];
      if (parseInt(move.x) === x && parseInt(move.y) === y) {
        return move;
      }
    }
  }
  return null;
}

export function clear(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function clearByDay(dayKey: number) {
  const allMoves = load();
  delete allMoves[dayKey];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allMoves));
}

export function clearByDaySquadId(dayKey: number, squadId: number) {
  const allMoves = load();
  delete allMoves[dayKey][squadId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allMoves));
}
