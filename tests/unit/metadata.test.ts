import {
  KindleDevice,
  KINDLE_DEVICES,
  DEFAULT_DEVICE,
  DEFAULT_FONT_SETTINGS,
} from "../../src/epub/metadata";

describe("KINDLE_DEVICES", () => {
  it("has an entry for every KindleDevice enum value", () => {
    for (const key of Object.values(KindleDevice)) {
      expect(KINDLE_DEVICES[key]).toBeDefined();
    }
  });

  it("each preset has widthPx, heightPx, and defaultFontSizePx", () => {
    for (const preset of Object.values(KINDLE_DEVICES)) {
      expect(typeof preset.widthPx).toBe("number");
      expect(preset.widthPx).toBeGreaterThan(0);
      expect(typeof preset.heightPx).toBe("number");
      expect(preset.heightPx).toBeGreaterThan(0);
      expect(typeof preset.defaultFontSizePx).toBe("number");
      expect(preset.defaultFontSizePx).toBeGreaterThan(0);
      expect(typeof preset.label).toBe("string");
      expect(preset.label.length).toBeGreaterThan(0);
    }
  });

  it("DEFAULT_DEVICE is a valid KindleDevice", () => {
    expect(Object.values(KindleDevice)).toContain(DEFAULT_DEVICE);
  });
});

describe("DEFAULT_FONT_SETTINGS", () => {
  it("has all required fields", () => {
    expect(typeof DEFAULT_FONT_SETTINGS.family).toBe("string");
    expect(DEFAULT_FONT_SETTINGS.family.length).toBeGreaterThan(0);
    expect(typeof DEFAULT_FONT_SETTINGS.sizePx).toBe("number");
    expect(DEFAULT_FONT_SETTINGS.sizePx).toBeGreaterThan(0);
    expect(typeof DEFAULT_FONT_SETTINGS.lineHeight).toBe("number");
    expect(DEFAULT_FONT_SETTINGS.lineHeight).toBeGreaterThan(0);
    expect(typeof DEFAULT_FONT_SETTINGS.indentEm).toBe("number");
    expect(DEFAULT_FONT_SETTINGS.indentEm).toBeGreaterThanOrEqual(0);
  });
});
