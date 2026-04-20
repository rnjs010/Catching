import axios from "axios";
import { API_BASE_URL } from "@/config/env";
import { WeeklyPopularChartApiResponse } from "@/types/chart";

export const getWeeklyPopularChart = async () => {
  const response = await axios.get<WeeklyPopularChartApiResponse>(
    `${API_BASE_URL}/popular/current`,
  );

  return response.data.data;
};
