import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { authAtom, clearAuthAtom } from '../../store/authStore';
import { api } from '../../services/api';
import './Login.css';

const Login = () => {
  const [auth, setAuth] = useAtom(authAtom);
  const [, clearAuth] = useAtom(clearAuthAtom);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // API 베이스 URL에서 포트와 프로토콜 추출
    const getOAuthBaseUrl = () => {
      // 환경변수에서 API URL 가져오기
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      
      if (apiUrl) {
        // API URL이 있으면 해당 URL 사용
        return apiUrl.replace('/api', '');
      }
      
      // Vercel 배포 환경인지 확인
      if (window.location.hostname.includes('vercel.app')) {
        // 배포 환경에서는 상대 경로 사용 (같은 도메인)
        return window.location.origin;
      }
      
      // 로컬 개발 환경
      return 'http://localhost:8081';
    };
    
    const oauthBaseUrl = getOAuthBaseUrl();
    const googleAuthUrl = `${oauthBaseUrl}/oauth2/authorization/google`;
    
    console.log('OAuth Base URL:', oauthBaseUrl);
    console.log('Google Auth URL:', googleAuthUrl);
    
    // 구글 로그인 페이지로 리디렉션
    window.location.href = googleAuthUrl;
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      clearAuth();
      // 로그아웃 후 홈페이지로 리디렉션
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (auth.isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-popup">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated && auth.user) {
    return (
      <div className="login-container">
        <div className="user-info">
          <img 
            src={auth.user.picture} 
            alt={auth.user.name} 
            className="user-avatar"
          />
          <div className="user-details">
            <h3>{auth.user.name}</h3>
            <p>{auth.user.email}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="login-title">환영합니다</h1>
          <p className="login-subtitle">소셜 계정으로 간편하게 로그인하세요</p>
        </div>
        
        <div className="social-buttons">
          <button onClick={handleGoogleLogin} className="social-login-btn">
            <svg viewBox="0 0 24 24" className="social-icon">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google로 로그인</span>
          </button>
        </div>
        
        <div className="login-footer">
          <p className="login-terms">로그인함으로써 서비스 이용약관에 동의하게 됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 