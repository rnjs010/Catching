import { useJobInputStore } from "@/stores/jobStore";
import { detectJobDrag } from "../services/jobDragService";

export const useJobDrag = () => {
  const { start, updatePreview, finishDrag, reset } = useJobInputStore();
  const { startSelectionMonitor } = detectJobDrag();

  const startJobDrag = async () => {
    start();

    try {
      await startSelectionMonitor((text) => {
        updatePreview(text); // 실시간 반영
      });

      finishDrag(); // mouseup 시
    } catch {
      reset(); // 30초 타임아웃
    }
  };

  return { startJobDrag };
};
