import axios from "axios";
import { API_BASE_URL } from "@/config/env";
import {
  WeeklyPopularChartApiItem,
  WeeklyPopularChartApiResponse,
} from "@/types/chart";

export const getWeeklyPopularChart = async (): Promise<
  WeeklyPopularChartApiItem[]
> => {
  const response = await axios.get<WeeklyPopularChartApiResponse>(
    `${API_BASE_URL}/popular/current`,
  );

  return response.data.data;
};
