import test from "node:test";
import assert from "node:assert/strict";
import { Board, FLEET } from "../src/engine/board.js";
import { OPPONENTS, chooseShot } from "../src/engine/ai.js";
import { Game } from "../src/engine/game.js";

function random(seed = 234) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}
function scheduler() {
  let id = 0;
  const pending = new Map();
  return {
    pending,
    schedule: (callback) => {
      pending.set(++id, callback);
      return id;
    },
    cancel: (key) => pending.delete(key),
    tick: () => {
      const [key, callback] = pending.entries().next().value;
      pending.delete(key);
      callback();
    },
  };
}

function miss(game) {
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (!game.enemy.cells[row][col].ship) return game.fire(row, col);
    }
  }
}

test("generated fleets contain all 20 masts, straight ships and no touching neighbors", () => {
  for (let sample = 0; sample < 100; sample++) {
    const board = new Board();
    assert.deepEqual(board.remaining, FLEET);
    const occupied = board.ships.flat().map(([r, c]) => `${r},${c}`);
    assert.equal(new Set(occupied).size, 20);
    board.ships.forEach((ship, index) => {
      assert.ok(ship.every(([r, c]) => r >= 0 && r < 10 && c >= 0 && c < 10));
      assert.ok(
        ship.every(([r]) => r === ship[0][0]) ||
          ship.every(([, c]) => c === ship[0][1]),
      );
      for (const [r, c] of ship) {
        board.ships.forEach((other, j) => {
          if (index !== j)
            assert.ok(
              other.every(
                ([or, oc]) => Math.max(Math.abs(r - or), Math.abs(c - oc)) > 1,
              ),
            );
        });
      }
    });
  }
});

test("sinking marks the whole ship and surrounding water, without counting water as hits", () => {
  const board = new Board([["A1", "A2"], ["J10"]]);
  assert.deepEqual(board.shoot(0, 0), {
    hit: true,
    sunk: 0,
    won: false,
    row: 0,
    col: 0,
  });
  assert.equal(board.shoot(0, 1).sunk, 2);
  assert.equal(board.cells[1][2].state, "blocked");
  assert.equal(board.cells[0][0].state, "sunk");
  assert.equal(board.shoot(1, 2), null);
  assert.equal(board.hits, 2);
  assert.deepEqual(board.remaining, [1]);
  assert.equal(board.shoot(9, 9).won, true);
});

test("duplicate and out-of-bounds shots are rejected", () => {
  const board = new Board([["J10"]]);
  assert.equal(board.shoot(-1, 0), null);
  assert.equal(board.shoot(10, 0), null);
  assert.equal(board.shoot(0, 10), null);
  assert.equal(board.shoot(0, 0).hit, false);
  assert.equal(board.shoot(0, 0), null);
});

test("the AI view hides all ship coordinates and is detached from the board", () => {
  const a = new Board([["A1", "A2"]]),
    b = new Board([["J9", "J10"]]);
  assert.deepEqual(a.knowledge(), b.knowledge());
  const info = a.knowledge();
  info.cells[0][0] = "hit";
  info.remaining.pop();
  assert.equal(a.cells[0][0].state, "unknown");
  assert.deepEqual(a.remaining, [2]);
});

for (const strategy of ["hunter", "parity", "sonar"]) {
  test(`${strategy} continues a line and forgets sunk ships`, () => {
    const board = new Board([["A1", "A2", "A3"], ["J10"]]);
    board.shoot(0, 0);
    board.shoot(0, 1);
    assert.deepEqual(
      chooseShot(board.knowledge(), strategy, () => 0),
      [0, 2],
    );
    board.shoot(0, 2);
    const [r, c] = chooseShot(board.knowledge(), strategy, () => 0);
    assert.equal(board.cells[r][c].state, "unknown");
    assert.ok(r > 1 || c > 3);
  });
}

test("Ada uses parity to search for long ships and can find the final singleton", () => {
  const board = new Board([["A1", "A2"], ["J9"]]);
  const [r, c] = chooseShot(board.knowledge(), "parity", () => 0.4);
  assert.equal((r + c) % 2, 0);
  board.shoot(0, 0);
  board.shoot(0, 1);
  for (const row of board.cells)
    for (const cell of row) if (!cell.ship) cell.state = "miss";
  assert.deepEqual(chooseShot(board.knowledge(), "parity"), [9, 8]);
});

test("Lena favors fields with more possible ship placements", () => {
  const board = new Board([["A1", "A2", "A3", "A4"]]);
  const [r, c] = chooseShot(board.knowledge(), "sonar", () => 0);
  assert.ok(r >= 3 && r <= 6 && c >= 3 && c <= 6);
});

