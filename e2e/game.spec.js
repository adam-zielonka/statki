import { test, expect } from "@playwright/test";
import { generateShips } from "../src/utils.js";

// Fleet fixture for prepare()'s seed: generate the player's fleet, then the enemy's.
function enemyFleet() {
  const original = Math.random;
  let seed = 117;
  Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  try {
    generateShips();
    return generateShips().flat();
  } finally {
    Math.random = original;
  }
}

// Keep the browser's native clock: replacing it masks Window timer receiver errors.
async function prepare(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    let seed = 117;
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
  });
  await page.goto("./");
  await expect(page.locator("#opponent-setup")).toBeVisible();
  return errors;
}

async function passTurn(page, restart = false) {
  // Restart within the same task to cancel the pending native timer before it fires.
  return page.evaluate(shouldRestart => {
    for (let shot = 0; shot < 21; shot++) {
      if (document.getElementById("player-status").dataset.state === "under-attack") {
        const labels = [...document.querySelectorAll(".board-status")].map(label => ({
          text: label.textContent, hidden: label.hidden,
        }));
        if (shouldRestart) {
          document.getElementById("settings-open").click();
          document.getElementById("new-game").click();
          document.getElementById("start").click();
        }
        return labels;
      }
      document.querySelector("#enemy-board button:enabled").click();
    }
    throw new Error("Could not pass the turn to the opponent");
  }, restart);
}

