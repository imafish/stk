import { BrowserContext, Page } from "@playwright/test";

/**
 * Opens the extension popup page directly by URL.
 * Requires the extension to be loaded via --load-extension in playwright.config.ts.
 */
export async function openExtensionPopup(context: BrowserContext): Promise<Page> {
  // Get extension ID from the service worker URL
  const workers = context.serviceWorkers();

  // Give the service worker a moment to register if not yet available
  let extensionId: string | undefined;
  if (workers.length > 0) {
    extensionId = workers[0].url().split("/")[2];
  } else {
    // Wait for service worker
    const sw = await context.waitForEvent("serviceworker", { timeout: 5000 }).catch(() => null);
    if (sw) extensionId = sw.url().split("/")[2];
  }

  if (!extensionId) throw new Error("Could not determine extension ID from service workers");

  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  return popupPage;
}
