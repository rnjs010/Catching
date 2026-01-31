import api from "./apiService";

export interface NotionStatusResponse {
  connected: boolean;
  workspaceName: string | null;
  hasDefaultPage: boolean;
  defaultPageId: string | null;
  defaultPageTitle: string | null;
}

export interface NotionPage {
  id: string;
  title: string;
  icon: string | null;
}

export interface NotionPagesWrapper {
  pages: NotionPage[];
}

export const notionService = {
  // Notion OAuth URL 생성
  getNotionOAuthUrl: async (): Promise<{ url: string }> => {
    const response = await api.get("/notion/oauth");
    return response.data;
  },

  // Notion 연동 상태 확인
  getNotionStatus: async (): Promise<NotionStatusResponse> => {
    const response = await api.get("/notion/status");
    return response.data;
  },

  // 허용된 페이지 목록 조회
  getNotionPages: async (): Promise<NotionPage[]> => {
    const response = await api.get("/notion/pages");
    return response.data.pages;
  },

  // 기본 페이지 변경
  updateDefaultPage: async (
    pageId: string,
    pageName: string,
  ): Promise<void> => {
    await api.put("/notion/default", { pageId, pageName });
  },

  // Notion 연동 해제
  disconnectNotion: async (): Promise<void> => {
    await api.delete("/notion/disconnect");
  },

  // 분석 결과 Notion으로 내보내기
  exportToNotion: async (analysisId: number): Promise<void> => {
    await api.post("/notion/export", { analysisId });
  },
};
