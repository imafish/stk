export interface DomainEntry {
  pattern: string;  // glob or exact hostname, e.g. "*.medium.com"
  selector: string; // CSS selector for main content element
}

export const DEFAULT_DOMAIN_LIST: DomainEntry[] = [
  { pattern: "*.wikipedia.org", selector: "#mw-content-text" },
  { pattern: "medium.com", selector: "article" },
  { pattern: "*.medium.com", selector: "article" },
  { pattern: "*.substack.com", selector: ".post-content" },
  { pattern: "news.ycombinator.com", selector: ".comment-tree" },
  { pattern: "github.com", selector: "article.markdown-body" },
];

export function globMatch(pattern: string, hostname: string): boolean {
  if (pattern.startsWith("*.")) {
    const domain = pattern.slice(2);
    return hostname === domain || hostname.endsWith("." + domain);
  }
  return hostname === pattern;
}

export function matchDomain(url: string, list: DomainEntry[]): string | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return null;
  }
  for (const entry of list) {
    if (globMatch(entry.pattern, hostname)) return entry.selector;
  }
  return null;
}
