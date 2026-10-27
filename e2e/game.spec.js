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
