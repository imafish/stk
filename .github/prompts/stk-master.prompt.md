---
description: "STK extension — master phase list. Shows all implementation phases, their dependencies, and links to individual phase prompts. Run this to get an overview before starting any phase."
name: "STK: Master Plan"
agent: "agent"
---

# STK – Send-to-Kindle Chrome Extension: Master Plan

## Stack Decisions

| Concern | Choice |
|---|---|
| Language | TypeScript |
| UI | Plain HTML + CSS (no framework) |
| Delivery | `.epub` download + EmailJS (no backend) |
| Manifest | V3, service worker background |
| ePub generation | Runs in popup context (Blob/URL access needed) |
| Content extraction (auto) | `@mozilla/readability` |

## Third-party Libraries

| Library | Purpose |
|---|---|
| `@mozilla/readability` | Auto mode — article extraction (same as Firefox Reader View) |
| `epub-gen-memory` | Browser-compatible HTML → epub in memory |
| `dompurify` | Sanitize captured HTML before epub generation |
| `emailjs-com` | Send epub to Kindle email address, no server |
| `typescript` + `webpack 5` + `ts-loader` + `copy-webpack-plugin` | Build toolchain |
| `jest` + `jest-environment-jsdom` + `ts-jest` | Unit tests |
| `playwright` | Integration tests (loads unpacked extension in Chromium) |

---

## Phase Overview

| # | Phase | Prompt | Depends on | Parallel with |
|---|-------|--------|-----------|---------------|
| 1 | Project Scaffold ✅ | [/stk-phase-1-scaffold](stk-phase-1-scaffold.done.prompt.md) | — | — |
| 2 | Content Extraction ✅ | [/stk-phase-2-content-extraction](stk-phase-2-content-extraction.done.prompt.md) | Phase 1 | Phase 3 |
| 3 | ePub Generation ✅ | [/stk-phase-3-epub-generation](stk-phase-3-epub-generation.done.prompt.md) | Phase 1 | Phase 2 |
| 4 | Popup UI ✅ | [/stk-phase-4-popup-ui](stk-phase-4-popup-ui.done.prompt.md) | Phase 2, 3 | Phase 5, 6 |
| 5 | Delivery ✅ | [/stk-phase-5-delivery](stk-phase-5-delivery.done.prompt.md) | Phase 3 | Phase 4, 6 |
| 6 | Options Page ✅ | [/stk-phase-6-options-page](stk-phase-6-options-page.done.prompt.md) | Phase 1 | Phase 4, 5 |
| 7 | Background Service Worker ✅ | [/stk-phase-7-background](stk-phase-7-background.done.prompt.md) | Phase 2 | — |
| 8 | Tests ✅ | [/stk-phase-8-tests](stk-phase-8-tests.done.prompt.md) | Phases 2–7 | — |
| 9 | Packaging + README ✅ | [/stk-phase-9-packaging](stk-phase-9-packaging.done.prompt.md) | Phase 8 | — |

---

## Directory Structure

```
src/
  background/
    background.ts       — on-demand injection, context menu, badge state
    domain-list.ts      — default domain→selector map, URL matching, storage
  content/
    inject.ts           — window.INJECTED guard, message listener
    extractor/
      auto.ts           — @mozilla/readability wrapper
      manual.ts         — hover/click DOM walker
    ui/
      highlight.ts      — CSS class toggle for hover
      panel.ts          — reader panel (insertAdjacentHTML, idempotent)
      toc.ts            — recursive heading→TOC builder
  epub/
    generator.ts        — epub-gen-memory wrapper with image embedding
    metadata.ts         — EpubMetadata types, KindleDevice presets
  popup/
    popup.html          — mode toggle, metadata form, font settings, Kindle picker
    popup.ts            — inject → extract → preview → metadata → generate → deliver
    delivery.ts         — download + EmailJS
  options/
    options.html
    options.ts          — domain list CRUD, Kindle email, font defaults
  common/
    types.ts            — shared TypeScript types
    messages.ts         — command constants + message type definitions
  styles/
    inject.css          — .stk-highlight, #stk-panel, #stk-overlay
manifest.json
webpack.config.js
tsconfig.json
package.json
tests/
  unit/
  integration/
```

---

## Verification Checklist

- [ ] `npm test` — all unit tests pass
- [ ] `npm run test:integration` — Playwright E2E with unpacked extension in Chromium
- [ ] Manual: auto mode on Wikipedia → epub downloads and opens in Calibre/Kindle Previewer
- [ ] Manual: manual mode on any site → hover highlights, click captures, metadata editable
- [ ] Manual: EmailJS send to `*@kindle.com` → confirmed receipt on device

## Scope Exclusions

- No backend server / OAuth / Gmail API
- No DRM on generated epub files
- Chrome only (Firefox/Safari out of scope)
- No React/Vue

---

## Reference Material

- [Chrome Extension instructions](../.github/instructions/chrome-extension-dom-capture-epub.instructions.md)
- [EasyReader reference](../../references/easy_reader/0.163_0/content.js) — DOM selection, TOC, panel
- [KTool reference](../../references/ktool/1.9.0_0/inject.script.js) — injection guard, extraction, delivery
