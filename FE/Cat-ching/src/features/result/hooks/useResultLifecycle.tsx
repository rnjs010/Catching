import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useAnalysisInputStore } from "@/stores/analysisInputStore";
import { useAnalysisStore } from "@/stores/analysisStore";
import { useAnalysisSSE } from "./useAnalysis";
import { useResultExport } from "./useResultExport";
import { useResultSectionUI } from "./useResultSectionUI";

export function useResultLifecycle() {
  const { company, position } = useAnalysisInputStore();
  const { start, stop } = useAnalysisSSE();

  const { sections, loadingStates, typingStates, isComplete, analysisId } =
    useAnalysisStore();

  // 토큰
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const t = await useAuthStore.getState().getToken();
      setToken(t);
    })();
  }, []);

  const { open, toggleSection, resetOpenState, openCompanyIssueOnly } =
    useResultSectionUI(true);

  // 분석 실행
  useEffect(() => {
    if (!company || !position || !token || isComplete) return;

    resetOpenState(true);

    start({
      company,
      position,
      today: new Date().toISOString().slice(0, 10),
      analysisDepth: "NORMAL",
      token,
    });

    return () => stop();
  }, [company, position, token]);

  // 분석 완료 후 UI 조정
  useEffect(() => {
    if (!isComplete) return;
    openCompanyIssueOnly();
  }, [isComplete]);

  // 내보내기 훅
  const {
    handleExportNotion,
    handleExportPdf,
    isNotionLoading,
    isPdfLoading,
    popupConfig,
    closePopup,
  } = useResultExport({
    analysisId,
    company,
    position,
  });

  return {
    company,
    position,

    sections,
    loadingStates,
    typingStates,

    open,
    toggleSection,

    handleExportNotion,
    handleExportPdf,
    isNotionLoading,
    isPdfLoading,

    popupConfig,
    closePopup,
  };
}
