import React, { useState, useEffect } from 'react';

interface ExchangeRatesKrwHighlightProps {
  krwRate: number;
  onRemitSimClick: () => void;
}

function ExchangeRatesKrwHighlight({ krwRate, onRemitSimClick }: ExchangeRatesKrwHighlightProps) {
  const [isSimBtnHover, setIsSimBtnHover] = useState(false);
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
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: isSmallMobile ? '0.6rem 0.8rem' : isMobile ? '0.8rem 1rem' : '1.5rem 2rem',
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      borderRadius: isSmallMobile ? '6px 6px 6px 6px' : isMobile ? '8px 8px 8px 8px' : '16px 16px 16px 16px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        fontSize: isSmallMobile ? '0.7rem' : isMobile ? '0.8rem' : '1.25rem', 
        fontWeight: 600, 
        color: '#1e293b',
        lineHeight: 1.2
      }}>
        <span>1달러 (USD) = </span>
        <span style={{ color: '#3b82f6', fontWeight: 700 }}>{krwRate.toLocaleString()}원 (KRW)</span>
      </div>
      <button
        style={{
          background: isSimBtnHover
            ? 'linear-gradient(90deg, #60a5fa 60%, #3b82f6 100%)'
            : 'linear-gradient(90deg, #3b82f6 60%, #60a5fa 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: isSmallMobile ? '4px' : isMobile ? '6px' : '9px',
          padding: isSmallMobile ? '0.3rem 0.6rem' : isMobile ? '0.4rem 0.8rem' : '0.6rem 1.2rem',
          fontWeight: 700,
          fontSize: isSmallMobile ? '0.65rem' : isMobile ? '0.75rem' : '1.04rem',
          cursor: 'pointer',
          boxShadow: isSimBtnHover
            ? '0 2px 8px 0 rgba(60, 130, 246, 0.18)'
            : '0 1px 4px rgba(30,41,59,0.07)',
          transition: 'background 0.18s, box-shadow 0.18s',
          outline: 'none',
          whiteSpace: 'nowrap'
        }}
        onClick={onRemitSimClick}
        onMouseEnter={() => setIsSimBtnHover(true)}
        onMouseLeave={() => setIsSimBtnHover(false)}
      >
        송금 시뮬레이션
      </button>
    </div>
  );
}

export default ExchangeRatesKrwHighlight; 