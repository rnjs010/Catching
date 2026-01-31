import api from "./apiService";

export const exportService = {
  // 분석 결과 PDF 다운로드
  downloadAnalysisPdf: async (
    analysisId: number,
    company: string,
    position: string,
  ): Promise<void> => {
    const response = await api.post(
      "/pdf",
      { analysisId },
      { responseType: "blob" },
    );

    // Blob을 파일로 다운로드
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Catching_Report_${company}_${position}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
