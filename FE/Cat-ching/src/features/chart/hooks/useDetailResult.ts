import { useCallback, useEffect, useState } from "react";
import { AnalysisSectionKey, createSectionState } from "@/stores/analysisStore";
import { parseMarkdownToSections } from "@/features/result/utils/parseMarkdown";
import { getChartDetail } from "../services/chartDetailService";
import { useResultExport } from "@/features/result/hooks/useResultExport";

export function useDetailResult(analysisId: number | null) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");

  const [sections, setSections] = useState(createSectionState(""));
  const [loadingStates, setLoadingStates] = useState(createSectionState(false));
  const [typingStates, setTypingStates] = useState(createSectionState(false));

  const initialOpenState = createSectionState(true);
  const [open, setOpen] =
    useState<Record<AnalysisSectionKey, boolean>>(initialOpenState);

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const toggleSection = useCallback((key: AnalysisSectionKey) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    if (!analysisId) return;

    let isMounted = true;

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        setLoadingStates(createSectionState(true));
        setTypingStates(createSectionState(false));

        const data = await getChartDetail(String(analysisId));

        if (!isMounted) return;
        const parsedSections = parseMarkdownToSections(data.content.content);

        setCompany(data.company);
        setPosition(data.position);
        setSections(parsedSections);

        setOpen({
          ...createSectionState(false),
          companyIssue: true,
        });
      } catch (error) {
        console.error("분석 상세 조회 실패:", error);
        if (!isMounted) return;
        setIsError(true);
      } finally {
        if (!isMounted) return;

        setLoadingStates(createSectionState(false));
        setTypingStates(createSectionState(false));
        setIsLoading(false);
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [analysisId]);

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

    isLoading,
    isError,

    handleExportNotion,
    handleExportPdf,
    isNotionLoading,
    isPdfLoading,

    popupConfig,
    closePopup,
  };
}
