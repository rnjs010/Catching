import axios from "axios";
import { API_BASE_URL } from "@/config/env";
import { useAuthStore } from "@/stores/authStore";

export type AnalysisDetailResponse = {
  status: number;
  success: boolean;
  message: string;
  data: {
    company: string;
    position: string;
    content: {
      format: "markdown";
      content: string;
      timestamp: number;
    };
    createdAt: string;
  };
};

export const getChartDetail = async (analysisId: string) => {
  const token = await useAuthStore.getState().getToken();

  if (!token) {
    throw new Error("액세스 토큰이 없습니다.");
  }

  const response = await axios.get<AnalysisDetailResponse>(
    `${API_BASE_URL}/analysis/${analysisId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    },
  );

  return response.data.data;
};
