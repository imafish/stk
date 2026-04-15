import { buildTOC } from "../../src/content/ui/toc";

function makeDOM(html: string): HTMLDivElement {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div;
}

describe("buildTOC", () => {
  it("returns an empty <ul> when there are no headings", () => {
    const root = makeDOM("<p>No headings here</p>");
    const toc = buildTOC(root);
    expect(toc.tagName).toBe("UL");
    expect(toc.querySelectorAll("li").length).toBe(0);
  });

  it("creates one <li> per heading", () => {
    const root = makeDOM("<h1>Title</h1><h2>Section</h2><h3>Sub</h3>");
    const toc = buildTOC(root);
    expect(toc.querySelectorAll("li").length).toBe(3);
  });

  it("assigns id attributes to headings", () => {
    const root = makeDOM("<h1>First</h1><h2>Second</h2>");
    buildTOC(root);
    const h1 = root.querySelector("h1")!;
    const h2 = root.querySelector("h2")!;
    expect(h1.id).toMatch(/^stk-heading-\d+$/);
    expect(h2.id).toMatch(/^stk-heading-\d+$/);
    expect(h1.id).not.toBe(h2.id);
  });

  it("sets href on anchor to match heading id", () => {
    const root = makeDOM("<h1>Alpha</h1>");
    const toc = buildTOC(root);
    const h1 = root.querySelector("h1")!;
    const a = toc.querySelector("a")!;
    expect(a.getAttribute("href")).toBe(`#${h1.id}`);
  });

  it("uses heading text content inside anchor", () => {
    const root = makeDOM("<h2>My Section</h2>");
    const toc = buildTOC(root);
    expect(toc.querySelector("a")!.textContent).toBe("My Section");
  });

  it("creates nested <ul> for deeper headings", () => {
    const root = makeDOM("<h1>Top</h1><h2>Sub</h2>");
    const toc = buildTOC(root);
    // h2 should be inside a nested <ul>
    const nestedUl = toc.querySelector("ul");
    expect(nestedUl).not.toBeNull();
    expect(nestedUl!.querySelectorAll("li").length).toBeGreaterThan(0);
  });

  it("traverses into div/section/article containers to find headings", () => {
    const root = makeDOM("<article><section><h1>Deep</h1></section></article>");
    const toc = buildTOC(root);
    expect(toc.querySelectorAll("li").length).toBe(1);
    expect(toc.querySelector("a")!.textContent).toBe("Deep");
  });
});
