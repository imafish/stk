export const HIGHLIGHT_CLASS = "stk-highlight";

export function addHighlight(el: Element): void {
  el.classList.add(HIGHLIGHT_CLASS);
}

export function removeHighlight(el: Element): void {
  el.classList.remove(HIGHLIGHT_CLASS);
}
