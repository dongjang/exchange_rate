import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { api } from '../../services/api';
import type { User } from '../../store/userStore';
import { selectedUserAtom } from '../../store/userStore';
import { useSetAtom, useAtom } from 'jotai';
import { setAuthAtom } from '../../store/authStore';
import './Header.css';
import { Link } from 'react-router-dom';
import { UserModal } from './UserModal';

interface HeaderProps {
  user: User | null;
  onUserUpdated: (user: User | null) => void;
}

function Header({ user, onUserUpdated }: HeaderProps) {
  const navigate = useNavigate();
  const setSelectedUser = useSetAtom(selectedUserAtom as any);
  const [, setAuthState] = useAtom(setAuthAtom);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuAnimating, setIsMenuAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: '로그아웃 하시겠습니까?',
      showCancelButton: true,
      confirmButtonText: '로그아웃',
      cancelButtonText: '취소',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#d1d5db',
    });
    if (!result.isConfirmed) return;
    try {
      // 사용자 로그아웃 (Redis 세션 + OAuth2 세션 정리)
      await api.logout();
      
      // 사용자 인증 상태 초기화
      setAuthState({ isAuthenticated: false, isLoading: false });
      
      // 구글 관련 쿠키 삭제 (현재 도메인만)
      document.cookie.split(";").forEach(function(c) { 
        const cookie = c.trim();
        if (cookie.startsWith('JSESSIONID') || cookie.includes('google') || cookie.includes('oauth')) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        }
      });
      
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // 에러가 발생해도 로그아웃 처리
      setAuthState({ isAuthenticated: false, isLoading: false });
      navigate('/');
    }
  };

  const handleUserNameClick = () => {
    if (!user) return;
    setSelectedUser({
      id: user.id,
      email: user.email,
      name: user.name,
      pictureUrl: user.pictureUrl,
      status: user.status,
    });

    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleMenuToggle = () => {
    if (isMenuOpen) {
      // 메뉴를 닫을 때 애니메이션 적용
      setIsMenuOpen(false);
      setIsMenuAnimating(true);
      setTimeout(() => {
        setIsMenuAnimating(false);
      }, 250);
    } else {
      // 메뉴를 열 때
      setIsMenuOpen(true);
      setIsMenuAnimating(false);
    }
  };
  
  const handleMenuClose = () => {
    setIsMenuOpen(false);
    setIsMenuAnimating(true);
    setTimeout(() => {
      setIsMenuAnimating(false);
    }, 250);
  };

  const handleAnimationEnd = () => {
    if (isMenuAnimating && !isMenuOpen) {
      setIsMenuAnimating(false);
    }
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    // 헤더 내부 클릭은 이벤트 전파를 막아서 document 클릭 이벤트가 발생하지 않도록 함
    e.stopPropagation();
  };

  // 전체 페이지 클릭 이벤트 처리
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (isMenuOpen && isMobile) {
        const target = e.target as HTMLElement;
        const isMenuButton = target.closest('.mobile-menu-btn');
        const isMenuContainer = target.closest('.mobile-menu-container');
        const isHeader = target.closest('.header');
        
        // 헤더 외부를 클릭했을 때만 메뉴를 닫음
        if (!isHeader && !isMenuButton && !isMenuContainer) {
          handleMenuClose();
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [isMenuOpen, isMobile]);

  return (
    <header className="header" onClick={handleHeaderClick}>
      <div className="header-content">
        {isMobile ? (
          <>
            {/* 모바일 레이아웃 */}
            <div className="user-mobile-header-left">
              <Link to="/" className="home-button-mobile" onClick={isMenuOpen ? handleMenuClose : undefined}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </Link>
            </div>
            
            <div className="user-mobile-header-center">
              {user && (
                <div className="user-info-mobile" onClick={handleUserNameClick}>
                  {user.pictureUrl && (
                    <img
                      src={user.pictureUrl}
                      alt={user.name || user.email}
                      className="user-avatar-mobile"
                    />
                  )}
                  <span className="user-name-mobile">
                    {user.name || user.email}
                  </span>
                </div>
              )}
              <button onClick={handleLogout} className="logout-button-mobile">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>로그아웃</span>
              </button>
            </div>
            
            <div className="user-mobile-header-right">
              <button className={`mobile-menu-btn ${isMenuOpen ? 'close' : ''}`} onClick={handleMenuToggle}>
                <span className="mobile-menu-icon" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 데스크톱 레이아웃 */}
            <div className="header-left">
              <Link to="/" className="home-button" onClick={isMenuOpen ? handleMenuClose : undefined}>
                <div className="home-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                </div>
              </Link>
            </div>

            <nav className="header-nav">
              <Link to="/exchange-rates" className="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                환율 조회
              </Link>
              <Link to="/remittance" className="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                송금
              </Link>
              <Link to="/remittance-history" className="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                송금 이력
              </Link>
              <Link to="/notices" className="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                공지사항
              </Link>
              <Link to="/qna" className="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Q&A
              </Link>
            </nav>

            <div className="header-right">
              {user && (
                <div className="desktop-user-section" onClick={handleUserNameClick}>
                  {user.pictureUrl && (
                    <img
                      src={user.pictureUrl}
                      alt={user.name || user.email}
                      className="desktop-user-avatar"
                    />
                  )}
                  <div className="desktop-user-info">
                    <span className="desktop-user-name">{user.name || user.email}</span>
                  </div>
                </div>
              )}
              <button onClick={handleLogout} className="desktop-logout-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                로그아웃
              </button>
            </div>
          </>
        )}
      </div>
      
      <UserModal isOpen={isModalOpen} onClose={handleModalClose} />
      
      {/* 모바일 메뉴 */}
      {isMobile && (isMenuOpen || isMenuAnimating) && (
        <div 
          className={`mobile-menu-container ${isMenuAnimating ? 'slide-up' : 'slide-down'}`}
          onAnimationEnd={handleAnimationEnd}
        >
          <Link to="/exchange-rates" className="mobile-menu-item" onClick={handleMenuClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            환율 조회
          </Link>
          <Link to="/remittance" className="mobile-menu-item" onClick={handleMenuClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            송금
          </Link>
          <Link to="/remittance-history" className="mobile-menu-item" onClick={handleMenuClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            송금 이력
          </Link>
          <Link to="/notices" className="mobile-menu-item" onClick={handleMenuClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            공지사항
          </Link>
          <Link to="/qna" className="mobile-menu-item" onClick={handleMenuClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Q&A
          </Link>
        </div>
      )}
    </header>
  );
}

export { Header };
