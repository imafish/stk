import { activateTab, buildContextMenu } from "../../src/background/background";
import { CMD } from "../../src/common/messages";
import { STORAGE_KEYS } from "../../src/common/types";

// chrome mock is set up in tests/setup.ts

describe("buildContextMenu", () => {
  it("calls contextMenus.removeAll then creates menu items", () => {
    buildContextMenu();
    expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: "stk-root" })
    );
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: "stk-auto", parentId: "stk-root" })
    );
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: "stk-manual", parentId: "stk-root" })
    );
  });
});

describe("activateTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({});
    (chrome.tabs.get as jest.Mock).mockResolvedValue({ id: 1, url: "https://example.com" });
  });

  it("calls insertCSS before executeScript", async () => {
    const order: string[] = [];
    (chrome.scripting.insertCSS as jest.Mock).mockImplementation(async () => { order.push("css"); });
    (chrome.scripting.executeScript as jest.Mock).mockImplementation(async () => { order.push("js"); });

    await activateTab(1, "auto");
    expect(order).toEqual(["css", "js"]);
  });

  it("sends ACTIVATE_AUTO for auto mode", async () => {
    await activateTab(1, "auto");
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ command: CMD.ACTIVATE_AUTO })
    );
  });

  it("sends ACTIVATE_MANUAL for manual mode", async () => {
    await activateTab(1, "manual");
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ command: CMD.ACTIVATE_MANUAL })
    );
  });

  it("includes selectorOverride when domain list matches", async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      [STORAGE_KEYS.DOMAIN_LIST]: [{ pattern: "example.com", selector: "#main" }],
    });
    (chrome.tabs.get as jest.Mock).mockResolvedValue({ id: 1, url: "https://example.com/page" });

    await activateTab(1, "auto");
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ command: CMD.ACTIVATE_AUTO, selectorOverride: "#main" })
    );
  });

  it("does not include selectorOverride when domain not in list", async () => {
    await activateTab(1, "auto");
    const callArgs = (chrome.tabs.sendMessage as jest.Mock).mock.calls[0][1];
    expect(callArgs.selectorOverride).toBeUndefined();
  });

  it("sets badge after activation", async () => {
    await activateTab(1, "auto");
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ tabId: 1, text: "ON" });
    expect(chrome.action.setTitle).toHaveBeenCalledWith({ tabId: 1, title: "STK (active)" });
  });
});
