import { useEffect, useMemo, useState } from "react";
import { getWeeklyPopularChart } from "../services/chartService";
import {
  formatYearMonthWeekRange,
  mapWeeklyChartToPieData,
} from "../services/chartMapper";
import { WeeklyPopularChartData } from "@/types/chart";

export const useWeeklyPopularChart = () => {
  const [chartData, setChartData] = useState<WeeklyPopularChartData | null>(
    null,
  );
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
        setChartData(data);
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

  const pieData = useMemo(() => {
    if (!chartData || !chartData.top5) return [];
    return mapWeeklyChartToPieData(chartData.top5);
  }, [chartData]);

  const totalCount = useMemo(() => {
    return chartData?.totalCount || 0;
  }, [chartData]);

  const dateRangeText = useMemo(() => {
    if (!chartData || !chartData.top5 || chartData.top5.length === 0) return "";
    return formatYearMonthWeekRange(chartData.top5[0].yearMonthWeek);
  }, [chartData]);

  return {
    pieData,
    totalCount,
    dateRangeText,
    isLoading,
    isError,
  };
};
