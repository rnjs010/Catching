import { useEffect, useState } from "react";

export function useShowCompany(isLoading: boolean, company: string | null) {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowResult(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowResult(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isLoading, company]);

  return showResult;
}
