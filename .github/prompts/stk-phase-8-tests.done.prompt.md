---
description: "STK Phase 8 — Tests. Adds comprehensive unit tests (jest + jsdom) for all modules and Playwright integration tests that load the unpacked extension in Chromium."
name: "STK Phase 8: Tests"
agent: "agent"
---

# STK Phase 8: Tests

Add comprehensive tests for all modules. Each phase's prompt specified the unit tests for that phase — this prompt focuses on integration tests and fills any remaining unit test gaps.

Prerequisites: Phases 2–7 complete.

## Unit Tests Summary

Run with `npm test` (jest + ts-jest + jsdom).

Ensure the following test files exist and pass (most were specified in earlier phases):

| File | Covers |
|---|---|
| `tests/unit/auto-extractor.test.ts` | `extractor/auto.ts` — Readability mock, null fallback |
| `tests/unit/manual-extractor.test.ts` | `extractor/manual.ts` — `findContainer` walker |
| `tests/unit/toc-builder.test.ts` | `ui/toc.ts` — nested `<ul>` from headings |
| `tests/unit/metadata.test.ts` | `epub/metadata.ts` — device presets, font defaults |
| `tests/unit/generator.test.ts` | `epub/generator.ts` — epub output, image embed, sanitization |
| `tests/unit/delivery.test.ts` | `delivery.ts` — download, filename sanitization, emailjs call |
| `tests/unit/domain-list.test.ts` | `domain-list.ts` — glob match, URL matching |
| `tests/unit/background.test.ts` | `background.ts` — injection order, context menu, badge |
| `tests/unit/popup.test.ts` | `popup.ts` — state transitions, form pre-fill |

### Additional unit tests to fill gaps

**`tests/unit/messages.test.ts`**
- Assert all `CMD` constants are unique strings
- Assert `CMD` object is frozen / not accidentally mutated

**`tests/unit/panel.test.ts`** (jsdom)
- Assert `openPanel()` inserts `#stk-reader-root` into `document.body`
- Assert calling `openPanel()` twice leaves exactly one `#stk-reader-root` (idempotent)
- Assert close button click removes `#stk-reader-root`
- Assert TOC is populated with `<a>` elements matching `<h1>–<h5>` in the content

**`tests/unit/highlight.test.ts`** (jsdom)
- Assert `addHighlight(el)` adds `stk-highlight` class
- Assert `removeHighlight(el)` removes `stk-highlight` class
- Assert no error when called on an element that already has/lacks the class

---

## Integration Tests

Run with `npm run test:integration` (Playwright, loads unpacked extension from `dist/`).

### Setup: `tests/integration/fixtures/article.html`

Create a static HTML fixture representing a simple article page:

```html
<!DOCTYPE html>
<html lang="en">
<head><title>Test Article</title></head>
<body>
  <header><nav>Site Navigation</nav></header>
  <article id="main-content">
    <h1>Test Article Title</h1>
    <p class="byline">By Test Author</p>
    <p>This is the first paragraph of the test article.</p>
    <h2>Section One</h2>
    <p>Content of section one.</p>
    <img src="https://via.placeholder.com/100" alt="placeholder" />
    <h2>Section Two</h2>
    <p>Content of section two.</p>
  </article>
  <footer>Footer content</footer>
</body>
</html>
```

Serve this fixture via a local static server in `globalSetup`.

### `tests/integration/auto-capture.spec.ts`

```typescript
test("auto capture extracts article content", async ({ context }) => {
  const page = await context.newPage();
  await page.goto("http://localhost:3000/fixtures/article.html");

  // Open extension popup
  const popupPage = await openExtensionPopup(context);
  await popupPage.click("#capture-btn");

  // Wait for metadata form to appear
  await popupPage.waitForSelector("#metadata-form", { state: "visible" });

  // Assert title field is populated
  const titleValue = await popupPage.inputValue("#title-input");
  expect(titleValue).toContain("Test Article");
});
```

### `tests/integration/manual-capture.spec.ts`

```typescript
test("manual capture highlights on hover and captures on click", async ({ context }) => {
  const page = await context.newPage();
  await page.goto("http://localhost:3000/fixtures/article.html");

  const popupPage = await openExtensionPopup(context);
  await popupPage.locator('input[value="manual"]').check();
  await popupPage.click("#capture-btn");

  // Wait for page to enter selection mode
  await page.waitForFunction(() =>
    document.body.style.cursor === "crosshair" ||
    document.querySelector(".stk-highlight") !== null
  );

  // Hover over article
  await page.hover("article#main-content");
  const hasHighlight = await page.$eval("article#main-content", el =>
    el.classList.contains("stk-highlight")
  );
  expect(hasHighlight).toBe(true);

  // Click to capture
  await page.click("article#main-content");

  // Popup should now show metadata form
  await popupPage.waitForSelector("#metadata-form", { state: "visible" });
});
```

### `tests/integration/epub-download.spec.ts`

```typescript
test("download epub produces a file", async ({ context }) => {
  const page = await context.newPage();
  await page.goto("http://localhost:3000/fixtures/article.html");

  const popupPage = await openExtensionPopup(context);
  await popupPage.click("#capture-btn");
  await popupPage.waitForSelector("#metadata-form", { state: "visible" });

  // Start waiting for download before clicking
  const downloadPromise = page.waitForEvent("download");
  await popupPage.click("#download-btn");
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.epub$/);
  const path = await download.path();
  expect(path).toBeTruthy();
  // Optionally assert file size > 0
  const { size } = await fs.stat(path!);
  expect(size).toBeGreaterThan(0);
});
```

### Helper: `tests/integration/helpers.ts`

```typescript
export async function openExtensionPopup(context: BrowserContext): Promise<Page> {
  // Gets all service workers, finds extension ID, opens popup URL
  const workers = context.serviceWorkers();
  const extensionId = workers[0].url().split("/")[2];
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/dist/popup.html`);
  return popupPage;
}
```

### `playwright.config.ts` global setup

Use `tests/integration/global-setup.ts` to:
1. Start a local HTTP server serving `tests/integration/fixtures/` on port 3000
2. Run `npm run build` (or assert `dist/` is up to date)

---

## Acceptance Criteria

- [ ] `npm test` — all unit tests pass, zero failures
- [ ] `npm run test:integration` — all Playwright specs pass with the built extension
- [ ] Auto capture spec: title field populated with "Test Article"
- [ ] Manual capture spec: `.stk-highlight` applied on hover
- [ ] Download spec: `.epub` file downloaded with non-zero size
- [ ] Panel idempotency test: double-injection leaves exactly one panel
