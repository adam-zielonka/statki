import { test, expect } from "@playwright/test";

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
  await expect(page.locator("#status-title")).toHaveText("Twoja flota czeka");
  return errors;
}

async function passTurn(page, pause = false) {
  // Clicking in one task lets the pause test cancel the timer before it can fire.
  await page.evaluate(shouldPause => {
    for (let shot = 0; shot < 21; shot++) {
      if (document.getElementById("phase-label").textContent === "RUCH PRZECIWNIKA") {
        if (shouldPause) document.getElementById("pause").click();
        return;
      }
      document.querySelector("#enemy-board button:enabled").click();
    }
    throw new Error("Could not pass the turn to the opponent");
  }, pause);
}

for (const id of ["random", "hunter", "parity", "sonar"]) {
  test(`${id} fires with native browser timers`, async ({ page }) => {
    const errors = await prepare(page);
    await page.locator(`.opponent[data-id="${id}"]`).click();
    await page.locator("#start").click();
    await passTurn(page);
    await expect(page.locator("#player-shots")).not.toHaveText("Strzały rywala: 0");
    await expect(page.locator("#player-board .last-shot")).toHaveCount(1);
    // Exercise native clearTimeout while a bot may have another shot pending.
    await page.locator("#new-game").click();
    await expect(page.locator("#status-title")).toHaveText("Twoja flota czeka");
    await expect(page.locator("#player-shots")).toHaveText("Strzały rywala: 0");
    expect(errors).toEqual([]);
  });
}

test("pause cancels native timers and resume restarts the opponent", async ({ page }) => {
  const errors = await prepare(page);
  await page.locator("#start").click();
  await passTurn(page, true);
  await expect(page.locator("#status-title")).toHaveText("Bitwa wstrzymana");
  await page.waitForTimeout(900);
  await expect(page.locator("#player-shots")).toHaveText("Strzały rywala: 0");
  await page.locator("#pause").click();
  await expect(page.locator("#player-shots")).not.toHaveText("Strzały rywala: 0");
  expect(errors).toEqual([]);
});

test("a new game cancels a native timer before the first enemy shot", async ({ page }) => {
  const errors = await prepare(page);
  await page.locator("#start").click();
  await passTurn(page, true);
  await page.evaluate(() => {
    document.getElementById("pause").click();
    document.getElementById("new-game").click();
    document.getElementById("start").click();
  });
  await page.waitForTimeout(900);
  await expect(page.locator("#phase-label")).toHaveText("TWÓJ RUCH");
  await expect(page.locator("#player-shots")).toHaveText("Strzały rywala: 0");
  expect(errors).toEqual([]);
});

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
            if (previous[index][square] && cell.classList.contains("sunk") && cell.textContent === "■") {
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
      await page.waitForFunction(() => ["TWÓJ RUCH", "KONIEC BITWY"].includes(document.getElementById("phase-label").textContent));
      const current = await snapshot();
      current.forEach(board => board.forEach(cell => {
        if (cell.sunk) expect(cell.mark).toBe("■");
        if (cell.hit) expect(cell.mark).toBe("×");
      }));
      await expect(page.locator("#enemy-board .ship")).toHaveCount(0);
      await expect(page.locator("#enemy-board .unknown").filter({ hasText: /[×■·]/ })).toHaveCount(0);
      if (shot === 14) {
        for (const board of ["player", "enemy"]) {
          await expect(page.locator(`#${board}-board .hit`).first()).toHaveText("×");
          await expect(page.locator(`#${board}-board .sunk`).first()).toHaveText("■");
          await expect(page.locator(`#${board}-board .miss`).first()).toHaveText("·");
        }
      }
      if (shot >= 14 && await page.evaluate(() => window.readabilityTransitions.every(Boolean))) break;
    }
    expect(await page.evaluate(() => window.readabilityTransitions)).toEqual([true, true]);
    await page.locator("#pause").click();
    const cells = await snapshot();
    await page.locator("footer").getByRole("button", { name: "English", exact: true }).click();
    expect(await snapshot()).toEqual(cells);
    await expect(page.locator(".legend-hit")).toHaveText("×");
    await expect(page.locator(".legend-sunk")).toHaveText("■");
    await expect(page.locator(".legend-sunk").locator("..")).toHaveText("■Sunk");
    await page.locator("footer").getByRole("button", { name: "Polski", exact: true }).click();
    await expect(page.locator(".legend-sunk").locator("..")).toHaveText("■Zatopiony");
    expect(await snapshot()).toEqual(cells);
    expect(errors).toEqual([]);
    await context.close();
  });
}
