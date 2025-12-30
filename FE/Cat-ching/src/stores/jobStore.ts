import { create } from "zustand";

type JobDragPhase = "idle" | "dragging" | "done";

interface JobDragState {
  phase: JobDragPhase;
  draftText: string; // 실시간 텍스트
  job: string | null; // 확정된 직무
  isProcessing: boolean;
  isAutoDetected: boolean;

  start: () => void;
  update: (text: string) => void;
  setProcessing: (value: boolean) => void;

  finish: () => void;
  finishOCR: (text: string) => void;

  setJobManual: (text: string) => void;
  reset: () => void;
}

export const useJobDragStore = create<JobDragState>((set) => ({
  phase: "idle",
  draftText: "",
  job: null,
  isProcessing: false,
  isAutoDetected: false,

  start: () =>
    set({
      phase: "dragging",
      draftText: "",
      isProcessing: false,
    }),

  update: (text) =>
    set({
      draftText: text,
    }),

  setProcessing: (value: boolean) =>
    set({
      isProcessing: value,
    }),

  finish: () =>
    set((state) => ({
      phase: state.draftText ? "done" : "idle",
      job: state.draftText || null,
      isAutoDetected: true,
      isProcessing: false,
    })),

  finishOCR: (text) =>
    set({
      phase: "done",
      job: text,
      draftText: "",
      isAutoDetected: true,
      isProcessing: false,
    }),

  setJobManual: (text) =>
    set({
      job: text,
      isAutoDetected: false,
      phase: "done",
    }),

  reset: () =>
    set({
      phase: "idle",
      draftText: "",
      job: null,
      isProcessing: false,
      isAutoDetected: false,
    }),
}));
