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
    // /auth/refresh 요청은 refreshToken을 사용하므로 accessToken 안 붙임
    if (config.url?.includes("/auth/refresh")) {
      return config;
    }

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

// 응답 인터셉터: ApiResponse 구조 unwrap
api.interceptors.response.use(
  (response) => {
    // ApiResponse<T> 구조에서 data 필드 자동 추출
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// 리프레시 토큰 갱신 중복 방지를 위한 Promise 캐시
let refreshTokenPromise: Promise<string> | null = null;

// 응답 인터셉터: 401 에러 시 토큰 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 재시도하지 않은 경우 (refresh 요청 제외)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        // 이미 진행 중인 리프레시가 있으면 그 결과를 기다림
        if (!refreshTokenPromise) {
          refreshTokenPromise = (async () => {
            try {
              const result = await browser.storage.local.get("refreshToken");
              if (!result.refreshToken) {
                throw new Error("리프레시 토큰이 없습니다");
              }

              const { accessToken, refreshToken: newRefreshToken } =
                await refreshAccessToken(result.refreshToken);

              // 새 토큰 저장
              await browser.storage.local.set({
                accessToken,
                refreshToken: newRefreshToken,
              });

              return accessToken;
            } finally {
              // 완료되면 캐시 초기화
              refreshTokenPromise = null;
            }
          })();
        }

        const accessToken = await refreshTokenPromise;

        // 원래 요청에 새 토큰 적용
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃 처리
        console.error("세션 만료:", refreshError);

        // 캐시 초기화
        refreshTokenPromise = null;

        // authStore의 logout 호출
        await useAuthStore.getState().logout(true);

        return Promise.reject(refreshError);
      }
    }

    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;
