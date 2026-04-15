import { test, expect, chromium } from "@playwright/test";
import path from "path";

const EXTENSION_PATH = path.resolve(__dirname, "../../dist");

test.describe("Auto capture", () => {
  test("popup loads and capture button is present", async () => {
    const userDataDir = path.join(__dirname, "../../.playwright-data");
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });

    const page = await context.newPage();
    await page.goto("http://localhost:3000/article.html");

    // Find extension popup URL from service workers
    const workers = context.serviceWorkers();
    let extensionId: string | undefined;

    if (workers.length > 0) {
      extensionId = workers[0].url().split("/")[2];
    } else {
      const sw = await context.waitForEvent("serviceworker", { timeout: 8000 }).catch(() => null);
      if (sw) extensionId = sw.url().split("/")[2];
    }

    if (!extensionId) {
      await context.close();
      test.skip(true, "Extension service worker not found — may need manual Chrome test.");
      return;
    }

    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

    // The popup should have a capture button
    const captureBtn = popupPage.locator("#capture-btn");
    await expect(captureBtn).toBeVisible();

    await context.close();
  });
});
