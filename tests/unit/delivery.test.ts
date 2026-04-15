import { downloadEpub, sanitizeFilename, sendToKindle, loadDeliveryConfig } from "../../src/popup/delivery";
import emailjs from "emailjs-com";
import { STORAGE_KEYS } from "../../src/common/types";

// ── Filename sanitization ─────────────────────────────────────────────────────
describe("sanitizeFilename", () => {
  it.each([
    ["normal title", "normal title"],
    ["title/with/slashes", "title_with_slashes"],
    ["title\\with\\backslash", "title_with_backslash"],
    ['title:with*chars?"<>|', "title_with_chars_____"],
    ["  spaces  ", "spaces"],
    ["", "article"],
    ["   ", "article"],
  ])("sanitizes '%s' → '%s'", (input, expected) => {
    expect(sanitizeFilename(input)).toBe(expected);
  });
});

// ── Download ──────────────────────────────────────────────────────────────────
describe("downloadEpub", () => {
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    createObjectURL = jest.fn().mockReturnValue("blob:fake-url");
    revokeObjectURL = jest.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    appendChildSpy = jest.spyOn(document.body, "appendChild").mockImplementation((el) => el);
    removeChildSpy = jest.spyOn(document.body, "removeChild").mockImplementation((el) => el);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("creates a blob URL and triggers a download anchor", () => {
    const buf = new ArrayBuffer(8);
    downloadEpub(buf, "My Article");
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe("My Article.epub");
    expect(anchor.href).toContain("fake-url");
  });

  it("calls revokeObjectURL after 1 second", () => {
    downloadEpub(new ArrayBuffer(4), "Test");
    expect(revokeObjectURL).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("sanitizes filename in download attribute", () => {
    downloadEpub(new ArrayBuffer(4), "Article: The Story?");
    const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe("Article_ The Story_.epub");
  });
});

// ── EmailJS ───────────────────────────────────────────────────────────────────
describe("sendToKindle", () => {
  const config = {
    serviceId: "svc",
    templateId: "tmpl",
    publicKey: "key",
    kindleEmail: "user@kindle.com",
  };

  it("calls emailjs.send with to_email and epub_filename", async () => {
    const buf = new ArrayBuffer(4);
    await sendToKindle(buf, "My Book", config);
    expect(emailjs.send).toHaveBeenCalledWith(
      "svc",
      "tmpl",
      expect.objectContaining({
        to_email: "user@kindle.com",
        epub_filename: "My Book.epub",
      }),
      "key"
    );
  });

  it("includes a base64 epub_base64 string", async () => {
    await sendToKindle(new ArrayBuffer(3), "Book", config);
    const params = (emailjs.send as jest.Mock).mock.calls[0][2] as Record<string, string>;
    expect(typeof params["epub_base64"]).toBe("string");
    expect(params["epub_base64"].length).toBeGreaterThan(0);
  });
});

// ── loadDeliveryConfig ────────────────────────────────────────────────────────
describe("loadDeliveryConfig", () => {
  it("returns null when KINDLE_EMAIL is not set", async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValueOnce({
      [STORAGE_KEYS.EMAILJS_KEY]: "key",
    });
    expect(await loadDeliveryConfig()).toBeNull();
  });

  it("returns null when EMAILJS_KEY is not set", async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValueOnce({
      [STORAGE_KEYS.KINDLE_EMAIL]: "user@kindle.com",
    });
    expect(await loadDeliveryConfig()).toBeNull();
  });

  it("returns config when both keys are set", async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValueOnce({
      [STORAGE_KEYS.KINDLE_EMAIL]: "user@kindle.com",
      [STORAGE_KEYS.EMAILJS_KEY]: "mykey",
    });
    const config = await loadDeliveryConfig();
    expect(config).not.toBeNull();
    expect(config!.kindleEmail).toBe("user@kindle.com");
    expect(config!.publicKey).toBe("mykey");
  });
});
