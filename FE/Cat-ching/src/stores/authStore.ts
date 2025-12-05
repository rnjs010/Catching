import { create } from "zustand";
import { AuthState } from "@/types/store";
import { loginWithGoogle } from "@/services/authService";

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,

  // Google OAuth 로그인
  login: async () => {
    set({ isLoading: true });

    try {
      // Chrome Identity API로 Google OAuth Token 받기
      const googleToken = await new Promise<string>((resolve, reject) => {
        browser.identity.getAuthToken({ interactive: true }, (result: any) => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else if (result && typeof result === "string") {
            resolve(result);
          } else if (result && typeof result === "object" && result.token) {
            resolve(result.token);
          } else {
            reject(new Error("토큰을 받지 못했습니다"));
          }
        });
      });

      console.log("Google Token 받음:", googleToken);

      // 백엔드로 Google Token 전송
      const { accessToken, refreshToken } = await loginWithGoogle(googleToken);

      // JWT 토큰 저장
      await browser.storage.local.set({
        accessToken,
        refreshToken,
      });

      set({ isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      console.error("로그인 실패:", error);
      set({ isLoading: false });
      return false;
    }
  },

  // 로그아웃
  logout: async () => {
    try {
      // Chrome Identity 캐시된 토큰 제거
      const token = await new Promise<string | undefined>((resolve) => {
        browser.identity.getAuthToken({ interactive: false }, (result: any) => {
          if (result && typeof result === "string") {
            resolve(result);
          } else if (result && typeof result === "object" && result.token) {
            resolve(result.token);
          } else {
            resolve(undefined);
          }
        });
      });

      if (token) {
        await new Promise<void>((resolve) => {
          browser.identity.removeCachedAuthToken({ token }, () => {
            resolve();
          });
        });
      }

      await browser.storage.local.remove(["accessToken", "refreshToken"]);
      set({ isAuthenticated: false });
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  },

  // 인증 상태 확인
  checkAuth: async () => {
    try {
      const result = await browser.storage.local.get("accessToken");
      if (result.accessToken) {
        set({ isAuthenticated: true });
      } else {
        set({ isAuthenticated: false });
      }
    } catch (error) {
      console.error("인증 확인 실패:", error);
      set({ isAuthenticated: false });
    }
  },

  // 토큰 가져오기
  getToken: async () => {
    try {
      const result = await browser.storage.local.get("accessToken");
      return result.accessToken || null;
    } catch (error) {
      console.error("토큰 가져오기 실패:", error);
      return null;
    }
  },
}));
