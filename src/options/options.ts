import { STORAGE_KEYS } from "../common/types";
import type { FontSettings } from "../epub/metadata";
import { DEFAULT_FONT_SETTINGS } from "../epub/metadata";
import { DEFAULT_DOMAIN_LIST } from "../background/domain-list";
import type { DomainEntry } from "../background/domain-list";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const kindleEmailInput = document.getElementById("kindle-email") as HTMLInputElement;
const emailjsKeyInput = document.getElementById("emailjs-key") as HTMLInputElement;
const domainTbody = document.getElementById("domain-tbody") as HTMLTableSectionElement;
const newPatternInput = document.getElementById("new-pattern") as HTMLInputElement;
const newSelectorInput = document.getElementById("new-selector") as HTMLInputElement;
const addDomainBtn = document.getElementById("add-domain-btn") as HTMLButtonElement;
const resetDomainsBtn = document.getElementById("reset-domains") as HTMLButtonElement;
const fontFamilySel = document.getElementById("opt-font-family") as HTMLSelectElement;
const fontSizeInput = document.getElementById("opt-font-size") as HTMLInputElement;
const lineHeightInput = document.getElementById("opt-line-height") as HTMLInputElement;
const indentInput = document.getElementById("opt-indent") as HTMLInputElement;
const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLElement;

let currentDomainList: DomainEntry[] = [...DEFAULT_DOMAIN_LIST];

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  bindEvents();
});

async function loadSettings(): Promise<void> {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.KINDLE_EMAIL,
    STORAGE_KEYS.EMAILJS_KEY,
    STORAGE_KEYS.DOMAIN_LIST,
    STORAGE_KEYS.FONT_SETTINGS,
  ]);

  kindleEmailInput.value = (data[STORAGE_KEYS.KINDLE_EMAIL] as string) ?? "";
  emailjsKeyInput.value = (data[STORAGE_KEYS.EMAILJS_KEY] as string) ?? "";

  currentDomainList = (data[STORAGE_KEYS.DOMAIN_LIST] as DomainEntry[]) ?? [...DEFAULT_DOMAIN_LIST];
  renderDomainTable(currentDomainList);

  const font = (data[STORAGE_KEYS.FONT_SETTINGS] as FontSettings) ?? DEFAULT_FONT_SETTINGS;
  fontFamilySel.value = font.family;
  fontSizeInput.value = String(font.sizePx);
  lineHeightInput.value = String(font.lineHeight);
  indentInput.value = String(font.indentEm);
}

// ── Domain table ──────────────────────────────────────────────────────────────
function renderDomainTable(entries: DomainEntry[]): void {
  domainTbody.innerHTML = "";
  entries.forEach((entry, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(entry.pattern)}</td>
      <td>${escapeHtml(entry.selector)}</td>
      <td><button class="danger" data-idx="${idx}">✕</button></td>
    `;
    domainTbody.appendChild(tr);
  });

  domainTbody.querySelectorAll("button[data-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt((btn as HTMLElement).dataset["idx"]!, 10);
      currentDomainList.splice(idx, 1);
      renderDomainTable(currentDomainList);
    });
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Events ────────────────────────────────────────────────────────────────────
function bindEvents(): void {
  addDomainBtn.addEventListener("click", () => {
    const pattern = newPatternInput.value.trim();
    const selector = newSelectorInput.value.trim();
    if (!pattern || !selector) return;
    currentDomainList.push({ pattern, selector });
    renderDomainTable(currentDomainList);
    newPatternInput.value = "";
    newSelectorInput.value = "";
  });

  resetDomainsBtn.addEventListener("click", () => {
    currentDomainList = [...DEFAULT_DOMAIN_LIST];
    renderDomainTable(currentDomainList);
  });

  saveBtn.addEventListener("click", saveSettings);
}

function readFontSettings(): FontSettings {
  return {
    family: fontFamilySel.value,
    sizePx: parseFloat(fontSizeInput.value) || DEFAULT_FONT_SETTINGS.sizePx,
    lineHeight: parseFloat(lineHeightInput.value) || DEFAULT_FONT_SETTINGS.lineHeight,
    indentEm: parseFloat(indentInput.value) ?? DEFAULT_FONT_SETTINGS.indentEm,
  };
}

async function saveSettings(): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.KINDLE_EMAIL]: kindleEmailInput.value.trim(),
      [STORAGE_KEYS.EMAILJS_KEY]: emailjsKeyInput.value.trim(),
      [STORAGE_KEYS.DOMAIN_LIST]: currentDomainList,
      [STORAGE_KEYS.FONT_SETTINGS]: readFontSettings(),
    });
    showStatus("Saved!", "ok");
  } catch {
    showStatus("Save failed.", "err");
  }
}

function showStatus(msg: string, type: "ok" | "err"): void {
  statusEl.textContent = msg;
  statusEl.className = type;
  setTimeout(() => { statusEl.textContent = ""; statusEl.className = ""; }, 3000);
}
