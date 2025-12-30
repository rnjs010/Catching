import { useJobDragStore } from "@/stores/jobStore";
import { detectJobDrag } from "../services/jobDragService";

export const useJobDrag = () => {
  const { start, update, finish, reset } = useJobDragStore();
  const { startSelectionMonitor } = detectJobDrag();

  const startJobDrag = async () => {
    start();

    try {
      await startSelectionMonitor((text) => {
        update(text); // 실시간 반영
      });

      finish(); // mouseup 시
    } catch {
      reset(); // 30초 타임아웃
    }
  };

  return { startJobDrag };
};
