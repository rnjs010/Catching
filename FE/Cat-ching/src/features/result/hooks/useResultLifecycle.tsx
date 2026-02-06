import { useCallback, useEffect, useRef, useState } from "react";
import { AnalysisSectionKey, createSectionState } from "@/stores/analysisStore";
import { useAuthStore } from "@/stores/authStore";
import { useAnalysisInputStore } from "@/stores/analysisInputStore";
import { useAnalysisStore } from "@/stores/analysisStore";
import { useAnalysisSSE } from "./useAnalysis";
import { notionService } from "@/services/notionService";
import { exportService } from "@/services/exportService";

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

  // 팝업 관리
  const [popupConfig, setPopupConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    message: "",
  });

  const closePopup = () =>
    setPopupConfig((prev) => ({ ...prev, isOpen: false }));

  // Notion / PDF 내보내기 상태
  const [isNotionLoading, setIsNotionLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const handleExportNotion = async () => {
    if (!analysisId || isNotionLoading) return;

    setIsNotionLoading(true);
    try {
      await notionService.exportToNotion(analysisId);
      setPopupConfig({
        isOpen: true,
        message: "Notion에 성공적으로 추가되었습니다.",
      });
    } catch {
      setPopupConfig({
        isOpen: true,
        message: "Notion 추가에 실패했습니다. 연동 상태를 확인해주세요.",
      });
    } finally {
      setIsNotionLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!analysisId || isPdfLoading) return;

    setIsPdfLoading(true);
    try {
      await exportService.downloadAnalysisPdf(analysisId, company, position);
      setPopupConfig({
        isOpen: true,
        message: "PDF 파일이 성공적으로 저장되었습니다.",
      });
    } catch {
      setPopupConfig({
        isOpen: true,
        message: "PDF 저장에 실패했습니다.",
      });
    } finally {
      setIsPdfLoading(false);
    }
  };

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
