export enum Direction {
  Left = 1,
  Right = 2,
  Up = 3,
  Down = 4,
}

export function updatePositionWithDirection(
  direction: Direction,
  value: { vec: { x: number; y: number } }
) {
  switch (direction) {
    case Direction.Left:
      value.vec.x--;
      break;
    case Direction.Right:
      value.vec.x++;
      break;
    case Direction.Up:
      value.vec.y--;
      break;
    case Direction.Down:
      value.vec.y++;
      break;
    default:
      throw new Error("Invalid direction provided");
  }
  return value;
}

export const MAP_AMPLITUDE = 16;

export const offset = 2147483647;

export const GRID_SIZE = 32;

export function isEnergySource({ x, y }: { x: number; y: number }): boolean {
  // Define the distance between energy sources
  const distance = 10;

  // Adjust for the hex grid's staggered pattern
  if (y % (2 * distance) === 0) {
    // For every alternate row starting from 0, place an energy source every `distance` hexes
    return x % distance === 0;
  } else if ((y - distance) % (2 * distance) === 0) {
    // For the rows `distance` away from the starting rows, offset the energy sources by `distance / 2`
    return (x - Math.floor(distance / 2)) % distance === 0;
  }

  return false;
}
