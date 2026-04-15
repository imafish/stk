---
description: "STK Phase 1 — Project scaffold. Creates manifest.json, package.json, tsconfig.json, webpack.config.js, and the full src/ directory skeleton for the Send-to-Kindle Chrome extension."
name: "STK Phase 1: Project Scaffold"
agent: "agent"
---

# STK Phase 1: Project Scaffold

Create the complete project scaffold for the STK Chrome extension. No feature logic yet — only configuration and empty placeholder files.

## Files to Create

### `manifest.json`

MV3 manifest with:
- `"manifest_version": 3`
- `name`: "STK – Send to Kindle"
- `version`: "0.1.0"
- `description`: "Capture web page content and send to Kindle as epub"
- `permissions`: `["activeTab", "scripting", "storage", "contextMenus"]`
- `background`: `{ "service_worker": "dist/background.js" }`
- `action`: `{ "default_popup": "dist/popup.html", "default_icon": "icons/icon-48.png" }`
- `options_page`: `"dist/options.html"`
- `web_accessible_resources`: `[{ "resources": ["dist/inject.js", "dist/inject.css"], "matches": ["<all_urls>"] }]`
- `icons`: 16, 48, 128 sizes pointing to `icons/`

### `package.json`

Include all dependencies:

**Runtime:**
- `@mozilla/readability`
- `epub-gen-memory`
- `dompurify`
- `@types/dompurify`
- `emailjs-com`

**Dev:**
- `typescript`
- `webpack`
- `webpack-cli`
- `ts-loader`
- `copy-webpack-plugin`
- `jest`
- `jest-environment-jsdom`
- `ts-jest`
- `@types/jest`
- `@types/chrome`
- `@playwright/test`

**Scripts:**
- `"build"`: `webpack --mode production`
- `"dev"`: `webpack --mode development --watch`
- `"test"`: `jest`
- `"test:integration"`: `playwright test`

### `tsconfig.json`

- `target`: `ES2020`
- `module`: `ES2020`
- `moduleResolution`: `bundler`
- `strict`: `true`
- `lib`: `["ES2020", "DOM"]`
- `outDir`: `./dist`
- `rootDir`: `./src`
- `include`: `["src/**/*"]`
- `exclude`: `["node_modules", "dist", "tests"]`

### `webpack.config.js`

Four entry points:
- `background` → `src/background/background.ts`
- `inject` → `src/content/inject.ts`
- `popup` → `src/popup/popup.ts`
- `options` → `src/options/options.ts`

Output to `dist/`. Use `ts-loader`. Use `CopyWebpackPlugin` to copy:
- `src/popup/popup.html` → `dist/popup.html`
- `src/options/options.html` → `dist/options.html`
- `src/styles/inject.css` → `dist/inject.css`
- `icons/` → `dist/icons/`
- `manifest.json` → `dist/manifest.json`

### `jest.config.js`

- `preset`: `ts-jest`
- `testEnvironment`: `jsdom`
- `testMatch`: `["**/tests/unit/**/*.test.ts"]`

### `playwright.config.ts`

- Single project using `chromium` with `--load-extension=./dist` and `--disable-extensions-except=./dist` launch args
- `testMatch`: `**/tests/integration/**/*.spec.ts`

### Source Placeholders

Create empty (stub) TypeScript files with a single `// TODO` comment for:
- `src/background/background.ts`
- `src/background/domain-list.ts`
- `src/content/inject.ts`
- `src/content/extractor/auto.ts`
- `src/content/extractor/manual.ts`
- `src/content/ui/highlight.ts`
- `src/content/ui/panel.ts`
- `src/content/ui/toc.ts`
- `src/epub/generator.ts`
- `src/epub/metadata.ts`
- `src/popup/popup.ts`
- `src/popup/delivery.ts`
- `src/options/options.ts`
- `src/common/types.ts`
- `src/common/messages.ts`

Create empty placeholder HTML files:
- `src/popup/popup.html`
- `src/options/options.html`

Create empty CSS:
- `src/styles/inject.css`

Create placeholder icon PNGs (1×1 white pixel) at `icons/icon-16.png`, `icons/icon-48.png`, `icons/icon-128.png` — or note where real icons should be dropped.

Create empty test directories:
- `tests/unit/.gitkeep`
- `tests/integration/.gitkeep`

## Acceptance Criteria

- [ ] `npm install` completes without errors
- [ ] `npm run build` produces `dist/` with all four entry bundles + copied assets
- [ ] `npm test` runs (zero tests, zero failures)
- [ ] `dist/manifest.json` is valid MV3 (load unpacked in Chrome without error)
