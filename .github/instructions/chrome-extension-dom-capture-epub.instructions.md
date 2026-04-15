---
description: "Use when building a Chrome extension that selects DOM regions with visual highlighting, captures content (text + images), converts to epub, or sends articles to Kindle. Covers MV3 architecture, on-demand script injection, DOM walker patterns, content extraction, message passing, and epub/Kindle delivery."
---

# Chrome Extension: DOM Capture + ePub/Kindle Delivery

Reference implementations:
- `references/easy_reader/` — DOM area selection with hover/click highlighting, content reader panel, TOC generation
- `references/ktool/` — Page-to-epub conversion, Kindle delivery, preview/edit mode, API authentication

---

## Manifest (MV3)

- Use **Manifest V3** with a service worker background (`"type": "module"` optional).
- Declare `"activeTab"`, `"scripting"`, and `"storage"` permissions.
- List inject scripts and CSS in `"web_accessible_resources"` when they must be fetched via `chrome.runtime.getURL`.
- Do **not** bundle all logic into the content script declared in `manifest.json`; inject on demand instead.

```json
{
  "manifest_version": 3,
  "background": { "service_worker": "background.js" },
  "permissions": ["activeTab", "scripting", "storage", "contextMenus"],
  "web_accessible_resources": [
    { "resources": ["inject.script.js", "inject.styles.css", "fonts/*"], "matches": ["<all_urls>"] }
  ]
}
```

---

## On-Demand Script Injection

Inject content scripts only when needed (not via `content_scripts` manifest key), keeping the service worker lean:

```javascript
// background.js
chrome.scripting.insertCSS({ target: { tabId }, files: ["inject.styles.css"] });
chrome.scripting.executeScript({ target: { tabId }, files: ["inject.script.js"] });
```

Always inject CSS before JS to prevent flash of unstyled content.

---

## Injection Guard (window.INJECTED)

Wrap all content-script logic in a guard to prevent double-execution if the script is injected multiple times:

```javascript
// inject.script.js
if (!window.INJECTED) {
  // ... all function definitions and message listeners ...
  window.INJECTED = true;
}
```

---

## DOM Hover Highlighting & Click-to-Select

Use a **DOM walker function** that climbs from the hovered element to the nearest acceptable container:

```javascript
// Accepted container types — tune for the target sites
const ACCEPTED_TAGS = new Set(["DIV", "BODY", "TD", "SECTION", "ARTICLE", "MAIN"]);

function findContainer(el) {
  if (!el || el === document.body) return document.body;
  if (ACCEPTED_TAGS.has(el.tagName)) return el;
  return findContainer(el.parentNode);
}

// Hover phase
document.body.addEventListener("mouseover", (e) => {
  const container = findContainer(e.target);
  container.classList.add("stk-highlight");
});
document.body.addEventListener("mouseout", (e) => {
  const container = findContainer(e.target);
  container.classList.remove("stk-highlight");
});

// Click-to-capture phase
document.body.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const container = findContainer(e.target);
  captureContent(container);
  removeHighlightListeners();
}, { capture: true });
```

---

## Highlight CSS

Provide clear visual feedback without disrupting layout:

```css
.stk-highlight {
  outline: 2px solid #4a90d9 !important;
  outline-offset: 2px !important;
  background-color: rgba(74, 144, 217, 0.08) !important;
  cursor: crosshair !important;
}
```

Use `!important` sparingly — only needed to override site styles on the highlight class.

---

## Content Extraction (Text + Images)

Clone the selected node to avoid mutating the live DOM:

```javascript
function captureContent(container) {
  const clone = container.cloneNode(true);

  // Remove non-content elements
  clone.querySelectorAll("script, style, noscript, iframe, object").forEach(el => el.remove());

  // Resolve relative image URLs to absolute
  clone.querySelectorAll("img[src]").forEach(img => {
    img.src = new URL(img.getAttribute("src"), document.baseURI).href;
  });

  // Resolve relative links
  clone.querySelectorAll("a[href]").forEach(a => {
    a.href = new URL(a.getAttribute("href"), document.baseURI).href;
  });

  return {
    html: clone.outerHTML,
    title: document.querySelector("h1")?.innerText ?? document.title,
    url: location.href,
  };
}
```

---

## TOC Generation (Recursive Heading Traversal)

