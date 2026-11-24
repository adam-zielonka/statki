import "./battle-effects.css";

function flame(row, col) {
  const delay = ((row * 7 + col * 3) % 13) / 10;
  return `<g class="fire-plume" transform="translate(${col * 100 + 50} ${row * 100 + 83})"
    style="--flame-delay: -${delay}s">
    <g class="drawn-flame">
      <path class="flame-outer" d="M-25 1C-43-18-24-39-23-58C-15-49-14-39-7-43
        C-10-62-3-76 1-89C21-72 14-52 25-57C23-42 40-25 31-8C24 10-7 15-25 1Z"/>
      <path class="flame-inner" d="M-12 3C-22-9-8-19-10-34C-3-29 1-21 1-15
        C9-25 11-36 10-45C29-24 24 2 8 7Q-3 11-12 3Z"/>
      <path class="flame-pencil" d="M-25-7Q-33-21-23-36M5-73Q15-60 11-49M16-10L12-4"/>
    </g>
  </g>`;
}

function fire(ship, index) {
  const x = ship.reduce((sum, [, col]) => sum + col * 100 + 50, 0) / ship.length;
  const y = ship.reduce((sum, [row]) => sum + row * 100 + 25, 0) / ship.length;
  return `<g class="ship-fire" style="--effect-delay: -${(index % 7) * 0.4}s">
    <g transform="translate(${x} ${y})">
      <g class="drawn-smoke">
        <path d="M-8-6C-26-19 16-26 2-43C-12-58 13-65 6-80"/>
        <path d="M10 1C29-12 2-25 17-38"/>
      </g>
    </g>
    ${ship.map(([row, col]) => flame(row, col)).join("")}
  </g>`;
}

function firework(ship, index) {
  const x = ship.reduce((sum, [, col]) => sum + col * 100 + 50, 0) / ship.length;
  const y = ship.reduce((sum, [row]) => sum + row * 100 + 50, 0) / ship.length;
  // Leave room for the whole burst, including ships touching the board's edges.
  const burstX = Math.max(76, Math.min(924, x)) - x;
  const burstY = Math.max(76, Math.min(924, y - 47)) - y;
  const rays = [
    "M-2-18L0-44M16-14L34-35M20 1L47-2M15 16L33 34",
    "M0 22L-3 47M-16 16L-35 35M-21 0L-47-3M-16-15L-34-37",
    "M8-12L17-29M13 7L31 15M-7 14L-18 31M-14-7L-31-18",
  ];
  return `<g class="ship-firework" transform="translate(${x} ${y})"
    data-color="${index % 4}" style="--effect-delay: -${(index % 9) * 0.37}s">
    <path class="firework-trail" pathLength="100" d="M-9 31Q16 7 ${burstX} ${burstY}"/>
    <g transform="translate(${burstX} ${burstY})">
      <g class="firework-burst">
        ${rays.map((d, ray) => `<path class="burst-ray ray-${ray}" d="${d}"/>`).join("")}
        <path class="burst-spark" d="M-3-7L0-12L3-6L10-2L4 2L2 10L-3 4L-10 1Z"/>
        <path class="burst-confetti" d="M-12-53L-14-57M49 19L54 20M13 52L15 57M-49 16L-53 19"/>
      </g>
    </g>
  </g>`;
}

export function createBattleEffects(element) {
  let layer = null, renderedBoard = null, renderedWinner = false;
  return (board, { finished, winner }) => {
    if (!finished) {
      layer?.remove();
      layer = null;
      renderedBoard = null;
      return;
    }
    // Keep the same SVG nodes on language/pace updates so animations continue.
    if (renderedBoard === board && renderedWinner === winner) return;
    layer?.remove();
    layer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    layer.setAttribute("class", "battle-effects");
    layer.setAttribute("viewBox", "0 0 1000 1000");
    layer.setAttribute("aria-hidden", "true");
    layer.setAttribute("focusable", "false");
    layer.innerHTML = board.ships.map((ship, index) => {
      if (board.isSunk(ship)) return fire(ship, index);
      return winner ? firework(ship, index) : "";
    }).join("");
    element.append(layer);
    renderedBoard = board;
    renderedWinner = winner;
  };
}
