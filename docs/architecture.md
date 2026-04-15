# Architecture

STK is a Manifest V3 Chrome extension built with TypeScript and webpack.

## High-Level Components

- Background service worker (`src/background/background.ts`)
- Content injection entry (`src/content/inject.ts`)
- Extraction logic (`src/content/extractor/*`)
- Popup UI and orchestration (`src/popup/*`)
- Options UI (`src/options/*`)
- EPUB generation (`src/epub/*`)
- Shared contracts (`src/common/*`)

## Build and Packaging

Webpack entry points in `webpack.config.js`:

- `background` -> `src/background/background.ts`
- `inject` -> `src/content/inject.ts`
- `popup` -> `src/popup/popup.ts`
- `options` -> `src/options/options.ts`

Output target: `dist/`.

Manifest and static assets are copied into `dist/` using `CopyWebpackPlugin`.

## Runtime Flow

### 1. Capture Trigger

Capture starts from either:

- Popup Capture button (`src/popup/popup.ts`)
- Context menu actions (`src/background/background.ts`)

Both routes inject:

- `inject.css`
- `inject.js`

### 2. Content Extraction

In `src/content/inject.ts`:

- `activate-auto` -> `autoExtract(selectorOverride?)`
- `activate-manual` -> `startManualSelection(...)`

Result returns as `return-html` message with:

- `html`
- `title`
- `byline`
- `url`

### 3. Metadata and EPUB Generation

Popup receives captured content and builds `EpubMetadata`:

- title/author/language
- device preset
- font settings

`src/epub/generator.ts` then:

1. Resolves image URLs and inlines image data as data URLs
2. Sanitizes HTML using DOMPurify allowlist
3. Injects generated typography CSS
4. Calls `epub-gen-memory` to produce an EPUB buffer

### 4. Delivery

In `src/popup/delivery.ts`:

- Download flow: create Blob URL and trigger file download
- Send flow: convert EPUB buffer to base64 and call EmailJS

## Background Responsibilities

`src/background/background.ts` handles:

- Context menu creation
- On-demand injection
- Tab badge state (`ON` when active)
- Domain selector override lookup via `stk_domain_list`

## State and Configuration

Persistent settings in `chrome.storage.local`:

- Kindle email and EmailJS key
- Kindle device selection
- Font settings
- Domain selector list

Key names are centralized in `src/common/types.ts`.

## Message Contracts

`src/common/messages.ts` defines command constants and message types for:

- Activation/deactivation
- Capture result exchange

This keeps popup/content/background communication consistent.

## Testing Architecture

- Unit tests: `tests/unit/**/*.test.ts` (Jest + jsdom)
- Integration tests: `tests/integration/**/*.spec.ts` (Playwright)

Current suite includes extraction, TOC, panel, domain matching, delivery, metadata, and background behavior tests.
