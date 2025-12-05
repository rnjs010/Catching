import api from "./apiService";

// Google OAuth 로그인
// browser.identity.getAuthToken()으로 받은 Google OAuth Token을 백엔드로 전송
export const loginWithGoogle = async (
  googleToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const response = await api.post("/auth/login", {
    token: googleToken,
  });

  return response.data;
};

// 토큰 리프레시
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  const response = await api.post("/auth/refresh", {
    refreshToken,
  });

  return response.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
  await browser.storage.local.remove(["accessToken", "refreshToken"]);
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
