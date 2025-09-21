import React, { useState, useEffect } from 'react';

interface CommonPageHeaderProps {
  title: string;
  subtitle: string;
  gradientColors?: {
    from: string;
    to: string;
  };
}

const CommonPageHeader: React.FC<CommonPageHeaderProps> = ({
  title,
  subtitle,
  gradientColors = { from: '#667eea', to: '#764ba2' }
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{
      background: `linear-gradient(135deg, ${gradientColors.from} 0%, ${gradientColors.to} 100%)`,
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '24px 20px' : '40px',
      marginBottom: isMobile ? '20px' : '30px',
      color: 'white',
      textAlign: 'center',
      boxShadow: `0 10px 25px rgba(102, 126, 234, 0.3)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      <h1 style={{
        fontSize: isMobile ? '1.3rem' : '2.5rem',
        fontWeight: '700',
        margin: isMobile ? '0 0 8px 0' : '0 0 10px 0',
        position: 'relative',
        zIndex: 1,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        {title}
      </h1>
      <p style={{
        fontSize: isMobile ? '0.9rem' : '1.1rem',
        margin: 0,
        opacity: 0.9,
        position: 'relative',
        zIndex: 1
      }}>
        {subtitle}
      </p>
    </div>
  );
};

export default CommonPageHeader;
