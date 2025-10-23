import React, { useRef, useState, useEffect } from 'react';

interface Qna {
  id: number;
  title: string;
  content: string;
  status: string;
  fileId?: number;
  fileName?: string;
  createdAt: string;
  answerContent?: string;
}

interface QnaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  editingQna: Qna | null;
  formData: {
    title: string;
    content: string;
    file: File | null;
    removeExistingFile?: boolean;
  };
  setFormData: (data: any) => void;
  isSubmitting: boolean;
}

const QnaModal: React.FC<QnaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onCancel,
  editingQna,
  formData,
  setFormData,
  isSubmitting
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsSmallMobile(width <= 480);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  const handleFileRemove = () => {
    setFormData({ ...formData, file: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingFile = () => {
    setFormData({ ...formData, file: null, removeExistingFile: true });
  };

  const isValidFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      padding: isSmallMobile ? '0.5rem 0.25rem' : isMobile ? '0.75rem 0.5rem' : '0',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: isSmallMobile ? '12px' : isMobile ? '16px' : '20px',
        width: isSmallMobile ? '98%' : isMobile ? '95%' : '90%',
        maxWidth: isSmallMobile ? '380px' : isMobile ? '450px' : '700px',
        maxHeight: isSmallMobile ? '95vh' : isMobile ? '95vh' : '90vh',
        overflow: 'hidden',
        boxShadow: isSmallMobile ? '0 8px 25px rgba(0, 0, 0, 0.15)' : isMobile ? '0 15px 35px rgba(0, 0, 0, 0.2)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        marginTop: isMobile ? '1rem' : '0',
        marginBottom: isMobile ? '1rem' : '0'
      }}>
        {/* 모달 헤더 */}
        <div style={{
          padding: isSmallMobile ? '12px 16px 10px 16px' : isMobile ? '16px 20px 14px 20px' : '32px 32px 24px 32px',
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <h2 style={{
              margin: 0,
              fontSize: isSmallMobile ? '1.1rem' : isMobile ? '1.3rem' : '1.75rem',
              fontWeight: '700',
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              {editingQna && editingQna.status === 'ANSWERED' ? 'Q&A 상세' : (editingQna ? 'Q&A 수정' : 'Q&A 등록')}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: isSmallMobile ? '28px' : isMobile ? '30px' : '32px',
                height: isSmallMobile ? '28px' : isMobile ? '30px' : '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: isSmallMobile ? '14px' : isMobile ? '15px' : '16px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 모달 바디 */}
        <div style={{ 
          padding: isSmallMobile ? '10px 12px' : isMobile ? '12px 16px' : '32px', 
          maxHeight: isSmallMobile ? '70vh' : isMobile ? '70vh' : '60vh', 
          overflowY: 'auto',
        }}>
          <div style={{ marginBottom: isSmallMobile ? '16px' : isMobile ? '20px' : '28px' }}>
            <label style={{
              display: 'block',
              marginBottom: isSmallMobile ? '4px' : isMobile ? '6px' : '10px',
              fontWeight: '600',
              color: '#1e293b',
              fontSize: isSmallMobile ? '15px' : isMobile ? '15px' : '15px'
            }}>
              제목 {editingQna && editingQna.status === 'ANSWERED' ? '' : <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>}
            </label>
            {editingQna && editingQna.status === 'ANSWERED' ? (
              <div style={{
                width: '100%',
                padding: isSmallMobile ? '10px 12px' : isMobile ? '12px 14px' : '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: isSmallMobile ? '6px' : isMobile ? '8px' : '12px',
                fontSize: isSmallMobile ? '15px' : isMobile ? '12px' : '15px',
                boxSizing: 'border-box',
                background: '#f8fafc',
                color: '#1e293b'
              }}>
                {formData.title}
              </div>
            ) : (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: isSmallMobile ? '10px 12px' : isMobile ? '12px 14px' : '16px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: isSmallMobile ? '6px' : isMobile ? '8px' : '12px',
                  fontSize: isSmallMobile ? '15px' : isMobile ? '15px' : '15px',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  background: 'white'
                }}
                placeholder="제목을 입력하세요 (최대 20자)"
                maxLength={20}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            )}
          </div>

          <div style={{ marginBottom: isSmallMobile ? '16px' : isMobile ? '20px' : '28px' }}>
            <label style={{
              display: 'block',
              marginBottom: isSmallMobile ? '4px' : isMobile ? '6px' : '10px',
              fontWeight: '600',
              color: '#1e293b',
              fontSize: isSmallMobile ? '15px' : isMobile ? '12px' : '15px'
            }}>
              내용 {editingQna && editingQna.status === 'ANSWERED' ? '' : <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>}
            </label>
            {editingQna && editingQna.status === 'ANSWERED' ? (
              <div style={{
                width: '100%',
                padding: isSmallMobile ? '10px 12px' : isMobile ? '12px 14px' : '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: isSmallMobile ? '6px' : isMobile ? '8px' : '12px',
                fontSize: isSmallMobile ? '15px' : isMobile ? '15px' : '15px',
                boxSizing: 'border-box',
                background: '#f8fafc',
                color: '#1e293b',
                minHeight: isSmallMobile ? '100px' : isMobile ? '110px' : '120px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {formData.content}
              </div>
            ) : (
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={isSmallMobile ? 6 : isMobile ? 7 : 8}
                style={{
                  width: '100%',
                  padding: isSmallMobile ? '10px 12px' : isMobile ? '12px 14px' : '16px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: isSmallMobile ? '6px' : isMobile ? '8px' : '12px',
                  fontSize: isSmallMobile ? '15px' : isMobile ? '15px' : '15px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  background: 'white',
                  fontFamily: 'inherit'
                }}
                placeholder="내용을 입력하세요"
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            )}
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: '600',
              color: '#1e293b',
              fontSize: '15px'
            }}>
              첨부파일
            </label>
            
            {editingQna && editingQna.status === 'ANSWERED' ? (
              // 답변완료된 경우: 첨부파일 표시만
              <div style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '15px',
                boxSizing: 'border-box',
                background: '#f8fafc',
                color: '#1e293b'
              }}>
                {editingQna.fileName ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px'
                  }}>
                    <span style={{ 
                      fontSize: '16px', 
                      color: '#10b981',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>📎</span>
                    <div style={{ 
                      flex: '1',
                      minWidth: 0
                    }}>
                      <span style={{ 
                        color: '#10b981', 
                        fontWeight: '500',
                        wordBreak: 'break-all',
                        lineHeight: '1.4',
                        display: 'block',
                        textAlign: 'left',
                        whiteSpace: 'normal'
                      }}>
                        {editingQna.fileName}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span style={{ color: '#6b7280' }}>첨부파일 없음</span>
                )}
              </div>
            ) : (
              // 수정 가능한 경우: 기존 파일 관리 기능 포함
              <>
                {/* 기존 파일 표시 (수정 시) */}
                {editingQna && editingQna.fileName && !formData.file && !formData.removeExistingFile && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    background: '#f0f9ff',
                    border: '1px solid #0ea5e9',
                    borderRadius: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ 
                        fontSize: '16px', 
                        color: '#0ea5e9', 
                        flexShrink: 0,
                        marginTop: '2px'
                      }}>📎</span>
                      <div style={{ 
                        flex: '1',
                        minWidth: 0
                      }}>
                        <span style={{ 
                          fontSize: '14px', 
                          color: '#0c4a6e', 
                          fontWeight: '500',
                          wordBreak: 'break-all',
                          lineHeight: '1.4',
                          display: 'block',
                          textAlign: 'left',
                          whiteSpace: 'normal'
                        }}>
                          기존 파일: {editingQna.fileName}
                        </span>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end' 
                    }}>
                      <button
                        type="button"
                        onClick={handleRemoveExistingFile}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )}

                {/* 기존 파일 삭제됨 표시 */}
                {editingQna && editingQna.fileName && formData.removeExistingFile && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    background: '#fef2f2',
                    border: '1px solid #ef4444',
                    borderRadius: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ 
                        fontSize: '16px', 
                        color: '#ef4444', 
                        flexShrink: 0,
                        marginTop: '2px'
                      }}>🗑️</span>
                      <div style={{ 
                        flex: '1',
                        minWidth: 0
                      }}>
                        <span style={{ 
                          fontSize: '14px', 
                          color: '#991b1b', 
                          fontWeight: '500',
                          wordBreak: 'break-all',
                          lineHeight: '1.4',
                          display: 'block',
                          textAlign: 'left',
                          whiteSpace: 'normal'
                        }}>
                          기존 파일: {editingQna.fileName}
                        </span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: '#ef4444',
                      backgroundColor: '#fee2e2',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '600'
                    }}>
                      삭제됨
                    </span>
                  </div>
                )}
                
                <div style={{
                  border: '2px dashed #e2e8f0',
                  borderRadius: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
                  padding: isSmallMobile ? '12px' : isMobile ? '16px' : '20px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  background: '#f8fafc'
                }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                    style={{ display: 'none' }}
                  />
                  
                  {formData.file ? (
                    <div>
                      <div style={{
                        padding: '12px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '8px',
                          marginBottom: '8px'
                        }}>
                          <span style={{ 
                            fontSize: '16px', 
                            color: '#10b981',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}>📎</span>
                          <div style={{ 
                            flex: '1',
                            minWidth: 0
                          }}>
                            <span style={{ 
                              fontSize: '14px', 
                              color: '#374151',
                              wordBreak: 'break-all',
                              lineHeight: '1.4',
                              display: 'block',
                              textAlign: 'left',
                              whiteSpace: 'normal'
                            }}>
                              {formData.file.name}
                            </span>
                          </div>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end' 
                        }}>
                          <button
                            type="button"
                            onClick={handleFileRemove}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      {!isValidFile(formData.file) && (
                        <div style={{
                          color: '#ef4444',
                          fontSize: '12px',
                          marginTop: '8px'
                        }}>
                          PDF 또는 이미지 파일만 업로드 가능하며, 최대 10MB까지 가능합니다.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: isSmallMobile ? '6px' : isMobile ? '7px' : '8px',
                          padding: isSmallMobile ? '8px 16px' : isMobile ? '10px 20px' : '12px 24px',
                          cursor: 'pointer',
                          fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        파일 선택
                      </button>
                      <div style={{
                        fontSize: isSmallMobile ? '10px' : isMobile ? '11px' : '12px',
                        color: '#6b7280',
                        marginTop: isSmallMobile ? '6px' : isMobile ? '7px' : '8px',
                        lineHeight: '1.4'
                      }}>
                        PDF, JPG, PNG, GIF 파일만 가능 (최대 10MB)
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

                     {editingQna && editingQna.status === 'PENDING' && (
             <div style={{
               marginBottom: '24px',
               padding: '16px',
               backgroundColor: '#fef3c7',
               border: '1px solid #f59e0b',
               borderRadius: '12px',
               borderLeft: '4px solid #f59e0b'
             }}>
               <div style={{
                 display: 'flex',
                 alignItems: 'flex-start',
                 gap: '12px'
               }}>
                 <div style={{
                   fontSize: '18px',
                   color: '#f59e0b',
                   marginTop: '2px'
                 }}>
                   ⚠️
                 </div>
                 <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#92400e',
                    fontSize: isSmallMobile ? '12px' : isMobile ? '12px' : '14px',
                    marginBottom: '4px'
                  }}>
                    문의 취소 안내
                  </div>
                  <div style={{
                    color: '#92400e',
                    fontSize: isSmallMobile ? '11px' : isMobile ? '14px' : '13px',
                    lineHeight: '1.5'
                  }}>
                    아직 답변이 완료되지 않은 문의입니다.<br />
                    문의를 취소하시면 더 이상 수정할 수 없습니다.
                  </div>
                 </div>
               </div>
             </div>
           )}

           {/* 답변 내용 (답변완료된 경우) */}
           {editingQna && editingQna.status === 'ANSWERED' && editingQna.answerContent && (
             <div style={{ marginBottom: '28px' }}>
               <label style={{
                 display: 'block',
                 marginBottom: '10px',
                 fontWeight: '600',
                 color: '#1e293b',
                 fontSize: '15px'
               }}>
                 답변 내용
               </label>
               <div style={{
                 width: '100%',
                 padding: '16px 20px',
                 border: '2px solid #e2e8f0',
                 borderRadius: '12px',
                 fontSize: '15px',
                 boxSizing: 'border-box',
                 background: '#f0f9ff',
                 color: '#0c4a6e',
                 minHeight: '120px',
                 lineHeight: '1.6',
                 whiteSpace: 'pre-wrap',
                 borderColor: '#0ea5e9'
               }}>
                 {editingQna.answerContent}
               </div>
             </div>
           )}
        </div>

        {/* 모달 푸터 */}
        <div style={{
          padding: isSmallMobile ? '12px 16px 16px 16px' : isMobile ? '16px 20px 20px 20px' : '24px 32px 32px 32px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          gap: isSmallMobile ? '8px' : isMobile ? '12px' : '16px',
          justifyContent: 'flex-end',
          background: 'white'
        }}>
          {editingQna && editingQna.status === 'PENDING' && (
            <button
              onClick={onCancel}
              style={{
                padding: isSmallMobile ? '6px 12px' : isMobile ? '8px 16px' : '14px 28px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: isSmallMobile ? '6px' : isMobile ? '8px' : '12px',
                cursor: 'pointer',
                fontSize: isSmallMobile ? '11px' : isMobile ? '12px' : '15px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
            >
              문의 취소
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: isSmallMobile ? '8px 16px' : isMobile ? '10px 20px' : '14px 28px',
              backgroundColor: 'white',
              color: '#64748b',
              border: '2px solid #e2e8f0',
              borderRadius: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
              cursor: 'pointer',
              fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            }}
          >
            취소
          </button>
          {((editingQna && editingQna.status === 'PENDING')|| !editingQna) && (
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            style={{
              padding: isSmallMobile ? '8px 16px' : isMobile ? '10px 20px' : '14px 28px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              opacity: isSubmitting ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {isSubmitting ? '처리중...' : (editingQna ? '수정' : '등록')}
          </button>
             )}
        </div>
      </div>
    </div>
  );
};

export default QnaModal;
