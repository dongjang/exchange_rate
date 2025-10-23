import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom, useSetAtom } from 'jotai';
import { 
  countryAtom, 
  remittanceCountriesAtom, 
  exchangeRatesAtom, 
  favoriteCurrenciesAtom,
  updateExchangeRatesAtom,
  updateFavoriteCurrenciesAtom
} from '../../store/countryStore';
import { api } from '../../services/api';
import { userInfoAtom } from '../../store/userStore';
import RemittanceDetailModal from './RemittanceDetailModal';
import CommonNoticeModal from './CommonNoticeModal';
import QnaModal from './QnaModal';
import './Dashboard.css';

interface User {
  id: number;
  email: string;
  name?: string;
  pictureUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

interface DashboardProps {
  user: User | null;
}

interface RemittanceHistory {
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
}

const formatCurrencyLabel = (code: string, countries: {code: string, codeName: string, countryName: string}[]) => {
  const country = countries.find(c => c.code === code);
  return country ? `${country.countryName} - ${country.codeName} (${country.code})` : code;
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();

  const [countries] = useAtom(countryAtom);
  const [remittanceCountries] = useAtom(remittanceCountriesAtom);
  const [userInfo] = useAtom(userInfoAtom);
  const [rates] = useAtom(exchangeRatesAtom);
  const [favorites] = useAtom(favoriteCurrenciesAtom);
  const [recentRemittances, setRecentRemittances] = useState<RemittanceHistory[]>([]);
  const [selectedRemittance, setSelectedRemittance] = useState<RemittanceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [importantNotices, setImportantNotices] = useState<any[]>([]);
  const [showImportantNoticeModal, setShowImportantNoticeModal] = useState(false);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  const [hideToday, setHideToday] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [qnaItems, setQnaItems] = useState<any[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [selectedQna, setSelectedQna] = useState<any | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showQnaModal, setShowQnaModal] = useState(false);
  
  const updateExchangeRates = useSetAtom(updateExchangeRatesAtom);
  const updateFavoriteCurrencies = useSetAtom(updateFavoriteCurrenciesAtom);

  // 환율 데이터 조회 (atom 사용)
  const getRates = async () => {
    try {
      await updateExchangeRates();
      setLoading(false);
    } catch (err: any) {
      console.error('환율 조회 오류:', err);
      setLoading(false);
    }
  };

  // 관심 환율 목록 조회 (atom 사용)
  const getUserFavoriteCurrencyList = async () => {
    try {
      await updateFavoriteCurrencies();
    } catch {
      console.error('관심 환율 조회 실패');
    }
  };

  // 최근 송금 내역 조회 (3개만)
  const getRecentRemittances = async () => {
    try {
      if (!userInfo?.id) return;
      
      const response = await api.searchRemittanceHistory({
        recipient: '',
        currency: '',
        status: '',
        minAmount: '',
        maxAmount: '',
        startDate: '',
        endDate: '',
        sortOrder: 'latest',
        page: 0,
        size: 3
      });
      
      setRecentRemittances(response.content);
    } catch (err) {
      console.error('최근 송금 내역 조회 실패:', err);
      setRecentRemittances([]);
    }
  };

  // 중요 공지사항 조회
  const getImportantNotices = async () => {
    try {
      const response = await api.searchNotices({
        title: '',
        content: '',
        priority: 'HIGH',
        sortOrder: 'latest',
        page: 0,
        size: 10
      });
      setImportantNotices(response.content || []);
      
      // 오늘 하루 보지 않기 체크
      const today = new Date().toDateString();
      const hideTodayKey = `hideImportantNotice_${today}`;
      const shouldHideToday = localStorage.getItem(hideTodayKey) === 'true';
            
      if ((response.content || []).length > 0 && !shouldHideToday) {
        setShowImportantNoticeModal(true);
      }
    } catch (err) {
      console.error('공지사항 조회 실패:', err);
      setImportantNotices([]);
    }
  };

  // 대시보드용 공지사항 조회 (중요도 높음 우선, 최신순)
  const getDashboardNotices = async () => {
    try {
      const response = await api.searchNotices({
        title: '',
        content: '',
        priority: '',
        sortOrder: '',
        page: 0,
        size: 3
      });
      setNotices(response.content || []);
    } catch (err) {
      console.error('대시보드 공지사항 조회 실패:', err);
      setNotices([]);
    }
  };

  // 대시보드용 Q&A 조회
  const getDashboardQna = async () => {
    try {
      const response = await api.searchQna({
        title: '',
        content: '',
        status: '',
        sortOrder: 'latest',
        page: 0,
        size: 3
      });
      setQnaItems(response.content || []);
    } catch (err) {
      console.error('대시보드 Q&A 조회 실패:', err);
      setQnaItems([]);
    }
  };

  useEffect(() => {
    if(user?.id || userInfo?.id){
      getRates();
      getUserFavoriteCurrencyList();
      getRecentRemittances();
      getImportantNotices();
      getDashboardNotices();
      getDashboardQna();
    }
  }, [user?.id, userInfo?.id]);

  // 환율 데이터 처리
  const rateEntries = Object.entries(rates).filter(([currency]) => currency !== 'KRW' && currency !== 'USD');
  
  // 최고 환율 TOP5 (KRW 기준으로 높은 값)
  const topRates = rateEntries
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([code, rate]) => ({
      currency: formatCurrencyLabel(code, countries),
      rate: rate.toFixed(2),
      code
    }));

