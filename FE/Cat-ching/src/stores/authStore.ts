import { create } from "zustand";
import { AuthState } from "@/types/store";
import {
  loginWithGoogle,
  getCurrentUser,
  logout as logoutApi,
} from "@/services/authService";
import { useUserStore } from "./userStore";

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  isNewUser: false,

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

      // 백엔드로 Google Token 전송
      const { accessToken, refreshToken, isNewUser } = await loginWithGoogle(
        googleToken
      );

      // JWT 토큰 저장
      await browser.storage.local.set({
        accessToken,
        refreshToken,
      });

      // 사용자 정보 가져오기 (토큰 직접 전달)
      const userInfo = await getCurrentUser(accessToken);
      useUserStore.getState().setUser(userInfo);

      set({ isAuthenticated: true, isLoading: false, isNewUser });
      return true;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  // 로그아웃
  logout: async (skipBackend = false) => {
    try {
      // skipBackend가 false일 때만 백엔드 API 호출
      if (!skipBackend) {
        await logoutApi();
      }

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

      // 사용자 정보 제거
      useUserStore.getState().clearUser();

      set({ isAuthenticated: false, isNewUser: false });
    } catch (error) {}
  },

  // 인증 상태 확인
  checkAuth: async () => {
    try {
      const result = await browser.storage.local.get([
        "accessToken",
        "refreshToken",
      ]);

      if (!result.accessToken || !result.refreshToken) {
        set({ isAuthenticated: false });
        return;
      }

      // 토큰 유효성 검증 (사용자 정보 가져오기)
      const userInfo = await getCurrentUser();
      useUserStore.getState().setUser(userInfo);

      set({ isAuthenticated: true });
    } catch (error) {
      // 토큰이 만료되었거나 유효하지 않음 - 백엔드 호출 없이 로컬만 정리
      console.log("토큰 만료, 자동 로그아웃");
      await get().logout(true); // skipBackend = true
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
