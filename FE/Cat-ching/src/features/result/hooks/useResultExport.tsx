import { useState } from "react";
import { notionService } from "@/services/notionService";
import { exportService } from "@/services/exportService";

type UseResultExportParams = {
  analysisId: number | null;
  company: string;
  position: string;
};

export function useResultExport({
  analysisId,
  company,
  position,
}: UseResultExportParams) {
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
    handleExportNotion,
    handleExportPdf,
    isNotionLoading,
    isPdfLoading,
    popupConfig,
    closePopup,
  };
}
