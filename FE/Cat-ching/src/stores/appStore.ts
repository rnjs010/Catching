import { create } from 'zustand'
import { AppState } from '@/types/store'

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}))
