import { useEffect, useMemo, useState } from "react";
import { getWeeklyPopularChart } from "../services/chartService";
import {
  formatYearMonthWeekRange,
  getTotalSurveyCount,
  mapWeeklyChartToPieData,
} from "../services/chartMapper";
import { WeeklyPopularChartApiItem } from "@/types/chart";

export const useWeeklyPopularChart = () => {
  const [rawData, setRawData] = useState<WeeklyPopularChartApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchChart = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        const data = await getWeeklyPopularChart();

        if (!isMounted) return;
        setRawData(data);
      } catch (error) {
        console.error("차트 조회 실패:", error);
        if (!isMounted) return;
        setIsError(true);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    fetchChart();

    return () => {
      isMounted = false;
    };
  }, []);

  const pieData = useMemo(() => mapWeeklyChartToPieData(rawData), [rawData]);

  const totalCount = useMemo(() => getTotalSurveyCount(rawData), [rawData]);

  const dateRangeText = useMemo(() => {
    if (rawData.length === 0) return "";
    return formatYearMonthWeekRange(rawData[0].yearMonthWeek);
  }, [rawData]);

  return {
    pieData,
    totalCount,
    dateRangeText,
    isLoading,
    isError,
  };
};
