import React, { useEffect, useState } from "react";

type Point = { x: number; y: number };

interface Props {
  screenshot: string;
  onComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

export const CropOverlay: React.FC<Props> = ({
  screenshot,
  onComplete,
  onCancel,
}) => {
  const [start, setStart] = useState<Point | null>(null);
  const [end, setEnd] = useState<Point | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  /* ESC 취소 */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onCancel]);

  /* body 스크롤 방지 */
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    setStart({ x: e.clientX, y: e.clientY });
    setEnd(null);
    setIsDrawing(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !start) return;
    setEnd({ x: e.clientX, y: e.clientY });
  };

  const onMouseUp = () => {
    if (!start || !end) {
      setIsDrawing(false);
      return;
    }

    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    if (width < 20 || height < 20) {
      setStart(null);
      setEnd(null);
      setIsDrawing(false);
      return;
    }

    const image = new Image();
    image.onload = () => {
      const scaleX = image.width / window.innerWidth;
      const scaleY = image.height / window.innerHeight;

      const canvas = document.createElement("canvas");
      canvas.width = width * scaleX;
      canvas.height = height * scaleY;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        image,
        left * scaleX,
        top * scaleY,
        width * scaleX,
        height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      onComplete(canvas.toDataURL("image/png"));
    };

    image.src = screenshot;
    setIsDrawing(false);
  };

  const hasSelection = start && end;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        cursor: "crosshair",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* 선택 전: 전체 어두운 배경 */}
      {!hasSelection && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
          }}
        />
      )}

      {/* 선택 영역 + 마스크 */}
      {hasSelection && (
        <div
          style={{
            position: "absolute",
            left: Math.min(start.x, end.x),
            top: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
            border: "3px dashed #3B82F6",
            background: "transparent",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* 안내 문구 */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.85)",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          pointerEvents: "none",
        }}
      >
        드래그해서 OCR할 영역을 선택하세요 (ESC: 취소)
      </div>
    </div>
  );
};
