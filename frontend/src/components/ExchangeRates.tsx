import React, { useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { countryAtom, remittanceCountriesAtom, getRemittanceCountries } from '../store/countryStore';
import { userInfoAtom } from '../store/userStore';
import { api } from '../services/api';
import axios from 'axios';
import Select from 'react-select';
import ExchangeRatesFavorites from './ExchangeRatesFavorites';
import ExchangeRatesList from './ExchangeRatesList';
import ExchangeRatesPaging from './ExchangeRatesPaging';
import ExchangeRatesKrwHighlight from './ExchangeRatesKrwHighlight';
import { RemitSimulationModal } from './RemitSimulationModal';

interface User {
  id: number;
  name: string;
  email: string;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20];

function paginate<T>(array: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return array.slice(start, start + pageSize);
}

const formatCurrencyLabel = (code: string, countries: {code: string, codeName: string, countryName: string}[]) => {
  const country = countries.find(c => c.code === code);
  return country ? `${country.countryName} - ${country.codeName} (${country.code})` : code;
};

export function ExchangeRates({ user }: { user: User | null }) {
  const [countries] = useAtom(countryAtom);
  const [remittanceCountries] = useAtom(remittanceCountriesAtom);
  const getRemitCountries = useSetAtom(getRemittanceCountries);
  const [rates, setRates] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isRemitModalOpen, setIsRemitModalOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState<'all' | 'remittance'>('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 관심 환율 목록 조회
  const getUserFavoriteCurrencyList = async () => {
    try {
      const list = await api.getFavoriteCurrencyList(user?.id || 0);
      setFavorites(list);
    } catch {
      setFavorites([]);
    }
  };

  useEffect(() => {
    getUserFavoriteCurrencyList();
  }, []);

  const handleFavoriteClick = async (currency: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await api.saveFavoriteCurrency({
          type: 'DEL',
          user_id: user?.id || 0,
          currency_code: currency,
        });
        setFavorites(prev => prev.filter(f => f !== currency));
      } else {
        await api.saveFavoriteCurrency({
          type: 'ADD',
          user_id: user?.id || 0,
          currency_code: currency,
        });
        setFavorites(prev => [...prev, currency]);
      }
    } catch (error) {
      console.error('관심 환율 처리 중 오류:', error);
    }
  };

  // 관심 환율 데이터
  const favoriteRates = favorites
    .map(code => [code, rates[code]] as [string, number])
    .filter(([code, rate]) => (code !== 'KRW' && code !== 'USD') && rate !== undefined);

  const getRates = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/exchange/exchangeRates', { withCredentials: true });
      setRates(res.data.conversion_rates);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
   //환율 조회
   //getRates();
  }, []);

  // 송금 가능 국가 선택 시, atom이 비어 있으면 get
  useEffect(() => {
    if (countryFilter === 'remittance' && !remittanceCountries) {
      getRemitCountries();
    }
  }, [countryFilter, remittanceCountries, getRemitCountries]);

  // react-select용 옵션 생성
  const searchOptions = (() => {
    const countryList = countryFilter === 'remittance' && remittanceCountries ? remittanceCountries : countries;
    return countryList
      .filter(c => c.code !== 'KRW' && c.code !== 'USD')
      .map(c => ({
        value: c.code,
        label: `${c.countryName} - ${c.codeName} (${c.code})`
      }));
  })();

  const selectedSearchOption = searchOptions.find(opt => opt.value === search) || null;

  // 페이징 관련
  const rateEntries = Object.entries(rates).filter(([currency]) => currency !== 'KRW' && currency !== 'USD');
  const filteredRateEntries = rateEntries.filter(([currency]) => {
    // 송금 가능 국가 필터
    const countryList = countryFilter === 'remittance' && remittanceCountries ? remittanceCountries : countries;
    if (countryFilter === 'remittance' && remittanceCountries && !remittanceCountries.some(c => c.code === currency)) {
      return false;
    }
    if (!search.trim()) return true;
    const countryText = countryList.find(c => c.code === currency)?.countryName || '';
    const currencyName = countryList.find(c => c.code === currency)?.codeName || '';
    const codeText = currency;
    const q = search.trim().toLowerCase();
    return (
      countryText.toLowerCase().includes(q) ||
      currencyName.toLowerCase().includes(q) ||
      codeText.toLowerCase().includes(q)
    );
  });
  const total = filteredRateEntries.length;
  const totalPages = Math.ceil(total / pageSize);
  const pagedRates = paginate(filteredRateEntries, page, pageSize);

  // pageSize, search, countryFilter 변경 시 1페이지로 이동
  useEffect(() => { setPage(1); }, [pageSize, search, countryFilter]);

  // KRW 환율 별도 추출
  const krwRate = rates['KRW'];

  // if (loading) return <div className="exchange-card"><div className="exchange-loading">환율 불러오는 중...</div></div>;
  // if (error) return <div className="exchange-card"><div className="exchange-error">{error}</div></div>;

  const handleRemitSimulation = (isOpen: boolean) => {
    setIsRemitModalOpen(isOpen);
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      width: '100%',
      margin: '0 auto', 
      padding: '1rem',
      boxSizing: 'border-box'
    }}>
      {/* 헤더 섹션 */}
      <div style={{
        background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
        borderRadius: '16px 16px 0 0',
        padding: '2rem',
        color: '#fff',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💱</div>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          margin: 0
        }}>
          오늘의 환율 <span style={{ fontWeight: 500, fontSize: '1.1rem', opacity: 0.8 }}>USD (달러) 기준</span>
        </h1>
        
        {/* 검색 필터 */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.5rem' : '1rem',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'nowrap',
          flexDirection: 'row',
          marginTop: '1.5rem'
        }}>
          <div style={{ position: 'relative' }}>
            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value as 'all' | 'remittance')}
              style={{
                padding: isMobile ? '0.4rem 0.7rem' : '0.75rem 1rem',
                border: 'none',
                borderRadius: '8px',
                background: '#fff',
                color: '#1e293b',
                fontWeight: 500,
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                minWidth: isMobile ? 80 : 110,
                height: isMobile ? 36 : 44,
                outline: 'none'
              }}
            >
              <option value="all">전체</option>
              <option value="remittance">송금 가능 국가</option>
            </select>
          </div>
          <div style={{ minWidth: isMobile ? 290 : 300, maxWidth: isMobile ? 380 : 400, flex: 1 }}>
            <Select
              options={searchOptions}
              value={selectedSearchOption}
              onChange={(opt) => setSearch(opt?.value || '')}
              isSearchable
              placeholder="국가/통화명/통화로 검색"
              isClearable
              noOptionsMessage={() => '검색 결과가 없습니다.'}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: isMobile ? 32 : 44,
                  borderRadius: '8px',
                  border: 'none',
                  background: '#fff',
                  fontSize: isMobile ? '0.75rem' : '1rem',
                  fontWeight: 500,
                  boxShadow: 'none',
                  padding: isMobile ? '0 0.3rem' : undefined,
                }),
                menu: (base) => ({ ...base, zIndex: 10 }),
                menuPortal: base => ({ ...base, zIndex: 9999 }),
                option: (base, state) => ({
                  ...base,
                  color: state.isSelected ? '#2563eb' : '#222',
                  background: state.isSelected ? '#e0e7ef' : '#fff',
                  fontWeight: state.isSelected ? 700 : 500,
                  fontSize: isMobile ? '0.75rem' : '1rem',
                  padding: isMobile ? '6px 8px' : '8px 12px',
                }),
                singleValue: (base) => ({
                  ...base,
                  fontSize: isMobile ? '0.75rem' : '1rem',
                  fontWeight: 500,
                  color: '#1e293b'
                }),
                placeholder: (base) => ({
                  ...base,
                  fontSize: isMobile ? '0.75rem' : '1rem',
                  color: '#94a3b8'
                }),
                input: (base) => ({
                  ...base,
                  fontSize: isMobile ? '0.75rem' : '1rem',
                }),
              }}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
            />
          </div>
        </div>
      </div>

      {/* 환율 표시 섹션 */}
      {krwRate && (
        <ExchangeRatesKrwHighlight krwRate={krwRate} onRemitSimClick={() => handleRemitSimulation(true)} />
      )}

      {/* 송금 시뮬레이션 모달 */}
      <RemitSimulationModal
        isOpen={isRemitModalOpen}
        onClose={() => handleRemitSimulation(false)}
        rates={rates}
      />

      {/* 관심 환율 섹션 */}
      <ExchangeRatesFavorites
        favoriteRates={favoriteRates}
        favorites={favorites}
        handleFavoriteClick={handleFavoriteClick}
        formatCurrencyLabel={code => formatCurrencyLabel(code, countries)}
      />

      {/* 환율 리스트 섹션 */}
      <ExchangeRatesList
        pagedRates={pagedRates}
        favorites={favorites}
        handleFavoriteClick={handleFavoriteClick}
        formatCurrencyLabel={code => formatCurrencyLabel(code, countries)}
        countryFilter={countryFilter}
      />

      {/* 페이징 */}
      <ExchangeRatesPaging
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
        total={total}
      />
    </div>
  );
} 