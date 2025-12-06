import { useEffect, useState } from "react";

export function useShowCompany(isLoading: boolean, company: string | null) {
  const [showCompany, setShowCompany] = useState(false);

  useEffect(() => {
    if (!isLoading && company) {
      // 분석 중 → 1초 후 회사 표시
      const timer = setTimeout(() => {
        setShowCompany(true);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setShowCompany(false);
    }
  }, [isLoading, company]);

  return showCompany;
}
