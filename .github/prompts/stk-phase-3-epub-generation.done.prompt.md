---
description: "STK Phase 3 — ePub generation. Implements EpubMetadata types, KindleDevice presets, image resolution to data URIs, DOMPurify sanitization, and the epub-gen-memory wrapper that produces an ArrayBuffer."
name: "STK Phase 3: ePub Generation"
agent: "agent"
---

# STK Phase 3: ePub Generation

Implement the epub generation pipeline. This runs in the **popup context** (not the service worker) because it requires `Blob`, `URL.createObjectURL`, and `fetch` with full CORS access.

Consult [chrome-extension-dom-capture-epub.instructions.md](../.github/instructions/chrome-extension-dom-capture-epub.instructions.md) for patterns.

## `src/epub/metadata.ts`

### `EpubMetadata` type

```typescript
export interface EpubMetadata {
  title: string;
  author: string;       // defaults to page byline or "Unknown"
  language: string;     // e.g. "en"
  sourceUrl: string;
  device: KindleDevice;
  font: FontSettings;
}

export interface FontSettings {
  family: string;       // e.g. "Georgia", "Bookerly", "Arial"
  sizePx: number;       // base body font size in px
  lineHeight: number;   // unitless multiplier, e.g. 1.5
  indentEm: number;     // paragraph indent in em, e.g. 1.5; 0 = no indent
}
```

### `KindleDevice` enum and presets

Define presets for at least:

| Model | Screen (px) | Notes |
|---|---|---|
| PaperWhite (2023) | 1236 × 1648 | 300 ppi |
| Oasis | 1264 × 1680 | 300 ppi |
| Scribe | 1860 × 2480 | 300 ppi |
| Basic (2022) | 1072 × 1448 | 300 ppi |

Each preset: `{ label: string; widthPx: number; heightPx: number; defaultFontSizePx: number }`.

Export `KINDLE_DEVICES: Record<KindleDevice, KindleDevicePreset>` and `DEFAULT_DEVICE: KindleDevice`.

### `DEFAULT_FONT_SETTINGS: FontSettings`

```typescript
export const DEFAULT_FONT_SETTINGS: FontSettings = {
  family: "Georgia",
  sizePx: 16,
  lineHeight: 1.6,
  indentEm: 1.5,
};
```

## `src/epub/generator.ts`

### Image resolution

```typescript
async function resolveImages(html: string, baseUrl: string): Promise<string> {
  // Parse html into a temp DOM element
  // For each img[src]:
  //   Resolve to absolute URL via new URL(src, baseUrl).href
  //   fetch() the image with { mode: "cors", credentials: "include" }
  //   Convert to base64 data URI
  //   Replace src attribute
  // For each img without src or failed fetch: set src="" (skip gracefully)
  // Return modified outerHTML
}
```

Wrap each `fetch` in try/catch — failed images are silently skipped (empty `src`), never throw.

### Sanitization

```typescript
import DOMPurify from "dompurify";

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...all standard HTML tags except script/object/embed/iframe...],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "id", "class", "style"],
    FORCE_BODY: true,
  });
}
```

### CSS injection for font settings

```typescript
function buildFontCSS(font: FontSettings): string {
  return `
    body {
      font-family: ${font.family}, serif;
      font-size: ${font.sizePx}px;
      line-height: ${font.lineHeight};
    }
    p { text-indent: ${font.indentEm}em; margin: 0; }
  `;
}
```

### Main export

```typescript
export async function generateEpub(
  content: CapturedContent,
  meta: EpubMetadata,
): Promise<ArrayBuffer> {
  const resolvedHtml = await resolveImages(content.html, content.url);
  const cleanHtml = sanitize(resolvedHtml);
  const fontCss = buildFontCSS(meta.font);

  // Call epub-gen-memory with:
  // - title, author, language from meta
  // - content: [{ title: meta.title, data: `<style>${fontCss}</style>${cleanHtml}` }]
  // - appendChapterTitles: false
  // Return the resulting ArrayBuffer
}
```

## Unit Tests to Add (`tests/unit/`)

### `metadata.test.ts`
- Assert all `KINDLE_DEVICES` entries have `widthPx`, `heightPx`, `defaultFontSizePx`
- Assert `DEFAULT_FONT_SETTINGS` has all required fields with sensible values

### `generator.test.ts`
- Mock `fetch` to return a 1×1 PNG base64 blob
- Mock `epub-gen-memory` to return a known `ArrayBuffer`
- Assert `generateEpub()` resolves with an `ArrayBuffer`
- Assert that `<script>` tags in input HTML are stripped (DOMPurify working)
- Assert that a failing image fetch (mock rejects) does not throw — epub still generated
- Assert font CSS is embedded in the chapter content HTML

## Acceptance Criteria

- [ ] `generateEpub()` returns an `ArrayBuffer` for a real Wikipedia article HTML string
- [ ] Images in the article are embedded as data URIs in the output
- [ ] The output epub opens in Calibre without validation errors
- [ ] Script tags from input HTML do not appear in the epub content
- [ ] All unit tests pass (`npm test`)
