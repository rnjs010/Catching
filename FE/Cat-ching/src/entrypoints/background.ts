import { Runtime } from "webextension-polyfill";

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    sendResponse({ success: true });
    return true;
  });

  browser.runtime.onConnect.addListener((port: Runtime.Port) => {
    console.log("팝업 연결됨:", port.name);

    // 팝업이 닫히거나 연결이 끊어졌을 때 실행
    port.onDisconnect.addListener(function () {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs: any[]) => {
          const tab = tabs[0];
          if (!tab?.id) return;

          browser.tabs.sendMessage(tab.id, { type: "CANCEL_CROP" });
        });
    });
  });
});
