# Ships

Classic single-player Battleship with an English interface for desktop and mobile.
Choose an opponent and shuffle your fleet before starting. A hit gives you another
shot; a miss passes the turn. Ships cannot touch, even diagonally.
Water around a sunk ship is marked automatically.

## Opponents

- **Felek — Explorer:** picks unexplored squares at random.
- **Hugo — Hunter:** follows up on hits by checking adjacent squares and pursuing the ship's line.
- **Ada — Strategist:** combines hit pursuit with a checkerboard search;
  switches to all remaining squares once every larger ship has been sunk.
- **Lena — Navigator:** counts legal placements of the remaining ships and targets
  squares with the most matching placements; follows up on hits to finish a ship.

Every opponent receives only previous shot results and the sizes of ships still
afloat. Hidden ship positions are never passed to the algorithms.

Includes pause, rematches, fleet counters, shot history and an accuracy summary.
Pausing or starting a new game cancels pending computer moves. The grid supports
keyboard controls: Tab, arrow keys, and Enter or Space.

See [DEVELOPMENT.md](DEVELOPMENT.md) for local setup and validation.
