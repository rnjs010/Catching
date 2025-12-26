import { create } from "zustand";

interface NotionPage {
  id: string;
  title: string;
  icon: string | null;
}

interface NotionState {
  isConnected: boolean;
  isConnecting: boolean;
  hasDefaultPage: boolean;
  defaultPageId: string | null;
  defaultPageTitle: string | null;
  workspaceName: string | null;
  availablePages: NotionPage[];

  setNotionInfo: (info: {
    isConnected: boolean;
    hasDefaultPage: boolean;
    defaultPageId: string | null;
    defaultPageTitle: string | null;
    workspaceName: string | null;
  }) => void;
  setConnecting: (isConnecting: boolean) => void;
  setAvailablePages: (pages: NotionPage[]) => void;
  clearNotionInfo: () => void;
}

export const useNotionStore = create<NotionState>((set) => ({
  isConnected: false,
  isConnecting: false,
  hasDefaultPage: false,
  defaultPageId: null,
  defaultPageTitle: null,
  workspaceName: null,
  availablePages: [],

  setNotionInfo: (info) => set((state) => ({ ...state, ...info })),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setAvailablePages: (pages) => set({ availablePages: pages }),
  clearNotionInfo: () =>
    set({
      isConnected: false,
      isConnecting: false,
      hasDefaultPage: false,
      defaultPageId: null,
      defaultPageTitle: null,
      workspaceName: null,
      availablePages: [],
    }),
}));
