import { useAtom } from 'jotai';
import React, { useEffect, useState } from 'react';
import { FaChartLine, FaEdit, FaExclamationTriangle, FaEye, FaSync } from 'react-icons/fa';
import { api } from '../../services/api';
import { userInfoAtom } from '../../store/userStore';
import './RemittanceLimitDisplay.css';
import RemittanceLimitHistoryModal from './RemittanceLimitHistoryModal';
import RemittanceLimitModal from './RemittanceLimitModal';

interface RemittanceLimit {
  dailyLimit: number;
  monthlyLimit: number;
  singleLimit: number;
  limitType: 'DEFAULT_LIMIT' | 'UPPER_LIMIT' | 'USER_LIMIT';
  status?: 'APPROVED' | 'PENDING' | 'REJECTED';
  // 추가된 필드들
  originalDailyLimit?: number;
  originalMonthlyLimit?: number;
}

interface RemittanceLimitRequest {
  id: number;
  userId: number;
  dailyLimit: number;
  monthlyLimit: number;
  singleLimit: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
}

interface RemittanceLimitDisplayProps {
  refreshKey?: number;
  onRefresh?: () => void;
  isSmallScreen?: boolean;
}

const RemittanceLimitDisplay: React.FC<RemittanceLimitDisplayProps> = ({ refreshKey = 0, onRefresh, isSmallScreen = false }) => {
  const [userInfo] = useAtom(userInfoAtom);
  const [limit, setLimit] = useState<RemittanceLimit | null>(null);
  const [pendingRequest, setPendingRequest] = useState<RemittanceLimitRequest | null>(null);
  const [approvedRequestId, setApprovedRequestId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [internalMobile, setInternalMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setInternalMobile(window.innerWidth <= 450);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchLimitData = async (showLoading = true) => {
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // 송금 한도 조회
      const limitResponse = await api.getUserRemittanceLimit();
      setLimit(limitResponse);
      
      setError(null);
    } catch (err) {
      console.error('한도 데이터 조회 실패:', err);
      setError('한도 정보를 불러올 수 없습니다.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const fetchRequestData = async () => {
    
    try {
      // 한도 변경 신청 데이터 조회 (파일 정보 포함)
      const requests = await api.getUserRemittanceLimitRequests();
      const latestPendingRequest = requests.find(request => request.status === 'PENDING' || request.status === 'REJECTED');
      if (latestPendingRequest) {
        setPendingRequest(latestPendingRequest);
      } else {
        setPendingRequest(null);
      }
      
      // 승인된 요청 ID 찾기
      const approvedRequest = requests.find(req => req.status === 'APPROVED');
      setApprovedRequestId(approvedRequest?.id);
    } catch (err) {
      console.error('신청 데이터 조회 실패:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await fetchLimitData(false); // 로딩 표시하지 않음
      await fetchRequestData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(userInfo){
      fetchData();
    }
    
  }, [userInfo?.id]);

  useEffect(() => {
    if (refreshKey > 0) {
      setLoading(true);
      fetchLimitData();
    }
  }, [refreshKey]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-blue-700">송금 한도 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!limit) {
    return null;
  }

  return (
    <>
      <div className="remittance-limit-container">
        <div className="remittance-limit-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="remittance-limit-icon">
                <FaChartLine style={{ color: 'white', fontSize: '16px' }} />
              </div>
              <div>
                <h3 className="remittance-limit-title">
                  송금 한도 정보
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="remittance-limit-badge">
                    {limit.limitType === 'DEFAULT_LIMIT' ? '기본 한도 적용' : '개인 요청 한도 적용'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 모바일일 때만 새로고침 버튼을 우측 끝에 배치 */}
            {isSmallScreen && onRefresh && (
              <button
                onClick={onRefresh}
                className="remittance-limit-refresh-btn"
              >
                <FaSync style={{ fontSize: '11px' }} />
                새로고침
              </button>
            )}
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center',
            justifyContent: (isSmallScreen || internalMobile) ? 'flex-end' : 'center'
          }}>          
            {/* 기본 한도 사용자이고 대기중인 요청이 없을 때만 신청 버튼 표시 */}
            {(limit.limitType === 'DEFAULT_LIMIT' && !pendingRequest) && (
              <button
                onClick={() => setShowLimitModal(true)}
                className="remittance-limit-upgrade-btn"
              >
                <FaEdit style={{ fontSize: '12px' }} />
                한도 변경 신청
              </button>
            )}
            
            {/* 개인 한도 사용자이거나 대기중인 요청이 있을 때 상세 버튼 표시 */}
            {(limit.limitType === 'USER_LIMIT' || pendingRequest) && (
              <>
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="remittance-limit-status-btn"
                  style={{ order: (isSmallScreen || internalMobile) ? 1 : 1 }}
                >
                  <FaEye style={{ fontSize: '12px' }} />
                  한도 변경 신청 상세
                </button>
                
                {/* 승인된 사용자에게만 재신청 버튼 표시 - 중간에 배치 */}
                {limit.limitType === 'USER_LIMIT' && !pendingRequest && (
                  <button
                    onClick={() => setShowLimitModal(true)}
                    className="remittance-limit-rerequest-btn"
                    style={{ order: (isSmallScreen || internalMobile) ? 2 : 2 }}
                  >
                    <FaEdit style={{ fontSize: '12px' }} />
                    한도 재변경 신청
                  </button>
                )}
              </>
            )}
          {/* PC에서 새로고침 버튼 - 가장 오른쪽에 배치 */}
           <button
             onClick={onRefresh || (() => window.location.reload())}
             className="remittance-limit-refresh-btn"
             style={{
               display: isSmallScreen ? 'none' : 'flex',
               order: 3
             }}
           >
             <FaSync style={{ fontSize: '12px' }} />
             새로고침
           </button>
          </div>
        </div>
        
        <div className="remittance-limit-cards">
          <div className="remittance-limit-card daily">
            <div className="remittance-limit-card-header">
              <div className="remittance-limit-card-label">일일 사용 가능 한도</div>
            </div>
            <div className={`remittance-limit-card-value ${limit.dailyLimit === 0 ? 'zero' : ''}`}>
              {formatCurrency(limit.dailyLimit)}
            </div>
            {limit.originalDailyLimit !== undefined && (
              <div className="remittance-limit-card-original">
                일일 한도: {formatCurrency(limit.originalDailyLimit)}
              </div>
            )}
          </div>
          
          <div className="remittance-limit-card monthly">
            <div className="remittance-limit-card-header">
              <div className="remittance-limit-card-label">월 사용 가능 한도</div>
            </div>
            <div className={`remittance-limit-card-value ${limit.monthlyLimit === 0 ? 'zero' : ''}`}>
              {formatCurrency(limit.monthlyLimit)}
            </div>
            {limit.originalMonthlyLimit !== undefined && (
              <div className="remittance-limit-card-original">
                월 한도: {formatCurrency(limit.originalMonthlyLimit)}
              </div>
            )}
          </div>
          
          <div className="remittance-limit-card single">
            <div className="remittance-limit-card-header">
              <div className="remittance-limit-card-label">1회 한도</div>
            </div>
            <div className="remittance-limit-card-value">
              {formatCurrency(limit.singleLimit)}
            </div>
          </div>
        </div>
        
                 
      </div>
      
      {/* 한도 변경 신청 모달 */}
      <RemittanceLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        currentLimit={{
          ...limit,
          status: pendingRequest?.status || 'APPROVED', // 현재 상태 반영
          id: pendingRequest?.status === 'REJECTED' ? pendingRequest.id : approvedRequestId,
          reason: pendingRequest?.reason,
          dailyLimit: pendingRequest?.dailyLimit || limit.dailyLimit,
          monthlyLimit: pendingRequest?.monthlyLimit || limit.monthlyLimit,
          singleLimit: pendingRequest?.singleLimit || limit.singleLimit
        }}
        user={userInfo}
        isEdit={pendingRequest?.status === 'REJECTED'} // 반려 상태일 때 수정 모드
        editRequestId={pendingRequest?.status === 'REJECTED' ? pendingRequest.id : undefined}
        isRerequest={limit.limitType === 'USER_LIMIT' && !pendingRequest} // 승인된 사용자일 때 재신청 모드
        onSuccess={fetchData}
      />

      {/* 한도 변경 신청 현황 모달 */}
      <RemittanceLimitHistoryModal
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSuccess={fetchData}
      />
    </>
  );
};

export default RemittanceLimitDisplay; 