Build a nested `<ul>` table of contents from headings in the captured content:

```javascript
function buildTOC(rootEl) {
  const toc = document.createElement("ul");
  let current = toc;
  let currentLevel = 0;
  let counter = 0;

  function walk(node) {
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const match = child.tagName.match(/^H([1-5])$/i);
      if (match) {
        const level = parseInt(match[1], 10);
        if (level > currentLevel) current = current.appendChild(document.createElement("ul"));
        else if (level < currentLevel) current = current.parentNode;
        currentLevel = level;
        const id = `stk-heading-${counter++}`;
        child.id = id;
        const li = document.createElement("li");
        li.innerHTML = `<a href="#${id}">${child.textContent}</a>`;
        current.appendChild(li);
      } else if (/^(DIV|UL|OL|LI|ARTICLE|SECTION)$/.test(child.tagName)) {
        walk(child);
      }
    }
  }

  walk(rootEl);
  return toc;
}
```

---

## Reader Panel Layout

Overlay a centered, scrollable reader panel without disrupting the host page:

```javascript
function openReaderPanel(html, title) {
  // Remove existing panel if present
  document.getElementById("stk-reader-root")?.remove();

  document.body.insertAdjacentHTML("beforeend", `
    <div id="stk-reader-root">
      <div id="stk-overlay"></div>
      <div id="stk-panel">
        <div id="stk-toc"></div>
        <div id="stk-content">${html}</div>
        <button id="stk-close">✕</button>
      </div>
    </div>
  `);

  document.getElementById("stk-close").addEventListener("click", closeReaderPanel);
  document.getElementById("stk-toc").appendChild(buildTOC(document.getElementById("stk-content")));
}
```

Use `insertAdjacentHTML("beforeend")` rather than `innerHTML =` to append without wiping existing body children.

Idempotent: always `remove()` any existing panel before inserting — use a stable root ID (`#stk-reader-root`).

---

## Full-Page Preview / Edit Mode (KTool Pattern)

Replace the entire page with the extracted/processed content for editing before send:

```javascript
function renderPreview(title, contentHtml) {
  document.head.innerHTML = "";   // clear all stylesheets and meta
  document.body.innerHTML = `
    <h1 id="stk-title" contenteditable="true">${title}</h1>
    <div id="stk-main-content" contenteditable="true">${contentHtml}</div>
    <div id="stk-toolbar">
      <button id="stk-send">Send to Kindle</button>
      <button id="stk-close">✕ Close</button>
    </div>
  `;
  document.getElementById("stk-close").addEventListener("click", () => location.reload());
  document.getElementById("stk-send").addEventListener("click", () => {
    chrome.runtime.sendMessage({ command: "send-to-kindle", html: getEditedHTML(), title: getEditedTitle() });
  });
}

function getEditedHTML()  { return document.getElementById("stk-main-content").innerHTML; }
function getEditedTitle() { return document.getElementById("stk-title").innerText; }
```

`contenteditable="true"` enables in-place user editing before delivery.

---

## Message Passing

Keep the protocol small and explicit. Use a `command` discriminator field:

```javascript
// content script → background
chrome.runtime.sendMessage({ command: "send-to-kindle", html, title, url });

// background → content script
chrome.tabs.sendMessage(tabId, { command: "render-success" });
chrome.tabs.sendMessage(tabId, { command: "render-failure", errorMessage: "Please login" });
chrome.tabs.sendMessage(tabId, { command: "render-preview", title, contentHtml });
```

In the content script, use a single `chrome.runtime.onMessage` listener with a switch/if-else on `msg.command`.

---

## Background Service Worker — State Machine

Track on/off state via the **action badge or title** (no storage roundtrip needed for ephemeral UI state):

```javascript
// Set active state
chrome.action.setTitle({ tabId, title: "STK (active)" });
chrome.action.setBadgeText({ tabId, text: "ON" });

// Read state
chrome.action.getTitle({ tabId }, (title) => {
  const isActive = title.includes("active");
  // ...
});
```

Use `chrome.storage.local` only for **persistent** data (auth tokens, user settings).

---

## Authentication & API Calls (KTool Pattern)

Keep all authenticated API calls in the background service worker — never in content scripts:

