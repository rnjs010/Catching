import api from "@/services/apiService";

// Base64 Data URL을 File 객체로 변환하는 유틸리티
const dataURLtoFile = (dataurl: string, filename: string) => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

type CropResultMessage = {
  croppedImage: string | null;
};

export const detectJobOCR = () => {
  // @ts-ignore: WXT global browser object
  const browserAPI = typeof browser !== "undefined" ? browser : chrome;

  const startOCRCapture = async (onOCRStart?: () => void): Promise<string> => {
    try {
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
        },
      );

      if (!result?.croppedImage) {
        throw new Error("Crop cancelled");
      }

      // 4. API 서버로 OCR 요청
      onOCRStart?.();

      const imageFile = dataURLtoFile(result.croppedImage, "ocr-image.png");
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await api.post<{ text: string }>(
        "/ocr/extract",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const extractedText = response.data.text || "";

      return extractedText
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

  const cancelOCRCapture = () => {
    browserAPI.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs: any[]) => {
        const tab = tabs[0];
        if (!tab?.id) return;

        browserAPI.tabs.sendMessage(tab.id, { type: "CANCEL_CROP" });
      });
  };

  return { startOCRCapture, cancelOCRCapture };
};
