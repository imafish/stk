---
description: "STK Phase 7 — Background service worker. Implements on-demand CSS+JS injection, context menu (Auto/Manual Capture), badge/title state management, and domain list matching for auto mode selector override."
name: "STK Phase 7: Background Service Worker"
agent: "agent"
---

# STK Phase 7: Background Service Worker

Implement the MV3 service worker. It handles toolbar icon clicks, context menu actions, and injects the content script on demand. It also uses the domain list from Phase 6 to resolve the correct CSS selector for auto mode.

Consult [chrome-extension-dom-capture-epub.instructions.md](../.github/instructions/chrome-extension-dom-capture-epub.instructions.md) for patterns.

## `src/background/background.ts`

### Activation flow

```typescript
async function activateTab(tabId: number, mode: "auto" | "manual"): Promise<void> {
  // 1. Inject CSS (always before JS)
  await chrome.scripting.insertCSS({ target: { tabId }, files: ["inject.css"] });
  // 2. Inject JS
  await chrome.scripting.executeScript({ target: { tabId }, files: ["inject.js"] });
  // 3. For auto mode: check domain list first
  //    If match found, send CMD.ACTIVATE_AUTO with the selector override
  //    Otherwise send CMD.ACTIVATE_AUTO (Readability will handle it)
  // 4. For manual mode: send CMD.ACTIVATE_MANUAL
  // 5. Update badge and title
  setActiveBadge(tabId);
}

function setActiveBadge(tabId: number): void {
  chrome.action.setBadgeText({ tabId, text: "ON" });
  chrome.action.setBadgeBackgroundColor({ tabId, color: "#4a90d9" });
  chrome.action.setTitle({ tabId, title: "STK (active)" });
}

function clearBadge(tabId: number): void {
  chrome.action.setBadgeText({ tabId, text: "" });
  chrome.action.setTitle({ tabId, title: "STK – Send to Kindle" });
}
```

### Toolbar click

```typescript
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url?.startsWith("http")) return;
  // Toggle: check current title for "(active)" to determine state
  const title = await chrome.action.getTitle({ tabId: tab.id });
  if (title.includes("active")) {
    chrome.tabs.sendMessage(tab.id, { command: CMD.DEACTIVATE });
    clearBadge(tab.id);
  } else {
    await activateTab(tab.id, "auto");
  }
});
```

**Note**: The popup is the primary entry point for most users. `action.onClicked` only fires when there is **no** popup configured. Since the popup exists, the badge/title state is used for context menu scenarios.

### Context menu

```typescript
chrome.runtime.onInstalled.addListener(buildContextMenu);

function buildContextMenu(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "stk-root",
      title: "STK",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "stk-auto",
      parentId: "stk-root",
      title: "Auto Capture",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "stk-manual",
      parentId: "stk-root",
      title: "Manual Capture (select area)",
      contexts: ["page"],
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id || !tab.url?.startsWith("http")) return;
  if (info.menuItemId === "stk-auto")   await activateTab(tab.id, "auto");
  if (info.menuItemId === "stk-manual") await activateTab(tab.id, "manual");
});
```

### Domain list integration

```typescript
async function getSelectorForTab(tabId: number): Promise<string | null> {
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url) return null;
  const { [STORAGE_KEYS.DOMAIN_LIST]: list } = await chrome.storage.local.get(STORAGE_KEYS.DOMAIN_LIST);
  const domainList: DomainEntry[] = list ?? DEFAULT_DOMAIN_LIST;
  return matchDomain(tab.url, domainList);
}
```

Use `getSelectorForTab` before sending `CMD.ACTIVATE_AUTO`. If a selector is found, include it in the message:

```typescript
chrome.tabs.sendMessage(tabId, {
  command: CMD.ACTIVATE_AUTO,
  selectorOverride: selector ?? undefined,
});
```

The inject script must handle the optional `selectorOverride`: if provided, use `document.querySelector(selectorOverride)` instead of Readability.

### Tab cleanup

Clear badge when the user navigates away:

```typescript
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") clearBadge(tabId);
});
```

## Unit Tests to Add (`tests/unit/`)

### `background.test.ts`
- Mock `chrome.scripting.insertCSS` and `chrome.scripting.executeScript`
- Assert `activateTab` calls `insertCSS` before `executeScript`
- Assert `activateTab` sends `CMD.ACTIVATE_AUTO` for auto mode
- Assert `activateTab` sends `CMD.ACTIVATE_MANUAL` for manual mode
- Assert context menu is built on `onInstalled`
- Assert clicking "stk-manual" context menu calls `executeScript` + sends `CMD.ACTIVATE_MANUAL`
- Assert `clearBadge` is called when tab navigates (status === "loading")
- Assert `action.onClicked` on an active tab (title contains "active") sends `CMD.DEACTIVATE`

## Acceptance Criteria

- [ ] Right-clicking any `http://` page shows "STK > Auto Capture / Manual Capture" context menu
- [ ] Auto Capture via context menu activates the page (badge shows "ON")
- [ ] Domain list match: navigating to Wikipedia and triggering auto capture uses `#mw-content-text` selector
- [ ] Navigating away clears the badge
- [ ] No errors logged for `chrome://` or `file://` URLs (guarded)
- [ ] All unit tests pass (`npm test`)
