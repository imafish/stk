// Jest global setup — mock chrome APIs
const chromeMock = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
    },
    onChanged: {
      addListener: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
    },
    getURL: jest.fn((path: string) => `chrome-extension://fakeid/${path}`),
    openOptionsPage: jest.fn(),
  },
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1, url: "https://example.com" }]),
    get: jest.fn().mockResolvedValue({ id: 1, url: "https://example.com" }),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onUpdated: {
      addListener: jest.fn(),
    },
    onRemoved: {
      addListener: jest.fn(),
    },
  },
  scripting: {
    insertCSS: jest.fn().mockResolvedValue(undefined),
    executeScript: jest.fn().mockResolvedValue(undefined),
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    setTitle: jest.fn(),
    getTitle: jest.fn().mockResolvedValue("STK – Send to Kindle"),
    onClicked: { addListener: jest.fn() },
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn((cb?: () => void) => cb && cb()),
    onClicked: { addListener: jest.fn() },
  },
};

(global as unknown as { chrome: typeof chromeMock }).chrome = chromeMock;
