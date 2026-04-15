import { CMD } from "../common/messages";
import type { Message } from "../common/messages";
import { autoExtract } from "./extractor/auto";
import { startManualSelection } from "./extractor/manual";

declare global {
  interface Window { INJECTED?: boolean; }
}

if (!window.INJECTED) {
  let manualTeardown: (() => void) | null = null;

  chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
    if (msg.command === CMD.ACTIVATE_AUTO) {
      const content = autoExtract(msg.selectorOverride);
      chrome.runtime.sendMessage({
        command: CMD.RETURN_HTML,
        html: content.html,
        title: content.title,
        byline: content.byline,
        url: content.url,
      });
      sendResponse({ ok: true });
    } else if (msg.command === CMD.ACTIVATE_MANUAL) {
      manualTeardown = startManualSelection((content) => {
        chrome.runtime.sendMessage({
          command: CMD.RETURN_HTML,
          html: content.html,
          title: content.title,
          byline: content.byline,
          url: content.url,
        });
      });
      sendResponse({ ok: true });
    } else if (msg.command === CMD.DEACTIVATE) {
      manualTeardown?.();
      manualTeardown = null;
      chrome.runtime.sendMessage({ command: CMD.DEACTIVATE_ACK });
      sendResponse({ ok: true });
    }
    // Return false: all responses are synchronous
    return false;
  });

  window.INJECTED = true;
}
