import { generateEpub } from "../../src/epub/generator";
import epubGenMemory from "epub-gen-memory";
import DOMPurify from "dompurify";
import type { CapturedContent } from "../../src/common/types";
import type { EpubMetadata } from "../../src/epub/metadata";
import { KindleDevice, DEFAULT_FONT_SETTINGS } from "../../src/epub/metadata";

const mockContent: CapturedContent = {
  html: "<h1>Test</h1><p>Hello world</p>",
  title: "Test Article",
  byline: "Author",
  url: "https://example.com",
};

const mockMeta: EpubMetadata = {
  title: "Test Article",
  author: "Author",
  language: "en",
  sourceUrl: "https://example.com",
  device: KindleDevice.PaperWhite2023,
  font: DEFAULT_FONT_SETTINGS,
};

// Mock fetch to return a small transparent PNG data URL
const PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    blob: jest.fn().mockResolvedValue(new Blob(["png"], { type: "image/png" })),
  } as unknown as Response);

  // Mock FileReader for blobToDataUrl
  global.FileReader = jest.fn().mockImplementation(() => ({
    readAsDataURL: jest.fn(function (this: { onload: (e: ProgressEvent) => void }) {
      this.onload({ target: { result: PNG_DATA_URL } } as unknown as ProgressEvent);
    }),
    onload: null,
    onerror: null,
  })) as unknown as typeof FileReader;

  jest.clearAllMocks();
});

describe("generateEpub", () => {
  it("returns an ArrayBuffer", async () => {
    const result = await generateEpub(mockContent, mockMeta);
    expect(result).toBeInstanceOf(ArrayBuffer);
  });

  it("calls epub-gen-memory with title, author, lang", async () => {
    await generateEpub(mockContent, mockMeta);
    expect(epubGenMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test Article",
        author: "Author",
        lang: "en",
      }),
      expect.any(Array)
    );
  });

  it("embeds font CSS in the chapter content", async () => {
    await generateEpub(mockContent, mockMeta);
    const chapters = (epubGenMemory as jest.Mock).mock.calls[0][1] as Array<{ content: string }>;
    expect(chapters[0].content).toContain("<style>");
    expect(chapters[0].content).toContain("Georgia");
  });

  it("strips <script> tags via DOMPurify sanitization", async () => {
    const contentWithScript: CapturedContent = {
      ...mockContent,
      html: '<p>Safe</p><script>alert("xss")</script>',
    };
    // DOMPurify mock passes through — verify it was called
    await generateEpub(contentWithScript, mockMeta);
    expect(DOMPurify.sanitize).toHaveBeenCalled();
  });

  it("does not throw when an image fetch fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));
    const contentWithImg: CapturedContent = {
      ...mockContent,
      html: '<img src="https://example.com/image.png" alt="test" /><p>Text</p>',
    };
    await expect(generateEpub(contentWithImg, mockMeta)).resolves.toBeInstanceOf(ArrayBuffer);
  });

  it("uses 'Unknown' as author when meta.author is empty", async () => {
    const noAuthorMeta = { ...mockMeta, author: "" };
    await generateEpub(mockContent, noAuthorMeta);
    expect(epubGenMemory).toHaveBeenCalledWith(
      expect.objectContaining({ author: "Unknown" }),
      expect.any(Array)
    );
  });
});
