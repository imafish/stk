---
description: "STK Phase 4 — Popup UI. Implements popup.html (mode toggle, metadata form, font settings, Kindle model picker) and popup.ts orchestration: inject → extract → preview → metadata → generate epub → deliver."
name: "STK Phase 4: Popup UI"
agent: "agent"
---

# STK Phase 4: Popup UI

Implement the extension popup. The popup orchestrates the full user flow: it triggers content injection, receives captured HTML, shows a metadata form, generates the epub, and hands off to delivery.

Prerequisite: Phase 2 (content extraction) and Phase 3 (epub generation) must be complete.

Consult [chrome-extension-dom-capture-epub.instructions.md](../.github/instructions/chrome-extension-dom-capture-epub.instructions.md) for patterns.

## `src/popup/popup.html`

Plain HTML (no framework). Sections:

1. **Mode toggle** — two radio buttons or a toggle switch: "Auto" / "Manual"
2. **Capture button** — "Capture Page" — triggers injection into the active tab
3. **Status area** — shows "Capturing…", "Extracting…", error messages
4. **Metadata form** (hidden until capture succeeds):
   - `title` text input (pre-filled from extracted title)
   - `author` text input (pre-filled from byline or blank)
   - `language` select (en, zh, de, fr, es, ja, ko — sensible defaults)
5. **Font settings** (collapsible `<details>`):
   - `font-family` select (Georgia, Bookerly, Arial, Verdana, Times New Roman)
   - `font-size` number input (range 10–24, step 1, default 16)
   - `line-height` number input (range 1.0–2.5, step 0.1, default 1.6)
   - `paragraph-indent` number input (range 0–3, step 0.5, default 1.5)
6. **Kindle model picker** — `<select>` populated from `KINDLE_DEVICES`
7. **Action buttons**:
   - "Download .epub" — calls `downloadEpub()`
   - "Send to Kindle" — calls `sendToKindle()` (EmailJS)
8. **Footer** — link to Options page: `chrome.runtime.openOptionsPage()`

Use semantic HTML. No inline styles — use a `popup.css` imported by webpack.

## `src/popup/popup.ts`

### State machine

The popup moves through these states (update UI visibility based on state):

```
idle → capturing → captured → generating → ready
                 ↘ error
```

### Flow

```typescript
// 1. On DOMContentLoaded: load saved settings from chrome.storage.local
//    (Kindle model, font settings, Kindle email)
//    Populate all form fields.

// 2. On "Capture" click:
//    - Set state: "capturing"
//    - Get active tab: chrome.tabs.query({ active: true, currentWindow: true })
//    - Determine mode (auto/manual) from radio
//    - Inject CSS then JS into the tab:
//        chrome.scripting.insertCSS({ target: { tabId }, files: ["inject.css"] })
//        chrome.scripting.executeScript({ target: { tabId }, files: ["inject.js"] })
//    - Send CMD.ACTIVATE_AUTO or CMD.ACTIVATE_MANUAL to the tab
//    - Listen for one CMD.RETURN_HTML message back
//    - On receipt: populate title/author fields, set state: "captured"

// 3. On "Download" or "Send to Kindle" click:
//    - Set state: "generating"
//    - Build EpubMetadata from form values
//    - Save font settings + Kindle model to chrome.storage.local
//    - Call generateEpub(capturedContent, metadata) → ArrayBuffer
//    - Set state: "ready"
//    - Call downloadEpub() or sendToKindle() from delivery.ts
```

### Error handling

- If injection fails (tab is a `chrome://` or `edge://` URL): show "Cannot capture this page"
- If `RETURN_HTML` is not received within 30 seconds: show "Capture timed out"
- If `generateEpub` throws: show the error message in the status area

### Storage keys (use these exact keys for cross-module consistency)

```typescript
export const STORAGE_KEYS = {
  KINDLE_EMAIL:    "stk_kindle_email",
  EMAILJS_KEY:     "stk_emailjs_key",
  KINDLE_DEVICE:   "stk_kindle_device",
  FONT_SETTINGS:   "stk_font_settings",
  DOMAIN_LIST:     "stk_domain_list",
} as const;
```

Define in `src/common/types.ts` and import here.

## Unit Tests to Add (`tests/unit/`)

### `popup.test.ts`
- Mock `chrome.tabs.query`, `chrome.scripting.insertCSS`, `chrome.scripting.executeScript`, `chrome.runtime.sendMessage`
- Assert that clicking Capture calls `insertCSS` then `executeScript` in that order
- Assert state transitions: idle → capturing on click, capturing → captured on message receipt
- Assert error state shown when tab URL is `chrome://newtab`
- Assert form fields pre-filled when `CMD.RETURN_HTML` received with title/byline

## Acceptance Criteria

- [ ] Popup opens without errors on any `http://` / `https://` tab
- [ ] Auto mode: clicking Capture fills in metadata form with extracted title/author
- [ ] Manual mode: clicking Capture puts the page in selection mode (cursor changes, highlight on hover)
- [ ] Font settings and Kindle model persist across popup close/reopen (chrome.storage.local)
- [ ] "Cannot capture this page" shown for `chrome://` URLs
- [ ] All unit tests pass (`npm test`)
