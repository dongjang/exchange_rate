import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import Select from 'react-select';
import { api } from '../../services/api';
import {
  countryAtom,
  exchangeRatesAtom,
  favoriteCurrenciesAtom,
  getRemittanceCountries,
  remittanceCountriesAtom,
  updateExchangeRatesAtom,
  updateFavoriteCurrenciesAtom
} from '../../store/countryStore';
import CommonPageHeader from './CommonPageHeader';
import ExchangeRatesFavorites from './ExchangeRatesFavorites';
import ExchangeRatesKrwHighlight from './ExchangeRatesKrwHighlight';
import ExchangeRatesList from './ExchangeRatesList';
import ExchangeRatesPaging from './ExchangeRatesPaging';
import { RemitSimulationModal } from './RemitSimulationModal';

interface User {
  id: number; 
  email: string;
  name?: string;
  pictureUrl?: string;
  status?: string;
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
  const [rates] = useAtom(exchangeRatesAtom);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [search, setSearch] = useState('');
  const [favorites] = useAtom(favoriteCurrenciesAtom);
  const [isRemitModalOpen, setIsRemitModalOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState<'all' | 'remittance'>('all');
  const [isMobile, setIsMobile] = useState(false);
  
  const updateExchangeRates = useSetAtom(updateExchangeRatesAtom);
  const updateFavoriteCurrencies = useSetAtom(updateFavoriteCurrenciesAtom);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 관심 환율 목록 조회
  const getUserFavoriteCurrencyList = async () => {
    try {
      await updateFavoriteCurrencies();
    } catch {
      console.error('관심 환율 조회 실패');
    }
  };

  useEffect(() => {
    if(user?.id){
      getUserFavoriteCurrencyList();
    }

  }, [user?.id]);

  const handleFavoriteClick = async (currency: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await api.saveFavoriteCurrency({
          type: 'DEL',
          currency_code: currency,
        });
        // atom 업데이트
        await updateFavoriteCurrencies();
      } else {
        await api.saveFavoriteCurrency({
          type: 'ADD',
          currency_code: currency,
        });
        // atom 업데이트
        await updateFavoriteCurrencies();
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
      await updateExchangeRates();
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    // 환율 조회
    if(user?.id){
      getRates();
    }
  }, []);

  // 송금 가능 국가 선택 시, atom이 비어 있으면 get
  useEffect(() => {
    if (user?.id && countryFilter === 'remittance' && !remittanceCountries) {
      getRemitCountries();
    }
  }, [countryFilter, remittanceCountries, getRemitCountries]);

  // 송금 가능 국가로 변경 시 검색 결과가 없으면 검색어 초기화
  useEffect(() => {
    if (countryFilter === 'remittance' && remittanceCountries) {
      const countryList = remittanceCountries;
      const hasSearchResult = countryList.some(c => {
        if (!search.trim()) return true;
        const countryText = c.countryName || '';
        const currencyName = c.codeName || '';
        const codeText = c.code;
        const q = search.trim().toLowerCase();
        return (
          countryText.toLowerCase().includes(q) ||
          currencyName.toLowerCase().includes(q) ||
          codeText.toLowerCase().includes(q)
        );
      });
      
      // 검색 결과가 없으면 검색어 초기화
      if (!hasSearchResult) {
        setSearch('');
      }
    }
  }, [countryFilter, remittanceCountries, search]);

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
      <CommonPageHeader
        title="💱 오늘의 환율"
        subtitle="1원화 (KRW) 기준"
        gradientColors={{ from: '#667eea', to: '#764ba2' }}
      />
      
      {/* 검색 필터 */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.5rem' : '1rem',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'nowrap',
        flexDirection: 'row',
        marginBottom: '1.5rem',
        background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
        borderRadius: '12px',
        padding: '1.5rem',
        color: '#fff'
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
            <option value="all">전체 국가</option>
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