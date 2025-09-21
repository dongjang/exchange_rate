import React, { useState, useEffect } from 'react';
import { FaSync } from 'react-icons/fa';
import RemittanceForm from './RemittanceForm';
import CommonPageHeader from './CommonPageHeader';

function RemittanceApplyPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsSmallScreen(width < 450);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const handleRefresh = () => {
    // 송금 한도 정보만 새로고침
    setRefreshKey(prev => prev + 1);
  };

  const handleRemittanceComplete = () => {
    // 송금 완료 후 한도 정보 새로고침
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{ 
      maxWidth: 650, 
      margin: isMobile ? '0' : '0.9rem auto 2.5rem auto'
    }}>
      <CommonPageHeader
        title="💸 송금"
        subtitle="송금 서비스를 이용하실 수 있습니다"
        gradientColors={{ from: '#667eea', to: '#764ba2' }}
      />
      <div style={{ boxShadow: '0 4px 24px rgba(30,41,59,0.13), 0 1.5px 6px rgba(59,130,246,0.07)', borderRadius: 18, background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', border: '1.5px solid #e0e7ef', padding: '0 0 0 0' }}>
        <div style={{ padding: isSmallScreen ? '0.7rem 0.7rem 0 0.7rem' : '1.5rem 1.5rem 0 1.5rem' }}>
          <RemittanceForm 
            refreshKey={refreshKey} 
            onSubmit={handleRemittanceComplete}
            onRefresh={handleRefresh}
            isSmallScreen={isSmallScreen}
          />
        </div>
      </div>
    </div>
  );
}

export default RemittanceApplyPage; 