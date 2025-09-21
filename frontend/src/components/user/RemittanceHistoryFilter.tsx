import { useAtom, useSetAtom } from 'jotai';
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { getRemittanceCountries, remittanceCountriesAtom } from '../../store/countryStore';
import './CustomCalendar.css';
import './CustomDatepicker.css';

interface RemittanceHistoryFilterProps {
  filters: {
    recipient: string;
    senderName?: string;
    minAmount: string;
    maxAmount: string;
    currency: string;
    status: string;
    startDate: string;
    endDate: string;
    quickDateRange: string;
    sortOrder: string;
  };
  onFilterChange: (filters: any) => void;
  onSearch: () => void;
  onSortChange?: (sortOrder: string) => void;
  onQuickDateRangeChange?: (range: string) => void;
  showSenderFilter?: boolean;
  useSortSelect?: boolean;
}

const RemittanceHistoryFilter: React.FC<RemittanceHistoryFilterProps> = ({
  filters,
  onFilterChange,
  onSearch,
  onSortChange,
  onQuickDateRangeChange,
  showSenderFilter = false,
  useSortSelect = false
}) => {
  const [startDate, setStartDate] = useState<Date | null>(filters.startDate ? new Date(filters.startDate) : null);
  const [endDate, setEndDate] = useState<Date | null>(filters.endDate ? new Date(filters.endDate) : null);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [remittanceCountries] = useAtom(remittanceCountriesAtom);
  const getRemitCountries = useSetAtom(getRemittanceCountries);
  const [selectedCurrency, setSelectedCurrency] = React.useState(null);
  React.useEffect(() => {
    if (!remittanceCountries) getRemitCountries();
  }, [remittanceCountries, getRemitCountries]);
  const currencyOptions = (remittanceCountries ?? []).map(c => ({ 
    value: c.code, 
    label: isMobile ? `${c.countryName} - ${c.codeName}` : `${c.countryName} – ${c.codeName} (${c.code})` 
  }));

  // 콤마 포맷 함수
  const formatNumberWithCommas = (value: string | number) => {
    const num = typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value.toString();
    if (!num) return '';
    return parseInt(num, 10).toLocaleString();
  };

  const [minAmountInput, setMinAmountInput] = React.useState(filters.minAmount ? formatNumberWithCommas(filters.minAmount) : '');
  const [maxAmountInput, setMaxAmountInput] = React.useState(filters.maxAmount ? formatNumberWithCommas(filters.maxAmount) : '');

  const [showStartCalendar, setShowStartCalendar] = React.useState(false);
  const [showEndCalendar, setShowEndCalendar] = React.useState(false);
  const startCalRef = React.useRef<HTMLDivElement>(null);
  const endCalRef = React.useRef<HTMLDivElement>(null);

  // 캘린더 외부 클릭 시 닫힘
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (showStartCalendar && startCalRef.current && !startCalRef.current.contains(e.target as Node)) {
        setShowStartCalendar(false);
      }
      if (showEndCalendar && endCalRef.current && !endCalRef.current.contains(e.target as Node)) {
        setShowEndCalendar(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showStartCalendar, showEndCalendar]);

  // 필터 값이 변경될 때 로컬 상태 업데이트
  React.useEffect(() => {
    setMinAmountInput(filters.minAmount ? formatNumberWithCommas(filters.minAmount) : '');
    setMaxAmountInput(filters.maxAmount ? formatNumberWithCommas(filters.maxAmount) : '');
    setStartDate(filters.startDate ? new Date(filters.startDate) : null);
    setEndDate(filters.endDate ? new Date(filters.endDate) : null);
  }, [filters.minAmount, filters.maxAmount, filters.startDate, filters.endDate]);

  // 날짜 포맷 함수
  const formatDate = (date: Date | null) => date ? date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }) : '';

  // 금액 입력 핸들러
  const handleAmountInput = (field: 'minAmount' | 'maxAmount', value: string) => {
    const raw = value.replace(/[^0-9]/g, '');
    if (field === 'minAmount') setMinAmountInput(formatNumberWithCommas(raw));
    if (field === 'maxAmount') setMaxAmountInput(formatNumberWithCommas(raw));
    handleInputChange(field, raw);
  };

  const handleInputChange = (field: string, value: string) => {
    const newFilters = {
      ...filters,
      [field]: value
    };
    
    onFilterChange(newFilters);
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    // 날짜 변경 시 즉시 검색
    const newFilters = {
      ...filters,
      startDate: date ? date.toISOString().split('T')[0] : ''
    };
    onFilterChange(newFilters);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    // 날짜 변경 시 즉시 검색
    const newFilters = {
      ...filters,
      endDate: date ? date.toISOString().split('T')[0] : ''
    };
    onFilterChange(newFilters);
  };

  const handleQuickDateRange = (range: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case 'today':
        start = today;
        end = today;
        break;
      case '1month':
        start.setMonth(today.getMonth() - 1);
        break;
      case '3months':
        start.setMonth(today.getMonth() - 3);
        break;
      case '6months':
        start.setMonth(today.getMonth() - 6);
        break;
      case '1year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case '3years':
        start.setFullYear(today.getFullYear() - 3);
        break;
      case '5years':
        start.setFullYear(today.getFullYear() - 5);
        break;
      case 'custom':
        return; // 직접 선택은 그대로 유지
    }

    setStartDate(start);
    setEndDate(end);
    
    // 기간 설정 버튼 전용 핸들러 사용
    if (onQuickDateRangeChange) {
      onQuickDateRangeChange(range);
    } else {
      // 기존 방식 (fallback)
      const newFilters = {
        ...filters,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        quickDateRange: range
      };
      onFilterChange(newFilters);
    }
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setMinAmountInput('');
    setMaxAmountInput('');
    setSelectedCurrency(null);
    onFilterChange({
      recipient: '',
      senderName: '',
      minAmount: '',
      maxAmount: '',
      currency: '',
      status: '',
      startDate: '',
      endDate: '',
      quickDateRange: '', // 초기화 시 빠른 날짜 범위 필터도 초기화
      sortOrder: 'latest' // 기본값으로 초기화
    });
  };

  const handleSearch = () => {
    onSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // 반응형일 때 텍스트 줄이기
  const getPlaceholderText = (defaultText: string, shortText: string) => {
    if (isMobile) {
      return shortText;
    }
    return defaultText;
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '0',
      padding: isMobile ? '2rem 1rem' : '2rem',
      marginBottom: '0',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    }}>
      {/* 첫 번째 행: 보내는 사람, 받는 사람, 수취 통화, 전체 상태 (라벨 제거, placeholder만) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showSenderFilter ? '1fr 1fr 1.5fr 1fr' : '1fr 2.2fr 1fr',
        gap: isMobile ? '0.5rem' : '1rem',
        marginBottom: isMobile ? '0.75rem' : '1.5rem'
      }}>
        {showSenderFilter && (
          <input
            type="text"
            value={filters.senderName || ''}
            onChange={(e) => handleInputChange('senderName', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholderText("보내는 사람", "보내는 사람")}
            style={{
              width: '100%',
              padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              backgroundColor: '#fff',
              transition: 'border 0.18s, box-shadow 0.18s',
            }}
            onFocus={e => { e.currentTarget.style.border = '1.5px solid #3b82f6'; e.currentTarget.style.boxShadow = '0 2px 8px #3b82f633'; }}
            onBlur={e => { e.currentTarget.style.border = '1px solid #d1d5db'; e.currentTarget.style.boxShadow = 'none'; }}
            onMouseEnter={e => { 
              if (e.currentTarget !== document.activeElement) {
                e.currentTarget.style.border = '1px solid #9ca3af';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }
            }}
            onMouseLeave={e => { 
              if (e.currentTarget !== document.activeElement) {
                e.currentTarget.style.border = '1px solid #d1d5db';
                e.currentTarget.style.backgroundColor = '#fff';
              }
            }}
          />
        )}
        <input
          type="text"
          value={filters.recipient}
          onChange={(e) => handleInputChange('recipient', e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={getPlaceholderText("받는 사람", "받는 사람")}
          style={{
            width: '100%',
            padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            backgroundColor: '#fff',
            transition: 'border 0.18s, box-shadow 0.18s',
          }}
          onFocus={e => { e.currentTarget.style.border = '1.5px solid #3b82f6'; e.currentTarget.style.boxShadow = '0 2px 8px #3b82f633'; }}
          onBlur={e => { e.currentTarget.style.border = '1px solid #d1d5db'; e.currentTarget.style.boxShadow = 'none'; }}
          onMouseEnter={e => { 
            if (e.currentTarget !== document.activeElement) {
              e.currentTarget.style.border = '1px solid #9ca3af';
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }
          }}
          onMouseLeave={e => { 
            if (e.currentTarget !== document.activeElement) {
              e.currentTarget.style.border = '1px solid #d1d5db';
              e.currentTarget.style.backgroundColor = '#fff';
            }
          }}
        />
        <Select
          options={currencyOptions}
          value={currencyOptions.find(opt => opt.value === filters.currency) || null}
          onChange={opt => {
            const newValue = opt?.value || '';
            const newFilters = {
              ...filters,
              currency: newValue
            };
            onFilterChange(newFilters);
          }}
          placeholder="수취 통화"
          isSearchable
          isClearable
          noOptionsMessage={() => '검색 결과가 없습니다.'}
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: isMobile ? 32 : 40,
              borderRadius: 8,
              border: state.isFocused ? '1.5px solid #3b82f6' : '1px solid #d1d5db',
              boxShadow: state.isFocused ? '0 2px 8px #3b82f633' : 'none',
              fontSize: isMobile ? '0.75rem' : '0.95rem',
              transition: 'border 0.18s, box-shadow 0.18s, background 0.18s',
              background: '#fff',
              '&:hover': {
                border: '1px solid #9ca3af',
                background: '#f9fafb'
              }
            }),
            menu: base => ({ ...base, zIndex: 10 }),
            option: (base, state) => ({ 
              ...base, 
              color: state.isSelected ? '#2563eb' : '#222', 
              background: state.isSelected ? '#e0e7ef' : '#fff', 
              fontWeight: state.isSelected ? 700 : 500,
              fontSize: isMobile ? '0.75rem' : '0.95rem'
            }),
            singleValue: base => ({ ...base, fontSize: isMobile ? '0.75rem' : '0.95rem', fontWeight: 500, color: '#1e293b' }),
            placeholder: base => ({ ...base, fontSize: isMobile ? '0.75rem' : '0.95rem', color: '#94a3b8' }),
            input: base => ({ ...base, fontSize: isMobile ? '0.75rem' : '0.95rem' }),
          }}
          menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
        />
        <select
          value={filters.status}
          onChange={(e) => {
            const newValue = e.target.value;
            const newFilters = {
              ...filters,
              status: newValue
            };
            onFilterChange(newFilters);
          }}
          style={{
            width: '100%',
            padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            backgroundColor: '#fff',
            transition: 'border 0.18s, box-shadow 0.18s',
          }}
          onFocus={e => { e.currentTarget.style.border = '1.5px solid #3b82f6'; e.currentTarget.style.boxShadow = '0 2px 8px #3b82f633'; }}
          onBlur={e => { e.currentTarget.style.border = '1px solid #d1d5db'; e.currentTarget.style.boxShadow = 'none'; }}
          onMouseEnter={e => { 
            if (e.currentTarget !== document.activeElement) {
              e.currentTarget.style.border = '1px solid #9ca3af';
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }
          }}
          onMouseLeave={e => { 
            if (e.currentTarget !== document.activeElement) {
              e.currentTarget.style.border = '1px solid #d1d5db';
              e.currentTarget.style.backgroundColor = '#fff';
            }
          }}
        >
          <option value="">{getPlaceholderText("전체 상태", "전체")}</option>
          <option value="COMPLETED">완료</option>
          <option value="WAITING">대기</option>
          <option value="FAILED">실패</option>
        </select>
      </div>

      {/* 두 번째 행: 최소 금액 ~ 최대 금액 (라벨 제거, placeholder만) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: isMobile ? '0.5rem' : '1rem',
        marginBottom: isMobile ? '0.75rem' : '1.5rem',
        alignItems: 'end'
      }}>
        <input
          type="text"
          value={minAmountInput}
          onChange={e => handleAmountInput('minAmount', e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={getPlaceholderText("최소 금액", "최소")}
          style={{
            width: '100%',
            padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            backgroundColor: '#fff',
            transition: 'border 0.18s, box-shadow 0.18s',
          }}
          onFocus={e => { e.currentTarget.style.border = '1.5px solid #3b82f6'; e.currentTarget.style.boxShadow = '0 2px 8px #3b82f633'; }}
          onBlur={e => { e.currentTarget.style.border = '1px solid #d1d5db'; e.currentTarget.style.boxShadow = 'none'; }}
          onMouseEnter={e => { 
            if (e.currentTarget !== document.activeElement) {
              e.currentTarget.style.border = '1px solid #9ca3af';
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }
          }}
          onMouseLeave={e => { 
            if (e.currentTarget !== document.activeElement) {
              e.currentTarget.style.border = '1px solid #d1d5db';
              e.currentTarget.style.backgroundColor = '#fff';
            }
          }}
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          paddingBottom: '0.5rem'
        }}>
          <span style={{ fontSize: '1.2rem', color: '#6b7280' }}>~</span>
        </div>
        <input
          type="text"
          value={maxAmountInput}
          onChange={e => handleAmountInput('maxAmount', e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="최대 금액"
          style={{
            width: '100%',
            padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            backgroundColor: '#fff',
            transition: 'border 0.18s, box-shadow 0.18s',
          }}
          onFocus={e => { e.currentTarget.style.border = '1.5px solid #3b82f6'; e.currentTarget.style.boxShadow = '0 2px 8px #3b82f633'; }}
          onBlur={e => { e.currentTarget.style.border = '1px solid #d1d5db'; e.currentTarget.style.boxShadow = 'none'; }}
          onMouseEnter={e => { 
            if (e.currentTarget !== document.activeElement) {
              e.currentTarget.style.border = '1px solid #9ca3af';
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }
          }}
          onMouseLeave={e => { 
            if (e.currentTarget !== document.activeElement) {
              e.currentTarget.style.border = '1px solid #d1d5db';
              e.currentTarget.style.backgroundColor = '#fff';
            }
          }}
        />
      </div>

      {/* 세 번째 행: 빠른 날짜 선택 버튼들 */}
      <div style={{
        display: 'flex',
        flexWrap: 'nowrap',
        gap: isMobile ? '0.3rem' : '0.7rem',
        marginBottom: isMobile ? '0.75rem' : '1.5rem',
        overflowX: 'auto',
        overflowY: 'visible',
        scrollbarWidth: 'thin',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '0.2rem',
        paddingTop: '0.3rem',
        width: '100%',
        justifyContent: isMobile ? 'center' : 'flex-start',
      }}>
        {[
          { key: 'today', label: '오늘' },
          { key: '1month', label: '1개월' },
          { key: '3months', label: '3개월' },
          { key: '6months', label: '6개월' },
          { key: '1year', label: '1년' },
          { key: '3years', label: '3년' },
          { key: '5years', label: '5년' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleQuickDateRange(key)}
            style={{
              flex: isMobile ? '0 0 auto' : 1,
              minWidth: isMobile ? 'fit-content' : 0,
              padding: isMobile ? '0.25rem 0.5rem' : '0.38rem 0.95rem',
              background: 'linear-gradient(90deg, #f0f6ff 0%, #e0e7ef 100%)',
              color: '#2563eb',
              border: '1.2px solid #dbeafe',
              borderRadius: '1.1rem',
              fontSize: isMobile ? '0.7rem' : '0.92rem',
              fontWeight: 600,
              letterSpacing: '0.01em',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(59,130,246,0.06)',
              transition: 'background 0.16s cubic-bezier(.4,0,.2,1), color 0.16s cubic-bezier(.4,0,.2,1), box-shadow 0.16s cubic-bezier(.4,0,.2,1)',
              outline: 'none',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              zIndex: 1,
              position: 'relative',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.13)';
              e.currentTarget.style.zIndex = '2';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #f0f6ff 0%, #e0e7ef 100%)';
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.borderColor = '#dbeafe';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(59,130,246,0.06)';
              e.currentTarget.style.zIndex = '1';
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 네 번째 행: 시작일 ~ 종료일 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: isMobile ? '0.5rem' : '1rem',
        marginBottom: isMobile ? '0.75rem' : '1.5rem',
        alignItems: 'end'
      }}>
        <div style={{ position: 'relative' }} ref={startCalRef}>
          <div style={{
            position: 'relative',
            width: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}>
            <input
              type="text"
              value={formatDate(startDate)}
              onFocus={() => setShowStartCalendar(true)}
              readOnly
              placeholder="시작일"
              style={{
                width: '100%',
                padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.25rem',
                border: 'none',
                borderRadius: '12px',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                backgroundColor: 'transparent',
                color: '#1e293b',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              pointerEvents: 'none'
            }}>
              📅
            </div>
          </div>
          {showStartCalendar && (
            <div style={{ 
              position: 'absolute', 
              top: '110%', 
              left: 0, 
              zIndex: 99999, 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              borderRadius: '16px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              maxWidth: isMobile ? '280px' : '320px',
              width: isMobile ? '280px' : '320px'
            }}>
              <Calendar
                value={startDate}
                onChange={date => { 
                  setStartDate(date as Date); 
                  setShowStartCalendar(false); 
                  onFilterChange({
                    ...filters,
                    startDate: date ? (date as Date).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }) : ''
                  });
                }}
                locale="ko-KR"
                maxDate={new Date()}
                calendarType="gregory"
                showNavigation={true}
                showNeighboringMonth={false}
              />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem', color: '#6b7280' }}>~</span>
        </div>
        <div style={{ position: 'relative' }} ref={endCalRef}>
          <div style={{
            position: 'relative',
            width: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}>
            <input
              type="text"
              value={formatDate(endDate)}
              onFocus={() => setShowEndCalendar(true)}
              readOnly
              placeholder="종료일"
              style={{
                width: '100%',
                padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.25rem',
                border: 'none',
                borderRadius: '12px',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                backgroundColor: 'transparent',
                color: '#1e293b',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              pointerEvents: 'none'
            }}>
              📅
            </div>
          </div>
          {showEndCalendar && (
            <div style={{ 
              position: 'absolute', 
              top: '110%', 
              right: isMobile ? '0' : '0', 
              left: isMobile ? 'auto' : 'auto',
              zIndex: 10, 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              borderRadius: '16px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              maxWidth: isMobile ? '280px' : '320px',
              width: isMobile ? '280px' : '320px'
            }}>
              <Calendar
                value={endDate}
                onChange={date => { 
                  setEndDate(date as Date); 
                  setShowEndCalendar(false); 
                  onFilterChange({
                    ...filters,
                    endDate: date ? (date as Date).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }) : ''
                  });
                }}
                locale="ko-KR"
                minDate={startDate || undefined}
                maxDate={new Date()}
                calendarType="gregory"
                showNavigation={true}
                showNeighboringMonth={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* 버튼 행: 정렬 + 우측 정렬 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: isMobile ? '0.4rem' : '0.7rem' }}>
        {/* 정렬 버튼 */}
        <div style={{ display: 'flex', gap: isMobile ? '0.3rem' : '0.4rem' }}>
          {useSortSelect ? (
            <select
              value={filters.sortOrder}
              onChange={(e) => {
                if (onSortChange) {
                  onSortChange(e.target.value);
                } else {
                  const newValue = e.target.value;
                  const newFilters = {
                    ...filters,
                    sortOrder: newValue
                  };
                  onFilterChange(newFilters);
                }
              }}
              style={{
                padding: isMobile ? '0.4rem 0.8rem' : '0.6rem 1.2rem',
                backgroundColor: '#fff',
                color: '#1e293b',
                border: '2px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                height: isMobile ? '36px' : '44px',
                outline: 'none'
              }}
              onFocus={e => { e.currentTarget.style.border = '2px solid #3b82f6'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.2)'; }}
              onBlur={e => { e.currentTarget.style.border = '2px solid #d1d5db'; e.currentTarget.style.boxShadow = 'none'; }}
              onMouseEnter={e => { 
                if (e.currentTarget !== document.activeElement) {
                  e.currentTarget.style.border = '2px solid #9ca3af';
                }
              }}
              onMouseLeave={e => { 
                if (e.currentTarget !== document.activeElement) {
                  e.currentTarget.style.border = '2px solid #d1d5db';
                }
              }}
            >
              <option value="latest">최신순</option>
              <option value="oldest">과거순</option>
              <option value="amount_desc">송금액 많은 순</option>
              <option value="amount_asc">송금액 적은 순</option>
            </select>
          ) : (
            <>
            </>
          )}
        </div>
        
        {/* 기존 버튼들 */}
        <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.7rem' }}>
        <button
          onClick={clearFilters}
          style={{
            padding: isMobile ? '0.4rem 0.8rem' : '0.6rem 1.2rem',
            backgroundColor: '#fff',
            color: '#3b82f6',
            border: '2px solid #3b82f6',
            borderRadius: '0.5rem',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.3rem' : '0.5rem',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            height: isMobile ? '36px' : '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.color = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.1)';
          }}
        >
          <span style={{ fontSize: '1.1rem', transition: 'transform 0.2s ease' }}>↻</span>
          초기화
        </button>
        <button
          onClick={handleSearch}
          style={{
            padding: isMobile ? '0.4rem 0.8rem' : '0.6rem 1.2rem',
            background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.3rem' : '0.5rem',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            height: isMobile ? '36px' : '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
          }}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ marginRight: '2px' }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          검색
        </button>
        </div>
      </div>
    </div>
  );
};

export default RemittanceHistoryFilter; 