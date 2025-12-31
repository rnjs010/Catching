import { useJobInputStore } from "@/stores/jobStore";
import { useMemo } from "react";

export type JobInputMode = "capture" | "drag";

export type ViewState =
  | "idle"
  | "selectGuide"
  | "dragPreview"
  | "ocrProcessing"
  | "result";

export const useJobViewState = (mode: JobInputMode): ViewState => {
  const { phase, previewText, isProcessing } = useJobInputStore();

  return useMemo(() => {
    if (phase === "done") return "result";

    if (phase === "selecting") {
      if (mode === "drag" && previewText) return "dragPreview";
      if (mode === "capture" && isProcessing) return "ocrProcessing";
      return "selectGuide";
    }

    return "idle";
  }, [mode, phase, previewText, isProcessing]);
};
