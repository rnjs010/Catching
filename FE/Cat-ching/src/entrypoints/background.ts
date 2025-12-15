export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    sendResponse({ success: true });
    return true;
  });
});
