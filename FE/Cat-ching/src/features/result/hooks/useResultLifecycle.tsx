import { useCallback, useEffect, useState } from "react";
import { AnalysisSectionKey, createSectionState } from "@/stores/analysisStore";
import { useAuthStore } from "@/stores/authStore";
import { useAnalysisInputStore } from "@/stores/analysisInputStore";
import { useAnalysisStore } from "@/stores/analysisStore";
import { useAnalysisSSE } from "./useAnalysis";
import { useResultExport } from "./useResultExport";

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

  // 섹션 상태
  const initialOpenState = createSectionState(true);
  const [open, setOpen] =
    useState<Record<AnalysisSectionKey, boolean>>(initialOpenState);

  const toggleSection = useCallback((key: AnalysisSectionKey) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // 분석 실행
  useEffect(() => {
    if (!company || !position || !token || isComplete) return;

    setOpen(initialOpenState);

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

    setOpen({
      ...createSectionState(false),
      companyIssue: true,
    });
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
