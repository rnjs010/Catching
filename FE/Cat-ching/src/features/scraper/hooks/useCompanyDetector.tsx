// src/features/scraper/hooks/useCompanyDetector.ts
import { useState, useEffect, useCallback } from "react";
import {
  detectCompany,
  onTabChange,
} from "@/features/scraper//services/companyService";
import { DetectResult } from "@/types/feature";

export const useCompanyDetector = () => {
  const [currentSite, setCurrentSite] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    const result: DetectResult = await detectCompany();
    setCurrentSite(result.site);
    setCompany(result.company);
  }, []);

  useEffect(() => {
    fetchCompany();
    const cleanup = onTabChange(() => fetchCompany());
    return cleanup;
  }, [fetchCompany]);

  return { company, currentSite, refetch: fetchCompany };
};
