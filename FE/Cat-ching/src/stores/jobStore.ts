import { create } from "zustand";

type JobDragPhase = "idle" | "dragging" | "done";

interface JobDragState {
  phase: JobDragPhase;
  draftText: string; // 실시간 텍스트
  job: string | null; // 확정된 직무

  isAutoDetected: boolean;

  start: () => void;
  update: (text: string) => void;
  finish: () => void;

  setJobManual: (text: string) => void;
  reset: () => void;
}

export const useJobDragStore = create<JobDragState>((set) => ({
  phase: "idle",
  draftText: "",
  job: null,
  isAutoDetected: false,

  start: () =>
    set({
      phase: "dragging",
      draftText: "",
    }),

  update: (text) =>
    set({
      draftText: text,
    }),

  finish: () =>
    set((state) => ({
      phase: state.draftText ? "done" : "idle",
      job: state.draftText || null,
      isAutoDetected: true,
    })),

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
      isAutoDetected: false,
    }),
}));
