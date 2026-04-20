export type WeeklyPopularChartApiItem = {
  companyPositionId: number;
  company: string;
  position: string;
  viewCount: number;
  yearMonthWeek: string; // ex) "2026-04-W3"
};

export type WeeklyPopularChartApiResponse = {
  status: number;
  success: boolean;
  message: string;
  data: WeeklyPopularChartApiItem[];
};

export type PieItem = {
  id: number;
  label: string; // 회사명
  job: string; // 직무명
  value: number; // 조사 수
  color: string;
};
