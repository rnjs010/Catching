type SelectionMessage =
  | { type: "SELECTION_UPDATE"; text: string }
  | { type: "SELECTION_COMPLETE" };

const SELECTION_TIMEOUT = 30_000;

export const detectJobDrag = () => {
  const startSelectionMonitor = (
    onUpdate: (text: string) => void
  ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      // @ts-ignore: WXT global browser object
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;

      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = (listener: (msg: SelectionMessage) => void) => {
        if (timeoutId) clearTimeout(timeoutId);
        browserAPI.runtime.onMessage.removeListener(listener);
      };

      try {
        const [tab] = await browserAPI.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab?.id) {
          reject(new Error("No active tab"));
          return;
        }

        await browserAPI.tabs.sendMessage(tab.id, {
          type: "START_SELECTION_MONITOR",
          realtime: true,
        });

        const listener = (message: SelectionMessage) => {
          if (message.type === "SELECTION_UPDATE") {
            onUpdate(message.text);
            return;
          }

          if (message.type === "SELECTION_COMPLETE") {
            cleanup(listener);
            resolve();
          }
        };

        browserAPI.runtime.onMessage.addListener(listener);

        timeoutId = setTimeout(() => {
          cleanup(listener);
          reject(new Error("Selection timeout"));
        }, SELECTION_TIMEOUT);
      } catch (error) {
        reject(error);
      }
    });
  };

  return { startSelectionMonitor };
};
