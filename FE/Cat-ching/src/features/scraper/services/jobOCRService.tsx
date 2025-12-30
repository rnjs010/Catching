import { createWorker } from "tesseract.js";

type CropResultMessage = {
  croppedImage: string | null;
};

export const detectJobOCR = () => {
  const startOCRCapture = async (onOCRStart?: () => void): Promise<string> => {
    try {
      // @ts-ignore: WXT global browser object
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;

      // 1. 현재 화면 캡쳐
      const screenshot = await browserAPI.tabs.captureVisibleTab(undefined, {
        format: "png",
      });

      // 2. 활성 탭 조회
      const [tab] = await browserAPI.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        throw new Error("No active tab");
      }

      // 3. content script에 크롭 요청
      const result: CropResultMessage = await browserAPI.tabs.sendMessage(
        tab.id,
        {
          type: "START_CROP",
          screenshot,
        }
      );

      if (!result?.croppedImage) {
        throw new Error("Crop cancelled");
      }

      // 4. Tesseract OCR 실행
      onOCRStart?.();

      const worker = await createWorker("kor+eng", 1, {
        corePath: browserAPI.runtime.getURL(
          "/tesseract/tesseract-core.wasm.js"
        ),
        workerPath: browserAPI.runtime.getURL("/tesseract/worker.min.js"),
        langPath: browserAPI.runtime.getURL("/tesseract"),
        workerBlobURL: false,
        gzip: false,
      });

      const ocrResult = await worker.recognize(result.croppedImage);
      await worker.terminate();

      // 5. 결과 정리
      return ocrResult.data.text
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\n+/g, " ")
        .replace(/([가-힣])\s+(?=[가-힣])/g, "$1")
        .trim();
    } catch (error) {
      console.error("OCR Error:", error);
      throw error;
    }
  };

  return { startOCRCapture };
};
