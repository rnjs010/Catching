import { useJobDragStore } from "@/stores/jobStore";
import { detectJobOCR } from "../services/jobOCRService";

export const useJobOCR = () => {
  const { start, finishOCR, reset, setProcessing } = useJobDragStore();
  const { startOCRCapture } = detectJobOCR();

  const startJobOCR = async () => {
    start();

    try {
      const text = await startOCRCapture(() => {
        setProcessing(true);
      });

      if (!text) {
        reset();
        return;
      }

      finishOCR(text);
    } catch {
      reset();
    }
  };

  return { startJobOCR };
};
