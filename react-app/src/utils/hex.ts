//It would be cool to call this library directly from cairo!

enum Direction {
    East = 'East',
    NorthEast = 'NorthEast',
    NorthWest = 'NorthWest',
    West = 'West',
    SouthWest = 'SouthWest',
    SouthEast = 'SouthEast',
}

export class HexTile {
    col: number;
    row: number;

    constructor(col: number, row: number) {
        this.col = col;
        this.row = row;
    }

    toString(): string {
        return `${this.col},${this.row}`;
    }

    neighbor(direction: string): HexTile {
        switch (direction) {
            case Direction.East:
                return new HexTile(this.col + 1, this.row);
            case Direction.NorthEast:
                return new HexTile(this.col + 1, this.row - 1);
            case Direction.NorthWest:
                return new HexTile(this.col, this.row - 1);
            case Direction.West:
                return new HexTile(this.col - 1, this.row);
            case Direction.SouthWest:
                return new HexTile(this.col, this.row + 1);
            case Direction.SouthEast:
                return new HexTile(this.col + 1, this.row + 1);
            default:
                throw new Error(`Invalid direction: ${direction}`);
        }
    }

    neighborEvenY(direction: string): HexTile {
        switch (direction) {
            case Direction.East:
                return new HexTile(this.col + 1, this.row);
            case Direction.NorthEast:
                return new HexTile(this.col, this.row + 1);
            case Direction.NorthWest:
                return new HexTile(this.col - 1, this.row + 1);
            case Direction.West:
                return new HexTile(this.col - 1, this.row);
            case Direction.SouthWest:
                return new HexTile(this.col - 1, this.row - 1);
            case Direction.SouthEast:
                return new HexTile(this.col, this.row - 1);
            default:
                throw new Error(`Invalid direction: ${direction}`);
        }
    }

    neighbors(): HexTile[] {
        if(this.row % 2 === 0)
        {
            return [
                this.neighborEvenY(Direction.East),
                this.neighborEvenY(Direction.NorthEast),
                this.neighborEvenY(Direction.NorthWest),
                this.neighborEvenY(Direction.West),
                this.neighborEvenY(Direction.SouthWest),
                this.neighborEvenY(Direction.SouthEast),
            ];
        }
        return [
            this.neighbor(Direction.East),
            this.neighbor(Direction.NorthEast),
            this.neighbor(Direction.NorthWest),
            this.neighbor(Direction.West),
            this.neighbor(Direction.SouthWest),
            this.neighbor(Direction.SouthEast),
        ];
    }

    getValidMoveTiles(distance: number) {
        let queue = [this];
        let visited = new Set([this.toString()]);
        let moves = 0;
        
        while (queue.length > 0 && moves < distance) {
            let nextQueue = [];
    
            for (let tile of queue) {
                for (let neighbor of tile.neighbors()) {
                    if (!visited.has(neighbor.toString())) {
                        visited.add(neighbor.toString());
                        nextQueue.push(neighbor);
                    }
                }
            }
    
            queue = nextQueue;
            moves++;
        }
    
        return visited;
    }

}


