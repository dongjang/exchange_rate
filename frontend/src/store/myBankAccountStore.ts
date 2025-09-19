import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { api } from '../services/api';

export type MyBankAccount = {
  bankCode: string;
  accountNumber: string;
};

export const myBankAccountAtom = atom<MyBankAccount | null>(null);

export type SenderBank = {
  bankCode: string;
  name: string;
};

export const banksAtom = atomFamily<string, SenderBank[] | null>(
  (currencyCode) => atom<SenderBank[] | null>(null)
);

export const fetchBanksAtom = atomFamily<string, any>(
  (currencyCode) =>
    atom(null, async (get: any, set: any) => {
      const banksAtomInst = banksAtom(currencyCode);
      if (!get(banksAtomInst)) {
        const data = await api.getBanks(currencyCode);
        set(banksAtomInst, data);
      }
    })
); 