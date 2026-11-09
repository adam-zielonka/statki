import { t } from "../i18n.js";
import { coordinate } from "../engine/board.js";

const labels = {
  unknown: "nieodkryte",
  miss: "pudło",
  blocked: "woda przy zatopionym statku",
  hit: "trafiony",
  sunk: "zatopiony",
};

export function createBoard(element, onShot) {
  const corner = document.createElement("span");
  corner.className = "axis";
  corner.setAttribute("aria-hidden", "true");
  element.append(corner);
  for (let col = 1; col <= 10; col++) {
    const axis = document.createElement("span");
    axis.className = "axis";
    axis.textContent = col;
    axis.setAttribute("aria-hidden", "true");
    element.append(axis);
  }
  const buttons = [];
  for (let row = 0; row < 10; row++) {
    const axis = document.createElement("span");
    axis.className = "axis";
    axis.textContent = String.fromCharCode(65 + row);
    axis.setAttribute("aria-hidden", "true");
    element.append(axis);
    for (let col = 0; col < 10; col++) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cell";
      button.dataset.row = row;
      button.dataset.col = col;
      button.dataset.markVariant = (row * 7 + col) % 3;
      const mark = document.createElement("span");
      mark.className = "cell-mark";
      mark.setAttribute("aria-hidden", "true");
      button.append(mark);
      button.addEventListener("click", () => onShot?.(row, col));
      button.addEventListener("keydown", (event) => {
        const step = {
          ArrowUp: -10,
          ArrowDown: 10,
          ArrowLeft: -1,
          ArrowRight: 1,
        }[event.key];
        if (!step) return;
        event.preventDefault();
        let next = row * 10 + col + step;
        while (next >= 0 && next < 100) {
          if (!buttons[next].disabled) {
            buttons[next].focus();
            break;
          }
          next += step;
        }
      });
      buttons.push(button);
      element.append(button);
    }
  }
  return (board, { interactive = false, reveal = false, last } = {}) => {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = board.cells[row][col],
          button = buttons[row * 10 + col];
        const visibleShip = reveal && cell.ship && cell.state === "unknown";
        const isLast = last?.row === row && last?.col === col;
        button.className = `cell ${cell.state}${visibleShip ? " ship" : ""}${isLast ? " last-shot" : ""}`;
        // Join the visible ship outline, as if drawn with a pen on graph paper.
        // An unfinished enemy ship must not reveal its shape through the DOM.
        const outlined = (r, c) => {
          const neighbor = board.cells[r]?.[c];
          return neighbor?.ship && (reveal || neighbor.state === "sunk");
        };
        if (outlined(row, col)) {
          button.classList.add("ship-outline");
          for (const [edge, dr, dc] of [
            ["top", -1, 0], ["right", 0, 1], ["bottom", 1, 0], ["left", 0, -1],
          ]) {
            // At the perimeter, the board's frame already supplies this edge.
            if (board.cells[row + dr]?.[col + dc] && !outlined(row + dr, col + dc))
              button.classList.add(`edge-${edge}`);
          }
        }
        const marked = cell.state === "hit" || cell.state === "sunk";
        const mark = button.firstElementChild;
        mark.className = `cell-mark${marked ? " pen-cross" : ""}`;
        mark.textContent = marked ? "×" : ["miss", "blocked"].includes(cell.state) ? "·" : "";
        button.disabled = !interactive || cell.state !== "unknown";
        button.setAttribute(
          "aria-label",
          `${coordinate(row, col)}: ${t(visibleShip ? "statek" : labels[cell.state])}`,
        );
      }
    }
  };
}