for (const { id } of OPPONENTS) {
  test(`${id} completes 12 fleets without repeated or illegal shots`, () => {
    for (let sample = 0; sample < 12; sample++) {
      const board = new Board(),
        rng = random(sample + 1);
      let shots = 0;
      while (board.remaining.length) {
        const knowledge = board.knowledge(),
          before = structuredClone(knowledge);
        const target = chooseShot(knowledge, id, rng);
        assert.deepEqual(knowledge, before);
        assert.ok(target);
        assert.equal(board.cells[target[0]][target[1]].state, "unknown");
        assert.ok(board.shoot(...target));
        assert.ok(++shots <= 100);
      }
      assert.equal(board.hits, 20);
      assert.equal(
        chooseShot(
          {
            cells: Array.from({ length: 10 }, () => Array(10).fill("miss")),
            remaining: [],
          },
          id,
        ),
        null,
      );
    }
  });
}

test("setup blocks shots and changing an active fleet or opponent is forbidden", () => {
  const game = new Game();
  assert.equal(game.fire(0, 0), null);
  game.selectOpponent("sonar");
  game.start();
  const player = game.player;
  game.selectOpponent("random");
  game.shuffleFleet();
  assert.equal(game.player, player);
  assert.equal(game.strategy, "sonar");
});

test("a hit preserves the turn, a miss transfers it, and repeat shots have no effect", () => {
  const clock = scheduler(),
    game = new Game(clock);
  game.enemy = new Board([["A1", "A2"]]);
  game.start();
  assert.equal(game.fire(0, 0).hit, true);
  assert.equal(game.turn, "player");
  assert.equal(game.fire(0, 0), null);
  assert.equal(game.shots.player, 1);
  assert.equal(game.fire(9, 9).hit, false);
  assert.equal(game.turn, "enemy");
  assert.equal(game.fire(0, 1), null);
  assert.equal(clock.pending.size, 1);
});

test("restart invalidates an already queued enemy shot even if its callback still executes", () => {
  const clock = scheduler(),
    game = new Game(clock);
  game.start();
  miss(game);
  const stale = [...clock.pending.values()][0];
  game.newGame();
  game.start();
  const before = game.player.knowledge();
  stale();
  assert.deepEqual(game.player.knowledge(), before);
  assert.equal(game.shots.enemy, 0);
  assert.equal(clock.pending.size, 0);
});

test("pause cancels the enemy timer, blocks player shots and resumes one timer only", () => {
  const clock = scheduler(),
    game = new Game(clock);
  game.start();
  miss(game);
  const stale = [...clock.pending.values()][0];
  game.togglePause();
  stale();
  assert.equal(clock.pending.size, 0);
  assert.equal(game.shots.enemy, 0);
  assert.equal(game.fire(1, 1), null);
  game.togglePause();
  game.queueEnemy();
  assert.equal(clock.pending.size, 1);
  clock.tick();
  assert.equal(game.shots.enemy, 1);
  game.newGame();
});

test("winning ends the game and blocks every subsequent shot", () => {
  const clock = scheduler(),
    game = new Game(clock);
  game.enemy = new Board([["A1"]]);
  game.start();
  assert.equal(game.fire(0, 0).won, true);
  assert.equal(game.phase, "over");
  assert.equal(game.winner, "player");
  assert.equal(game.fire(9, 9), null);
  assert.equal(clock.pending.size, 0);
});

test("complete games with every opponent conserve fleets and end with no pending timers", () => {
  for (const { id } of OPPONENTS) {
    const clock = scheduler(),
      game = new Game(clock),
      rng = random(145);
    game.selectOpponent(id);
    game.start();
    let steps = 0;
    while (game.phase === "playing") {
      if (game.turn === "player")
        game.fire(...chooseShot(game.enemy.knowledge(), "sonar", rng));
      else clock.tick();
      assert.ok(++steps <= 200);
      assert.equal(
        game.player.cells.flat().filter((cell) => cell.ship).length,
        20,
      );
      assert.equal(
        game.enemy.cells.flat().filter((cell) => cell.ship).length,
        20,
      );
    }
    assert.ok(game.winner);
    assert.equal(clock.pending.size, 0);
  }
});

test("default timers keep the browser global receiver when scheduling and cancelling", (t) => {
  const pending = new Map();
  t.mock.method(globalThis, "setTimeout", function (callback) {
    assert.ok(this === globalThis, "native timer must be called on the browser global");
    pending.set(1, callback);
    return 1;
  });
  t.mock.method(globalThis, "clearTimeout", function (id) {
    assert.ok(this === globalThis, "native timer must be called on the browser global");
    pending.delete(id);
  });
  const game = new Game();
  game.enemy = new Board([["J10"]]);
  game.start();
  game.fire(0, 0);
  assert.equal(pending.size, 1);
  game.togglePause();
  assert.equal(pending.size, 0);
  game.togglePause();
  assert.equal(pending.size, 1);
  game.newGame();
  assert.equal(pending.size, 0);
});
