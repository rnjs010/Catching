import { create } from "zustand";
import { AppState, Page } from "@/types/store";

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: "home",
  prevPage: null,

  navigate: (page: Page) =>
    set((state) => ({
      currentPage: page,
      prevPage: state.currentPage,
    })),

  goBack: () =>
    set((state) => ({
      currentPage: state.prevPage || "search",
      prevPage: null,
    })),
}));
