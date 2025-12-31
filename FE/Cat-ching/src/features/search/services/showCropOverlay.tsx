import { createRoot } from "react-dom/client";
import { CropOverlay } from "../components/CropOverlay";

export const showCropOverlay = (screenshot: string) => {
  let cancel!: () => void;

  const promise = new Promise<string>((resolve, reject) => {
    const container = document.createElement("div");
    container.id = "ocr-react-overlay-root";
    document.body.appendChild(container);

    const root = createRoot(container);

    const cleanup = () => {
      root.unmount();
      container.remove();
    };

    cancel = () => {
      cleanup();
      reject(new Error("Crop cancelled"));
    };

    root.render(
      <CropOverlay
        screenshot={screenshot}
        onComplete={(cropped) => {
          cleanup();
          resolve(cropped);
        }}
        onCancel={cancel}
      />
    );
  });

  return { promise, cancel };
};
