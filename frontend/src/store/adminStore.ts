import { atom } from 'jotai';

export interface Admin {
  id: number;
  adminId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  updatedAdminName?: string;
  updatedAdminId?: string;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 관리자 인증 상태
export const adminAuthAtom = atom<AdminAuthState>({
  isAuthenticated: false,
  isLoading: false,
});

// 관리자 정보
export const adminInfoAtom = atom<Admin | null>(null);

// 관리자 인증 상태 설정
export const setAdminAuthAtom = atom(
  null,
  (get, set, authState: AdminAuthState) => {
    set(adminAuthAtom, authState);
  }
);

// 관리자 인증 상태 초기화
export const clearAdminAuthAtom = atom(
  null,
  (get, set) => {
    set(adminAuthAtom, {
      isAuthenticated: false,
      isLoading: false,
    });
    set(adminInfoAtom, null);
  }
);

// 관리자 정보 설정
export const setAdminInfoAtom = atom(
  null,
  (get, set, adminInfo: Admin | null) => {
    set(adminInfoAtom, adminInfo);
  }
);
