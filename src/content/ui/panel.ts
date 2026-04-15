import { buildTOC } from "./toc";
import type { CapturedContent } from "../../common/types";

const PANEL_ROOT_ID = "stk-reader-root";

export function openPanel(content: CapturedContent): void {
  // Idempotent: remove any existing panel first
  document.getElementById(PANEL_ROOT_ID)?.remove();

  document.body.insertAdjacentHTML("beforeend", `
    <div id="${PANEL_ROOT_ID}">
      <div id="stk-overlay"></div>
      <div id="stk-panel">
        <nav id="stk-toc" aria-label="Table of contents"></nav>
        <div id="stk-content">${content.html}</div>
        <button id="stk-close" aria-label="Close reader">✕</button>
      </div>
    </div>
  `);

  const contentEl = document.getElementById("stk-content");
  if (contentEl) {
    document.getElementById("stk-toc")!.appendChild(buildTOC(contentEl));
  }

  document.getElementById("stk-close")!.addEventListener("click", closePanel);
  document.getElementById("stk-overlay")!.addEventListener("click", closePanel);
}

export function closePanel(): void {
  document.getElementById(PANEL_ROOT_ID)?.remove();
}
