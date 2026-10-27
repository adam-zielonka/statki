import { chooseShot } from "./ai.js";
import { Board, coordinate } from "./board.js";

export class Game {
  constructor({
    delay = 650,
    schedule = (callback, ms) => globalThis.setTimeout(callback, ms),
    cancel = (timer) => globalThis.clearTimeout(timer),
  } = {}) {
    this.delay = delay;
    this.schedule = schedule;
    this.cancel = cancel;
    this.listeners = new Set();
    this.generation = 0;
    this.timer = null;
    this.strategy = "hunter";
    this.newGame();
  }

  emit() {
    this.listeners.forEach((listener) => listener());
  }

  clearPending() {
    this.generation++;
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
  }

  newGame() {
    this.clearPending();
    this.player = new Board();
    this.enemy = new Board();
    this.phase = "setup";
    this.turn = "player";
    this.paused = false;
    this.winner = null;
    this.history = [];
    this.shots = { player: 0, enemy: 0 };
    this.emit();
  }

  shuffleFleet() {
    if (this.phase !== "setup") return;
    this.player = new Board();
    this.emit();
  }

  selectOpponent(strategy) {
    if (this.phase !== "setup") return;
    this.strategy = strategy;
    this.emit();
  }

  start() {
    if (this.phase !== "setup") return;
    this.phase = "playing";
    this.emit();
  }

  togglePause() {
    if (this.phase !== "playing") return;
    this.paused = !this.paused;
    this.clearPending();
    this.emit();
    this.queueEnemy();
  }

  fire(row, col, actor = "player") {
    if (this.phase !== "playing" || this.paused || this.turn !== actor)
      return null;
    const board = actor === "player" ? this.enemy : this.player;
    const result = board.shoot(row, col);
    if (!result) return null;
    this.shots[actor]++;
    this.history.unshift({
      ...result,
      actor,
      coordinate: coordinate(row, col),
    });
    this.history = this.history.slice(0, 8);
    if (result.won) {
      this.phase = "over";
      this.winner = actor;
      this.clearPending();
    } else if (!result.hit) this.turn = actor === "player" ? "enemy" : "player";
    this.emit();
    this.queueEnemy();
    return result;
  }

  queueEnemy() {
    if (
      this.phase !== "playing" ||
      this.paused ||
      this.turn !== "enemy" ||
      this.timer !== null
    )
      return;
    const generation = this.generation;
    this.timer = this.schedule(() => {
      if (generation !== this.generation) return;
      this.timer = null;
      const target = chooseShot(this.player.knowledge(), this.strategy);
      if (target) this.fire(...target, "enemy");
    }, this.delay);
  }
}
