export interface CapturedContent {
  html: string;
  title: string;
  byline: string | null;
  url: string;
}

export const STORAGE_KEYS = {
  KINDLE_EMAIL: "stk_kindle_email",
  EMAILJS_KEY: "stk_emailjs_key",
  KINDLE_DEVICE: "stk_kindle_device",
  FONT_SETTINGS: "stk_font_settings",
  DOMAIN_LIST: "stk_domain_list",
} as const;
