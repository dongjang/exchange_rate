import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { remittanceCountriesAtom } from '../../store/countryStore';

export interface Remittance {
  id: number;
  userId: number;
  senderBank: string;
  senderAccount: string;
  receiverBank: string;
  receiverAccount: string;
  receiverName: string;
  receiverCountry: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface RemittanceListProps {
  remittances: Remittance[];
  onRemittanceClick?: (remittance: Remittance) => void;
}



const getStatusText = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '완료';
    case 'WAITING':
      return '대기';
    case 'FAILED':
      return '실패';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '#10b981';
    case 'PENDING':
      return '#f59e0b';
    case 'FAILED':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

function RemittanceList({ remittances, onRemittanceClick }: RemittanceListProps) {
  const [selected, setSelected] = useState<Remittance | null>(null);
  const [countries] = useAtom(remittanceCountriesAtom);
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

  const formatCurrencyLabel = (code: string) => {
    const country = countries?.find(c => c.code === code);
    if (country) {
      return `${country.countryName} - ${country.codeName} (${country.code})`;
    }
    return code;
  };

  // 반응형 텍스트 처리 함수
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 받는 사람 이름 처리 (모바일에서 10자 제한)
  const formatReceiverName = (name: string) => {
    if (isMobile && name.length > 10) {
      return truncateText(name, 10);
    }
    return name;
  };

  // 수취통화 텍스트 처리 (12글자 이상시 ... 처리)
  const formatCurrencyLabelForDisplay = (code: string) => {
    const fullText = formatCurrencyLabel(code);
    if (isMobile && fullText.length > 12) {
      return truncateText(fullText, 12);
    }
    return fullText;
  };

  // 송금일 텍스트 처리 (반응형에서 더 짧게)
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (isMobile) {
      return `${month}.${day} ${hours}:${minutes}`;
    }
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const handleRemittanceClick = (remittance: Remittance) => {
    if (onRemittanceClick) {
      onRemittanceClick(remittance);
    } else {
      setSelected(remittance);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
          borderRadius: '0',
          overflow: 'hidden',
          boxShadow: 'none',
          borderTop: '1px solid #e5e7eb'
        }}>
          <thead>
            <tr style={{ 
              background: '#fff', 
              color: '#374151',
              fontSize: isSmallMobile ? '0.65rem' : isMobile ? '0.7rem' : '0.875rem',
              fontWeight: 600,
              borderBottom: '2px solid #e2e8f0'
            }}>
              <th style={{ 
                padding: isSmallMobile ? '0.375rem 0.25rem' : isMobile ? '0.4rem 0.375rem' : '1rem', 
                textAlign: 'left' 
              }}>받는 사람</th>
              <th style={{ 
                padding: isSmallMobile ? '0.375rem 0.25rem' : isMobile ? '0.4rem 0.375rem' : '1rem', 
                textAlign: 'left' 
              }}>수취 통화</th>
              <th style={{ 
                padding: isSmallMobile ? '0.375rem 0.25rem' : isMobile ? '0.4rem 0.375rem' : '1rem', 
                textAlign: 'right' 
              }}>금액(원)</th>
              <th style={{ 
                padding: isSmallMobile ? '0.375rem 0.25rem' : isMobile ? '0.4rem 0.375rem' : '1rem', 
                textAlign: 'center' 
              }}>상태</th>
              <th style={{ 
                padding: isSmallMobile ? '0.375rem 0.25rem' : isMobile ? '0.4rem 0.375rem' : '1rem', 
                textAlign: 'center' 
              }}>송금일</th>
            </tr>
          </thead>
          <tbody>
            {remittances.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ 
                  textAlign: 'center', 
                  color: '#64748b', 
                  padding: '2.5rem 0', 
                  fontSize: '1.1rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  송금 이력이 없습니다.
                </td>
              </tr>
            ) : (
              remittances.map((r, index) => (
                <tr key={r.id || `remittance-${index}`}
                  onClick={() => handleRemittanceClick(r)}
                  style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: isSmallMobile ? '0.65rem' : isMobile ? '0.7rem' : '0.875rem',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td 
                    style={{ 
                      padding: isSmallMobile ? '0.375rem 0.25rem' : isMobile ? '0.4rem 0.375rem' : '1rem', 
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#1e293b'
                    }}
                    title={isMobile && r.receiverName.length > 10 ? r.receiverName : undefined}
                  >
                    {formatReceiverName(r.receiverName)}
                </td>
                  <td style={{ 
                    padding: isSmallMobile ? '0.375rem 0.25rem' : isMobile ? '0.4rem 0.375rem' : '1rem', 
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}
                  title={isMobile && formatCurrencyLabel(r.currency).length > 12 ? formatCurrencyLabel(r.currency) : undefined}
                  >
                  {formatCurrencyLabelForDisplay(r.currency)}
                </td>
                  <td style={{ 
                    padding: isSmallMobile ? '0.375rem 0.25rem' : isMobile ? '0.4rem 0.375rem' : '1rem', 
                    textAlign: 'right',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}>
                    {r.amount.toLocaleString()}
                  </td>
                  <td style={{ 
                    padding: isSmallMobile ? '0.375rem 0.25rem' : isMobile ? '0.4rem 0.375rem' : '1rem', 
                    textAlign: 'center',
                    fontWeight: 500,
                    color: getStatusColor(r.status)
                  }}>
                    {getStatusText(r.status)}
                  </td>
                  <td style={{ 
                    padding: isSmallMobile ? '0.375rem 0.25rem' : isMobile ? '0.4rem 0.375rem' : '1rem', 
                    textAlign: 'center',
                    color: '#64748b'
                  }}>
                    {formatDateForDisplay(r.createdAt)}
                  </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* 상세 모달 (onRemittanceClick이 없을 때만 표시) */}
      {selected && !onRemittanceClick && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,41,59,0.48)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(30,41,59,0.13)', minWidth: 320, maxWidth: 400, width: '100%', padding: '2.2rem 2rem 1.5rem 2rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: '1.5rem', color: '#888', cursor: 'pointer' }} aria-label="닫기">×</button>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '1.2rem', color: '#2563eb' }}>송금 상세</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '1.08rem' }}>
              <div><b>받는 사람:</b> {selected.receiverName}</div>
              <div><b>금액:</b> {selected.amount.toLocaleString()}</div>
              <div><b>상태:</b> {getStatusText(selected.status)}</div>
              <div><b>국가:</b> {selected.receiverCountry}</div>
              <div><b>계좌번호:</b> {selected.receiverAccount}</div>
              <div><b>수취 통화:</b> {formatCurrencyLabel(selected.currency)}</div>
              <div><b>신청일:</b> {new Date(selected.createdAt).toLocaleDateString('ko-KR')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RemittanceList; 