```javascript
// background.js
const ACCESS_TOKEN_KEY = "stk_access_token";

async function getToken() {
  const { [ACCESS_TOKEN_KEY]: token } = await chrome.storage.local.get(ACCESS_TOKEN_KEY);
  return token;
}

async function callAPI(path, payload) {
  const token = await getToken();
  const res = await fetch(`https://api.yourdomain.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("Please login");
  if (res.status === 402) throw new Error("Subscription required");
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
```

On the message handler in background: call the API, then `sendMessage` back with `render-success` or `render-failure`.

---

## Storage-Driven CSS Settings

Store per-property CSS overrides and apply them reactively:

```javascript
// Shared schema (both options page and content script)
const CSS_DEFAULTS = {
  "Background color": { property: "background", value: "#fffffa", selector: "#stk-panel" },
  "Text color":       { property: "color",      value: "#222",    selector: "#stk-content" },
};

async function loadAndApplyCSS() {
  const { css: overrides = {} } = await chrome.storage.local.get("css");
  const merged = { ...CSS_DEFAULTS, ...overrides };
  for (const { property, value, selector } of Object.values(merged)) {
    document.querySelectorAll(selector).forEach(el => { el.style[property] = value; });
  }
}

// React to changes from the options page (live preview)
chrome.storage.onChanged.addListener(() => loadAndApplyCSS());
```

---

## CSS Loading Feedback (No DOM Overlay Needed)

For lightweight loading indication, use `cursor` on `body` rather than an overlay:

```css
body.stk-loading { cursor: wait !important; }
```

```javascript
document.body.classList.add("stk-loading");
// ... async operation ...
document.body.classList.remove("stk-loading");
```

For richer feedback, use SVG stroke-dashoffset animations drawn in inject.styles.css:

```css
@keyframes stk-circle  { 0% { stroke-dashoffset: 480px } 100% { stroke-dashoffset: 960px } }
@keyframes stk-check   { 0% { stroke-dashoffset: 100px } 100% { stroke-dashoffset: 0px } }
```

---

## Context Menu

Build the context menu tree dynamically in the background on startup and on auth-state changes:

```javascript
function buildContextMenu(isLoggedIn) {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "stk-root", title: "STK", contexts: ["page"] });
    chrome.contextMenus.create({ id: "stk-capture", parentId: "stk-root", title: "Capture selection", contexts: ["page"] });
    if (isLoggedIn) {
      chrome.contextMenus.create({ id: "stk-send", parentId: "stk-root", title: "Send to Kindle", contexts: ["page"] });
    }
  });
}
chrome.runtime.onInstalled.addListener(() => buildContextMenu(false));
chrome.storage.onChanged.addListener((changes) => {
  if (changes.stk_access_token) buildContextMenu(!!changes.stk_access_token.newValue);
});
```

---

## Cross-Context Bridge (Page JS → Content Script)

When you need data from the page's own JavaScript context, inject a web-accessible script as a `<script>` tag, then bridge via `CustomEvent`:

```javascript
// bridge.js (web-accessible, runs in page context)
window.dispatchEvent(new CustomEvent("stk:page-data", { detail: window.__somePageData }));

// inject.script.js (content script context)
window.addEventListener("stk:page-data", (e) => {
  chrome.runtime.sendMessage({ command: "page-data", data: e.detail });
});

// background.js — inject the bridge
function injectBridge(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const s = document.createElement("script");
      s.src = chrome.runtime.getURL("bridge.js");
      document.body.appendChild(s);
    },
  });
}
```

---

## Browser Compatibility Branch

```javascript
const isFirefox = chrome.runtime.getURL("").startsWith("moz-extension://");
const isSafari  = chrome.runtime.getURL("").startsWith("safari-web-extension://");

// Use chrome.action (MV3) everywhere; Firefox uses chrome.browserAction via polyfill
```

---

## Anti-Patterns to Avoid

- **Do not** declare heavy content scripts in `manifest.json` `content_scripts` — inject on demand.
- **Do not** make API calls with auth tokens from content scripts — they run in page context and are inspectable.
- **Do not** store JWT tokens in `sessionStorage` or `localStorage` — use `chrome.storage.local`.
- **Do not** use `document.write()` or set `document.body.outerHTML` for partial updates — use `innerHTML` on specific containers or `insertAdjacentHTML`.
- **Do not** forget to remove the `window.INJECTED` guard or the single-instance ID check — double-injection causes duplicate listeners and UI glitches.
