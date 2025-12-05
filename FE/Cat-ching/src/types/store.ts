export interface AppState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

// 사용자 정보 타입
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// 인증 스토어 타입
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

// 사용자 스토어 타입
export interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}
