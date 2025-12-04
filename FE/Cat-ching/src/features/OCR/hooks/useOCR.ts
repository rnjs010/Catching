import { createWorker } from "tesseract.js";

export const useOCR = () => {
  const captureAndOCR = async (onOCRStart?: () => void): Promise<string> => {
    try {
      // @ts-ignore: WXT global browser object
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;

      // 전체 화면 캡처
      const fullScreenshot = await browserAPI.tabs.captureVisibleTab(
        undefined,
        {
          format: "png",
        }
      );

      // Content script에 크롭 UI 표시 요청
      const [tab] = await browserAPI.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) throw new Error("No active tab");

      // Content script에 메시지 전송하여 크롭 UI 활성화
      const cropResult = await browserAPI.tabs.sendMessage(tab.id, {
        type: "START_CROP",
        screenshot: fullScreenshot,
      });

      if (!cropResult || !cropResult.croppedImage) {
        throw new Error("Crop cancelled");
      }

      // 크롭 완료, OCR 처리 시작 알림
      if (onOCRStart) {
        onOCRStart();
      }

      const worker = await createWorker("kor+eng", 1, {
        corePath: browserAPI.runtime.getURL(
          "/tesseract/tesseract-core.wasm.js"
        ),
        workerPath: browserAPI.runtime.getURL("/tesseract/worker.min.js"),
        langPath: browserAPI.runtime.getURL("/tesseract"),
        workerBlobURL: false,
        gzip: false,
      });

      const result = await worker.recognize(cropResult.croppedImage);
      await worker.terminate();

      // OCR 결과 텍스트 정리
      const cleanedText = result.data.text
        .trim()
        .replace(/\s+/g, " ") // 연속된 공백을 하나로
        .replace(/\n+/g, " ") // 줄바꿈을 공백으로
        // 한글 글자 사이의 공백 제거 (예: "경 영 기 획" -> "경영기획")
        .replace(/([가-힣])\s+(?=[가-힣])/g, "$1")
        .trim();

      return cleanedText;
    } catch (error) {
      console.error("OCR Error:", error);
      throw error;
    }
  };

  const getSelectionText = async (): Promise<string> => {
    try {
      // @ts-ignore: WXT global browser object
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;

      const tabs = await browserAPI.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];
      if (!tab?.id) return "";

      const result = await browserAPI.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString() || "",
      });

      return result[0]?.result || "";
    } catch (error) {
      console.error("Selection Error:", error);
      return "";
    }
  };

  return { captureAndOCR, getSelectionText };
};
