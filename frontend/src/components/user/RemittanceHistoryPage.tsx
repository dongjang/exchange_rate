import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { api } from '../../services/api';
import RemittanceList from './RemittanceList';
import RemittanceHistoryFilter from './RemittanceHistoryFilter';
import RemittancePaging from './RemittancePaging';
import RemittanceDetailModal from './RemittanceDetailModal';
import { userInfoAtom } from '../../store/userStore';
import CommonPageHeader from './CommonPageHeader';

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
  createdAt: string;
  updatedAt: string;
  senderBankName?: string;
  receiverBankName?: string;
}

function RemittanceHistoryPage() {
  const [userInfo] = useAtom(userInfoAtom);
  const [remittances, setRemittances] = useState<RemittanceHistory[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState({
    recipient: '',
    minAmount: '',
    maxAmount: '',
    currency: '',
    status: '',
    startDate: '',
    endDate: '',
    quickDateRange: '',
    sortOrder: 'latest' // 기본값: 최신순
  });
  const [selectedRemittance, setSelectedRemittance] = useState<RemittanceHistory | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchRemittances = async () => {
    try {
      setLoading(true);
      
      // 사용자 정보가 없으면 에러 처리
      if (!userInfo?.id) {
        setError('사용자 정보를 가져올 수 없습니다.');
        setRemittances([]);
        return;
      }

      // 백엔드 API 호출 (페이징 포함)
      const response = await api.searchRemittanceHistory({
        recipient: filters.recipient,
        currency: filters.currency,
        status: filters.status,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sortOrder: filters.sortOrder,
        page: currentPage - 1, // 백엔드는 0부터 시작
        size: pageSize
      });
      
      // 페이징 정보 설정
      setRemittances(response.content);
      setTotalItems(response.totalElements);
      setTotalPages(response.totalPages);
      
      setError(null);
    } catch (err) {
      console.error('송금 이력 조회 실패:', err);
      setError('송금 이력을 불러오는데 실패했습니다.');
      setRemittances([]);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 로드 시 초기 데이터 가져오기 (사용자 정보가 있을 때만)
  useEffect(() => {
    if (userInfo?.id) {
      fetchRemittances();
    }
  }, [userInfo]);

  // 페이징 변경 시 데이터 가져오기
  useEffect(() => {
    if (userInfo?.id) {
      fetchRemittances();
    }
  }, [currentPage, pageSize, userInfo?.id]);

  // 필터 변경 시 자동 검색 (상태 업데이트 후 검색 실행)
  useEffect(() => {
    if (userInfo?.id) {
      setCurrentPage(1);
      fetchRemittances();
    }
  }, [filters, userInfo?.id]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // 기간 설정 버튼 전용 핸들러
  const handleQuickDateRangeChange = (range: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case 'today':
        start = today;
        end = today;
        break;
      case '1month':
        start.setMonth(today.getMonth() - 1);
        break;
      case '3months':
        start.setMonth(today.getMonth() - 3);
        break;
      case '6months':
        start.setMonth(today.getMonth() - 6);
        break;
      case '1year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case '3years':
        start.setFullYear(today.getFullYear() - 3);
        break;
      case '5years':
        start.setFullYear(today.getFullYear() - 5);
        break;
      case 'custom':
        return; // 직접 선택은 그대로 유지
    }

    const newFilters = {
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      quickDateRange: range
    };
    setFilters(newFilters);
    setCurrentPage(1); // 기간 변경 시 첫 페이지로 이동
    // useEffect가 filters 변경을 감지해서 자동으로 검색 실행
  };



  const handleSearch = () => {
    setCurrentPage(1);
    fetchRemittances();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

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

  return (
    <div style={{ 
      maxWidth: 650, 
      margin: isMobile ? '0' : '0.9rem auto 2.5rem'
    }}>
      <CommonPageHeader
        title="📋 송금 이력"
        subtitle="송금 내역을 확인하실 수 있습니다"
        gradientColors={{ from: '#667eea', to: '#764ba2' }}
      />
      {/* 검색 폼 영역 */}
      <div style={{ 
        boxShadow: '0 4px 24px rgba(30,41,59,0.13), 0 1.5px 6px rgba(59,130,246,0.07)', 
        borderRadius: 18, 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', 
        border: '1.5px solid #e0e7ef', 
        padding: '0 0 0 0', 
        marginBottom: '24px'
      }}>
        <div style={{ padding: '0'}}>
          <RemittanceHistoryFilter 
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onQuickDateRangeChange={handleQuickDateRangeChange}
            useSortSelect={true}
          />
        </div>
      </div>

      {/* 리스트 영역 */}
      {error ? (
        <div style={{ 
          boxShadow: '0 4px 24px rgba(30,41,59,0.13), 0 1.5px 6px rgba(59,130,246,0.07)', 
          borderRadius: 18, 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', 
          border: '1.5px solid #e0e7ef', 
          padding: '2.5rem',
          textAlign: 'center', 
          color: '#ef4444', 
          fontSize: '1.1rem',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      ) : (
        <div style={{ 
          boxShadow: '0 4px 24px rgba(30,41,59,0.13), 0 1.5px 6px rgba(59,130,246,0.07)', 
          borderRadius: 18, 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', 
          border: '1.5px solid #e0e7ef', 
          padding: '0 0 0 0', 
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          <div style={{ 
            background: '#fff', 
            borderTop: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <RemittanceList 
              remittances={remittances}
              onRemittanceClick={handleRemittanceClick}
            />
          </div>
        </div>
      )}

      {/* 페이징 영역 */}
      {!error && (
          <RemittancePaging
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
      )}
      <RemittanceDetailModal
        isOpen={!!selectedRemittance}
        onClose={() => setSelectedRemittance(null)}
        remittance={selectedRemittance}
      />
    </div>
  );
}

export default RemittanceHistoryPage; 