import { Readability } from "@mozilla/readability";
import type { CapturedContent } from "../../common/types";

export function autoExtract(selectorOverride?: string): CapturedContent {
  if (selectorOverride) {
    const el = document.querySelector(selectorOverride);
    if (el) {
      return {
        html: el.innerHTML,
        title: document.title,
        byline: null,
        url: location.href,
      };
    }
  }

  const clone = document.cloneNode(true) as Document;
  const reader = new Readability(clone);
  const article = reader.parse();

  return {
    html: article?.content ?? document.body.innerHTML,
    title: article?.title ?? document.title,
    byline: article?.byline ?? null,
    url: location.href,
  };
}
