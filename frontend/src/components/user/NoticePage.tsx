import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import Swal from 'sweetalert2';
import { api } from '../../services/api';
import { userInfoAtom } from '../../store/userStore';
import CommonPageLayout from './CommonPageLayout';
import CommonNoticeModal from './CommonNoticeModal';

interface Notice {
  id: number;
  title: string;
  content: string;
  status: string;
  priority: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  noticeStartAt?: string;
  noticeEndAt?: string;
  createdUserId: number;
  createdUserName: string;
}

interface NoticeSearchRequest {
  title?: string;
  content?: string;
  status?: string;
  priority?: string;
  page: number;
  size: number;
  sortOrder?: string;
}

const NoticePage: React.FC = () => {
  const [userInfo] = useAtom(userInfoAtom);
  const [noticeList, setNoticeList] = useState<Notice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchRequest, setSearchRequest] = useState<NoticeSearchRequest>({
    page: 0,
    size: 5,
    sortOrder: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const statusOptions = [
    { value: 'ACTIVE', label: '활성' },
    { value: 'INACTIVE', label: '비활성' }
  ];

  const priorityOptions = [
    { value: 'HIGH', label: '높음' },
    { value: 'NORMAL', label: '보통' }
  ];

  const fetchNoticeList = async () => {
    try {
      const response = await api.searchNotices(searchRequest);
      if (response && response.content) {
        setNoticeList(response.content);
        setTotalCount(response.totalElements);
      } else {
        setNoticeList([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
      Swal.fire('오류', '공지사항을 불러오는데 실패했습니다.', 'error');
    }
  };

  useEffect(() => {
    if(userInfo?.id){
      fetchNoticeList();
    }
  }, [searchRequest]);

  // 검색 조건이 변경될 때만 검색 실행 (페이지 변경 제외)
  useEffect(() => {
    setSearchRequest(prev => ({ ...prev, page: 0 }));
    setCurrentPage(1);
  }, [searchRequest.title, searchRequest.content, searchRequest.status, searchRequest.priority]);

  const handleSearch = () => {
    setSearchRequest(prev => ({ ...prev, page: 0 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchRequest(prev => ({ ...prev, page: (page - 1) * prev.size }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setSearchRequest(prev => ({ ...prev, size: newPageSize, page: 0 }));
    setCurrentPage(1);
  };

  const handleRowClick = async (notice: Notice) => {
    try {
      // 개별 API 호출로 최신 데이터 가져오기
      const noticeDetail = await api.getNoticeById(notice.id);
      
      // 조회수 증가 API 호출
      await api.incrementNoticeViewCount(notice.id);
      
      // 최신 데이터로 조회수 증가된 상태로 설정
      const updatedNotice = { ...noticeDetail, viewCount: noticeDetail.viewCount + 1 };
      setSelectedNotice(updatedNotice);
      
      // 로컬 상태도 업데이트
      setNoticeList(prev => prev.map(n => 
        n.id === notice.id ? updatedNotice : n
      ));
    } catch (error) {
      console.error('공지사항 상세 정보 조회 또는 조회수 증가 실패:', error);
      // 에러 발생 시 기존 데이터로 모달 열기
      setSelectedNotice(notice);
    }
    setIsModalOpen(true);
  };

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  };

  const getPriorityLabel = (priority: string) => {
    const priorityOption = priorityOptions.find(option => option.value === priority);
    return priorityOption ? priorityOption.label : priority;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10b981';
      case 'INACTIVE':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return '#ef4444';
      case 'NORMAL':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  // 반응형 감지
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsSmallMobile(width <= 400);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 테이블 컬럼 정의
  const columns = [
    {
      key: 'title',
      label: '제목',
      width: isSmallMobile ? '2.5fr' : isMobile ? '4fr' : '4fr',
      render: (notice: Notice) => (
        <div style={{
          fontWeight: '500',
          color: '#1e293b',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {notice.title}
        </div>
      )
    },
    {
      key: 'priority',
      label: isSmallMobile ? '중요' : '중요도',
      width: isSmallMobile ? '1fr' : '1fr',
      align: 'center' as const,
      render: (notice: Notice) => (
        <span style={{
          padding: isSmallMobile ? '2px 6px' : isMobile ? '3px 8px' : '4px 12px',
          borderRadius: '20px',
          fontSize: isSmallMobile ? '10px' : isMobile ? '10px' : '12px',
          fontWeight: '600',
          backgroundColor: getPriorityColor(notice.priority) + '20',
          color: getPriorityColor(notice.priority),
          whiteSpace: 'nowrap',
          display: 'inline-block',
          minWidth: 'fit-content'
        }}>
          {isSmallMobile ? (getPriorityLabel(notice.priority) === '높음' ? '높음' : '보통') : 
           isMobile ? (getPriorityLabel(notice.priority) === '높음' ? '높음' : '보통') : 
           getPriorityLabel(notice.priority)}
        </span>
      )
    },
    {
      key: 'viewCount',
      label: isSmallMobile ? '조회' : '조회수',
      width: isSmallMobile ? '0.6fr' : '1fr',
      align: 'right' as const,
      render: (notice: Notice) => (
        <div style={{ 
          fontSize: isSmallMobile ? '10px' : isMobile ? '11px' : '14px', 
          color: '#64748b',
          textAlign: 'right'
        }}>
          {notice.viewCount}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: isSmallMobile ? '날짜' : '등록일',
      width: isSmallMobile ? '1.2fr' : isMobile ? '1.5fr' : '1fr',
      align: 'center' as const,
      render: (notice: Notice) => (
        <div style={{ 
          fontSize: isSmallMobile ? '10px' : isMobile ? '11px' : '14px', 
          color: '#64748b' 
        }}>
          {isSmallMobile ? 
            new Date(notice.createdAt).toLocaleDateString('ko-KR', {
              month: '2-digit',
              day: '2-digit'
            }) :
            new Date(notice.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })
          }
        </div>
      )
    }
  ];

  return (
    <CommonPageLayout
      title="📢 공지사항"
      subtitle="중요한 소식과 업데이트를 확인하세요"
      gradientColors={{ from: '#667eea', to: '#764ba2' }}
      columns={columns}
      data={noticeList}
      emptyMessage="등록된 공지사항이 없습니다."
      totalCount={totalCount}
      currentPage={currentPage}
      pageSize={searchRequest.size}
      onRowClick={handleRowClick}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    >
      {/* 검색 폼 */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* 제목 검색 */}
          <div>
            <input
               type="text"
               value={searchRequest.title || ''}
               onChange={(e) => setSearchRequest(prev => ({ ...prev, title: e.target.value }))}
               placeholder="제목을 입력하세요"
               style={{
                 width: '100%',
                 padding: '12px',
                 border: '1px solid #d1d5db',
                 borderRadius: '8px',
                 fontSize: '14px',
                 outline: 'none',
                 transition: 'border-color 0.2s ease'
               }}
               onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#10b981'}
               onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'}
             />
          </div>

          {/* 내용 검색 */}
          <div>
            <input
               type="text"
               value={searchRequest.content || ''}
               onChange={(e) => setSearchRequest(prev => ({ ...prev, content: e.target.value }))}
               placeholder="내용을 입력하세요"
               style={{
                 width: '100%',
                 padding: '12px',
                 border: '1px solid #d1d5db',
                 borderRadius: '8px',
                 fontSize: '14px',
                 outline: 'none',
                 transition: 'border-color 0.2s ease'
               }}
               onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#10b981'}
               onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'}
             />
          </div>

          {/* 중요도 필터 */}
          <div>
            <select
               value={searchRequest.priority || ''}
               onChange={(e) => setSearchRequest(prev => ({ ...prev, priority: e.target.value }))}
               style={{
                 width: '100%',
                 padding: '12px',
                 border: '1px solid #d1d5db',
                 borderRadius: '8px',
                 fontSize: '14px',
                 outline: 'none',
                 transition: 'border-color 0.2s ease',
                 backgroundColor: 'white'
               }}
               onFocus={(e) => (e.target as HTMLSelectElement).style.borderColor = '#10b981'}
               onBlur={(e) => (e.target as HTMLSelectElement).style.borderColor = '#d1d5db'}
             >
              <option value="">전체</option>
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 검색 버튼 */}
          <div>
            <button
              onClick={handleSearch}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#059669'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#10b981'}
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 공지사항 상세 모달 */}
      <CommonNoticeModal
        isOpen={isModalOpen}
        notice={selectedNotice}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNotice(null);
        }}
        isImportantNotice={false}
      />
    </CommonPageLayout>
  );
};

export default NoticePage;
