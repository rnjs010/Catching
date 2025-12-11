import api from "./apiService";

// Google OAuth 로그인
// browser.identity.getAuthToken()으로 받은 Google OAuth Token을 백엔드로 전송
export const loginWithGoogle = async (
  googleToken: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}> => {
  const response = await api.post("/auth/login", {
    token: googleToken,
  });

  // 201: 회원가입, 200: 로그인
  const isNewUser = response.status === 201;

  return {
    ...response.data,
    isNewUser: isNewUser,
  };
};

// 토큰 리프레시
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  const response = await api.post("/auth/refresh", null, {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  return response.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
  await browser.storage.local.remove(["accessToken", "refreshToken"]);
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (token?: string) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const response = await api.get("/auth/me", config);
  return response.data;
};

// 사용자 정보 업데이트
export const updateUserInfo = async (name: string) => {
  const response = await api.put("/auth/me", { name });
  return response.data;
};
