---
description: "STK Phase 2 — Content extraction. Implements the inject script (window.INJECTED guard), auto mode via @mozilla/readability, manual mode DOM walker with hover highlighting, TOC builder, and the reader panel UI."
name: "STK Phase 2: Content Extraction"
agent: "agent"
---

# STK Phase 2: Content Extraction

Implement the content-side logic: the inject script that runs in the page, both extraction modes (auto + manual), hover highlight UI, reader panel, and TOC generation.

Consult [chrome-extension-dom-capture-epub.instructions.md](../.github/instructions/chrome-extension-dom-capture-epub.instructions.md) for all patterns.

## `src/common/messages.ts`

Define all message command constants and TypeScript types for the message protocol:

```typescript
export const CMD = {
  // background → content
  ACTIVATE_AUTO:   "activate-auto",
  ACTIVATE_MANUAL: "activate-manual",
  DEACTIVATE:      "deactivate",
  // content → background / popup
  CONTENT_READY:   "content-ready",
  RETURN_HTML:     "return-html",
  DEACTIVATE_ACK:  "deactivate-ack",
} as const;

export type Message =
  | { command: typeof CMD.ACTIVATE_AUTO }
  | { command: typeof CMD.ACTIVATE_MANUAL }
  | { command: typeof CMD.DEACTIVATE }
  | { command: typeof CMD.RETURN_HTML; html: string; title: string; byline: string | null; url: string };
```

## `src/common/types.ts`

```typescript
export interface CapturedContent {
  html: string;
  title: string;
  byline: string | null;
  url: string;
}
```

## `src/content/inject.ts`

Top-level injection guard — all logic inside the `if (!window.INJECTED)` block:

```typescript
declare global { interface Window { INJECTED?: boolean } }

if (!window.INJECTED) {
  // Import and wire up all handlers
  // chrome.runtime.onMessage listener with switch on msg.command
  // CMD.ACTIVATE_AUTO → autoExtract() then sendMessage RETURN_HTML
  // CMD.ACTIVATE_MANUAL → startManualSelection()
  // CMD.DEACTIVATE → teardown()
  window.INJECTED = true;
}
```

Message listener must call `sendResponse` synchronously (or return `true` if async).

## `src/content/extractor/auto.ts`

Wraps `@mozilla/readability`:

```typescript
import { Readability } from "@mozilla/readability";

export function autoExtract(): CapturedContent {
  const clone = document.cloneNode(true) as Document;
  const reader = new Readability(clone);
  const article = reader.parse();
  return {
    html: article?.content ?? document.body.innerHTML,
    title: article?.title ?? document.title,
    byline: article?.byline ?? null,
    url: location.href,
  };
}
```

## `src/content/extractor/manual.ts`

DOM walker + click-to-select:

```typescript
const ACCEPTED_TAGS = new Set(["DIV", "BODY", "TD", "SECTION", "ARTICLE", "MAIN"]);

export function findContainer(el: Element | null): Element {
  if (!el || el === document.body) return document.body;
  if (ACCEPTED_TAGS.has(el.tagName)) return el;
  return findContainer(el.parentElement);
}

export function startManualSelection(onCapture: (el: Element) => void): () => void {
  // mouseover: add .stk-highlight via findContainer
  // mouseout: remove .stk-highlight
  // click (capture=true): prevent default, call onCapture(findContainer(target)), remove listeners
  // Returns teardown function that removes all listeners
}
```

## `src/content/ui/highlight.ts`

Two simple exports only — the actual listener registration is in `manual.ts`:

```typescript
export const HIGHLIGHT_CLASS = "stk-highlight";
export function addHighlight(el: Element): void   { el.classList.add(HIGHLIGHT_CLASS); }
export function removeHighlight(el: Element): void { el.classList.remove(HIGHLIGHT_CLASS); }
```

## `src/content/ui/toc.ts`

Recursive heading traversal:

```typescript
export function buildTOC(root: Element): HTMLUListElement {
  // Walk firstChild chains, recurse into div/ul/ol/li/article/section
  // For each H1–H5:
  //   assign id = "stk-heading-<counter>"
  //   adjust nesting: appendChild new <ul> if deeper, parentNode if shallower
  //   create <li><a href="#id">textContent</a></li>
  // Return the root <ul>
}
```

## `src/content/ui/panel.ts`

Idempotent reader panel:

```typescript
export function openPanel(content: CapturedContent): void {
  document.getElementById("stk-reader-root")?.remove();  // idempotent
  document.body.insertAdjacentHTML("beforeend", `
    <div id="stk-reader-root">
      <div id="stk-overlay"></div>
      <div id="stk-panel">
        <nav id="stk-toc"></nav>
        <div id="stk-content">${content.html}</div>
        <button id="stk-close" aria-label="Close">✕</button>
      </div>
    </div>
  `);
  document.getElementById("stk-toc")!
    .appendChild(buildTOC(document.getElementById("stk-content")!));
  document.getElementById("stk-close")!
    .addEventListener("click", closePanel);
}

export function closePanel(): void {
  document.getElementById("stk-reader-root")?.remove();
}
```

## `src/styles/inject.css`

Provide styles for:
- `.stk-highlight` — `outline: 2px solid #4a90d9`, `outline-offset: 2px`, light blue background fill, `cursor: crosshair`
- `#stk-reader-root` — fixed full-screen `z-index: 2147483647`
- `#stk-overlay` — semi-transparent backdrop
- `#stk-panel` — centered, scrollable, max-width 720px, white background, padding
- `#stk-toc` — fixed-width left sidebar, collapsible on narrow panels
- `#stk-close` — top-right absolute position button
- `body.stk-loading { cursor: wait !important }`

## Unit Tests to Add (`tests/unit/`)

### `auto-extractor.test.ts`
- Mock `@mozilla/readability` `Readability.parse()` returning a known article object
- Assert `autoExtract()` returns `{ html, title, byline, url }` matching mock output
- Assert fallback to `document.body.innerHTML` and `document.title` when `parse()` returns `null`

### `manual-extractor.test.ts` (jsdom)
- Assert `findContainer` returns the element itself when tag is in ACCEPTED_TAGS
- Assert `findContainer` climbs to parent when tag is not accepted
- Assert `findContainer` returns `document.body` when no accepted ancestor found
- Assert `findContainer` handles `null` input returning `document.body`

### `toc-builder.test.ts` (jsdom)
- DOM fixture with `h1 > section > h2, h3` nesting
- Assert returned `<ul>` has correct nested `<li>` structure
- Assert `id` attributes are assigned to heading elements
- Assert `href` in `<a>` matches assigned `id`

## Acceptance Criteria

- [ ] Auto capture on Wikipedia returns a non-empty `html` with `title` set
- [ ] Manual mode: hovering elements shows blue outline, clicking captures that element
- [ ] Panel opens with content and TOC, close button removes it
- [ ] All unit tests pass (`npm test`)
- [ ] No `window.INJECTED` double-injection: injecting twice does not double-bind listeners
