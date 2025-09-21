import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface ExchangeRatesListProps {
  pagedRates: [string, number][];
  favorites: string[];
  handleFavoriteClick: (currency: string, isFavorite: boolean) => void;
  formatCurrencyLabel: (code: string) => string;
  countryFilter: 'all' | 'remittance';
}

function ExchangeRatesList({ pagedRates, favorites, handleFavoriteClick, formatCurrencyLabel, countryFilter }: ExchangeRatesListProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px 16px 0 0',
      margin: '1rem 0 0 0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#f8fafc',
        padding: isMobile ? '0.7rem 0.5rem' : '1rem 2rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
          전체 환율
        </h3>
        <span style={{
            display: 'inline-block',
          padding: '0.5rem 1rem',
          borderRadius: '1rem',
          fontSize: '0.875rem',
            fontWeight: 600,
            background: countryFilter === 'remittance' ? '#dbeafe' : '#e0e7ef',
          color: countryFilter === 'remittance' ? '#1d4ed8' : '#2563eb'
        }}>
          {countryFilter === 'remittance' ? '송금 가능 국가' : '전체 국가'}
        </span>
      </div>
      
      <div style={{ 
        overflowX: 'auto',
        maxWidth: '100%'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
          minWidth: '100%'
        }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{
                padding: isMobile ? '0.7rem 0.5rem' : '1rem 2rem',
                textAlign: 'left',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                width: '60%'
              }}>수취 통화</th>
              <th style={{
                padding: isMobile ? '0.7rem 0.5rem' : '1rem 2rem',
                textAlign: 'right',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                width: '25%'
              }}>환율</th>
              <th style={{
                padding: isMobile ? '0.7rem 0.5rem' : '1rem 2rem',
                textAlign: 'center',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                width: '15%'
              }}>관심</th>
            </tr>
          </thead>
          <tbody>
            {pagedRates.length === 0 ? (
              <tr>
                <td colSpan={3} style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.875rem'
                }}>
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              pagedRates.map(([currency, rate], idx) => (
                <tr key={currency} style={{
                  borderBottom: '1px solid #f1f5f9',
                  background: idx % 2 === 0 ? '#fff' : '#f8fafc'
                }}>
                  <td style={{
                    padding: isMobile ? '0.7rem 0.5rem' : '1rem 2rem',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}>
                    <div style={{ 
                      fontSize: isMobile ? '0.7rem' : '1rem', 
                      color: '#1e293b', 
                      fontWeight: 600 
                    }}>
                      {formatCurrencyLabel(currency)}
                    </div>
                  </td>
                  <td style={{
                    padding: isMobile ? '0.7rem 0.5rem' : '1rem 2rem',
                    textAlign: 'right',
                    color: '#3b82f6',
                    fontSize: isMobile ? '0.7rem' : '1rem',
                    fontWeight: isMobile ? 700 : 600
                  }}>
                    {rate.toFixed(2)}
                  </td>
                  <td style={{
                    padding: isMobile ? '0.7rem 0.5rem' : '1rem 2rem',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={async () => {
                        const isFavorite = favorites.includes(currency);
                        const action = isFavorite ? '해제' : '등록';
                        const currencyLabel = formatCurrencyLabel(currency);
                        
                        const result = await Swal.fire({
                          title: isMobile ? `관심 환율 ${action}` : `관심 환율을 ${action}하시겠습니까?`,
                          text: currencyLabel,
                          icon: 'question',
                          showCancelButton: true,
                          confirmButtonText: action,
                          cancelButtonText: '취소',
                          confirmButtonColor: '#3b82f6',
                          cancelButtonColor: '#6b7280'
                        });
                        
                        if (result.isConfirmed) {
                          handleFavoriteClick(currency, isFavorite);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        color: favorites.includes(currency) ? '#fbbf24' : '#d1d5db',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!favorites.includes(currency)) {
                          e.currentTarget.style.color = '#fbbf24';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!favorites.includes(currency)) {
                          e.currentTarget.style.color = '#d1d5db';
                        }
                      }}
                      title={favorites.includes(currency) ? '관심 해제' : '관심 등록'}
                    >
                      {favorites.includes(currency) ? '★' : '☆'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExchangeRatesList; 