for (const id of ["random", "hunter", "parity", "sonar"]) {
  test(`${id} fires with native browser timers`, async ({ page }) => {
    const errors = await prepare(page);
    await expect(page.locator(".board-status:visible")).toHaveCount(0);
    await page.locator(`.opponent[data-id="${id}"]`).click();
    await page.locator("#start").click();
    await expect(page.locator("#enemy-status")).toHaveText("Atakujesz");
    await expect(page.locator("#player-status")).toBeHidden();
    const labels = await passTurn(page);
    expect(labels).toEqual([{ text: "", hidden: true }, { text: "Jesteś atakowany", hidden: false }]);
    await expect(page.locator("#player-board .last-shot")).toHaveCount(1);
    // Exercise native clearTimeout while a bot may have another shot pending.
    await page.locator("#settings-open").click();
    await page.locator("#new-game").click();
    await expect(page.locator("#opponent-setup")).toBeVisible();
    await expect(page.locator(".board-status:visible")).toHaveCount(0);
    await expect(page.locator("#player-board .miss, #player-board .hit, #player-board .sunk")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("opening rules and settings keeps the opponent moving", async ({ page }) => {
  const errors = await prepare(page);
  await page.locator("#start").click();
  await passTurn(page);
  await page.locator("#rules-open").click();
  await expect(page.locator("#rules-dialog")).toBeVisible();
  await expect(page.locator("#player-board .last-shot")).toHaveCount(1);
  await expect(page.locator("#enemy-status")).toHaveAttribute("data-state", "attacking", { timeout: 15000 });
  await page.keyboard.press("Escape");
  await page.locator("#settings-open").click();
  await expect(page.locator("#settings-dialog")).toBeVisible();
  await expect(page.locator("#enemy-board button:enabled").first()).toBeEnabled();
  expect(errors).toEqual([]);
});

test("a new game cancels a native timer before the first enemy shot", async ({ page }) => {
  const errors = await prepare(page);
  await page.locator("#start").click();
  await passTurn(page, true);
  await page.waitForTimeout(900);
  await expect(page.locator("#enemy-status")).toHaveText("Atakujesz");
  await expect(page.locator("#player-board .miss, #player-board .hit, #player-board .sunk")).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const outcome of ["win", "loss"]) {
  test(`${outcome} replaces the logo with a notebook result and resets on a rematch`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = await prepare(page);
    const boardPositions = () => page.locator(".sea-grid").evaluateAll(boards =>
      boards.map(board => board.getBoundingClientRect().top + scrollY));
    const initialPositions = await boardPositions();
    await expect(page.locator(".battle-effects")).toHaveCount(0);
    await page.locator('.opponent[data-id="sonar"]').click();
    await page.locator("#settings-open").click();
    await page.locator('[data-delay="250"]').click();
    await page.locator(".settings .dialog-close").click();
    await page.locator("#start").click();
    const targets = enemyFleet();
    for (let shot = 0; shot < 100; shot++) {
      await page.waitForFunction(() => document.querySelector('#enemy-board button:enabled, #result-card.result-note'));
      if (await page.locator("#result-card.result-note").count()) break;
      await expect(page.locator("#enemy-status")).toHaveText("Atakujesz");
      const target = outcome === "win"
        ? page.locator("#enemy-board").getByRole("button", { name: `${targets[shot]}: nieodkryte`, exact: true })
        : page.locator("#enemy-board button:enabled").first();
      await target.click();
      if (shot === 0) await expect(page.locator(".battle-effects")).toHaveCount(0);
    }
    await expect(page.locator(".result-note #title")).toHaveText(outcome === "win" ? "Wygrałeś" : "Przegrałeś");
    await expect(page.locator("#result-card")).toHaveAttribute("data-result", outcome);
    expect(await boardPositions()).toEqual(initialPositions);
    await expect(page.locator(".board-status:visible")).toHaveCount(0);
    await expect(page.locator(".winner-mark")).toHaveCount(0);
    const winner = outcome === "win" ? "player" : "enemy";
    await expect(page.locator(".battle-effects")).toHaveCount(2);
    for (const actor of ["player", "enemy"]) {
      const grid = page.locator(`#${actor}-board`);
      const lost = await page.locator(`#${actor}-fleet .lost`).count();
      const alive = await page.locator(`#${actor}-fleet .mini-ship:not(.lost)`).count();
      await expect(grid.locator(".ship-fire")).toHaveCount(lost);
      await expect(grid.locator(".fire-plume")).toHaveCount(await grid.locator(".sunk").count());
      await expect(grid.locator(".ship-firework")).toHaveCount(actor === winner ? alive : 0);
      await expect(grid.locator(".battle-effects")).toHaveAttribute("aria-hidden", "true");
    }
    const flame = await page.locator(".drawn-flame").first().elementHandle();
    expect(await flame.evaluate(node => node.getAnimations().some(a => a.playState === "running"))).toBe(true);
    expect(await page.locator(".firework-burst").first().evaluate(node =>
      node.getAnimations().some(a => a.playState === "running"))).toBe(true);
    const replayBox = await page.locator("#replay").boundingBox();
    const cardBox = await page.locator("#result-card").boundingBox();
    await expect(page.locator("#result-card #replay")).toBeVisible();
    expect(replayBox.x).toBeGreaterThan(cardBox.x);
    expect(replayBox.x + replayBox.width).toBeLessThan(cardBox.x + cardBox.width);
    expect(replayBox.y + replayBox.height).toBeLessThan(cardBox.y + cardBox.height);
    const frameEdges = await page.locator(".ship-outline").evaluateAll(cells => {
      const coverage = new Set(), duplicates = [];
      for (const cell of cells) {
        const boundaries = [
          ["top", cell.dataset.row === "0"], ["right", cell.dataset.col === "9"],
          ["bottom", cell.dataset.row === "9"], ["left", cell.dataset.col === "0"],
        ];
        for (const [edge, touchesFrame] of boundaries) {
          if (!touchesFrame) continue;
          coverage.add(edge);
          if (cell.classList.contains(`edge-${edge}`)) duplicates.push(`${edge}: ${cell.getAttribute("aria-label")}`);
        }
      }
      return { coverage: [...coverage].sort(), duplicates };
    });
    expect(frameEdges.coverage).toEqual(["bottom", "left", "right", "top"]);
    expect(frameEdges.duplicates).toEqual([]);
    await expect(page.locator(".ship-outline.edge-left:not([data-col='0'])").first()).toBeVisible();
    const mask = await page.locator("#result-card").evaluate(card => getComputedStyle(card, "::before").maskImage);
    expect(mask).toContain("notebook-scrap.svg");
    expect(await page.locator(".masthead button:visible").evaluateAll(nodes => nodes.map(node => node.id)))
      .toEqual(["rules-open", "replay", "settings-open"]);
    await page.locator("#settings-open").click();
    await page.locator('[data-language="en"]').click();
    await expect(page.locator(".result-note #title")).toHaveText(outcome === "win" ? "You won" : "You lost");
    expect(await flame.evaluate(node => node.isConnected)).toBe(true);
    expect(await boardPositions()).toEqual(initialPositions);
    await expect(page.locator("#player-title")).toHaveText("Me");
    await page.locator('[data-language="pl"]').click();
    await page.keyboard.press("Escape");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await page.locator(".battle-effects").evaluateAll(layers =>
      layers.every(layer => layer.getAnimations({ subtree: true }).length === 0))).toBe(true);
    expect(await page.locator(".firework-burst").first().evaluate(node => getComputedStyle(node).opacity)).toBe("1");
    expect(await page.locator(".firework-burst").evaluateAll(bursts => bursts.every(burst => {
      const frame = burst.closest("svg").getBoundingClientRect(), box = burst.getBoundingClientRect();
      return box.left >= frame.left && box.right <= frame.right && box.top >= frame.top && box.bottom <= frame.bottom;
    }))).toBe(true);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator("#replay").click();
    await expect(page.locator("#title")).toHaveText("statki");
    await expect(page.locator("#result-card")).not.toHaveClass(/result-note/);
    await expect(page.locator("#opponent-setup")).toBeVisible();
    await expect(page.locator(".battle-effects")).toHaveCount(0);
    await expect(page.locator(".board-status:visible")).toHaveCount(0);
    await page.locator("#start").click();
    await expect(page.locator("#enemy-status")).toHaveText("Atakujesz");
    expect(errors).toEqual([]);
  });
}

for (const mobile of [false, true]) {
  test(`hit and sunk stay distinct on both boards (${mobile ? "touch" : "keyboard"})`, async ({ browser }) => {
    test.setTimeout(120000);
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 1000 },
      isMobile: mobile,
      hasTouch: mobile,
      locale: "pl-PL",
    });
    const page = await context.newPage();
    const errors = await prepare(page);
    await page.locator('.opponent[data-id="random"]').click();
    await page.evaluate(() => {
      const boards = [...document.querySelectorAll(".sea-grid")];
      let previous = boards.map(board => [...board.querySelectorAll(".cell")].map(cell => cell.classList.contains("hit")));
      window.readabilityTransitions = [false, false];
      new MutationObserver(() => {
        boards.forEach((board, index) => {
          const cells = [...board.querySelectorAll(".cell")];
          cells.forEach((cell, square) => {
            if (previous[index][square] && cell.classList.contains("sunk") && cell.textContent === "×") {
              window.readabilityTransitions[index] = true;
            }
          });
          previous[index] = cells.map(cell => cell.classList.contains("hit"));
        });
      }).observe(document.querySelector(".boards"), { attributes: true, childList: true, subtree: true });
    });
    await page.locator("#start").click();
    const snapshot = () => page.locator(".sea-grid").evaluateAll(boards => boards.map(board =>
      [...board.querySelectorAll(".cell")].map(cell => ({
        hit: cell.classList.contains("hit"),
        sunk: cell.classList.contains("sunk"),
        mark: cell.textContent,
      })),
    ));
    for (let shot = 0; shot < 64; shot++) {
      const target = page.locator("#enemy-board button:enabled").first();
      if (mobile) await target.tap();
      else {
        await target.focus();
        await page.keyboard.press(shot % 2 ? "Space" : "Enter");
      }
      await page.waitForFunction(() => document.querySelector("#enemy-status[data-state=attacking], #result-card.result-note"));
      const current = await snapshot();
      current.forEach(board => board.forEach(cell => {
        if (cell.sunk) expect(cell.mark).toBe("×");
        if (cell.hit) expect(cell.mark).toBe("×");
      }));
      await expect(page.locator("#enemy-board .ship")).toHaveCount(0);
      // Paper outlines may reveal only fully sunk enemy ships, never their
      // hidden extensions after a partial hit.
      const hiddenOutlines = page.locator("#enemy-board .unknown.ship-outline, #enemy-board .hit.ship-outline");
      await expect(hiddenOutlines).toHaveCount(0);
      const sunkCount = await page.locator("#enemy-board .sunk").count();
      await expect(page.locator("#enemy-board .sunk.ship-outline")).toHaveCount(sunkCount);
      await expect(page.locator("#enemy-board .unknown").filter({ hasText: /[×·]/ })).toHaveCount(0);
      if (shot === 14) {
        const squares = await page.locator(".sea-grid .cell").evaluateAll(cells =>
          cells.map(cell => {
            const rect = cell.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          }));
        // Pen marks must not stretch rows or leave gaps in the paper grid.
        squares.forEach(({ width, height }) => expect(Math.abs(width - height)).toBeLessThan(1));
        for (const board of ["player", "enemy"]) {
          await expect(page.locator(`#${board}-board .hit`).first()).toHaveText("×");
          await expect(page.locator(`#${board}-board .sunk`).first()).toHaveText("×");
          await expect(page.locator(`#${board}-board .miss`).first()).toHaveText("·");
          const ink = await page.locator(`#${board}-board .sunk`).first().evaluate(cell => ({
            fill: getComputedStyle(cell).backgroundImage,
            cross: getComputedStyle(cell.querySelector(".pen-cross"), "::before").maskImage,
          }));
          expect(ink.fill).toBe("none");
          expect(ink.cross).not.toBe("none");
        }
      }
      if (shot >= 14 && await page.evaluate(() => window.readabilityTransitions.every(Boolean))) break;
    }
    expect(await page.evaluate(() => window.readabilityTransitions)).toEqual([true, true]);
    await page.locator("#settings-open").click();
    const cells = await snapshot();
    await page.locator(".settings").getByRole("button", { name: "English", exact: true }).click();
    expect(await snapshot()).toEqual(cells);
    await expect(page.locator(".legend-hit")).toHaveText("×");
    await expect(page.locator(".legend-sunk")).toHaveText("×");
    await expect(page.locator(".legend-sunk").locator("..")).toHaveText("×Sunk");
    await page.locator(".settings").getByRole("button", { name: "Polski", exact: true }).click();
    await expect(page.locator(".legend-sunk").locator("..")).toHaveText("×Zatopiony");
    expect(await snapshot()).toEqual(cells);
    expect(errors).toEqual([]);
    await context.close();
  });
}
