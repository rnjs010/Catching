import { useJobInputStore } from "@/stores/jobStore";
import { detectJobOCR } from "../services/jobOCRService";

export const useJobOCR = () => {
  const { start, finishOCR, reset, setProcessing } = useJobInputStore();
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
