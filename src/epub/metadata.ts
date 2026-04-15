export interface FontSettings {
  family: string;
  sizePx: number;
  lineHeight: number;
  indentEm: number;
}

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  family: "Georgia",
  sizePx: 16,
  lineHeight: 1.6,
  indentEm: 1.5,
};

export enum KindleDevice {
  PaperWhite2023 = "paperwhite2023",
  Oasis = "oasis",
  Scribe = "scribe",
  Basic2022 = "basic2022",
}

export interface KindleDevicePreset {
  label: string;
  widthPx: number;
  heightPx: number;
  defaultFontSizePx: number;
}

export const KINDLE_DEVICES: Record<KindleDevice, KindleDevicePreset> = {
  [KindleDevice.PaperWhite2023]: {
    label: "Kindle PaperWhite (2023)",
    widthPx: 1236,
    heightPx: 1648,
    defaultFontSizePx: 16,
  },
  [KindleDevice.Oasis]: {
    label: "Kindle Oasis",
    widthPx: 1264,
    heightPx: 1680,
    defaultFontSizePx: 16,
  },
  [KindleDevice.Scribe]: {
    label: "Kindle Scribe",
    widthPx: 1860,
    heightPx: 2480,
    defaultFontSizePx: 18,
  },
  [KindleDevice.Basic2022]: {
    label: "Kindle Basic (2022)",
    widthPx: 1072,
    heightPx: 1448,
    defaultFontSizePx: 15,
  },
};

export const DEFAULT_DEVICE = KindleDevice.PaperWhite2023;

export interface EpubMetadata {
  title: string;
  author: string;
  language: string;
  sourceUrl: string;
  device: KindleDevice;
  font: FontSettings;
}
