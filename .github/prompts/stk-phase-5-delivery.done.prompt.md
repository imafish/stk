---
description: "STK Phase 5 — Delivery. Implements epub download via Blob URL and EmailJS send to Kindle email address. No backend required."
name: "STK Phase 5: Delivery"
agent: "agent"
---

# STK Phase 5: Delivery

Implement the two delivery methods: direct `.epub` download and sending the epub to the user's Kindle email address via EmailJS.

Prerequisite: Phase 3 (ePub generation) must be complete.

## `src/popup/delivery.ts`

### Download

```typescript
export function downloadEpub(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], { type: "application/epub+zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeFilename(filename) + ".epub";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a short delay to allow the download to start
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeFilename(name: string): string {
  // Replace characters not safe in filenames: / \ : * ? " < > |
  return name.replace(/[/\\:*?"<>|]/g, "_").trim() || "article";
}
```

### EmailJS send

```typescript
import emailjs from "emailjs-com";

export interface EmailDeliveryConfig {
  serviceId: string;    // from EmailJS dashboard
  templateId: string;   // template must accept: to_email, epub_filename, epub_base64
  publicKey: string;    // EmailJS public key (stored in chrome.storage.local)
  kindleEmail: string;  // user's @kindle.com address
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
      to_email:      config.kindleEmail,
      epub_filename: sanitizeFilename(filename) + ".epub",
      epub_base64:   base64,
    },
    config.publicKey,
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
```

### Config loading helper

```typescript
export async function loadDeliveryConfig(): Promise<EmailDeliveryConfig | null> {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.KINDLE_EMAIL,
    STORAGE_KEYS.EMAILJS_KEY,
  ]);
  if (!result[STORAGE_KEYS.KINDLE_EMAIL] || !result[STORAGE_KEYS.EMAILJS_KEY]) return null;
  return {
    serviceId:   "default_service",   // EmailJS default service or user-configured
    templateId:  "stk_kindle",        // template ID from EmailJS
    publicKey:   result[STORAGE_KEYS.EMAILJS_KEY],
    kindleEmail: result[STORAGE_KEYS.KINDLE_EMAIL],
  };
}
```

## EmailJS Setup Notes

Document in the options page help text:
1. Create a free account at https://emailjs.com
2. Add an Email Service (Gmail, Outlook, etc.)
3. Create an Email Template with variables: `{{to_email}}`, `{{epub_filename}}`, `{{epub_base64}}`
4. Copy the **Public Key** and paste into STK options
5. Note: Kindle email must be added to "Approved senders" on Amazon's account settings

## Unit Tests to Add (`tests/unit/`)

### `delivery.test.ts`
- Mock `URL.createObjectURL` and `URL.revokeObjectURL`
- Assert `downloadEpub()` creates an `<a>` element with correct `download` attribute
- Assert `downloadEpub()` calls `URL.revokeObjectURL` after timeout
- Assert `sanitizeFilename` replaces `:`, `?`, `*`, `/`, `\`, `"`, `<`, `>`, `|` with `_`
- Assert `sanitizeFilename` returns `"article"` for empty or whitespace-only input
- Mock `emailjs.send` — assert it is called with correct `to_email` and `epub_filename`
- Assert `loadDeliveryConfig()` returns `null` when Kindle email is not set in storage

## Acceptance Criteria

- [ ] Download button triggers a browser download of a valid `.epub` file
- [ ] Downloaded filename derived from article title with unsafe chars replaced
- [ ] "Send to Kindle" calls EmailJS with the epub attached as base64
- [ ] Sending without a configured Kindle email shows an error message (not a JS exception)
- [ ] All unit tests pass (`npm test`)
