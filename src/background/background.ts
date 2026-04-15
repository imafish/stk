import { CMD } from "../common/messages";
import type { Message } from "../common/messages";
import { STORAGE_KEYS } from "../common/types";
import { DEFAULT_DOMAIN_LIST, matchDomain } from "./domain-list";
import type { DomainEntry } from "./domain-list";

// ── Badge helpers ─────────────────────────────────────────────────────────────
function setActiveBadge(tabId: number): void {
  chrome.action.setBadgeText({ tabId, text: "ON" });
  chrome.action.setBadgeBackgroundColor({ tabId, color: "#4a90d9" });
  chrome.action.setTitle({ tabId, title: "STK (active)" });
}

function clearBadge(tabId: number): void {
  chrome.action.setBadgeText({ tabId, text: "" });
  chrome.action.setTitle({ tabId, title: "STK – Send to Kindle" });
}

// ── Domain list helpers ───────────────────────────────────────────────────────
async function getSelectorForUrl(url: string): Promise<string | null> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.DOMAIN_LIST);
  const list: DomainEntry[] = (data[STORAGE_KEYS.DOMAIN_LIST] as DomainEntry[]) ?? DEFAULT_DOMAIN_LIST;
  return matchDomain(url, list);
}

// ── Injection ─────────────────────────────────────────────────────────────────
export async function activateTab(tabId: number, mode: "auto" | "manual"): Promise<void> {
  // CSS before JS to prevent flash
  await chrome.scripting.insertCSS({ target: { tabId }, files: ["inject.css"] });
  await chrome.scripting.executeScript({ target: { tabId }, files: ["inject.js"] });

  if (mode === "manual") {
    chrome.tabs.sendMessage(tabId, { command: CMD.ACTIVATE_MANUAL } satisfies Message);
  } else {
    const tab = await chrome.tabs.get(tabId);
    const selector = tab.url ? await getSelectorForUrl(tab.url) : null;
    const msg: Message = selector
      ? { command: CMD.ACTIVATE_AUTO, selectorOverride: selector }
      : { command: CMD.ACTIVATE_AUTO };
    chrome.tabs.sendMessage(tabId, msg);
  }

  setActiveBadge(tabId);
}

// ── Toolbar click (fires when popup is NOT configured) ────────────────────────
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url?.startsWith("http")) return;
  const title = await chrome.action.getTitle({ tabId: tab.id });
  if (title.includes("active")) {
    chrome.tabs.sendMessage(tab.id, { command: CMD.DEACTIVATE } satisfies Message);
    clearBadge(tab.id);
  } else {
    await activateTab(tab.id, "auto");
  }
});

// ── Context menu ──────────────────────────────────────────────────────────────
export function buildContextMenu(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "stk-root", title: "STK", contexts: ["page"] });
    chrome.contextMenus.create({ id: "stk-auto", title: "Auto Capture", parentId: "stk-root", contexts: ["page"] });
    chrome.contextMenus.create({ id: "stk-manual", title: "Manual Capture", parentId: "stk-root", contexts: ["page"] });
  });
}

chrome.runtime.onInstalled.addListener(buildContextMenu);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id || !tab.url?.startsWith("http")) return;
  if (info.menuItemId === "stk-auto") await activateTab(tab.id, "auto");
  if (info.menuItemId === "stk-manual") await activateTab(tab.id, "manual");
});

// ── Tab navigation cleanup ────────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") clearBadge(tabId);
});

// ── Relay messages from inject script to popup ────────────────────────────────
chrome.runtime.onMessage.addListener((msg: Message, _sender, _sendResponse) => {
  // RETURN_HTML is handled directly in the popup via onMessage in popup.ts
  // No relay needed — popup registers its own listener.
  void msg;
});
