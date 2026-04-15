import { openPanel, closePanel } from "../../src/content/ui/panel";
import type { CapturedContent } from "../../src/common/types";

const mockContent: CapturedContent = {
  html: "<h1>Article</h1><h2>Section</h2><p>Content here.</p>",
  title: "Test Article",
  byline: "Test Author",
  url: "https://example.com",
};

describe("openPanel", () => {
  afterEach(() => {
    document.getElementById("stk-reader-root")?.remove();
  });

  it("inserts #stk-reader-root into the document body", () => {
    openPanel(mockContent);
    expect(document.getElementById("stk-reader-root")).not.toBeNull();
  });

  it("is idempotent — calling twice leaves exactly one panel", () => {
    openPanel(mockContent);
    openPanel(mockContent);
    const panels = document.querySelectorAll("#stk-reader-root");
    expect(panels.length).toBe(1);
  });

  it("renders the captured html inside #stk-content", () => {
    openPanel(mockContent);
    const content = document.getElementById("stk-content");
    expect(content?.innerHTML).toContain("Content here.");
  });

  it("populates #stk-toc with anchor elements from headings", () => {
    openPanel(mockContent);
    const anchors = document.querySelectorAll("#stk-toc a");
    expect(anchors.length).toBeGreaterThan(0);
  });

  it("close button removes the panel", () => {
    openPanel(mockContent);
    const closeBtn = document.getElementById("stk-close") as HTMLButtonElement;
    closeBtn.click();
    expect(document.getElementById("stk-reader-root")).toBeNull();
  });
});

describe("closePanel", () => {
  it("removes the panel if it exists", () => {
    openPanel(mockContent);
    closePanel();
    expect(document.getElementById("stk-reader-root")).toBeNull();
  });

  it("does not throw if no panel exists", () => {
    expect(() => closePanel()).not.toThrow();
  });
});
