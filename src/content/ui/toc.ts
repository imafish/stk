const RECURSE_TAGS = new Set(["DIV", "UL", "OL", "LI", "ARTICLE", "SECTION", "MAIN"]);
const HEADING_RE = /^H([1-5])$/i;

export function buildTOC(root: Element): HTMLUListElement {
  const rootUl = document.createElement("ul");
  let current: HTMLElement = rootUl;
  let currentLevel = 0;
  let counter = 0;

  function walk(node: Element): void {
    for (let child = node.firstElementChild; child; child = child.nextElementSibling) {
      const match = child.tagName.match(HEADING_RE);
      if (match) {
        const level = parseInt(match[1], 10);
        if (level > currentLevel) {
          const nested = document.createElement("ul");
          current.appendChild(nested);
          current = nested;
        } else {
          while (level < currentLevel && current.parentElement) {
            current = current.parentElement as HTMLElement;
            currentLevel--;
          }
        }
        currentLevel = level;

        const id = `stk-heading-${counter++}`;
        (child as HTMLElement).id = id;

        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `#${id}`;
        a.textContent = child.textContent ?? "";
        li.appendChild(a);
        current.appendChild(li);
      } else if (RECURSE_TAGS.has(child.tagName)) {
        walk(child);
      }
    }
  }

  walk(root);
  return rootUl;
}
