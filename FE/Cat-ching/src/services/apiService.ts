import axios from "axios";
import { refreshAccessToken } from "./authService";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// 요청 인터셉터: JWT 토큰 첨부
api.interceptors.request.use(
  async (config) => {
    const result = await browser.storage.local.get("accessToken");
    if (result.accessToken) {
      config.headers.Authorization = `Bearer ${result.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 시 토큰 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 리프레시 토큰으로 새 액세스 토큰 받기
        const result = await browser.storage.local.get("refreshToken");
        if (!result.refreshToken) {
          throw new Error("리프레시 토큰이 없습니다");
        }

        const { accessToken } = await refreshAccessToken(result.refreshToken);

        // 새 토큰 저장
        await browser.storage.local.set({ accessToken });

        // 원래 요청에 새 토큰 적용
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃 처리
        console.error("세션 만료:", refreshError);

        // authStore의 logout 호출 (Chrome Identity 토큰 제거 + 스토어 초기화)
        await useAuthStore.getState().logout();

        return Promise.reject(refreshError);
      }
    }

    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;
