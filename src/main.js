import { t, language, setLanguage, subscribe } from "./i18n.js";
import { staticText } from "./static-translations.js";
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
  button.addEventListener("click", () => game.selectOpponent(opponent.id));
  $("opponents").append(button);
}

function fleet(id, board) {
  const counts = [...board.remaining];
  $(id).innerHTML = FLEET.map((length) => {
    const index = counts.indexOf(length),
      alive = index !== -1;
    if (alive) counts.splice(index, 1);
    const label = t("{length} {size}: {state}", {
      length,
      size: length === 1 ? t("maszt") : t("maszty"),
      state: t(alive ? t("pływa") : t("zatopiony")),
    });
    return `<span class="mini-ship ${alive ? "" : "lost"}" aria-label="${label}">
      ${"<i></i>".repeat(length)}</span>`;
  }).join("");
}

function update() {
  const opponent = OPPONENTS.find((item) => item.id === game.strategy);
  const setup = game.phase === "setup",
    over = game.phase === "over";
  const yourTurn = game.turn === "player";
  const activeTurn = game.phase === "playing";
  const turnState = yourTurn ? "attacking" : "under-attack";
  const turnLabel = t(yourTurn ? "Atakujesz" : "Jesteś atakowany");
  for (const actor of ["player", "enemy"]) {
    const status = $(`${actor}-status`);
    const target = activeTurn && actor === (yourTurn ? "enemy" : "player");
    status.hidden = !target;
    status.dataset.state = target ? turnState : "idle";
    status.className = `board-status${target ? " turn-mark" : ""}`;
    status.textContent = target ? turnLabel : "";
  }
  const title = $("title");
  const resultCard = $("result-card");
  resultCard.classList.toggle("result-note", over);
  resultCard.classList.toggle("notebook-scrap", over);
  resultCard.dataset.result = over ? game.winner === "player" ? "win" : "loss" : "";
  title.textContent = t(over ? game.winner === "player" ? "Wygrałeś" : "Przegrałeś" : "statki");
  const replay = $("replay");
  replay.hidden = !over;
  const latest = game.history[0];
  const turn = t(yourTurn ? "Twój ruch." : "Ruch przeciwnika.");
  const result = latest
    ? `${latest.coordinate}: ${t(latest.sunk ? "Zatopiony" : latest.hit ? "Trafiony" : "Pudło")}. `
    : "";
  const announcement = setup
    ? t("Wybierz rywala i ustaw flotę. Zaczynasz Ty.")
    : over
      ? game.winner === "player"
        ? t("Zwycięstwo! Morze jest Twoje.")
        : t("{name} wygrywa tę bitwę", { name: opponent.name })
      : result + turn;
  if ($("game-announcement").textContent !== announcement) {
    $("game-announcement").textContent = announcement;
  }
  $("start").hidden = !setup;
  $("shuffle").hidden = !setup;
  $("opponent-setup").hidden = !setup;
  $("selected-opponent-description").textContent = t(opponent.description);
  for (const button of document.querySelectorAll("[data-delay]")) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.delay) === game.delay));
  }
  for (const button of $("opponents").children) {
    const opponent = OPPONENTS.find((item) => item.id === button.dataset.id);
    button.innerHTML = `<svg class="selection" viewBox="0 0 24 28" aria-hidden="true">
      <path d="M12 17v9" fill="none" stroke="#596b7d" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M8 5h8l-1 7 3 4.5c-3 2-9 2-12 0L9 12Z" fill="#b34451" stroke="#873943" stroke-width=".8"/>
      <ellipse cx="12" cy="5" rx="5.5" ry="2.5" fill="#d96872" stroke="#873943" stroke-width=".8"/>
      <path d="m9.5 8 .4 3" fill="none" stroke="#fff7" stroke-width="1.3" stroke-linecap="round"/>
    </svg>
    <span class="opponent-name">${opponent.name} <span>${t(opponent.role)}</span></span>
    <span class="opponent-description">${t(opponent.description)}</span>`;

    button.setAttribute(
      "aria-pressed",
      String(button.dataset.id === game.strategy),
    );
    button.disabled = !setup;
  }
  $("enemy-title").textContent = opponent.name;
  $("enemy-title").dataset.opponent = opponent.id;
  updateEnemy(game.enemy, {
    finished: over,
    winner: game.winner === "enemy",
    interactive: activeTurn && yourTurn,
    reveal: over,
    last: game.history.find((item) => item.actor === "player"),
  });
  updatePlayer(game.player, {
    finished: over,
    winner: game.winner === "player",
    reveal: true,
    last: game.history.find((item) => item.actor === "enemy"),
  });
  fleet("enemy-fleet", game.enemy);
  fleet("player-fleet", game.player);
}

for (const name of ["rules", "settings"]) {
  const dialog = $(`${name}-dialog`);
  $(`${name}-open`).addEventListener("click", () => dialog.showModal());
  dialog.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());
  const outside = (event) => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  let pressedBackdrop = false;
  dialog.addEventListener("pointerdown", (event) => {
    pressedBackdrop = event.target === dialog && outside(event);
  });
  dialog.addEventListener("click", (event) => {
    if (pressedBackdrop && event.target === dialog && outside(event)) dialog.close();
    pressedBackdrop = false;
  });
}

$("start").addEventListener("click", () => {
  game.start();
  $("enemy-board").querySelector("button:not(:disabled)")?.focus();
});
for (const button of document.querySelectorAll("[data-delay]")) {
  button.addEventListener("click", () => game.setDelay(Number(button.dataset.delay)));
}
$("shuffle").addEventListener("click", () => game.shuffleFleet());
for (const button of [$("new-game"), $("replay")]) {
  button.addEventListener("click", () => {
    game.newGame();
    $("settings-dialog").close();
    $("start").focus();
  });
}
game.listeners.add(update);
update();

function translatePage() {
  for (const [selector, source] of Object.entries(staticText)) {
    document.querySelector(selector).innerHTML = t(source);
  }
  for (const element of document.querySelectorAll("[aria-label]")) {
    element.dataset.labelSource ??= element.getAttribute("aria-label");
    if (
      !element.classList.contains("cell") &&
      !element.classList.contains("mini-ship")
    )
      element.setAttribute("aria-label", t(element.dataset.labelSource));
  }
  for (const button of document.querySelectorAll("[data-language]")) {
    button.setAttribute("aria-pressed", String(button.dataset.language === language));
  }
  update();
}
for (const button of document.querySelectorAll("[data-language]")) {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
}
subscribe(translatePage);
translatePage();
