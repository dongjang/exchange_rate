import React, { useEffect, useState } from 'react';
import { FaTimes, FaCheck, FaTimes as FaReject, FaClock, FaFileAlt, FaEdit, FaEye, FaDownload, FaTrash } from 'react-icons/fa';
import { api } from '../../services/api';
import { useAtom } from 'jotai';
import { userInfoAtom } from '../../store/userStore';
import RemittanceLimitModal from './RemittanceLimitModal';
import Swal from 'sweetalert2';
import './RemittanceLimitHistoryModal.css';

interface FileInfo {
  id: number;
  originalName: string;
  fileSize: number;
  fileType: string;
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
  incomeFile?: FileInfo;
  bankbookFile?: FileInfo;
  businessFile?: FileInfo;
}

interface RemittanceLimitHistoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RemittanceLimitHistoryModal: React.FC<RemittanceLimitHistoryModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [requests, setRequests] = useState<RemittanceLimitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInfo] = useAtom(userInfoAtom);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RemittanceLimitRequest | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { icon: <FaClock />, text: '대기중', color: '#f59e0b', bgColor: '#fef3c7' };
      case 'APPROVED':
        return { icon: <FaCheck />, text: '승인', color: '#10b981', bgColor: '#d1fae5' };
      case 'REJECTED':
        return { icon: <FaReject />, text: '반려', color: '#ef4444', bgColor: '#fee2e2' };
      default:
        return { icon: <FaClock />, text: '대기중', color: '#f59e0b', bgColor: '#fef3c7' };
    }
  };

  useEffect(() => {
    if (open && userInfo?.id) {
      fetchRequests();
    }
  }, [open, userInfo?.id]);

  const fetchRequests = async () => {
   
    setLoading(true);
    try {
      const response = await api.getUserRemittanceLimitRequests();
      setRequests(response);
    } catch (error) {
      console.error('한도 변경 신청 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    if (!userInfo?.id) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: '신청 취소',
      text: '정말로 이 한도 변경 신청을 취소하시겠습니까? 취소 후에는 복구할 수 없습니다.',
      showCancelButton: true,
      confirmButtonText: '취소',
      cancelButtonText: '돌아가기',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      await api.cancelRemittanceLimitRequest(requestId);
      
      await Swal.fire({
        icon: 'success',
        title: '취소 완료',
        text: '한도 변경 신청이 성공적으로 취소되었습니다.',
        confirmButtonText: '확인'
      });

      // 목록 새로고침
      fetchRequests();
      
      // 성공 후 콜백 호출
      if (onSuccess) {
        onSuccess();
      }
      
      // 모달 닫기
      onClose();
    } catch (error) {
      console.error('신청 취소 실패:', error);
      
      await Swal.fire({
        icon: 'error',
        title: '취소 실패',
        text: '신청 취소 중 오류가 발생했습니다. 다시 시도해주세요.',
        confirmButtonText: '확인'
      });
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1f2937'
          }}>
            한도 변경 신청 상세
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.5rem',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#6b7280';
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* 내용 */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            <div className="loading-spinner"></div>
          </div>
        ) : requests.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            <FaFileAlt style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '1.1rem' }}>신청 내역이 없습니다.</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
              한도 변경 신청을 하시면 여기서 확인하실 수 있습니다.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.map((request) => {
              const statusInfo = getStatusInfo(request.status);
              return (
                <div key={request.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  backgroundColor: '#fafafa'
                }}>
                  {/* 헤더 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: statusInfo.bgColor,
                        color: statusInfo.color,
                        fontSize: '0.875rem'
                      }}>
                        {statusInfo.icon}
                      </span>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#374151'
                      }}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      {formatDate(request.createdAt)}
                    </span>
                  </div>

                  {/* 한도 정보 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>일일 한도</span>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                        {formatCurrency(request.dailyLimit)}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>월 한도</span>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                        {formatCurrency(request.monthlyLimit)}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>1회 한도</span>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                        {formatCurrency(request.singleLimit)}
                      </div>
                    </div>
                  </div>

                  {/* 신청 사유 */}
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>신청 사유</span>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#374151',
                      lineHeight: '1.5',
                      marginTop: '0.25rem'
                    }}>
                      {request.reason}
                    </div>
                  </div>

                  {/* 첨부 파일 정보 */}
                  {(request.incomeFile || request.bankbookFile || request.businessFile) && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>첨부 파일</span>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginTop: '0.25rem'
                      }}>
                        {request.incomeFile && (
                          <div style={{
                            display: isMobile ? 'flex' : 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            gap: isMobile ? '0.25rem' : '0.5rem',
                            padding: isMobile ? '0.75rem' : '0.5rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: isMobile ? '8px' : '6px',
                            fontSize: '0.875rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: isMobile ? '0.25rem' : '0'
                            }}>
                              <FaFileAlt style={{ color: '#6b7280' }} />
                              <span style={{ color: '#374151', fontWeight: '500' }}>소득 증빙:</span>
                            </div>
                            <span 
                              style={{ 
                                color: '#3b82f6', 
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontWeight: '500',
                                wordBreak: isMobile ? 'break-all' : 'normal',
                                lineHeight: isMobile ? '1.4' : 'normal'
                              }}
                              onClick={() => api.downloadFile(request.incomeFile!.id)}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.color = '#1d4ed8';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.color = '#3b82f6';
                              }}
                            >
                              {request.incomeFile.originalName}
                            </span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: isMobile ? '0.25rem' : '0'
                            }}>
                              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                                ({formatFileSize(request.incomeFile.fileSize)})
                              </span>
                              <FaDownload style={{ color: '#6b7280', fontSize: '0.75rem' }} />
                            </div>
                          </div>
                        )}
                        {request.bankbookFile && (
                          <div style={{
                            display: isMobile ? 'flex' : 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            gap: isMobile ? '0.25rem' : '0.5rem',
                            padding: isMobile ? '0.75rem' : '0.5rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: isMobile ? '8px' : '6px',
                            fontSize: '0.875rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: isMobile ? '0.25rem' : '0'
                            }}>
                              <FaFileAlt style={{ color: '#6b7280' }} />
                              <span style={{ color: '#374151', fontWeight: '500' }}>통장 사본:</span>
                            </div>
                            <span 
                              style={{ 
                                color: '#3b82f6', 
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontWeight: '500',
                                wordBreak: isMobile ? 'break-all' : 'normal',
                                lineHeight: isMobile ? '1.4' : 'normal'
                              }}
                              onClick={() => api.downloadFile(request.bankbookFile!.id)}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.color = '#1d4ed8';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.color = '#3b82f6';
                              }}
                            >
                              {request.bankbookFile.originalName}
                            </span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: isMobile ? '0.25rem' : '0'
                            }}>
                              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                                ({formatFileSize(request.bankbookFile.fileSize)})
                              </span>
                              <FaDownload style={{ color: '#6b7280', fontSize: '0.75rem' }} />
                            </div>
                          </div>
                        )}
                        {request.businessFile && (
                          <div style={{
                            display: isMobile ? 'flex' : 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            gap: isMobile ? '0.25rem' : '0.5rem',
                            padding: isMobile ? '0.75rem' : '0.5rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: isMobile ? '8px' : '6px',
                            fontSize: '0.875rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: isMobile ? '0.25rem' : '0'
                            }}>
                              <FaFileAlt style={{ color: '#6b7280' }} />
                              <span style={{ color: '#374151', fontWeight: '500' }}>사업자 등록증:</span>
                            </div>
                            <span 
                              style={{ 
                                color: '#3b82f6', 
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontWeight: '500',
                                wordBreak: isMobile ? 'break-all' : 'normal',
                                lineHeight: isMobile ? '1.4' : 'normal'
                              }}
                              onClick={() => api.downloadFile(request.businessFile!.id)}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.color = '#1d4ed8';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.color = '#3b82f6';
                              }}
                            >
                              {request.businessFile.originalName}
                            </span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: isMobile ? '0.25rem' : '0'
                            }}>
                              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                                ({formatFileSize(request.businessFile.fileSize)})
                              </span>
                              <FaDownload style={{ color: '#6b7280', fontSize: '0.75rem' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 관리자 코멘트 (반려된 경우) */}
                  {request.status === 'REJECTED' && (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#fee2e2',
                      borderRadius: '8px',
                      border: `1px solid '#fecaca'`
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#991b1b'
                      }}>
                        {'반려 사유'}
                      </span>
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#991b1b',
                        marginTop: '0.25rem',
                        lineHeight: '1.5'
                      }}>
                        {request.adminComment}
                      </div>
                    </div>
                  )}
                  
                  {/* 반려 상태 안내 문구 */}
                  {request.status === 'REJECTED' && (
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#fef3c7',
                      borderRadius: '6px',
                      border: '1px solid #f59e0b',
                      marginTop: '0.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                        color: '#92400e'
                      }}>
                        <span style={{ fontSize: '0.9rem' }}>💡</span>
                        <span>
                          반려된 신청은 <strong>신청 수정</strong> 버튼을 통해 재신청할 수 있습니다.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.5rem',
                    marginTop: '1rem'
                  }}>
                    {/* PENDING 상태일 때만 신청 취소 버튼 표시 */}
                    {request.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                        }}
                      >
                        <FaTrash style={{ fontSize: '0.75rem' }} />
                        신청 취소
                      </button>
                    )}
                    
                    {/* PENDING 또는 REJECTED 상태일 때 신청 수정 버튼 표시 */}
                    {(request.status === 'PENDING' || request.status === 'REJECTED') && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowEditModal(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                        }}
                      >
                        <FaEdit style={{ fontSize: '0.75rem' }} />
                        신청 수정
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* 하단 닫기 버튼 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
            }}
          >
            닫기
          </button>
        </div>
      </div>
      
      {/* 신청 수정 모달 */}
      {showEditModal && selectedRequest && (
        <RemittanceLimitModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRequest(null);
            fetchRequests(); // 목록 새로고침
          }}
          currentLimit={{
            dailyLimit: selectedRequest.dailyLimit,
            monthlyLimit: selectedRequest.monthlyLimit,
            singleLimit: selectedRequest.singleLimit,
            status: selectedRequest.status,
            reason: selectedRequest.reason,
            incomeFile: selectedRequest.incomeFile,
            bankbookFile: selectedRequest.bankbookFile,
            businessFile: selectedRequest.businessFile
          }}
          user={userInfo}
          isEdit={true}
          editRequestId={selectedRequest.id}
        />
      )}
    </div>
  );
};

export default RemittanceLimitHistoryModal; 