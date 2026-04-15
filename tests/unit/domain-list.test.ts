import { globMatch, matchDomain, DEFAULT_DOMAIN_LIST } from "../../src/background/domain-list";

describe("globMatch", () => {
  it("matches exact hostname", () => {
    expect(globMatch("github.com", "github.com")).toBe(true);
  });

  it("does not match subdomains for exact pattern", () => {
    expect(globMatch("github.com", "api.github.com")).toBe(false);
  });

  it("wildcard *.example.com matches subdomain", () => {
    expect(globMatch("*.medium.com", "blog.medium.com")).toBe(true);
  });

  it("wildcard *.example.com matches the apex domain itself", () => {
    expect(globMatch("*.medium.com", "medium.com")).toBe(true);
  });

  it("wildcard does not match unrelated domain", () => {
    expect(globMatch("*.medium.com", "notmedium.com")).toBe(false);
  });

  it("wildcard does not match partial hostname end match", () => {
    expect(globMatch("*.medium.com", "fakemedium.com")).toBe(false);
  });
});

describe("matchDomain", () => {
  it("returns selector for wikipedia.org", () => {
    const result = matchDomain("https://en.wikipedia.org/wiki/Foo", DEFAULT_DOMAIN_LIST);
    expect(result).toBe("#mw-content-text");
  });

  it("returns selector for apex wikipedia.org", () => {
    const result = matchDomain("https://wikipedia.org/wiki/Foo", DEFAULT_DOMAIN_LIST);
    expect(result).toBe("#mw-content-text");
  });

  it("returns selector for medium.com", () => {
    expect(matchDomain("https://medium.com/@user/post", DEFAULT_DOMAIN_LIST)).toBe("article");
  });

  it("returns selector for subdomain of medium", () => {
    expect(matchDomain("https://blog.medium.com/post", DEFAULT_DOMAIN_LIST)).toBe("article");
  });

  it("returns null for unknown domain", () => {
    expect(matchDomain("https://unknowndomain123.com/", DEFAULT_DOMAIN_LIST)).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(matchDomain("not-a-url", DEFAULT_DOMAIN_LIST)).toBeNull();
  });

  it("uses custom list entry when provided", () => {
    const customList = [{ pattern: "custom.io", selector: "#custom" }];
    expect(matchDomain("https://custom.io/page", customList)).toBe("#custom");
  });
});
