import { CMD } from "../common/messages";
import type { Message } from "../common/messages";
import type { CapturedContent } from "../common/types";
import { STORAGE_KEYS } from "../common/types";
import { generateEpub } from "../epub/generator";
import { KindleDevice, KINDLE_DEVICES, DEFAULT_DEVICE, DEFAULT_FONT_SETTINGS } from "../epub/metadata";
import type { EpubMetadata, FontSettings } from "../epub/metadata";
import { downloadEpub, sendToKindle, loadDeliveryConfig } from "./delivery";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const modeAuto = document.getElementById("mode-auto") as HTMLInputElement;
const modeManuaL = document.getElementById("mode-manual") as HTMLInputElement;
const captureBtn = document.getElementById("capture-btn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLParagraphElement;
const metaForm = document.getElementById("metadata-form") as HTMLElement;
const titleInput = document.getElementById("title-input") as HTMLInputElement;
const authorInput = document.getElementById("author-input") as HTMLInputElement;
const langSelect = document.getElementById("lang-select") as HTMLSelectElement;
const fontFamily = document.getElementById("font-family") as HTMLSelectElement;
const fontSize = document.getElementById("font-size") as HTMLInputElement;
const lineHeight = document.getElementById("line-height") as HTMLInputElement;
const indent = document.getElementById("indent") as HTMLInputElement;
const deviceSel = document.getElementById("kindle-device") as HTMLSelectElement;
const downloadBtn = document.getElementById("download-btn") as HTMLButtonElement;
const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
const optionsLink = document.getElementById("options-link") as HTMLAnchorElement;

// ── State ─────────────────────────────────────────────────────────────────────
type State = "idle" | "capturing" | "captured" | "generating" | "ready" | "error";
let state: State = "idle";
let capturedContent: CapturedContent | null = null;
let generatedBuffer: ArrayBuffer | null = null;
let captureTimeout: ReturnType<typeof setTimeout> | null = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  populateDeviceSelect();
  loadSettings();
  bindEvents();
});

function populateDeviceSelect(): void {
  deviceSel.innerHTML = "";
  for (const [key, preset] of Object.entries(KINDLE_DEVICES)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = preset.label;
    if (key === DEFAULT_DEVICE) option.selected = true;
    deviceSel.appendChild(option);
  }
}

async function loadSettings(): Promise<void> {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.KINDLE_DEVICE,
    STORAGE_KEYS.FONT_SETTINGS,
  ]);
  if (data[STORAGE_KEYS.KINDLE_DEVICE]) {
    deviceSel.value = data[STORAGE_KEYS.KINDLE_DEVICE] as string;
  }
  const font = data[STORAGE_KEYS.FONT_SETTINGS] as FontSettings | undefined;
  if (font) {
    fontFamily.value = font.family;
    fontSize.value = String(font.sizePx);
    lineHeight.value = String(font.lineHeight);
    indent.value = String(font.indentEm);
  }
}

// ── Events ────────────────────────────────────────────────────────────────────
function bindEvents(): void {
  captureBtn.addEventListener("click", onCapture);
  downloadBtn.addEventListener("click", onDownload);
  sendBtn.addEventListener("click", onSend);
  optionsLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Listen for RETURN_HTML from inject script
  chrome.runtime.onMessage.addListener((msg: Message) => {
    if (msg.command === CMD.RETURN_HTML) {
      if (captureTimeout) clearTimeout(captureTimeout);
      capturedContent = { html: msg.html, title: msg.title, byline: msg.byline, url: msg.url };
      titleInput.value = msg.title;
      authorInput.value = msg.byline ?? "";
      setState("captured");
    }
  });
}

function setState(next: State, message = ""): void {
  state = next;
  statusEl.textContent = message;
  statusEl.className = "status";

  const isCapturing = next === "capturing";
  const isGenerating = next === "generating";
  const hasCapture = next === "captured" || next === "ready" || next === "generating";
  const isReady = next === "ready";

  captureBtn.disabled = isCapturing || isGenerating;
  metaForm.hidden = !hasCapture;
  downloadBtn.disabled = !isReady;
  sendBtn.disabled = !isReady;

  if (next === "capturing") {
    statusEl.textContent = "Capturing…";
  } else if (next === "generating") {
    statusEl.textContent = "Generating epub…";
  } else if (next === "error") {
    statusEl.className = "status";
    statusEl.textContent = message;
  } else if (next === "ready") {
    statusEl.className = "status ok";
    statusEl.textContent = "Ready! Choose download or send.";
  }
}

// ── Capture ───────────────────────────────────────────────────────────────────
async function onCapture(): Promise<void> {
  generatedBuffer = null;
  capturedContent = null;
  setState("capturing");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) { setState("error", "No active tab found."); return; }
  if (!tab.url?.startsWith("http")) {
    setState("error", "Cannot capture this page.");
    return;
  }

  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["inject.css"] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["inject.js"] });
  } catch {
    setState("error", "Cannot capture this page.");
    return;
  }

  const command = modeAuto.checked ? CMD.ACTIVATE_AUTO : CMD.ACTIVATE_MANUAL;
  chrome.tabs.sendMessage(tab.id, { command });

  // Timeout if inject script never responds
  captureTimeout = setTimeout(() => {
    if (state === "capturing") setState("error", "Capture timed out.");
  }, 30_000);
}

// ── Generate + Deliver ────────────────────────────────────────────────────────
function buildMetadata(): EpubMetadata {
  return {
    title: titleInput.value.trim() || "Untitled",
    author: authorInput.value.trim(),
    language: langSelect.value,
    sourceUrl: capturedContent?.url ?? "",
    device: deviceSel.value as KindleDevice,
    font: {
      family: fontFamily.value,
      sizePx: parseFloat(fontSize.value) || DEFAULT_FONT_SETTINGS.sizePx,
      lineHeight: parseFloat(lineHeight.value) || DEFAULT_FONT_SETTINGS.lineHeight,
      indentEm: parseFloat(indent.value) ?? DEFAULT_FONT_SETTINGS.indentEm,
    },
  };
}

async function ensureGenerated(): Promise<ArrayBuffer | null> {
  if (generatedBuffer) return generatedBuffer;
  if (!capturedContent) return null;

  setState("generating");
  const meta = buildMetadata();

  // Persist font + device choice
  await chrome.storage.local.set({
    [STORAGE_KEYS.KINDLE_DEVICE]: meta.device,
    [STORAGE_KEYS.FONT_SETTINGS]: meta.font,
  });

  try {
    generatedBuffer = await generateEpub(capturedContent, meta);
    setState("ready");
    return generatedBuffer;
  } catch (err) {
    setState("error", `Generation failed: ${(err as Error).message}`);
    return null;
  }
}

async function onDownload(): Promise<void> {
  const buf = await ensureGenerated();
  if (!buf) return;
  const meta = buildMetadata();
  downloadEpub(buf, meta.title);
}

async function onSend(): Promise<void> {
  const buf = await ensureGenerated();
  if (!buf) return;
  const config = await loadDeliveryConfig();
  if (!config) {
    setState("error", "Kindle email not configured. Open Options to set it up.");
    return;
  }
  const meta = buildMetadata();
  try {
    await sendToKindle(buf, meta.title, config);
    statusEl.className = "status ok";
    statusEl.textContent = "Sent to Kindle!";
  } catch (err) {
    setState("error", `Send failed: ${(err as Error).message}`);
  }
}
