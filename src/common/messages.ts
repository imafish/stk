export const CMD = {
  // background → content
  ACTIVATE_AUTO: "activate-auto",
  ACTIVATE_MANUAL: "activate-manual",
  DEACTIVATE: "deactivate",
  // content → background / popup
  CONTENT_READY: "content-ready",
  RETURN_HTML: "return-html",
  DEACTIVATE_ACK: "deactivate-ack",
} as const;

export type CmdValue = typeof CMD[keyof typeof CMD];

export type Message =
  | { command: typeof CMD.ACTIVATE_AUTO; selectorOverride?: string }
  | { command: typeof CMD.ACTIVATE_MANUAL }
  | { command: typeof CMD.DEACTIVATE }
  | { command: typeof CMD.RETURN_HTML; html: string; title: string; byline: string | null; url: string }
  | { command: typeof CMD.CONTENT_READY }
  | { command: typeof CMD.DEACTIVATE_ACK };
