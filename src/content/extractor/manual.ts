import type { CapturedContent } from "../../common/types";
import { addHighlight, removeHighlight } from "../ui/highlight";

const ACCEPTED_TAGS = new Set(["DIV", "BODY", "TD", "SECTION", "ARTICLE", "MAIN"]);

export function findContainer(el: Element | null): Element {
  if (!el || el === document.body) return document.body;
  if (ACCEPTED_TAGS.has(el.tagName)) return el;
  return findContainer(el.parentElement);
}

export function startManualSelection(onCapture: (content: CapturedContent) => void): () => void {
  let lastHighlighted: Element | null = null;

  const onMouseOver = (e: MouseEvent) => {
    const target = e.target as Element;
    const container = findContainer(target);
    if (lastHighlighted && lastHighlighted !== container) {
      removeHighlight(lastHighlighted);
    }
    addHighlight(container);
    lastHighlighted = container;
  };

  const onMouseOut = (e: MouseEvent) => {
    const target = e.target as Element;
    const container = findContainer(target);
    removeHighlight(container);
    if (lastHighlighted === container) lastHighlighted = null;
  };

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    teardown();

    const target = e.target as Element;
    const container = findContainer(target);
    removeHighlight(container);

    onCapture({
      html: container.innerHTML,
      title: document.title,
      byline: null,
      url: location.href,
    });
  };

  document.body.addEventListener("mouseover", onMouseOver);
  document.body.addEventListener("mouseout", onMouseOut);
  document.body.addEventListener("click", onClick, { capture: true });
  document.body.style.cursor = "crosshair";

  function teardown() {
    document.body.removeEventListener("mouseover", onMouseOver);
    document.body.removeEventListener("mouseout", onMouseOut);
    document.body.removeEventListener("click", onClick, { capture: true });
    document.body.style.cursor = "";
    if (lastHighlighted) removeHighlight(lastHighlighted);
  }

  return teardown;
}
