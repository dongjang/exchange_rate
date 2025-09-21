import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface ExchangeRatesFavoritesProps {
  favoriteRates: [string, number][];
  favorites: string[];
  handleFavoriteClick: (currency: string, isFavorite: boolean) => void;
  formatCurrencyLabel: (code: string) => string;
}

function ExchangeRatesFavorites({ favoriteRates, favorites, handleFavoriteClick, formatCurrencyLabel }: ExchangeRatesFavoritesProps) {
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
      borderRadius: '16px',
      margin: '1rem 0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: isMobile ? '0.7rem 0.5rem' : '1rem 2rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: isMobile ? 'nowrap' : 'wrap'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: isMobile ? '1rem' : '1.1rem', 
          fontWeight: 600, 
          color: '#fff',
          whiteSpace: 'nowrap'
        }}>
          관심 환율
        </h3>
        <span style={{ 
          fontSize: isMobile ? '0.8rem' : '0.875rem', 
          color: '#fff', 
          fontWeight: 500,
          whiteSpace: 'nowrap'
        }}>
          {favorites.length}/10
        </span>
      </div>
      
      <div style={{ 
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto', 
        boxSizing: 'border-box'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
          minWidth: '100%'
        }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{
                padding: isMobile ? '0.7rem 0.5rem' : '1rem 2rem',
                textAlign: 'left',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #d1d5db',
                width: '60%'
              }}>수취 통화</th>
              <th style={{
                padding: isMobile ? '0.7rem 0.5rem' : '1rem 2rem',
                textAlign: 'right',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #d1d5db',
                width: '25%'
              }}>환율</th>
              <th style={{
                padding: isMobile ? '0.7rem 0.5rem' : '1rem 2rem',
                textAlign: 'center',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #d1d5db',
                width: '15%'
              }}>관심</th>
            </tr>
          </thead>
          <tbody>
            {favoriteRates.length === 0 ? (
              <tr>
                <td colSpan={3} style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.875rem'
                }}>
                  등록된 관심 환율이 없습니다.
                </td>
              </tr>
            ) : favoriteRates.map(([currency, rate], idx) => (
              <tr key={currency} style={{
                borderBottom: '1px solid #f3f4f6',
                background: idx % 2 === 0 ? '#fff' : '#f9fafb'
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
                  color: '#10b981',
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
                      const currencyLabel = formatCurrencyLabel(currency);
                      
                      const result = await Swal.fire({
                        title: isMobile ? '관심 환율 해제' : '관심 환율을 해제하시겠습니까?',
                        text: currencyLabel,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: '해제',
                        cancelButtonText: '취소',
                        confirmButtonColor: '#10b981',
                        cancelButtonColor: '#6b7280'
                      });
                      
                      if (result.isConfirmed) {
                        handleFavoriteClick(currency, true);
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      color: '#10b981',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#059669';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#10b981';
                    }}
                    title="관심 해제"
                  >
                    ★
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExchangeRatesFavorites; 
