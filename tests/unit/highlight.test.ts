import { addHighlight, removeHighlight, HIGHLIGHT_CLASS } from "../../src/content/ui/highlight";

describe("highlight helpers", () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement("div");
    document.body.appendChild(el);
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  it("addHighlight adds the stk-highlight class", () => {
    addHighlight(el);
    expect(el.classList.contains(HIGHLIGHT_CLASS)).toBe(true);
  });

  it("removeHighlight removes the stk-highlight class", () => {
    el.classList.add(HIGHLIGHT_CLASS);
    removeHighlight(el);
    expect(el.classList.contains(HIGHLIGHT_CLASS)).toBe(false);
  });

  it("addHighlight is idempotent — class added only once", () => {
    addHighlight(el);
    addHighlight(el);
    const count = el.className.split(/\s+/).filter(c => c === HIGHLIGHT_CLASS).length;
    expect(count).toBe(1);
  });

  it("removeHighlight does not throw if class is not present", () => {
    expect(() => removeHighlight(el)).not.toThrow();
  });
});
