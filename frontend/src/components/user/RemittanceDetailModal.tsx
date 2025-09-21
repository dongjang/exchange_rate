import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { remittanceCountriesAtom } from '../../store/countryStore';

interface RemittanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  remittance: {
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
    exchangeRate?: number;
    convertedAmount?: number;
    status: string;
    failureReason?: string;
    createdAt: string;
    updatedAt: string;
    senderBankName?: string;
    receiverBankName?: string;
  } | null;
}

const RemittanceDetailModal: React.FC<RemittanceDetailModalProps> = ({
  isOpen,
  onClose,
  remittance
}) => {
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

  if (!isOpen || !remittance) return null;

  const formatCurrencyLabel = (code: string) => {
    const country = countries?.find(c => c.code === code);
    if (country) {
      // 모든 화면에서 동일한 형식으로 표시
      return `${country.countryName} - ${country.codeName} (${country.code})`;
    }
    return code;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isSmallMobile) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${month}월 ${day}일 ${hours}:${minutes}`;
    } else if (isMobile) {
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
    } else {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '완료';
      case 'PENDING':
        return '처리중';
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

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'rgba(30,41,59,0.48)', 
      zIndex: 9999, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: isMobile ? '1rem 0.5rem' : '0',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }} onClick={onClose}>
      <div style={{ 
        background: '#fff', 
        borderRadius: isSmallMobile ? 8 : isMobile ? 12 : 16, 
        boxShadow: isSmallMobile ? '0 2px 12px rgba(30,41,59,0.1)' : isMobile ? '0 3px 18px rgba(30,41,59,0.12)' : '0 4px 24px rgba(30,41,59,0.13)', 
        minWidth: isSmallMobile ? 280 : isMobile ? 300 : 400, 
        maxWidth: isSmallMobile ? '95vw' : isMobile ? '90vw' : 600, 
        width: '100%', 
        padding: isSmallMobile ? '1rem 0.8rem 0.8rem 0.8rem' : isMobile ? '1.4rem 1.2rem 1rem 1.2rem' : '2.2rem 2rem 1.5rem 2rem', 
        position: 'relative',
        marginTop: isMobile ? '1rem' : '0',
        marginBottom: isMobile ? '1rem' : '0',
        maxHeight: isMobile ? '90vh' : 'auto',
        overflowY: isMobile ? 'auto' : 'visible'
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ 
          position: 'absolute', 
          top: isSmallMobile ? 12 : isMobile ? 15 : 18, 
          right: isSmallMobile ? 12 : isMobile ? 15 : 18, 
          background: 'none', 
          border: 'none', 
          fontSize: isSmallMobile ? '1.2rem' : isMobile ? '1.3rem' : '1.5rem', 
          color: '#888', 
          cursor: 'pointer' 
        }} aria-label="닫기">×</button>
        
        <h3 style={{ 
          fontSize: isSmallMobile ? '0.9rem' : isMobile ? '1rem' : '1.25rem', 
          fontWeight: 700, 
          marginBottom: isSmallMobile ? '1rem' : isMobile ? '1.2rem' : '1.5rem', 
          color: '#1e293b', 
          textAlign: 'center' 
        }}>송금 상세</h3>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isSmallMobile ? '1rem' : isMobile ? '1.3rem' : '1.8rem', 
          fontSize: isSmallMobile ? '0.8rem' : isMobile ? '0.9rem' : '1rem' 
        }}>
          {/* 받는 사람 */}
          <div>
            <h4 style={{ 
              fontSize: isSmallMobile ? '0.8rem' : isMobile ? '0.85rem' : '0.95rem', 
              fontWeight: 600, 
              color: '#374151', 
              marginBottom: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              <span style={{ fontSize: isSmallMobile ? '0.9rem' : isMobile ? '1rem' : '1.1rem' }}>👥</span>
              받는 사람
            </h4>
            <div style={{ 
              background: '#f8fafc', 
              padding: isSmallMobile ? '0.8rem' : isMobile ? '1rem' : '1.2rem', 
              borderRadius: isSmallMobile ? 6 : isMobile ? 8 : 10,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                fontSize: isSmallMobile ? '0.75rem' : isMobile ? '0.8rem' : '0.9rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isSmallMobile ? '0.4rem' : isMobile ? '0.5rem' : '0.6rem' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>이름</span>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>{remittance.receiverName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>은행</span>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>
                    {remittance.receiverBankName || remittance.receiverBank}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>계좌번호</span>
                  <span style={{ color: '#1e293b', fontWeight: 600, fontFamily: 'monospace' }}>{remittance.receiverAccount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>수취 통화</span>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>{formatCurrencyLabel(remittance.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 보내는 사람 */}
          <div>
            <h4 style={{ 
              fontSize: isSmallMobile ? '0.8rem' : isMobile ? '0.85rem' : '0.95rem', 
              fontWeight: 600, 
              color: '#374151', 
              marginBottom: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              <span style={{ fontSize: isSmallMobile ? '0.9rem' : isMobile ? '1rem' : '1.1rem' }}>👤</span>
              보내는 사람
            </h4>
            <div style={{ 
              background: '#f8fafc', 
              padding: isSmallMobile ? '0.8rem' : isMobile ? '1rem' : '1.2rem', 
              borderRadius: isSmallMobile ? 6 : isMobile ? 8 : 10,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                fontSize: isSmallMobile ? '0.75rem' : isMobile ? '0.8rem' : '0.9rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isSmallMobile ? '0.4rem' : isMobile ? '0.5rem' : '0.6rem' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>은행</span>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>
                    {remittance.senderBankName || remittance.senderBank}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>계좌번호</span>
                  <span style={{ color: '#1e293b', fontWeight: 600, fontFamily: 'monospace' }}>{remittance.senderAccount}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 송금 금액 및 상태 */}
          <div style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: isSmallMobile ? 6 : isMobile ? 8 : 12,
            padding: isSmallMobile ? '0.8rem' : isMobile ? '1rem' : '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : '0.8rem' 
            }}>
              <span style={{ 
                color: '#64748b', 
                fontSize: isSmallMobile ? '0.75rem' : isMobile ? '0.8rem' : '0.9rem', 
                fontWeight: 500 
              }}>송금 금액</span>
              <span style={{ 
                fontWeight: 700, 
                fontSize: isSmallMobile ? '1rem' : isMobile ? '1.2rem' : '1.4rem', 
                color: '#1e293b' 
              }}>
                {formatAmount(remittance.amount)}원
              </span>
            </div>
            {remittance.exchangeRate && remittance.convertedAmount && (
              <>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : '0.8rem' 
                }}>
                  <span style={{ 
                    color: '#64748b', 
                    fontSize: isSmallMobile ? '0.75rem' : isMobile ? '0.8rem' : '0.9rem', 
                    fontWeight: 500 
                  }}>환율</span>
                  <span style={{ 
                    fontWeight: 600, 
                    fontSize: isSmallMobile ? '0.8rem' : isMobile ? '0.9rem' : '1rem', 
                    color: '#1e293b' 
                  }}>
                    1 {formatCurrencyLabel(remittance.currency).split(' - ')[1]?.split(' (')[0] || remittance.currency} = {remittance.exchangeRate.toLocaleString()}원
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : '0.8rem' 
                }}>
                  <span style={{ 
                    color: '#64748b', 
                    fontSize: isSmallMobile ? '0.75rem' : isMobile ? '0.8rem' : '0.9rem', 
                    fontWeight: 500 
                  }}>변환 금액</span>
                  <span style={{ 
                    fontWeight: 600, 
                    fontSize: isSmallMobile ? '0.8rem' : isMobile ? '0.9rem' : '1rem', 
                    color: '#1e293b' 
                  }}>
                    {remittance.convertedAmount.toLocaleString()} {formatCurrencyLabel(remittance.currency).split(' - ')[1]?.split(' (')[0] || remittance.currency}
                  </span>
                </div>
              </>
            )}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : '0.8rem' 
            }}>
              <span style={{ 
                color: '#64748b', 
                fontSize: isSmallMobile ? '0.75rem' : isMobile ? '0.8rem' : '0.9rem', 
                fontWeight: 500 
              }}>상태</span>
              <span style={{ 
                fontWeight: 600, 
                color: getStatusColor(remittance.status),
                padding: isSmallMobile ? '0.2rem 0.5rem' : isMobile ? '0.25rem 0.6rem' : '0.3rem 0.8rem',
                borderRadius: isSmallMobile ? 4 : isMobile ? 5 : 6,
                fontSize: isSmallMobile ? '0.7rem' : isMobile ? '0.75rem' : '0.85rem',
                background: getStatusColor(remittance.status) === '#10b981' ? '#ecfdf5' : 
                           getStatusColor(remittance.status) === '#f59e0b' ? '#fffbeb' : '#fef2f2'
              }}>
                {getStatusText(remittance.status)}
              </span>
            </div>
            {remittance.failureReason && (
              <div style={{ 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                borderRadius: isSmallMobile ? 4 : isMobile ? 6 : 8, 
                padding: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : '0.8rem', 
                marginTop: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : '0.8rem' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginBottom: isSmallMobile ? '0.3rem' : isMobile ? '0.35rem' : '0.4rem' 
                }}>
                  <span style={{ fontSize: isSmallMobile ? '0.8rem' : isMobile ? '0.9rem' : '1rem' }}>⚠️</span>
                  <span style={{ 
                    color: '#dc2626', 
                    fontSize: isSmallMobile ? '0.7rem' : isMobile ? '0.75rem' : '0.85rem', 
                    fontWeight: 600 
                  }}>실패 사유</span>
                </div>
                <div style={{ 
                  color: '#991b1b', 
                  fontSize: isSmallMobile ? '0.65rem' : isMobile ? '0.7rem' : '0.8rem', 
                  lineHeight: 1.4 
                }}>
                  {remittance.failureReason}
                </div>
              </div>
            )}
          </div>
          {/* 날짜 정보 */}
          <div style={{ 
            borderTop: '1px solid #e5e7eb', 
            paddingTop: isSmallMobile ? '0.6rem' : isMobile ? '0.8rem' : '1rem',
            textAlign: 'center',
            marginBottom: isSmallMobile ? '0.6rem' : isMobile ? '0.8rem' : '1rem'
          }}>
            <div style={{ 
              fontSize: isSmallMobile ? '0.65rem' : isMobile ? '0.7rem' : '0.8rem', 
              color: '#9ca3af', 
              fontWeight: 500 
            }}>
              송금일: {formatDate(remittance.createdAt)}
            </div>
          </div>

          {/* 닫기 버튼 */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={onClose}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: isSmallMobile ? '0.5rem 2rem' : isMobile ? '0.6rem 3rem' : '0.75rem 4rem',
                borderRadius: isSmallMobile ? '6px' : isMobile ? '7px' : '8px',
                fontSize: isSmallMobile ? '0.75rem' : isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                minWidth: isSmallMobile ? '120px' : isMobile ? '140px' : '160px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
              }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemittanceDetailModal; 