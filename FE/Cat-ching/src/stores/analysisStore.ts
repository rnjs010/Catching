import { create } from "zustand";

export type AnalysisSource = "redis" | "database" | "ai" | null;

export const ANALYSIS_SECTION_KEYS = [
  "companySummary",
  "companyIssue",
  "positionMainBusiness",
  "positionIssue",
] as const;

export type AnalysisSectionKey = (typeof ANALYSIS_SECTION_KEYS)[number];

type SectionStateMap<T> = Record<AnalysisSectionKey, T>;

export interface AnalysisSections extends SectionStateMap<string> {}
type LoadingStates = SectionStateMap<boolean>;
type TypingStates = SectionStateMap<boolean>;

interface AnalysisState {
  source: AnalysisSource;
  analysisId: number | null;

  sections: AnalysisSections;
  loadingStates: LoadingStates;
  typingStates: TypingStates;

  status: string;
  isComplete: boolean;
}

interface AnalysisActions {
  setSource: (source: AnalysisSource) => void;
  setAnalysisId: (id: number) => void;

  appendSection: (key: AnalysisSectionKey, text: string) => void;
  setSection: (key: AnalysisSectionKey, text: string) => void;

  setLoading: (key: AnalysisSectionKey, value: boolean) => void;
  setTyping: (key: AnalysisSectionKey, value: boolean) => void;

  setStatus: (status: string) => void;
  setComplete: () => void;

  setAllSections: (params: {
    sections: AnalysisSections;
    analysisId: number;
    source: AnalysisSource;
  }) => void;

  reset: () => void;
}

type AnalysisStore = AnalysisState & AnalysisActions;

export const createSectionState = <T>(initialValue: T): SectionStateMap<T> => {
  return ANALYSIS_SECTION_KEYS.reduce((acc, key) => {
    acc[key] = initialValue;
    return acc;
  }, {} as SectionStateMap<T>);
};

const initialState = {
  source: null,
  analysisId: null,
  sections: createSectionState(""),
  loadingStates: createSectionState(true),
  typingStates: createSectionState(false),
  status: "",
  isComplete: false,
};

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  ...initialState,

  setSource: (source) => set({ source }),
  setAnalysisId: (id) => set({ analysisId: id }),

  /** AI 스트리밍용 */
  appendSection: (key, text) =>
    set((state) => ({
      sections: {
        ...state.sections,
        [key]: (state.sections[key] ?? "") + text,
      },
    })),

  /** redis / db용 */
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

  setAllSections: ({ sections, analysisId, source }) =>
    set({
      sections,
      analysisId,
      source,
      isComplete: true,
      loadingStates: createSectionState(false),
      typingStates: createSectionState(false),
    }),

  reset: () => set(initialState),
}));
