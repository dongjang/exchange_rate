import { atom } from 'jotai';

export interface User {
  id: number;
  email: string;
  name?: string;
  pictureUrl?: string;
  status?: string;
}

// 로그인 사용자 정보
export const userInfoAtom = atom<User | null>(null);

// 사용자 목록 상태
export const usersAtom = atom<User[]>([]);

// 선택된 사용자 상태
export const selectedUserAtom = atom<User | null>(null);

// 로딩 상태
export const loadingAtom = atom<boolean>(false);

// 에러 상태
export const errorAtom = atom<string | null>(null);

// 사용자 정보 업데이트 함수
export const updateUserAtom = atom(
  null,
  (get: any, set: any, user: User) => {
    set(userInfoAtom, user);
  }
); 