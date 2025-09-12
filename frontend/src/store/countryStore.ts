import type { Getter, Setter } from 'jotai';
import { atom } from 'jotai';
import { api } from '../services/api';
import { userInfoAtom } from './userStore';

export type Country = {
  code: string;
  codeName: string;
  countryName: string;
};

export const countryAtom = atom<Country[]>([]);

// 송금 가능 국가 atom
export const remittanceCountriesAtom = atom<Country[] | null>(null);

// 환율 데이터 atom
export const exchangeRatesAtom = atom<{ [key: string]: number }>({});

// 관심 환율 atom
export const favoriteCurrenciesAtom = atom<string[]>([]);

export const getRemittanceCountries = atom(
  null,
  async (get: Getter, set: Setter) => {
    if (!get(remittanceCountriesAtom) && get(userInfoAtom)?.id) {
      const data = await api.getRemittanceCountries();
      set(remittanceCountriesAtom, data);
    }
  }
);

// 환율 데이터 업데이트 atom
export const updateExchangeRatesAtom = atom(
  null,
  async (get: Getter, set: Setter) => {
    const currentRates = get(exchangeRatesAtom);
    if (Object.keys(currentRates).length === 0 && get(userInfoAtom)?.id) {
      const response = await api.getExchangeRates();
      if (response.success && response.rates) {
        set(exchangeRatesAtom, response.rates as { [key: string]: number });
      } else {
        console.error('환율 데이터 조회 실패:', response.message);
      }
    }
  }
);

// 관심 환율 업데이트 atom
export const updateFavoriteCurrenciesAtom = atom(
  null,
  async (get: Getter, set: Setter,) => {
    const list = await api.getFavoriteCurrencyList();
    set(favoriteCurrenciesAtom, list);
  }
); 