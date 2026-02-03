import { useState, useEffect, useCallback, useRef } from "react";
import {
  detectCompany,
  onTabChange,
} from "@/features/search/services/companyService";
import { DetectResult } from "@/types/feature";

export const useCompanyDetector = () => {
  const [currentSite, setCurrentSite] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const lastResultRef = useRef<string>("");
  const fetchingRef = useRef(false);

  const fetchCompanyRef = useRef<() => Promise<void>>(async () => {});

  fetchCompanyRef.current = async () => {
    if (!isMountedRef.current) return;

    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setIsLoading(true);

    try {
      const result: DetectResult = await detectCompany();

      if (!isMountedRef.current) return;

      const resultKey = `${result.site}:${result.company}`;
      lastResultRef.current = resultKey;

      setCurrentSite(result.site);
      setCompany(result.company);
    } catch (error) {
      console.error("[fetchCompany] 에러:", error);
    } finally {
      if (isMountedRef.current) {
        fetchingRef.current = false;
        setIsLoading(false);
      }
    }
  };

  const fetchCompany = useCallback(() => {
    return fetchCompanyRef.current();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    fetchCompany();

    const cleanup = onTabChange(() => {
      setCurrentSite(null);
      setCompany(null);
      lastResultRef.current = "";
      fetchingRef.current = false;
      setIsLoading(true);

      setTimeout(() => {
        fetchCompany();
      }, 100);
    });

    return () => {
      isMountedRef.current = false;
      fetchingRef.current = false;
      cleanup();
    };
  }, [fetchCompany]);

  return {
    company,
    currentSite,
    isLoading,
    refetch: fetchCompany,
  };
};
