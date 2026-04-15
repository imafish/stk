---
description: "STK Phase 9 — Packaging and README. Builds the production dist/, packages the extension as a .crx or zip, and updates README.md with install, usage, and test instructions."
name: "STK Phase 9: Packaging + README"
agent: "agent"
---

# STK Phase 9: Packaging + README

Build the final production bundle, create installable packages, and update the README so users and contributors can install, test, and use the extension.

Prerequisites: Phase 8 (all tests passing).

## Build

Ensure `npm run build` produces a clean `dist/` with:

```
dist/
  manifest.json
  background.js
  inject.js
  inject.css
  popup.html
  popup.js
  options.html
  options.js
  icons/
    icon-16.png
    icon-48.png
    icon-128.png
```

Verify:
- No source maps in production build (set `devtool: false` in webpack for production)
- All assets referenced in `manifest.json` exist in `dist/`
- Load `dist/` as unpacked extension in Chrome with zero errors in the Extensions page

## Packaging as ZIP (for Chrome Web Store or manual sharing)

Add an npm script `"pack"` that zips the `dist/` directory:

```json
"pack": "cd dist && zip -r ../stk-extension.zip . && cd .."
```

Or use `archiver` if cross-platform zip is needed.

The resulting `stk-extension.zip` can be:
- Uploaded to the Chrome Web Store developer dashboard
- Shared directly and installed via "Load unpacked" after unzipping

## `README.md`

Update the README with the following sections (follow the [readme.instructions.md](../.github/instructions/readme.instructions.md) guidelines):

### Project Introduction

Brief description of STK: a Chrome extension that captures web page content, converts it to `.epub`, and sends it to your Kindle device via download or email.

Key features:
- Auto mode (Mozilla Readability-powered article extraction)
- Manual mode (click to select any DOM region)
- Keep images, generate TOC
- Customize font, font size, line spacing, indentation
- Optimize for specific Kindle models
- Pre-configured domain list (Wikipedia, Medium, Substack, Hacker News, GitHub)
- Download `.epub` directly or send to `*@kindle.com` via EmailJS

### Installation (Developer / Unpacked)

```markdown
## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/imafish/stk.git
   cd stk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load into Chrome:
   - Open `chrome://extensions`
   - Enable **Developer mode** (top-right toggle)
   - Click **Load unpacked**
   - Select the `dist/` folder

The STK icon will appear in your Chrome toolbar.
```

### Configuration

```markdown
## Configuration

1. Click the STK icon → click the gear icon or visit `chrome://extensions` → STK → Details → Extension options.
2. Enter your **Kindle email address** (e.g. `yourname@kindle.com`).
3. Set up EmailJS (optional, only needed for "Send to Kindle" button):
   - Create a free account at https://emailjs.com
   - Add an email service and create a template with variables: `{{to_email}}`, `{{epub_filename}}`, `{{epub_base64}}`
   - Paste your **EmailJS Public Key** into STK options
4. Add your Kindle email to [Amazon's Approved Senders list](https://www.amazon.com/hz/mycd/myx#/home/settings/pdoc).
```

### Usage

```markdown
## Usage

### Auto Mode
1. Navigate to any article page.
2. Click the STK icon to open the popup.
3. Select **Auto** mode (default).
4. Click **Capture Page** — the article is extracted automatically.
5. Edit the title/author if needed.
6. Adjust font settings and select your Kindle model.
7. Click **Download .epub** or **Send to Kindle**.

### Manual Mode
1. Select **Manual** mode in the popup.
2. Click **Capture Page** — the page enters selection mode (cursor changes).
3. Hover over any section to highlight it; click to capture that region.
4. Continue from step 5 above.

### Context Menu
Right-click any page → **STK** → **Auto Capture** or **Manual Capture** to activate without opening the popup.
```

### How to Test

```markdown
## Development & Testing

### Unit Tests
```bash
npm test
```

### Integration Tests (requires Chrome)
```bash
npm run build
npm run test:integration
```

Playwright launches Chromium with the extension loaded and runs end-to-end scenarios including auto capture, manual selection, and epub download.

### Manual Testing Checklist
- [ ] Auto mode on [Wikipedia](https://en.wikipedia.org/wiki/Kindle) extracts the article body
- [ ] Manual mode on any page highlights on hover and captures on click
- [ ] Downloaded `.epub` opens without errors in [Calibre](https://calibre-ebook.com/) or Kindle Previewer
- [ ] Images from the article are embedded in the epub
- [ ] Font settings (size, family, spacing) are reflected in the epub stylesheet
- [ ] Sending to Kindle email delivers the epub to the device
```

### Contribution Guidelines

```markdown
## Contributing

1. Fork the repo and create a feature branch.
2. Follow the TypeScript conventions in `src/`.
3. Add or update unit tests for any changed module.
4. Run `npm test` and `npm run test:integration` — all must pass.
5. Open a pull request with a clear description of the change.
```

## Acceptance Criteria

- [ ] `npm run build && npm run pack` produces `stk-extension.zip`
- [ ] `stk-extension.zip` installs cleanly via Load unpacked after unzip
- [ ] No errors on the `chrome://extensions` page
- [ ] README has all five sections: Introduction, Installation, Configuration, Usage, Testing
- [ ] `npm test` and `npm run test:integration` both pass on a clean checkout
