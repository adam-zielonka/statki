import { createBoard } from "./components/board.js";
import { Game } from "./engine/game.js";
import { OPPONENTS } from "./engine/ai.js";
import { FLEET } from "./engine/board.js";

const game = new Game();
const $ = (id) => document.getElementById(id);
const updateEnemy = createBoard($("enemy-board"), (row, col) =>
  game.fire(row, col),
);
const updatePlayer = createBoard($("player-board"));

for (const opponent of OPPONENTS) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "opponent";
  button.dataset.id = opponent.id;
  button.setAttribute("aria-pressed", "false");
  const icon = opponent.id === "hunter"
    ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"
        stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="6"/>
        <path d="M12 2v6m0 8v6M2 12h6m8 0h6"/></svg>`
    : opponent.icon;
  button.innerHTML = `<span class="opponent-top"><span class="avatar" aria-hidden="true">${icon}</span>
    <span class="opponent-level">${opponent.level}</span><span class="selection" aria-hidden="true">✓</span></span>
    <span class="opponent-name">${opponent.name} <span>${opponent.role}</span></span>
    <span class="opponent-description">${opponent.description}</span>`;
  button.addEventListener("click", () => game.selectOpponent(opponent.id));
  $("opponents").append(button);
}

function fleet(id, board) {
  const counts = [...board.remaining];
  $(id).innerHTML = FLEET.map((length) => {
    const index = counts.indexOf(length),
      alive = index !== -1;
    if (alive) counts.splice(index, 1);
    const label = `${length}-cell ship: ${alive ? "afloat" : "sunk"}`;
    return `<span class="mini-ship ${alive ? "" : "lost"}" aria-label="${label}">
      ${"<i></i>".repeat(length)}</span>`;
  }).join("");
}

function update() {
  const opponent = OPPONENTS.find((item) => item.id === game.strategy);
  const setup = game.phase === "setup",
    over = game.phase === "over";
  const yourTurn = game.turn === "player";
  document.querySelector(".battle").classList.toggle("in-progress", !setup);
  const latest = game.history[0];
  let title, detail, phase;
  if (setup) {
    phase = "GETTING READY";
    title = "Your fleet is ready";
    detail =
      "Shuffle your fleet and start the battle. The first shot is yours.";
  } else if (over) {
    phase = "BATTLE OVER";
    title =
      game.winner === "player"
        ? "Victory! The sea is yours."
        : `${opponent.name} wins this battle`;
    const accuracy = Math.round(
      (game.enemy.hits / (game.shots.player || 1)) * 100,
    );
    detail = `Your shots: ${game.shots.player} · Accuracy: ${accuracy}% · Ready for a rematch? Start a new game.`;
  } else if (game.paused) {
    phase = "BACK IN PORT";
    title = "Battle paused";
    detail = "The fleets can wait. Resume whenever you are ready.";
  } else {
    phase = yourTurn ? "YOUR TURN" : "ENEMY TURN";
    title = yourTurn
      ? "Set your course. Pick a square."
      : `${opponent.name} is choosing a target…`;
    detail = latest
      ? `${latest.actor === "player" ? "Your shot" : opponent.name} · ${latest.coordinate} · ${
        latest.sunk
          ? "Hit and sunk!"
          : latest.hit
            ? latest.actor === "player"
              ? "Hit! Fire again."
              : "Hit! Your opponent fires again."
            : "Miss. The turn passes."
      }`
      : "Pick a square in enemy waters. Good luck, captain!";
  }
  $("phase-label").textContent = phase;
  $("status-title").textContent = title;
  $("status-detail").textContent = detail;
  $("status-dot").className =
    `status-dot ${!setup && !over && !game.paused ? "live" : ""}`;
  $("start").hidden = !setup;
  $("shuffle").hidden = !setup;
  $("pause").hidden = setup || over;
  $("pause").textContent = game.paused ? "Resume battle" : "Pause";
  $("pause").setAttribute("aria-pressed", String(game.paused));
  $("new-game").hidden = setup;
  $("new-game").textContent = over ? "Play again ↗" : "New game";
  $("opponent-hint").textContent = setup
    ? "Find your kind of challenge"
    : "Change rivals in a new game";
  for (const button of $("opponents").children) {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.id === game.strategy),
    );
    button.disabled = !setup;
  }
  $("enemy-title").textContent = `${opponent.name}'s fleet`;
  $("enemy-count").textContent = `Ships: ${game.enemy.remaining.length} / 10`;
  $("player-count").textContent =
    `Ships: ${game.player.remaining.length} / 10`;
  $("enemy-shots").textContent = `Your shots: ${game.shots.player}`;
  $("player-shots").textContent = `Enemy shots: ${game.shots.enemy}`;
  document
    .querySelector(".enemy-panel")
    .classList.toggle("ready", !setup && !over && yourTurn && !game.paused);
  updateEnemy(game.enemy, {
    interactive: !setup && !over && yourTurn && !game.paused,
    reveal: over,
    last: game.history.find((item) => item.actor === "player"),
  });
  updatePlayer(game.player, {
    reveal: true,
    last: game.history.find((item) => item.actor === "enemy"),
  });
  fleet("enemy-fleet", game.enemy);
  fleet("player-fleet", game.player);
  $("history").innerHTML = game.history.length
    ? game.history
      .map(
        (item) => `<li>
    <span class="log-mark ${item.hit ? "hit" : ""}" aria-hidden="true">${item.hit ? "×" : "·"}</span>
    <span>${item.actor === "player" ? "You" : opponent.name}<strong>${item.coordinate}</strong></span>
    <span class="log-result">${item.sunk ? "Sunk" : item.hit ? "Hit" : "Miss"}</span></li>`,
      )
      .join("")
    : "<li class=\"empty-log\">Your battle will be recorded here.<br>Every shot brings a new clue.</li>";
}

$("start").addEventListener("click", () => {
  game.start();
  $("enemy-board").querySelector("button:not(:disabled)")?.focus();
});
$("shuffle").addEventListener("click", () => game.shuffleFleet());
$("pause").addEventListener("click", () => game.togglePause());
$("new-game").addEventListener("click", () => {
  game.newGame();
  $("start").focus();
});
game.listeners.add(update);
update();