  // 최저 환율 TOP5 (KRW 기준으로 낮은 값)
  const bottomRates = rateEntries
    .sort(([, a], [, b]) => a - b)
    .slice(0, 5)
    .map(([code, rate]) => ({
      currency: formatCurrencyLabel(code, countries),
      rate: rate.toFixed(2),
      code
    }));

  // 관심 환율 데이터
  const favoriteRates = favorites
    .map(code => [code, rates[code]] as [string, number])
    .filter(([code, rate]) => (code !== 'KRW' && code !== 'USD') && rate !== undefined)
    .map(([code, rate]) => ({
      currency: formatCurrencyLabel(code, countries),
      rate: rate.toFixed(2),
      code
    }));

  // 송금 내역 포맷팅 함수들
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + ` 원`;
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

  const formatRemittanceCurrencyLabel = (code: string) => {
    // remittanceCountries가 없으면 countries에서 찾기
    const country = remittanceCountries?.find(c => c.code === code) || 
                   countries.find(c => c.code === code);
    if (country) {
      return `${country.countryName} - ${country.codeName} (${country.code})`;
    }
    return code;
  };

  const formatNoticeDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleCloseImportantNoticeModal = () => {
    setShowImportantNoticeModal(false);
  };

  const handleHideToday = () => {
    const today = new Date().toDateString();
    const hideTodayKey = `hideImportantNotice_${today}`;
    localStorage.setItem(hideTodayKey, 'true');
    setHideToday(true);
    handleCloseImportantNoticeModal();
  };

  // 송금 내역 클릭 핸들러
  const handleRemittanceClick = async (remittance: RemittanceHistory) => {
    try {
      // DB에서 최신 송금 상세 정보 조회 (실패 사유 포함)
      const detailRemittance = await api.getRemittanceDetail(remittance.id);
      setSelectedRemittance(detailRemittance);
    } catch (error) {
      console.error('송금 상세 조회 실패:', error);
      // 실패 시 기존 데이터로 표시
      setSelectedRemittance(remittance);
    }
  };

  // 공지사항 클릭 핸들러
  const handleNoticeClick = async (notice: any) => {
    try {
      // 개별 API 호출로 최신 데이터 가져오기
      const noticeDetail = await api.getNoticeById(notice.id);
      
      // 조회수 증가 API 호출
      await api.incrementNoticeViewCount(notice.id);
      
      // 최신 데이터로 조회수 증가된 상태로 설정
      const updatedNotice = { ...noticeDetail, viewCount: noticeDetail.viewCount + 1 };
      setSelectedNotice(updatedNotice);
      
      // 로컬 상태도 업데이트
      setNotices(prev => prev.map(n => 
        n.id === notice.id ? updatedNotice : n
      ));
    } catch (error) {
      console.error('공지사항 상세 정보 조회 또는 조회수 증가 실패:', error);
      // 에러 발생 시 기존 데이터로 모달 열기
      setSelectedNotice(notice);
    }
    setShowNoticeModal(true);
  };

  // Q&A 클릭 핸들러
  const handleQnaClick = (qna: any) => {
    setSelectedQna(qna);
    setShowQnaModal(true);
  };

  // 모달 닫기 핸들러들
  const handleCloseNoticeModal = () => {
    setShowNoticeModal(false);
    setSelectedNotice(null);
  };

