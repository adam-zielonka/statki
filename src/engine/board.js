import { generateShips, getXY } from "../utils.js";

export const FLEET = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
export const coordinate = (row, col) =>
  `${String.fromCharCode(65 + row)}${col + 1}`;

export class Board {
  constructor(ships = generateShips()) {
    this.ships = ships.map((ship) => ship.map((id) => getXY(id)));
    this.cells = Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => ({
        ship: false,
        state: "unknown",
      })),
    );
    for (const ship of this.ships) {
      for (const [row, col] of ship) this.cells[row][col].ship = true;
    }
  }

  isSunk(ship) {
    return ship.every(([row, col]) =>
      ["hit", "sunk"].includes(this.cells[row][col].state),
    );
  }

  get remaining() {
    return this.ships
      .filter((ship) => !this.isSunk(ship))
      .map((ship) => ship.length);
  }

  get hits() {
    return this.cells
      .flat()
      .filter((cell) => ["hit", "sunk"].includes(cell.state)).length;
  }

  // Expose revealed information only; never pass hidden ships or cell references to an AI.
  knowledge() {
    return {
      cells: this.cells.map((row) => row.map((cell) => cell.state)),
      remaining: this.remaining,
    };
  }

  shoot(row, col) {
    const cell = this.cells[row]?.[col];
    if (!cell || cell.state !== "unknown") return null;
    cell.state = cell.ship ? "hit" : "miss";
    let sunk = 0;
    if (cell.ship) {
      const ship = this.ships.find((parts) =>
        parts.some(([r, c]) => r === row && c === col),
      );
      if (this.isSunk(ship)) {
        sunk = ship.length;
        for (const [r, c] of ship) {
          this.cells[r][c].state = "sunk";
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const neighbor = this.cells[r + dr]?.[c + dc];
              if (neighbor && !neighbor.ship && neighbor.state === "unknown")
                neighbor.state = "blocked";
            }
          }
        }
      }
    }
    return { hit: cell.ship, sunk, won: this.remaining.length === 0, row, col };
  }
}
