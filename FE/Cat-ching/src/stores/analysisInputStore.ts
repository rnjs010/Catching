import { create } from "zustand";

interface AnalysisInputState {
  company: string;
  position: string;

  setCompany: (company: string) => void;
  setPosition: (position: string) => void;

  setInput: (input: { company: string; position: string }) => void;
  reset: () => void;
}

export const useAnalysisInputStore = create<AnalysisInputState>((set) => ({
  company: "",
  position: "",

  setCompany: (company) => set({ company }),
  setPosition: (position) => set({ position }),

  setInput: ({ company, position }) => set({ company, position }),

  reset: () => set({ company: "", position: "" }),
}));
