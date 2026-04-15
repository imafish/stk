# Getting Started

This guide walks you through running STK locally and loading it into Chrome.

## Prerequisites

- Node.js 18+ and npm
- Google Chrome

## Install Dependencies

```bash
npm install
```

## Build Extension Assets

```bash
npm run build
```

This generates the `dist/` folder with:

- `manifest.json`
- `background.js`
- `inject.js`
- `inject.css`
- `popup.html`, `popup.js`, `popup.css`
- `options.html`, `options.js`
- `icons/*`

## Load Extension in Chrome

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click Load unpacked
4. Select the `dist/` folder

## First Run

1. Open any `http://` or `https://` article page.
2. Open STK popup.
3. Choose Auto or Manual mode.
4. Click Capture Page.
5. Edit metadata and typography settings.
6. Download EPUB or send to Kindle (if configured).

## Configure Send to Kindle (Optional)

1. Open extension options from popup gear icon.
2. Set Kindle email (`yourname@kindle.com`).
3. Set EmailJS public key.
4. Ensure your sender is approved in Amazon Personal Document settings.

## Validation Checklist

- Build succeeds: `npm run build`
- Unit tests pass: `npm test`
- Integration tests pass: `npm run test:integration`
- Packaging works: `npm run pack` (creates `stk-extension.zip`)

## Common Issues

- Capture fails on non-web pages:
  - STK only captures `http://` and `https://` pages.
- Send to Kindle unavailable:
  - Confirm `stk_kindle_email` and `stk_emailjs_key` are configured in options.
- Content quality in Auto mode:
  - Add a domain selector override in options for problematic sites.
