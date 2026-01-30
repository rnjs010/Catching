import { create } from "zustand";

export type AnalysisSource = "redis" | "database" | "ai" | null;

export interface AnalysisSections {
  companySummary: string;
  companyIssue: string;
  positionMainBusiness: string;
  positionIssue: string;
}

interface LoadingStates {
  companySummary: boolean;
  companyIssue: boolean;
  positionMainBusiness: boolean;
  positionIssue: boolean;
}

interface TypingStates {
  companySummary: boolean;
  companyIssue: boolean;
  positionMainBusiness: boolean;
  positionIssue: boolean;
}

interface AnalysisState {
  source: AnalysisSource;
  analysisId: number | null;

  sections: AnalysisSections;
  loadingStates: LoadingStates;
  typingStates: TypingStates;

  status: string;
  isComplete: boolean;

  /** actions */
  setSource: (source: AnalysisSource) => void;
  setAnalysisId: (id: number) => void;

  appendSection: (key: keyof AnalysisSections, text: string) => void;
  setSection: (key: keyof AnalysisSections, text: string) => void;

  setLoading: (key: keyof LoadingStates, value: boolean) => void;
  setTyping: (key: keyof TypingStates, value: boolean) => void;

  setStatus: (status: string) => void;
  setComplete: () => void;
  reset: () => void;
}

const initialState = {
  source: null,
  analysisId: null,
  sections: {
    companySummary: "",
    companyIssue: "",
    positionMainBusiness: "",
    positionIssue: "",
  },
  loadingStates: {
    companySummary: true,
    companyIssue: true,
    positionMainBusiness: true,
    positionIssue: true,
  },
  typingStates: {
    companySummary: false,
    companyIssue: false,
    positionMainBusiness: false,
    positionIssue: false,
  },
  status: "",
  isComplete: false,
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  ...initialState,

  setSource: (source) => set({ source }),

  setAnalysisId: (id) => set({ analysisId: id }),

  /** AI 스트리밍용: 기존 텍스트 뒤에 이어붙이기 */
  appendSection: (key, text) =>
    set((state) => ({
      sections: {
        ...state.sections,
        [key]: (state.sections[key] ?? "") + text,
      },
    })),

  /** redis / db용: 한 번에 세팅 */
  setSection: (key, text) =>
    set((state) => ({
      sections: {
        ...state.sections,
        [key]: text,
      },
      loadingStates: {
        ...state.loadingStates,
        [key]: false,
      },
    })),

  setLoading: (key, value) =>
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: value,
      },
    })),

  setTyping: (key, value) =>
    set((state) => ({
      typingStates: {
        ...state.typingStates,
        [key]: value,
      },
    })),

  setStatus: (status) => set({ status }),

  setComplete: () => set({ isComplete: true }),

  reset: () => set(initialState),
}));
