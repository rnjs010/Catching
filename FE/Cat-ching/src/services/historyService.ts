import api from "./apiService";
import { HistoryItemResponse } from "@/types/history";

export const historyService = {
  getHistoryList: async (): Promise<HistoryItemResponse[]> => {
    const response = await api.get("/history/list");
    return response.data;
  },

  getHistoryAnalysis: async (companyPositionId: number): Promise<any> => {
    const response = await api.get(`/analysis/${companyPositionId}`);
    return response.data;
  },
};
