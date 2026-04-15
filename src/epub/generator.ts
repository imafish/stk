import epubGenMemory from "epub-gen-memory";
import DOMPurify from "dompurify";
import type { CapturedContent } from "../common/types";
import type { EpubMetadata } from "./metadata";

const ALLOWED_TAGS = [
  "a", "abbr", "address", "article", "aside", "b", "blockquote", "br",
  "caption", "cite", "code", "col", "colgroup", "dd", "del", "details",
  "dfn", "div", "dl", "dt", "em", "figcaption", "figure", "footer", "h1",
  "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "ins", "kbd",
  "li", "main", "mark", "nav", "ol", "p", "pre", "q", "s", "section",
  "small", "span", "strong", "sub", "summary", "sup", "table", "tbody",
  "td", "tfoot", "th", "thead", "time", "tr", "u", "ul", "var", "wbr",
];

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "src", "alt", "title", "id", "class", "style", "colspan", "rowspan"],
    FORCE_BODY: true,
  });
}

async function resolveImages(html: string, baseUrl: string): Promise<string> {
  const container = document.createElement("div");
  container.innerHTML = html;

  const images = Array.from(container.querySelectorAll("img[src]"));
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src) return;
      let absoluteUrl: string;
      try {
        absoluteUrl = new URL(src, baseUrl).href;
      } catch {
        img.removeAttribute("src");
        return;
      }
      try {
        const response = await fetch(absoluteUrl, { mode: "cors", credentials: "include" });
        if (!response.ok) { img.removeAttribute("src"); return; }
        const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);
        img.setAttribute("src", dataUrl);
      } catch {
        img.removeAttribute("src");
      }
    })
  );

  return container.innerHTML;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

function buildFontCSS(font: EpubMetadata["font"]): string {
  return `
    body {
      font-family: ${font.family}, Georgia, serif;
      font-size: ${font.sizePx}px;
      line-height: ${font.lineHeight};
      margin: 1em 1.5em;
    }
    p {
      text-indent: ${font.indentEm}em;
      margin: 0;
    }
    img { max-width: 100%; height: auto; }
  `.trim();
}

export async function generateEpub(
  content: CapturedContent,
  meta: EpubMetadata,
): Promise<ArrayBuffer> {
  const resolvedHtml = await resolveImages(content.html, content.url);
  const cleanHtml = sanitize(resolvedHtml);
  const fontCss = buildFontCSS(meta.font);

  const epubContent = `<style>${fontCss}</style>${cleanHtml}`;

  const buf = await epubGenMemory(
    {
      title: meta.title,
      author: meta.author || "Unknown",
      lang: meta.language,
      prependChapterTitles: false,
    },
    [{ title: meta.title, content: epubContent }]
  );
  // epub-gen-memory returns a Buffer in Node context; ArrayBuffer in browser
  if (buf instanceof ArrayBuffer) return buf;
  const typed = buf as unknown as Uint8Array;
  return typed.buffer.slice(typed.byteOffset, typed.byteOffset + typed.byteLength) as ArrayBuffer;
}
