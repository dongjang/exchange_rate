import React, { useState, useMemo, useEffect } from 'react';
import Select from 'react-select';
import { useAtom, useSetAtom } from 'jotai';
import { remittanceCountriesAtom, getRemittanceCountries, exchangeRatesAtom, updateExchangeRatesAtom } from '../../store/countryStore';

function formatNumberWithCommas(value: string | number) {
  const num = typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value.toString();
  if (!num) return '';
  return parseInt(num, 10).toLocaleString();
}

interface RemitSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: { [key: string]: number };
}

const FEE_RATE = 0.01; // 1% 수수료

export function RemitSimulationModal({ isOpen, onClose, rates }: RemitSimulationModalProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [backdropClicked, setBackdropClicked] = useState(false);
  const [exchangeRates] = useAtom(exchangeRatesAtom);
  const updateExchangeRates = useSetAtom(updateExchangeRatesAtom);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsSmallMobile(width <= 480);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 모달이 열릴 때마다 입력값/통화 초기화
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setCurrency('');
    }
  }, [isOpen]);
  
  // 환율 데이터가 비어있을 때만 조회
  useEffect(() => {
    if (isOpen && (!exchangeRates || Object.keys(exchangeRates).length === 0)) {
      updateExchangeRates();
    }
  }, [isOpen, exchangeRates, updateExchangeRates]);

  const [remittanceCountries] = useAtom(remittanceCountriesAtom);
  const getRemitCountries = useSetAtom(getRemittanceCountries);
  useEffect(() => {
    if (isOpen && !remittanceCountries) {
      getRemitCountries();
    }
  }, [isOpen, remittanceCountries, getRemitCountries]);

  // 숫자만 추출해서 계산에 사용
  const numericAmount = amount.replace(/[^0-9]/g, '');
  const parsedAmount = parseFloat(numericAmount) || 0;
  const rate = rates[currency] ? 1 / rates[currency] : 0;
  const fee = useMemo(() => Math.floor(parsedAmount * FEE_RATE), [parsedAmount]);
  const krwRate = rates['KRW'] || 0;
  
  // 선택된 통화로 변환된 금액 계산 (입력한 원화 금액 ÷ 선택된 외화 환율)
  const convertedAmount = useMemo(() => {
    if (!parsedAmount || !currency || !exchangeRates[currency]) return 0;
    return parsedAmount / exchangeRates[currency];
  }, [parsedAmount, currency, exchangeRates]);

  // 통화 표시 이름 생성
  const getCurrencyDisplayName = (currencyCode: string) => {
    if (!remittanceCountries) return currencyCode;
    
    const country = remittanceCountries.find(c => c.code === currencyCode);
    if (country) {
      return `${country.codeName} (${country.code})`;
    }
    
    // fallback for KRW
    if (currencyCode === 'KRW') {
      return '원 (KRW)';
    }
    
    return currencyCode;
  };
  
  // USD 등 타 통화 환산: (송금액-수수료) / (KRW 환율)
  const received = useMemo(() => {
    if (!krwRate || !rates[currency]) return 0;
    if (currency === 'USD') {
      return (parsedAmount - fee) / krwRate;
    } else {
      // USD → 타 통화: (원화 → USD → 타 통화)
      const usd = (parsedAmount - fee) / krwRate;
      return usd * rates[currency];
    }
  }, [parsedAmount, fee, krwRate, rates, currency]);

  // react-select용 옵션 생성
  const currencyOptions = (remittanceCountries ?? [])
    .filter(c => c.code !== 'KRW')
    .map(c => ({
      value: c.code,
      label: `${c.countryName} – ${c.codeName} (${c.code})`
    }));
  const selectedCurrencyOption = currencyOptions.find(opt => opt.value === currency) || null;

  if (!isOpen) return null;

  return (
    <div
      className="remit-modal-backdrop"
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,41,59,0.48)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) setBackdropClicked(true);
        else setBackdropClicked(false);
      }}
      onMouseUp={e => {
        if (e.target === e.currentTarget && backdropClicked) {
          setBackdropClicked(false);
          onClose();
        }
      }}
    >
      <div
        className="remit-modal-card"
        style={{ 
          background: '#fff', 
          borderRadius: isSmallMobile ? '8px' : isMobile ? '12px' : '16px', 
          boxShadow: isSmallMobile ? '0 2px 12px rgba(30,41,59,0.1)' : isMobile ? '0 3px 18px rgba(30,41,59,0.12)' : '0 4px 24px rgba(30,41,59,0.13)', 
          minWidth: isSmallMobile ? 280 : isMobile ? 320 : 350, 
          maxWidth: isSmallMobile ? 340 : isMobile ? 380 : 400, 
          width: '100%', 
          padding: isSmallMobile ? '1.2rem 1rem 1rem 1rem' : isMobile ? '1.6rem 1.4rem 1.2rem 1.4rem' : '2.2rem 2rem 1.5rem 2rem', 
          position: 'relative',
          margin: isSmallMobile ? '1rem' : isMobile ? '1.5rem' : '0'
        }}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: isSmallMobile ? 12 : isMobile ? 15 : 18, right: isSmallMobile ? 12 : isMobile ? 15 : 18, background: 'none', border: 'none', fontSize: isSmallMobile ? '1.2rem' : isMobile ? '1.3rem' : '1.5rem', color: '#888', cursor: 'pointer' }} aria-label="닫기">×</button>
        <h2 style={{ fontSize: isSmallMobile ? '0.9rem' : isMobile ? '1rem' : '1.25rem', fontWeight: 700, marginBottom: isSmallMobile ? '0.3rem' : isMobile ? '0.4rem' : '0.5rem', color: '#2563eb' }}>송금 시뮬레이션</h2>
        <p style={{ fontSize: isSmallMobile ? '0.7rem' : isMobile ? '0.75rem' : '0.9rem', color: '#64748b', marginBottom: isSmallMobile ? '0.8rem' : isMobile ? '1rem' : '1.2rem', lineHeight: '1.4' }}>
          송금 가능 국가만 조회할 수 있습니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isSmallMobile ? '0.8rem' : isMobile ? '0.9rem' : '1.1rem' }}>
          <label style={{ fontWeight: 500, color: '#222', fontSize: isSmallMobile ? '0.8rem' : isMobile ? '0.85rem' : '1rem' }}>
            송금액 (원 : KRW)
            <input
              type="text"
              inputMode="numeric"
              value={formatNumberWithCommas(amount)}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setAmount(raw);
              }}
              style={{ 
                width: '100%', 
                marginTop: isSmallMobile ? 4 : 6, 
                padding: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : '0.7rem', 
                borderRadius: isSmallMobile ? 5 : isMobile ? 6 : 7, 
                border: '1.5px solid #e0e7ef', 
                fontSize: isSmallMobile ? '0.8rem' : isMobile ? '0.9rem' : '1.1rem', 
                fontWeight: 500 
              }}
              placeholder="예: 1,000,000"
              autoComplete="off"
              maxLength={12}
            />
          </label>
          <label style={{ fontWeight: 500, color: '#222', fontSize: isSmallMobile ? '0.8rem' : isMobile ? '0.85rem' : '1rem' }}>
            수취 통화
            <div style={{ margin: isSmallMobile ? '4px 0 2px 0' : '6px 0 4px 0', fontSize: isSmallMobile ? '0.7rem' : isMobile ? '0.75rem' : '0.98em', color: '#64748b' }}>
              국가, 통화명, 통화로 검색 또는 선택해 주세요
            </div>
            <div style={{ marginTop: isSmallMobile ? 4 : 6 }}>
              <Select
                key={isOpen ? 'open' : 'closed'}
                options={currencyOptions}
                value={selectedCurrencyOption}
                onChange={opt => {
                  setCurrency(opt?.value || '');
                  setAmount(''); // 통화 변경 시 송금액 초기화
                }}
                isSearchable
                placeholder={isSmallMobile ? "국가/통화 검색" : isMobile ? "국가/통화 검색" : "국가/통화명/통화로 검색"}
                styles={{
                  control: base => ({ 
                    ...base, 
                    borderRadius: isSmallMobile ? 5 : isMobile ? 6 : 7, 
                    border: '1.5px solid #e0e7ef', 
                    fontSize: isSmallMobile ? '0.8rem' : isMobile ? '0.9rem' : '1.1rem', 
                    fontWeight: 500, 
                    minHeight: isSmallMobile ? 36 : isMobile ? 40 : 44 
                  }),
                  menu: base => ({ ...base, zIndex: 99999 }),
                  option: (base, state) => ({
                    ...base,
                    fontSize: isSmallMobile ? '0.75rem' : isMobile ? '0.8rem' : '1rem',
                    padding: isSmallMobile ? '6px 8px' : isMobile ? '8px 10px' : '8px 12px'
                  }),
                  singleValue: base => ({
                    ...base,
                    fontSize: isSmallMobile ? '0.8rem' : isMobile ? '0.9rem' : '1.1rem'
                  }),
                  placeholder: base => ({
                    ...base,
                    fontSize: isSmallMobile ? '0.75rem' : isMobile ? '0.8rem' : '1rem'
                  })
                }}
                noOptionsMessage={() => '검색 결과가 없습니다.'}
              />
            </div>
          </label>
        </div>
        <div style={{ 
          marginTop: isSmallMobile ? '1rem' : isMobile ? '1.2rem' : '1.5rem', 
          background: '#f8fafc', 
          borderRadius: isSmallMobile ? 6 : isMobile ? 8 : 10, 
          padding: isSmallMobile ? '0.7rem' : isMobile ? '0.9rem' : '1.1rem', 
          fontSize: isSmallMobile ? '0.75rem' : isMobile ? '0.85rem' : '1.08rem', 
          color: '#222', 
          boxShadow: '0 1px 4px rgba(30,41,59,0.06)' 
        }}>
          {krwRate > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontWeight: 500, color: '#2563eb' }}>
              <span>현재 원화 환율</span>
              <span>1 USD = {krwRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} KRW</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>환율</span>
            <span>
              1 KRW = {
                krwRate && rates[currency] && currency
                  ? (
                      currency === 'USD'
                        ? (1 / krwRate).toFixed(2)
                        : (rates[currency] / krwRate).toFixed(2)
                    )
                  : '-'
              } {currency}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>수수료 (1% : 원)</span>
            <span>{fee.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>송금액(원)</span>
            <span>{parsedAmount > 0 ? parsedAmount.toLocaleString() : '-'}</span>
          </div>
          {convertedAmount > 0 && currency && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#059669', fontWeight: 600 }}>
              <span>변환 금액</span>
              <span>{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencyDisplayName(currency)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>
            <span>총 출금액(원)</span>
            <span>{parsedAmount > 0 ? (parsedAmount + fee).toLocaleString() : '-'}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '2.2rem',
            width: '100%',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.9rem 0',
            fontWeight: 700,
            fontSize: '1.08rem',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(30,41,59,0.07)'
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
} 