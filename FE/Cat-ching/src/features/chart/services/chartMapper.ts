import { CHART_COLORS } from "@/styles/colors";
import { PieItem, WeeklyPopularChartApiItem } from "@/types/chart";

const pad = (num: number) => String(num).padStart(2, "0");

const formatDate = (date: Date) => {
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
};

/**
 * "2026-04-W3" -> "2026.04.15~2026.04.21" 형태
 * 규칙:
 * W1 = 1~7일
 * W2 = 8~14일
 * W3 = 15~21일
 * W4 = 22~28일
 * W5 = 29일~말일
 */
export const formatYearMonthWeekRange = (yearMonthWeek: string) => {
  const match = yearMonthWeek.match(/^(\d{4})-(\d{2})-W(\d)$/);

  if (!match) return "";

  const [, yearStr, monthStr, weekStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const week = Number(weekStr);

  const startDay = (week - 1) * 7 + 1;
  const endDay = week === 5 ? new Date(year, month, 0).getDate() : week * 7;

  const startDate = new Date(year, month - 1, startDay);
  const endDate = new Date(year, month - 1, endDay);

  return `${formatDate(startDate)}~${formatDate(endDate)}`;
};

export const mapWeeklyChartToPieData = (
  items: WeeklyPopularChartApiItem[],
): PieItem[] => {
  return items.slice(0, 5).map((item, index) => ({
    id: item.companyPositionId,
    label: item.company,
    job: item.position,
    value: item.viewCount,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
};

// top5의 총 조사 수 계산
export const getTotalSurveyCount = (items: WeeklyPopularChartApiItem[]) => {
  return items.reduce((sum, item) => sum + item.viewCount, 0);
};
