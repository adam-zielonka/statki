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
const possessive = {
  random: "Felka",
  hunter: "Hugona",
  parity: "Ady",
  sonar: "Leny",
};

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
  document.querySelector(".battle").classList.toggle("in-progress", !setup);
  const latest = game.history[0];
  let title, detail, phase;
  if (setup) {
    phase = t("PRZYGOTOWANIE");
    title = t("Twoja flota czeka");
    detail = t(
      "Wylosuj ustawienie i rozpocznij bitwę. Pierwszy strzał należy do Ciebie.",
    );
  } else if (over) {
    phase = t("KONIEC BITWY");
    title =
      game.winner === "player"
        ? t("Zwycięstwo! Morze jest Twoje.")
        : t("{name} wygrywa tę bitwę", { name: opponent.name });
    const accuracy = Math.round(
      (game.enemy.hits / (game.shots.player || 1)) * 100,
    );
    detail = t(
      "Twoje strzały: {shots} · Celność: {accuracy}% · Rewanż? Rozpocznij nową grę.",
      { shots: game.shots.player, accuracy },
    );
  } else if (game.paused) {
    phase = t("CHWILA W PRZYSTANI");
    title = t("Bitwa wstrzymana");
    detail = t("Floty poczekają. Wznów grę, kiedy będziesz gotów.");
  } else {
    phase = yourTurn ? t("TWÓJ RUCH") : t("RUCH PRZECIWNIKA");
    title = yourTurn
      ? t("Obierz kurs. Wybierz pole.")
      : t("{name} wybiera cel…", { name: opponent.name });
    detail = latest
      ? `${latest.actor === "player" ? t("Twój strzał") : opponent.name} · ${latest.coordinate} · ${
        latest.sunk
          ? t("Trafiony, zatopiony!")
          : latest.hit
            ? latest.actor === "player"
              ? t("Trafiony! Strzelaj dalej.")
              : t("Trafiony! Rywal strzela dalej.")
            : t("Pudło. Zmiana tury.")
      }`
      : t("Kliknij pole na wodach przeciwnika. Powodzenia, kapitanie!");
  }
  $("phase-label").textContent = phase;
  $("status-title").textContent = title;
  $("status-detail").textContent = detail;
  $("status-dot").className =
    `status-dot ${!setup && !over && !game.paused ? "live" : ""}`;
  $("start").hidden = !setup;
  $("shuffle").hidden = !setup;
  $("pause").hidden = setup || over;
  $("pause").textContent = game.paused ? t("Wznów bitwę") : t("Pauza");
  $("pause").setAttribute("aria-pressed", String(game.paused));
  $("new-game").hidden = setup;
  $("new-game").textContent = over ? t("Zagraj ponownie ↗") : t("Nowa gra");
  $("opponent-hint").textContent = setup
    ? t("Wybierz styl przeciwnika")
    : t("Zmiana rywala przy nowej grze");
  for (const button of $("opponents").children) {
    const opponent = OPPONENTS.find((item) => item.id === button.dataset.id);
    const icon =
      opponent.id === "hunter"
        ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"
        stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="6"/>
        <path d="M12 2v6m0 8v6M2 12h6m8 0h6"/></svg>`
        : opponent.icon;
    button.innerHTML = `<span class="opponent-top"><span class="avatar" aria-hidden="true">${icon}</span>
    <span class="opponent-level">${t(opponent.level)}</span><span class="selection" aria-hidden="true">✓</span></span>
    <span class="opponent-name">${opponent.name} <span>${t(opponent.role)}</span></span>
    <span class="opponent-description">${t(opponent.description)}</span>`;

    button.setAttribute(
      "aria-pressed",
      String(button.dataset.id === game.strategy),
    );
    button.disabled = !setup;
  }
  $("enemy-title").textContent = t("Flota {name}", {
    name: language === "pl" ? possessive[game.strategy] : opponent.name,
  });
  $("enemy-count").textContent = t("{count} / 10 statków", {
    count: game.enemy.remaining.length,
  });
  $("player-count").textContent = t("{count} / 10 statków", {
    count: game.player.remaining.length,
  });
  $("enemy-shots").textContent = t("Twoje strzały: {count}", {
    count: game.shots.player,
  });
  $("player-shots").textContent = t("Strzały rywala: {count}", {
    count: game.shots.enemy,
  });
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
    <span>${item.actor === "player" ? t("Ty") : opponent.name}<strong>${item.coordinate}</strong></span>
    <span class="log-result">${item.sunk ? t("Zatopiony") : item.hit ? t("Trafiony") : t("Pudło")}</span></li>`,
      )
      .join("")
    : t(
      "<li class=\"empty-log\">Tu zapiszemy przebieg Twojej bitwy.<br>Każdy strzał to nowa wskazówka.</li>",
    );
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
  $("language").value = language;
  update();
}
$("language").addEventListener("change", (event) =>
  setLanguage(event.target.value),
);
subscribe(translatePage);
translatePage();
