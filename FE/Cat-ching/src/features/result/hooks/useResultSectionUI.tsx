import { useCallback, useState } from "react";
import { AnalysisSectionKey, createSectionState } from "@/stores/analysisStore";

export function useResultSectionUI(defaultOpen = true) {
  const [open, setOpen] = useState<Record<AnalysisSectionKey, boolean>>(
    createSectionState(defaultOpen),
  );

  const toggleSection = useCallback((key: AnalysisSectionKey) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetOpenState = useCallback((isOpen: boolean) => {
    setOpen(createSectionState(isOpen));
  }, []);

  const openCompanyIssueOnly = useCallback(() => {
    setOpen({
      ...createSectionState(false),
      companyIssue: true,
    });
  }, []);

  return {
    open,
    toggleSection,
    resetOpenState,
    openCompanyIssueOnly,
  };
}
