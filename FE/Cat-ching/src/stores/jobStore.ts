import { create } from "zustand";

type JobInputPhase = "idle" | "selecting" | "done";

interface JobInputState {
  phase: JobInputPhase;
  job: string | null; // 확정된 직무
  previewText: string; // 실시간 텍스트 (drag)
  isProcessing: boolean; // OCR 분석 중 여부
  isAutoDetected: boolean;

  start: () => void;
  updatePreview: (text: string) => void; // drag
  setProcessing: (value: boolean) => void; // OCR

  finishDrag: () => void;
  finishOCR: (text: string) => void;

  setJobManual: (text: string) => void;
  reset: () => void;
}

export const useJobInputStore = create<JobInputState>((set) => ({
  phase: "idle",
  job: null,
  previewText: "",
  isProcessing: false,
  isAutoDetected: false,

  start: () =>
    set({
      phase: "selecting",
      previewText: "",
      isProcessing: false,
    }),

  updatePreview: (text) =>
    set({
      previewText: text,
    }),

  setProcessing: (value: boolean) =>
    set({
      isProcessing: value,
    }),

  finishDrag: () =>
    set((state) => ({
      phase: state.previewText ? "done" : "idle",
      job: state.previewText || null,
      isAutoDetected: true,
      isProcessing: false,
    })),

  finishOCR: (text) =>
    set({
      phase: "done",
      job: text,
      previewText: "",
      isAutoDetected: true,
      isProcessing: false,
    }),

  setJobManual: (text) =>
    set({
      phase: "done",
      job: text,
      isAutoDetected: false,
    }),

  reset: () =>
    set({
      phase: "idle",
      job: null,
      previewText: "",
      isProcessing: false,
      isAutoDetected: false,
    }),
}));
