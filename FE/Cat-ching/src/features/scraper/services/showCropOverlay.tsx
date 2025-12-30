import { createRoot } from "react-dom/client";
import { CropOverlay } from "../components/CropOverlay";

export const showCropOverlay = (screenshot: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const container = document.createElement("div");
    container.id = "ocr-react-overlay-root";
    document.body.appendChild(container);

    const root = createRoot(container);

    const cleanup = () => {
      root.unmount();
      container.remove();
    };

    root.render(
      <CropOverlay
        screenshot={screenshot}
        onComplete={(cropped) => {
          cleanup();
          resolve(cropped);
        }}
        onCancel={() => {
          cleanup();
          reject(new Error("User cancelled crop"));
        }}
      />
    );
  });
};
