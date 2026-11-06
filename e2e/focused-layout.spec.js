import { test, expect } from "@playwright/test";

for (const width of [320, 390, 844, 1280]) {
  test(`setup and battle fit at ${width}px in both languages`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("./");
    const fits = async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const board of ["#player-board", "#enemy-board"]) {
        if (await page.locator(board).isVisible()) {
          const box = await page.locator(board).boundingBox();
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
          const cell = await page.locator(`${board} .cell`).first().boundingBox();
          expect(cell.width).toBeGreaterThanOrEqual(24);
        }
      }
      const mast = await page.locator("#player-fleet .mini-ship i").first().boundingBox();
      expect(mast.width).toBeGreaterThan(0);
      expect(mast.height).toBeGreaterThan(0);
      const legend = await page.locator(".legend-ship").boundingBox();
      expect(legend.width).toBeGreaterThan(0);
      expect(legend.height).toBeGreaterThan(0);
    };
    await expect(page.locator("#opponent-setup")).toBeVisible();
    await expect(page.locator(".command-bar, #pause, .log-panel, footer, details, .brand-dot")).toHaveCount(0);
    await expect(page.locator("#rules-dialog, #settings-dialog")).toHaveCount(2);
    await expect(page.locator("#enemy-board")).toBeVisible();
    await expect(page.locator("#enemy-board button:enabled")).toHaveCount(0);
    await page.locator(".opponent[data-id=\"sonar\"]").click();
    await expect(page.locator("#enemy-title")).toHaveText("Flota Leny");
    const before = await page.locator("#player-board .cell").evaluateAll(cells => cells.map(c => c.className));
    await page.locator("#shuffle").click();
    const after = await page.locator("#player-board .cell").evaluateAll(cells => cells.map(c => c.className));
    expect(after).not.toEqual(before);
    await fits();
    await page.locator("#settings-open").click();
    await expect(page.locator(".settings .source-link")).toBeVisible();
    await page.locator("[data-language=\"en\"]").click();
    await fits();
    await expect(page.getByRole("dialog", { name: "Settings", exact: true })).toBeVisible();
    await page.locator(".settings .dialog-close").focus();
    await page.keyboard.press("Tab");
    await expect(page.locator('[data-delay="1200"]')).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(".settings .dialog-close")).toBeFocused();
    // A modal keeps the background inert, including programmatic focus attempts.
    await page.locator("#start").evaluate(button => button.focus());
    await expect(page.locator(".settings .dialog-close")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("#settings-dialog")).toBeHidden();
    await expect(page.locator("#settings-open")).toBeFocused();
    await page.locator("#start").click();
    await expect(page.locator("#opponent-setup")).toBeHidden();
    await expect(page.locator("#enemy-board")).toBeVisible();
    await expect(page.locator("#shuffle")).toBeHidden();
    await fits();
    await page.locator("#rules-open").click();
    await expect(page.getByRole("dialog", { name: "How to play", exact: true })).toBeVisible();
    await expect(page.locator("#player-title")).toHaveClass(/active-turn/);
    await page.locator(".rules .dialog-close").click();
    await expect(page.locator("#rules-dialog")).toBeHidden();
    await expect(page.locator("#rules-open")).toBeFocused();
    await page.locator("#rules-open").click();
    await page.locator("#rules-title").click();
    await expect(page.locator("#rules-dialog")).toBeVisible();
    await page.mouse.click(2, 2);
    await expect(page.locator("#rules-dialog")).toBeHidden();
    await expect(page.locator("#rules-open")).toBeFocused();
    await page.locator("#settings-open").click();
    await page.locator("[data-delay=\"250\"]").click();
    await expect(page.locator("[data-delay=\"250\"]")).toHaveAttribute("aria-pressed", "true");
    const paceColors = await page.locator("[data-delay]").evaluateAll(buttons =>
      buttons.map(button => getComputedStyle(button).backgroundColor));
    expect(paceColors[2]).not.toBe(paceColors[1]);
    await expect(page.locator("#player-board .miss, #player-board .hit, #player-board .sunk")).toHaveCount(0);
    await page.locator("[data-language=\"pl\"]").click();
    await fits();
    await page.keyboard.press("Escape");
    await page.locator("#enemy-board button:enabled").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#enemy-board .miss, #enemy-board .hit, #enemy-board .sunk")).toHaveCount(1);
    await page.locator("#settings-open").click();
    await page.locator("#new-game").click();
    await expect(page.locator(".settings")).not.toHaveAttribute("open", "");
    await expect(page.locator("#start")).toBeFocused();
    await expect(page.locator("#opponent-setup")).toBeVisible();
    await expect(page.locator(".opponent[data-id=\"sonar\"]")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-delay=\"250\"]")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#player-board .miss, #player-board .hit, #player-board .sunk")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
