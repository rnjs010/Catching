import { CHART_COLORS } from "@/styles/colors";
import { PieItem, WeeklyPopularChartApiItem } from "@/types/chart";

const pad = (num: number) => String(num).padStart(2, "0");

const formatDate = (date: Date) => {
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
};

/**
 * "2026-04-W3" -> "2026.04.15~2026.04.21" 형태
 * - 해당 월의 첫 번째 월요일부터 1주차 시작
 * - 각 주는 월~일
 * - all-time이면 날짜 범위 대신 전체 기간 문구 반환
 */
export const formatYearMonthWeekRange = (yearMonthWeek: string) => {
  if (yearMonthWeek === "all-time") {
    return "전체 기간 기준";
  }

  const match = yearMonthWeek.match(/^(\d{4})-(\d{2})-W(\d)$/);
  if (!match) return "";

  const [, yearStr, monthStr, weekStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const week = Number(weekStr);

  if (week < 1) return "";

  // 해당 월의 1일
  const firstDayOfMonth = new Date(year, month - 1, 1);

  // 해당 월의 첫 번째 월요일 찾기
  const firstMonday = new Date(firstDayOfMonth);
  const firstDay = firstMonday.getDay(); // 일:0, 월:1 ...
  const daysUntilMonday =
    firstDay === 0 ? 1 : firstDay === 1 ? 0 : 8 - firstDay;
  firstMonday.setDate(firstMonday.getDate() + daysUntilMonday);
  firstMonday.setHours(0, 0, 0, 0);

  // W1의 시작이 firstMonday, W2는 +7일, W3는 +14일 ...
  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (week - 1) * 7);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

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
