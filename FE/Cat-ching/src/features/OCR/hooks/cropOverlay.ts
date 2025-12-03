export const showCropOverlay = (screenshot: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 회색 배경이 있는 전체 화면 오버레이
    const overlay = document.createElement("div");
    overlay.id = "ocr-crop-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      z-index: 999999;
      cursor: crosshair;
    `;

    // 선택 영역 (box-shadow로 외부만 어둡게)
    const selection = document.createElement("div");
    selection.style.cssText = `
      position: absolute;
      border: 2px solid #3B82F6;
      background: transparent;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
      pointer-events: none;
      display: none;
    `;

    // 안내 텍스트
    const instruction = document.createElement("div");
    instruction.textContent =
      "마우스를 드래그하여 OCR할 영역을 선택하세요 (ESC: 취소)";
    instruction.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;
      z-index: 1000000;
    `;

    overlay.appendChild(selection);
    overlay.appendChild(instruction);
    document.body.appendChild(overlay);

    // 포커스 설정
    setTimeout(() => {
      overlay.focus();
    }, 100);
    overlay.setAttribute("tabindex", "-1");

    let startX = 0;
    let startY = 0;
    let isDrawing = false;

    const handleMouseDown = (e: MouseEvent) => {
      // 클릭하는 순간 오버레이 배경 제거
      overlay.style.background = "transparent";

      isDrawing = true;
      startX = e.clientX;
      startY = e.clientY;
      selection.style.display = "block";
      selection.style.left = `${startX}px`;
      selection.style.top = `${startY}px`;
      selection.style.width = "0px";
      selection.style.height = "0px";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);

      selection.style.left = `${left}px`;
      selection.style.top = `${top}px`;
      selection.style.width = `${width}px`;
      selection.style.height = `${height}px`;
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (!isDrawing) return;
      isDrawing = false;

      const endX = e.clientX;
      const endY = e.clientY;

      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      // 최소 크기 체크
      if (width < 20 || height < 20) {
        selection.style.display = "none";
        // 배경 복원
        overlay.style.background = "rgba(0, 0, 0, 0.6)";
        return;
      }

      const left = Math.min(startX, endX);
      const top = Math.min(startY, endY);

      // 원본 스크린샷에서 크롭
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Canvas context not available"));
        return;
      }

      const image = new Image();
      image.onload = () => {
        // 화면 크기 대비 이미지 크기 비율 계산
        const scaleX = image.width / window.innerWidth;
        const scaleY = image.height / window.innerHeight;

        // 크롭 영역을 이미지 좌표로 변환
        const cropX = left * scaleX;
        const cropY = top * scaleY;
        const cropWidth = width * scaleX;
        const cropHeight = height * scaleY;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // 원본 이미지에서 직접 크롭
        ctx.drawImage(
          image,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        const croppedDataUrl = canvas.toDataURL("image/png");
        cleanup();
        resolve(croppedDataUrl);
      };

      image.onerror = () => {
        cleanup();
        reject(new Error("Failed to load screenshot"));
      };

      image.src = screenshot;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cleanup();
        reject(new Error("Crop cancelled by user"));
      }
    };

    const cleanup = () => {
      overlay.removeEventListener("mousedown", handleMouseDown);
      overlay.removeEventListener("mousemove", handleMouseMove);
      overlay.removeEventListener("mouseup", handleMouseUp);
      overlay.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleKeyDown, true);
      overlay.remove();
    };

    overlay.addEventListener("mousedown", handleMouseDown);
    overlay.addEventListener("mousemove", handleMouseMove);
    overlay.addEventListener("mouseup", handleMouseUp);
    overlay.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", handleKeyDown, true);
  });
};
