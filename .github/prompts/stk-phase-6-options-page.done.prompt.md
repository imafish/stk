---
description: "STK Phase 6 — Options page. Implements Kindle email input, EmailJS public key, domain list CRUD editor, and default font settings. All persisted to chrome.storage.local."
name: "STK Phase 6: Options Page"
agent: "agent"
---

# STK Phase 6: Options Page

Implement the extension options page where users configure their Kindle email, EmailJS credentials, the domain→selector list for auto mode, and default font settings.

## `src/options/options.html`

Sections (use `<fieldset>` + `<legend>` for grouping):

1. **Kindle Delivery**
   - `kindle-email` text input — `*@kindle.com` address
   - `emailjs-public-key` text input — EmailJS public key
   - Help text: brief EmailJS setup instructions (4 steps) with a link to emailjs.com

2. **Domain List** (for auto mode selector override)
   - A `<table>` showing current entries:
     - Column: URL pattern (glob, e.g. `*.wikipedia.org`)
     - Column: CSS selector (e.g. `#mw-content-text`)
     - Column: Delete button per row
   - "Add entry" form: two text inputs (pattern + selector) + Add button
   - "Reset to defaults" button

3. **Default Font Settings**
   - Same controls as in the popup (family, size, line-height, indent)
   - These become the popup's initial values

4. **Save button** + success/error status message

## `src/options/options.ts`

### Domain list type

```typescript
export interface DomainEntry {
  pattern: string;   // glob or exact hostname, e.g. "*.medium.com"
  selector: string;  // CSS selector for the main content element
}
```

### Default domain list

Pre-populate with at least:

```typescript
export const DEFAULT_DOMAIN_LIST: DomainEntry[] = [
  { pattern: "*.wikipedia.org",   selector: "#mw-content-text" },
  { pattern: "medium.com",        selector: "article" },
  { pattern: "*.substack.com",    selector: ".post-content" },
  { pattern: "news.ycombinator.com", selector: ".comment-tree" },
  { pattern: "github.com",        selector: "article.markdown-body" },
];
```

### Load / save

```typescript
async function loadSettings(): Promise<void> {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.KINDLE_EMAIL,
    STORAGE_KEYS.EMAILJS_KEY,
    STORAGE_KEYS.DOMAIN_LIST,
    STORAGE_KEYS.FONT_SETTINGS,
  ]);
  // Populate form fields and render domain table
}

async function saveSettings(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.KINDLE_EMAIL]: kindleEmailInput.value.trim(),
    [STORAGE_KEYS.EMAILJS_KEY]:  emailjsKeyInput.value.trim(),
    [STORAGE_KEYS.DOMAIN_LIST]:  currentDomainList,
    [STORAGE_KEYS.FONT_SETTINGS]: readFontSettings(),
  });
  showStatus("Saved!");
}
```

### Domain table rendering

```typescript
function renderDomainTable(entries: DomainEntry[]): void {
  // Clear and rebuild the <tbody> from entries array
  // Each row: pattern cell, selector cell, delete button
  // Delete button: removes entry from currentDomainList, re-renders
}
```

### Reset to defaults

```typescript
document.getElementById("reset-domains")!.addEventListener("click", () => {
  currentDomainList = [...DEFAULT_DOMAIN_LIST];
  renderDomainTable(currentDomainList);
});
```

## `src/background/domain-list.ts`

This module is used by the background service worker to resolve the correct selector for a given URL:

```typescript
export function matchDomain(url: string, list: DomainEntry[]): string | null {
  const hostname = new URL(url).hostname;
  for (const entry of list) {
    if (globMatch(entry.pattern, hostname)) return entry.selector;
  }
  return null;
}

function globMatch(pattern: string, hostname: string): boolean {
  // Support *.example.com and exact match
  if (pattern.startsWith("*.")) {
    const domain = pattern.slice(2);
    return hostname === domain || hostname.endsWith("." + domain);
  }
  return hostname === pattern;
}
```

## Unit Tests to Add (`tests/unit/`)

### `domain-list.test.ts`
- Assert `matchDomain("https://en.wikipedia.org/wiki/X", list)` returns `"#mw-content-text"`
- Assert `matchDomain("https://wikipedia.org/wiki/X", list)` returns `"#mw-content-text"` (apex domain)
- Assert `matchDomain("https://notinlist.com", list)` returns `null`
- Assert `globMatch("*.medium.com", "blog.medium.com")` is `true`
- Assert `globMatch("*.medium.com", "medium.com")` is `true`
- Assert `globMatch("*.medium.com", "notmedium.com")` is `false`
- Assert `globMatch("github.com", "github.com")` is `true`
- Assert `globMatch("github.com", "api.github.com")` is `false`

## Acceptance Criteria

- [ ] Saving Kindle email and EmailJS key persists across options page reloads
- [ ] Adding a domain entry appears in the table immediately
- [ ] Deleting a domain entry removes it from the table and storage on Save
- [ ] "Reset to defaults" restores the built-in domain list (does not save automatically)
- [ ] Font settings saved on options page appear as defaults in the popup
- [ ] All unit tests pass (`npm test`)
