export const detectJobDrag = () => {
  const startSelectionMonitor = async (
    onUpdate: (text: string) => void
  ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        // @ts-ignore: WXT global browser object
        const browserAPI = typeof browser !== "undefined" ? browser : chrome;

        const [tab] = await browserAPI.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab?.id) {
          reject(new Error("No active tab"));
          return;
        }

        // Content script에 선택 모니터링 시작 메시지 전송
        await browserAPI.tabs.sendMessage(tab.id, {
          type: "START_SELECTION_MONITOR",
          realtime: true, // 실시간 업데이트 모드 (현재 사용 X)
        });

        // 실시간 업데이트 및 완료 메시지를 기다림
        const listener = (message: any) => {
          if (
            message.type === "SELECTION_UPDATE" &&
            message.text !== undefined
          ) {
            // 실시간 업데이트
            onUpdate(message.text);
          }

          if (message.type === "SELECTION_COMPLETE") {
            browserAPI.runtime.onMessage.removeListener(listener);
            resolve();
          }
        };

        browserAPI.runtime.onMessage.addListener(listener);

        // 타임아웃 설정 (30초)
        setTimeout(() => {
          browserAPI.runtime.onMessage.removeListener(listener);
          reject(new Error("Selection timeout"));
        }, 30000);
      } catch (error) {
        reject(error);
      }
    });
  };

  return { startSelectionMonitor };
};
