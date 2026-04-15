import emailjs from "emailjs-com";
import { STORAGE_KEYS } from "../common/types";

// ── Download ──────────────────────────────────────────────────────────────────
export function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "_").trim() || "article";
}

export function downloadEpub(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], { type: "application/epub+zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeFilename(filename) + ".epub";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── EmailJS ───────────────────────────────────────────────────────────────────
export interface EmailDeliveryConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  kindleEmail: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function sendToKindle(
  buffer: ArrayBuffer,
  filename: string,
  config: EmailDeliveryConfig,
): Promise<void> {
  const base64 = arrayBufferToBase64(buffer);
  await emailjs.send(
    config.serviceId,
    config.templateId,
    {
      to_email: config.kindleEmail,
      epub_filename: sanitizeFilename(filename) + ".epub",
      epub_base64: base64,
    },
    config.publicKey,
  );
}

export async function loadDeliveryConfig(): Promise<EmailDeliveryConfig | null> {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.KINDLE_EMAIL,
    STORAGE_KEYS.EMAILJS_KEY,
  ]);
  const email = result[STORAGE_KEYS.KINDLE_EMAIL] as string | undefined;
  const apiKey = result[STORAGE_KEYS.EMAILJS_KEY] as string | undefined;
  if (!email || !apiKey) return null;
  return {
    serviceId: "default_service",
    templateId: "stk_kindle",
    publicKey: apiKey,
    kindleEmail: email,
  };
}
