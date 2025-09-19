import { atom } from 'jotai';
import type { AuthUser } from '../services/api';

export interface AuthState {
  isAuthenticated: boolean | 'unknown';
  isLoading: boolean;
  user?: AuthUser;
}

export const authAtom = atom<AuthState>({
  isAuthenticated: 'unknown', // 초기 상태를 'unknown'으로 설정
  isLoading: false,
});

export const setAuthAtom = atom(
  null,
  (get, set, authState: AuthState) => {
    set(authAtom, authState);
  }
);

export const clearAuthAtom = atom(
  null,
  (get, set) => {
    set(authAtom, {
      isAuthenticated: false,
      isLoading: false,
    });
  }
); 