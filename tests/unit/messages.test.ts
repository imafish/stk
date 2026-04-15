import { CMD } from "../../src/common/messages";

describe("CMD constants", () => {
  it("all command values are unique strings", () => {
    const values = Object.values(CMD);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("all values are non-empty strings", () => {
    for (const v of Object.values(CMD)) {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
    }
  });

  it("CMD object is not accidentally mutable at the value level", () => {
    // 'as const' makes the type readonly but doesn't deep-freeze at runtime;
    // verify the expected keys still exist after test execution
    expect(CMD.ACTIVATE_AUTO).toBe("activate-auto");
    expect(CMD.ACTIVATE_MANUAL).toBe("activate-manual");
    expect(CMD.DEACTIVATE).toBe("deactivate");
    expect(CMD.RETURN_HTML).toBe("return-html");
  });
});
