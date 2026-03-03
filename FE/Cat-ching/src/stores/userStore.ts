import { create } from "zustand";
import { UserState, User } from "@/types/store";

export const useUserStore = create<UserState>((set) => ({
  user: null,

  // 사용자 정보 설정
  setUser: (user: User | null) => set({ user }),

  // 사용자 정보 제거
  clearUser: () => set({ user: null }),
}));
