import { Readability } from "@mozilla/readability";
import { autoExtract } from "../../src/content/extractor/auto";

describe("autoExtract", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    document.title = "Page Title";
    document.body.innerHTML = "<p>Body content</p>";
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "https://example.com/article" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
    jest.clearAllMocks();
  });

  it("returns Readability article content when parse succeeds", () => {
    const result = autoExtract();
    expect(result.html).toBe("<div><p>Mock article content.</p></div>");
    expect(result.title).toBe("Mock Article Title");
    expect(result.byline).toBe("Mock Author");
    expect(result.url).toBe("https://example.com/article");
  });

  it("falls back to document.body.innerHTML when Readability returns null", () => {
    (Readability as jest.Mock).mockImplementationOnce(() => ({
      parse: jest.fn().mockReturnValue(null),
    }));
    const result = autoExtract();
    expect(result.html).toBe("<p>Body content</p>");
    expect(result.title).toBe("Page Title");
    expect(result.byline).toBeNull();
  });

  it("uses selectorOverride to extract content when provided and selector matches", () => {
    document.body.innerHTML = '<article id="main"><p>Article text</p></article><aside>Sidebar</aside>';
    const result = autoExtract("#main");
    expect(result.html).toContain("Article text");
  });

  it("falls back to Readability when selectorOverride has no match", () => {
    const result = autoExtract("#nonexistent");
    expect(result.title).toBe("Mock Article Title");
  });
});
