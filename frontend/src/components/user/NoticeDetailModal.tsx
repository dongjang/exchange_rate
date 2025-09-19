import React from 'react';

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

interface NoticeDetailModalProps {
  isOpen: boolean;
  notice: Notice | null;
  onClose: () => void;
}

const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({
  isOpen,
  notice,
  onClose
}) => {
  if (!isOpen || !notice) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return '높음';
      case 'NORMAL':
        return '보통';
      default:
        return priority;
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'modalSlideIn 0.3s ease-out'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* 헤더 */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px 32px',
          color: 'white',
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '25px',
                  fontWeight: '700',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  공지사항 상세
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '16px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div style={{
          padding: '32px',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {/* 제목 */}
          <div style={{
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '2px solid #f1f5f9'
          }}>
                         <h3 style={{
               margin: 0,
               fontSize: '18px',
               fontWeight: '600',
               color: '#1e293b',
               lineHeight: '1.4'
             }}>
               {notice.title}
             </h3>
          </div>

          {/* 공지 내용 */}
          <div style={{
            marginBottom: '24px'
          }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              공지 내용
            </h4>
            <div style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#374151',
              whiteSpace: 'pre-wrap'
            }}>
              {notice.content}
            </div>
          </div>

          {/* 메타 정보 */}
          <div style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              상세 정보
            </h4>
              <div style={{
               display: 'grid',
               gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
               gap: '12px',
               fontSize: '13px'
             }}>
               <div>
                 <span style={{ color: '#64748b', fontWeight: '500' }}>중요도:</span>
                 <span style={{ 
                   marginLeft: '8px', 
                   color: getPriorityColor(notice.priority),
                   fontWeight: '600'
                 }}>
                   {getPriorityLabel(notice.priority)}
                 </span>
               </div>
               <div>
                 <span style={{ color: '#64748b', fontWeight: '500' }}>조회수:</span>
                 <span style={{ marginLeft: '8px', color: '#374151' }}>{notice.viewCount}</span>
               </div>
               <div>
                 <span style={{ color: '#64748b', fontWeight: '500' }}>작성자:</span>
                 <span style={{ marginLeft: '8px', color: '#374151' }}>{notice.createdUserName}</span>
               </div>
               <div>
                 <span style={{ color: '#64748b', fontWeight: '500' }}>등록일:</span>
                 <span style={{ marginLeft: '8px', color: '#374151' }}>{formatDate(notice.createdAt)}</span>
               </div>
             </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 32px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a67d8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
          >
            닫기
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NoticeDetailModal;