  const handleCloseQnaModal = () => {
    setShowQnaModal(false);
    setSelectedQna(null);
  };





  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>
            환율 정보를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* 환율 TOP5 섹션 */}
        <div className="rates-section">
          <div className="rates-card">
            <div className="card-header">
              <h2>💱 환율 TOP5 <span style={{fontSize: '0.8em', color: '#333', fontWeight: 'normal'}}>(1원(KRW) 기준)</span></h2>
              <button className="more-btn" onClick={() => navigate('/exchange-rates')}>더보기</button>
            </div>
            <div className="rates-combined-grid">
              <div className="rates-column">
                <h3>📈 최고 환율</h3>
                <div className="rates-list">
                  {topRates.map((rate, index) => (
                    <div key={index} className="rate-item">
                      <div className="rate-info">
                        <span className="currency">{rate.currency}</span>
                        <span className="rate">{rate.rate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rates-column">
                <h3>📉 최저 환율</h3>
                <div className="rates-list">
                  {bottomRates.map((rate, index) => (
                    <div key={index} className="rate-item">
                      <div className="rate-info">
                        <span className="currency">{rate.currency}</span>
                        <span className="rate">{rate.rate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 관심 환율 섹션 */}
        <div className="favorite-rates-section">
          <div className="rates-card">
            <div className="card-header">
              <h2>⭐ 관심 환율</h2>
              <button className="manage-btn" onClick={() => navigate('/exchange-rates')}>더보기</button>
            </div>
            <div className="favorite-rates-grid">
              {favoriteRates.length > 0 ? (
                favoriteRates.map((rate, index) => (
                  <div key={index} className="favorite-rate-item">
                    <div className="rate-info">
                      <span className="currency">{rate.currency}</span>
                      <span className="rate">{rate.rate}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ 
                  gridColumn: '1 / -1', 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  설정된 관심 환율이 없습니다.<br />
                  환율 조회 페이지에서 관심 환율을 설정해보세요.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 최근 송금 내역 섹션 */}
        <div className="remittance-section">
          <div className="rates-card">
            <div className="card-header">
              <h2>📋 최근 송금 내역</h2>
              <button className="more-btn" onClick={() => navigate('/remittance-history')}>더보기</button>
            </div>
            <div className="remittance-list">
              {recentRemittances.length > 0 ? (
                recentRemittances.map((remit, index) => (
                  <div 
                    key={remit.id} 
                    className="remittance-item clickable"
                    onClick={() => handleRemittanceClick(remit)}
                  >
                    <div className="remittance-details-left">
                      <span className="date">{formatDate(remit.createdAt)}</span>
                      <div className="receiver-currency-row">
                        <span className="receiver-name">{remit.receiverName}</span>
                        <span className="currency-pair">
                          {formatRemittanceCurrencyLabel(remit.currency)}
                        </span>
                        <span className="amount">{formatAmount(remit.amount, remit.currency)}</span>
                      </div>
                    </div>
                    <span className={`status ${remit.status.toLowerCase()}`}>
                      {getStatusText(remit.status)}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  송금 내역이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 공지사항 & QnA 섹션 */}
        <div className="info-section">
          <div className="info-grid">
            <div className="rates-card">
              <div className="card-header">
                <h2>📢 공지사항</h2>
                <button className="more-btn" onClick={() => navigate('/notices')}>더보기</button>
              </div>
                             <div className="info-list">
                 {notices.length > 0 ? (
                   notices.map((notice) => (
                     <div key={notice.id} className="info-item clickable" onClick={() => handleNoticeClick(notice)}>
                       <div className="info-content">
                         <span className={`title ${notice.priority === 'HIGH' ? 'important' : ''}`}>
                           {notice.title}
                         </span>
                         <span className="date">{formatNoticeDate(notice.createdAt)}</span>
                       </div>
                       {notice.priority === 'HIGH' && <span className="badge">중요</span>}
                     </div>
                   ))
                 ) : (
                   <div style={{ 
                     textAlign: 'center', 
                     padding: '40px', 
                     color: '#6b7280',
                     fontSize: '14px'
                   }}>
                     공지사항이 없습니다.
                   </div>
                 )}
               </div>
            </div>

            <div className="rates-card">
              <div className="card-header">
                <h2>💬 Q&A</h2>
                <button className="more-btn" onClick={() => navigate('/qna')}>더보기</button>
              </div>
                             <div className="info-list">
                 {qnaItems.length > 0 ? (
                   qnaItems.map((qna) => (
                     <div key={qna.id} className="info-item clickable" onClick={() => handleQnaClick(qna)}>
                       <div className="info-content">
                         <span className="title">{qna.title}</span>
                         <span className="date">{formatNoticeDate(qna.createdAt)}</span>
                       </div>
                         <span className={`status-badge ${qna.status.toLowerCase()}`}>
                           {qna.status === 'ANSWERED' ? '답변완료' : '대기중'}
                         </span>
                     </div>
                   ))
                 ) : (
                   <div style={{ 
                     textAlign: 'center', 
                     padding: '40px', 
                     color: '#6b7280',
                     fontSize: '14px'
                   }}>
                     Q&A가 없습니다.
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>

     {/* 송금 내역 상세 모달 */}
      <RemittanceDetailModal
        isOpen={!!selectedRemittance}
        onClose={() => setSelectedRemittance(null)}
        remittance={selectedRemittance}
      />

      {/* 공지사항 상세 모달 */}
      {selectedNotice && (
        <CommonNoticeModal
          isOpen={showNoticeModal}
          notice={selectedNotice}
          onClose={handleCloseNoticeModal}
          isImportantNotice={false}
        />
      )}

      {/* Q&A 상세 모달 */}
      {selectedQna && (
        <QnaModal
          isOpen={showQnaModal}
          onClose={handleCloseQnaModal}
          onSubmit={() => {}}
          onCancel={handleCloseQnaModal}
          editingQna={{
            ...selectedQna,
            status: 'ANSWERED'
          }}
          formData={{
            title: selectedQna.title,
            content: selectedQna.content,
            file: null,
            removeExistingFile: false
          }}
          setFormData={() => {}}
          isSubmitting={false}
        />
      )}

      {/* 중요 공지사항 모달 */}
      {importantNotices.length > 0 && (
        <CommonNoticeModal
          isOpen={showImportantNoticeModal}
          notice={importantNotices[currentNoticeIndex]}
          onClose={handleCloseImportantNoticeModal}
          isImportantNotice={true}
          onHideToday={handleHideToday}
        />
      )}
    </div>
  );
};

export default Dashboard;
