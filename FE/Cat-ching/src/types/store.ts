// 페이지 타입
export type Page =
  | "home"
  | "register"
  | "search"
  | "loading"
  | "analysis"
  | "settings"
  | "chart";

export interface AppState {
  currentPage: Page;
  prevPage: Page | null;
  navigate: (page: Page) => void;
  goBack: () => void;
}

// 사용자 정보 타입
export interface User {
  userId: number;
  userName: string;
  email: string;
}

// 인증 스토어 타입
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  login: () => Promise<boolean>;
  logout: (skipBackend?: boolean) => Promise<void>;
  checkAuth: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

// 사용자 스토어 타입
export interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}
