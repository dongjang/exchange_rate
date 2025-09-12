import React, { useState, useRef, useEffect } from 'react';
import { FaUpload, FaTimes, FaCheck, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { api } from '../../services/api';
import { useAtom } from 'jotai';
import { userInfoAtom } from '../../store/userStore';

interface RemittanceLimit {
  id?: number; // 재신청 모드에서 사용할 ID
  dailyLimit: number;
  monthlyLimit: number;
  singleLimit: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  reason?: string;
  originalDailyLimit?: number; // 원본 일일 한도
  originalMonthlyLimit?: number; // 원본 월 한도
  incomeFile?: {
    id: number;
    originalName: string;
    fileSize: number;
    fileType: string;
  };
  bankbookFile?: {
    id: number;
    originalName: string;
    fileSize: number;
    fileType: string;
  };
  businessFile?: {
    id: number;
    originalName: string;
    fileSize: number;
    fileType: string;
  };
  limitType: 'DEFAULT_LIMIT' | 'UPPER_LIMIT'; // 한도 타입
}

interface RemittanceLimitModalProps {
  open: boolean;
  onClose: () => void;
  currentLimit?: RemittanceLimit;
  user?: any;
  isEdit?: boolean;
  editRequestId?: number;
  isRerequest?: boolean; // 재신청 모드 추가
  onSuccess?: () => void;
}

const RemittanceLimitModal: React.FC<RemittanceLimitModalProps> = ({
  open,
  onClose,
  currentLimit,
  user,
  isEdit = false,
  editRequestId,
  isRerequest = false, // 재신청 모드 추가
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    dailyLimit: '',
    monthlyLimit: '',
    singleLimit: '',
    reason: '',
    files: {
      income: [] as File[],      // 소득 증빙 (필수)
      bankbook: [] as File[],    // 통장 사본 (필수)
      business: [] as File[]     // 사업 관련 (필수)
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragStates, setDragStates] = useState({
    income: false,
    bankbook: false,
    business: false
  });
  const [existingFiles, setExistingFiles] = useState({
    income: null as any,
    bankbook: null as any,
    business: null as any
  });
  const [userInfo] = useAtom(userInfoAtom);

  // 기존 한도가 있는지 확인 (첫 번째 신청인지 여부)
  const isFirstRequest = !currentLimit || currentLimit.limitType === 'DEFAULT_LIMIT';

  // 재신청 모드일 때 기존 데이터 로드
  useEffect(() => {
    if ((isEdit || isRerequest) && currentLimit) {
      setFormData({
        dailyLimit: formatNumberWithCommas((isRerequest && currentLimit.originalDailyLimit ? currentLimit.originalDailyLimit : currentLimit.dailyLimit).toString()),
        monthlyLimit: formatNumberWithCommas((isRerequest && currentLimit.originalMonthlyLimit ? currentLimit.originalMonthlyLimit : currentLimit.monthlyLimit).toString()),
        singleLimit: formatNumberWithCommas(currentLimit.singleLimit.toString()),
        reason: currentLimit.reason || '',
        files: {
          income: [],
          bankbook: [],
          business: []
        }
      });
      
      // 기존 파일 정보 로드
      if (currentLimit.incomeFile) {
        setExistingFiles(prev => ({ ...prev, income: currentLimit.incomeFile }));
      }
      if (currentLimit.bankbookFile) {
        setExistingFiles(prev => ({ ...prev, bankbook: currentLimit.bankbookFile }));
      }
      if (currentLimit.businessFile) {
        setExistingFiles(prev => ({ ...prev, business: currentLimit.businessFile }));
      }
    }
  }, [isEdit, isRerequest, currentLimit]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const formatNumberWithCommas = (value: string | number) => {
    const num = typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value.toString();
    if (!num) return '';
    return parseInt(num, 10).toLocaleString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 한도 입력 필드인 경우 콤마 처리
    if (['dailyLimit', 'monthlyLimit', 'singleLimit'].includes(name)) {
      const raw = value.replace(/[^0-9]/g, '');
      const formattedValue = formatNumberWithCommas(raw);
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateFile = (file: File): boolean => {
    // 지원하는 파일 형식 (이미지와 PDF만)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf'
    ];
    
    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    // 파일 형식 검증
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: '지원하지 않는 파일 형식',
        text: 'jpg, png, gif, pdf 파일만 업로드 가능합니다.',
        confirmButtonText: '확인'
      });
      return false;
    }
    
    // 파일 크기 검증
    if (file.size > maxSize) {
      Swal.fire({
        icon: 'error',
        title: '파일 크기 초과',
        text: '파일 크기는 10MB 이하여야 합니다.',
        confirmButtonText: '확인'
      });
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, category: keyof typeof formData.files) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const currentFiles = formData.files[category];
      
      // 각 카테고리별로 1개만 업로드 가능
      if (currentFiles.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: '파일 업로드 제한',
          text: '각 카테고리별로 1개 파일만 업로드할 수 있습니다.',
          confirmButtonText: '확인'
        });
        return;
      }
      
      // 첫 번째 파일만 선택
      const selectedFile = newFiles[0];
      
      // 파일 validation
      if (!validateFile(selectedFile)) {
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        files: {
          ...prev.files,
          [category]: [selectedFile]
        }
      }));
    }
  };

  const removeFile = (category: keyof typeof formData.files, index: number) => {
    setFormData(prev => ({
      ...prev,
      files: {
        ...prev.files,
        [category]: prev.files[category].filter((_, i) => i !== index)
      }
    }));
  };

  const removeExistingFile = (category: keyof typeof existingFiles) => {
    Swal.fire({
      title: '기존 파일 삭제',
      html: '<div style="text-align: left; line-height: 1.5;">삭제 후에는 새로운 파일을 업로드할 수 있습니다.<br>기존 파일을 삭제하시겠습니까?</div>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        setExistingFiles(prev => ({
          ...prev,
          [category]: null
        }));
      }
    });
  };

  // 드래그 앤 드롭 관련 함수들
  const handleDragEnter = (e: React.DragEvent, category: keyof typeof formData.files) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStates(prev => ({ ...prev, [category]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, category: keyof typeof formData.files) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStates(prev => ({ ...prev, [category]: false }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, category: keyof typeof formData.files) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStates(prev => ({ ...prev, [category]: false }));

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // 각 카테고리별로 1개만 업로드 가능
    const currentFiles = formData.files[category];
    if (currentFiles.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: '파일 업로드 제한',
        text: '각 카테고리별로 1개 파일만 업로드할 수 있습니다.',
        confirmButtonText: '확인'
      });
      return;
    }

    // 첫 번째 파일만 선택
    const selectedFile = files[0];
    
    // 파일 validation
    if (!validateFile(selectedFile)) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      files: {
        ...prev.files,
        [category]: [selectedFile]
      }
    }));
  };

  // Validation 함수들
  const validateDailyLimit = (): boolean => {
    const dailyLimit = parseInt(formData.dailyLimit.replace(/[^0-9]/g, ''));
    if (!dailyLimit || dailyLimit <= 0) {
      Swal.fire({
        icon: 'error',
        title: '일일 한도 입력 오류',
        text: '일일 한도를 입력해주세요.',
        confirmButtonText: '확인'
      });
      return false;
    }
    return true;
  };

  const validateMonthlyLimit = (): boolean => {
    const monthlyLimit = parseInt(formData.monthlyLimit.replace(/[^0-9]/g, ''));
    if (!monthlyLimit || monthlyLimit <= 0) {
      Swal.fire({
        icon: 'error',
        title: '월 한도 입력 오류',
        text: '월 한도를 입력해주세요.',
        confirmButtonText: '확인'
      });
      return false;
    }
    return true;
  };

  const validateSingleLimit = (): boolean => {
    const singleLimit = parseInt(formData.singleLimit.replace(/[^0-9]/g, ''));
    if (!singleLimit || singleLimit <= 0) {
      Swal.fire({
        icon: 'error',
        title: '1회 한도 입력 오류',
        text: '1회 한도를 입력해주세요.',
        confirmButtonText: '확인'
      });
      return false;
    }
    return true;
  };

  const validateReason = (): boolean => {
    if (!formData.reason.trim()) {
      Swal.fire({
        icon: 'error',
        title: '신청 사유 입력 오류',
        text: '신청 사유를 입력해주세요.',
        confirmButtonText: '확인'
      });
      return false;
    }
    if (formData.reason.trim().length < 10) {
      Swal.fire({
        icon: 'error',
        title: '신청 사유 입력 오류',
        text: '신청 사유는 최소 10자 이상 입력해주세요.',
        confirmButtonText: '확인'
      });
      return false;
    }
    return true;
  };

  const validateFiles = (): boolean => {
    // 재신청 모드일 때는 파일 validation 비활성화
    if (isRerequest) {
      return true;
    }
    
    // 최초 신청이거나 수정 모드인 경우 파일 검증
    const needsFileValidation = isFirstRequest || isEdit;
    
    if (needsFileValidation) {
      // 소득 증빙 파일 검증 (기존 파일이 없고 새 파일도 없는 경우)
      if (!existingFiles.income && formData.files.income.length === 0) {
        Swal.fire({
          icon: 'error',
          title: '소득 증빙 파일 필수',
          text: '소득 증빙 파일을 첨부해주세요.',
          confirmButtonText: '확인'
        });
        return false;
      }
      
      // 통장 사본 파일 검증 (기존 파일이 없고 새 파일도 없는 경우)
      if (!existingFiles.bankbook && formData.files.bankbook.length === 0) {
        Swal.fire({
          icon: 'error',
          title: '통장 사본 파일 필수',
          text: '통장 사본 파일을 첨부해주세요.',
          confirmButtonText: '확인'
        });
        return false;
      }
      
      // 사업 관련 파일 검증 (기존 파일이 없고 새 파일도 없는 경우)
      if (!existingFiles.business && formData.files.business.length === 0) {
        Swal.fire({
          icon: 'error',
          title: '사업 관련 파일 필수',
          text: '사업 관련 파일을 첨부해주세요.',
          confirmButtonText: '확인'
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation 체크
    if (!validateDailyLimit()) return;
    
    if (!validateMonthlyLimit()) return;
    
    if (!validateSingleLimit()) return;
    
    if (!validateReason()) return;
    
    if (!validateFiles()) return;

    // Confirm Swal
    const result = await Swal.fire({
      icon: 'question',
      title: isRerequest ? '한도 변경 재신청' : (isEdit ? '한도 변경 신청 수정' : '한도 변경 신청'),
      text: isRerequest ? '입력하신 내용으로 한도 변경을 재신청하시겠습니까?' : (isEdit ? '입력하신 내용으로 한도 변경 신청을 수정하시겠습니까?' : '입력하신 내용으로 한도 변경을 신청하시겠습니까?'),
      showCancelButton: true,
      confirmButtonText: isRerequest ? '재신청하기' : (isEdit ? '수정하기' : '신청하기'),
      cancelButtonText: '취소',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsSubmitting(true);

    try {
      // FormData 생성
      const formDataToSend = new FormData();
      formDataToSend.append('dailyLimit', formData.dailyLimit.replace(/[^0-9]/g, ''));
      formDataToSend.append('monthlyLimit', formData.monthlyLimit.replace(/[^0-9]/g, ''));
      formDataToSend.append('singleLimit', formData.singleLimit.replace(/[^0-9]/g, ''));
      formDataToSend.append('reason', formData.reason);

      // 파일 추가 (재신청 모드가 아닐 때만)
      if (!isRerequest) {
        if (formData.files.income.length > 0) {
          formDataToSend.append('incomeFile', formData.files.income[0]);
        }
        if (formData.files.bankbook.length > 0) {
          formDataToSend.append('bankbookFile', formData.files.bankbook[0]);
        }
        if (formData.files.business.length > 0) {
          formDataToSend.append('businessFile', formData.files.business[0]);
        }
      }

      // API 호출

      if (isRerequest && currentLimit && currentLimit.id) {
        // 재신청 모드 - 기존 요청 UPDATE
        await api.updateRemittanceLimitRequest(currentLimit.id, formDataToSend, true);
        
        await Swal.fire({
          icon: 'success',
          title: '재신청이 완료되었습니다!',
          text: '관리자 검토 후 결과를 알려드리겠습니다.',
          confirmButtonText: '확인'
        });
      } else if (isEdit && editRequestId) {
        // 수정 모드
        await api.updateRemittanceLimitRequest(editRequestId, formDataToSend);
        
        await Swal.fire({
          icon: 'success',
          title: '수정이 완료되었습니다!',
          text: '관리자 검토 후 결과를 알려드리겠습니다.',
          confirmButtonText: '확인'
        });
      } else {
        // 신규 신청 모드
        await api.createRemittanceLimitRequest(formDataToSend);
        
        await Swal.fire({
          icon: 'success',
          title: '신청이 완료되었습니다!',
          text: '관리자 검토 후 결과를 알려드리겠습니다.',
          confirmButtonText: '확인'
        });
      }

      onClose();
      setFormData({
        dailyLimit: '',
        monthlyLimit: '',
        singleLimit: '',
        reason: '',
        files: {
          income: [],
          bankbook: [],
          business: []
        }
      });
      
      // 성공 후 콜백 호출
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('한도 변경 신청 실패:', error);
      await Swal.fire({
        icon: 'error',
        title: '신청 실패',
        text: '다시 시도해주세요.',
        confirmButtonText: '확인'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasExistingLimit = currentLimit && (currentLimit?.limitType && currentLimit?.limitType !== "DEFAULT_LIMIT");
  
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
        maxWidth: '600px',
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
             {isEdit ? '한도 변경 신청 수정' : '한도 변경 신청'}
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

        {/* 기존 한도 정보 (있는 경우) - 개선된 디자인 */}
        {hasExistingLimit && (
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #f3f4f6 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '2px solid #3b82f6',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <FaChartLine style={{ color: 'white', fontSize: '14px' }} />
              </div>
              <h3 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#1f2937'
              }}>
                현재 한도
              </h3>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.8rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid #dbeafe'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#1d4ed8', fontWeight: '500' }}>일일 한도</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e3a8a' }}>{formatCurrency(currentLimit.originalDailyLimit || currentLimit.dailyLimit)}</div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.8rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid #e0e7ff'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#3730a3', fontWeight: '500' }}>월 한도</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#312e81' }}>{formatCurrency(currentLimit.originalMonthlyLimit || currentLimit.monthlyLimit)}</div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.8rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid #f3e8ff'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#7c3aed', fontWeight: '500' }}>1회 한도</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#5b21b6' }}>{formatCurrency(currentLimit.singleLimit)}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 한도 입력 (첫 신청이거나 수정 모드인 경우) */}
          {(isFirstRequest || isEdit) && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#1f2937'
              }}>
                신청할 한도
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#374151'
                  }}>
                    일일 한도 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="dailyLimit"
                    value={formData.dailyLimit}
                    onChange={handleInputChange}
                    placeholder="예: 1,000,000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      backgroundColor: '#f9fafb',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = '#3b82f6';
                      (e.target as HTMLInputElement).style.backgroundColor = 'white';
                      (e.target as HTMLInputElement).style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = '#e5e7eb';
                      (e.target as HTMLInputElement).style.backgroundColor = '#f9fafb';
                      (e.target as HTMLInputElement).style.boxShadow = 'none';
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLInputElement).style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.target) {
                        (e.target as HTMLInputElement).style.backgroundColor = '#f9fafb';
                      }
                    }}
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#374151'
                  }}>
                    월 한도 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="monthlyLimit"
                    value={formData.monthlyLimit}
                    onChange={handleInputChange}
                    placeholder="예: 5,000,000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      backgroundColor: '#f9fafb',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = '#3b82f6';
                      (e.target as HTMLInputElement).style.backgroundColor = 'white';
                      (e.target as HTMLInputElement).style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = '#e5e7eb';
                      (e.target as HTMLInputElement).style.backgroundColor = '#f9fafb';
                      (e.target as HTMLInputElement).style.boxShadow = 'none';
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLInputElement).style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.target) {
                        (e.target as HTMLInputElement).style.backgroundColor = '#f9fafb';
                      }
                    }}
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#374151'
                  }}>
                    1회 한도 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="singleLimit"
                    value={formData.singleLimit}
                    onChange={handleInputChange}
                    placeholder="예: 500,000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      backgroundColor: '#f9fafb',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = '#3b82f6';
                      (e.target as HTMLInputElement).style.backgroundColor = 'white';
                      (e.target as HTMLInputElement).style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = '#e5e7eb';
                      (e.target as HTMLInputElement).style.backgroundColor = '#f9fafb';
                      (e.target as HTMLInputElement).style.boxShadow = 'none';
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLInputElement).style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.target) {
                        (e.target as HTMLInputElement).style.backgroundColor = '#f9fafb';
                      }
                    }}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 변경 신청 한도 (기존 한도가 있는 경우) - 각각 1줄씩 */}
          {hasExistingLimit && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#1f2937'
              }}>
                변경 신청 한도
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#374151'
                  }}>
                    일일 한도 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="dailyLimit"
                    value={formData.dailyLimit}
                    onChange={handleInputChange}
                    placeholder="예: 2,000,000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      backgroundColor: '#f9fafb',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.boxShadow = 'none';
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.target) {
                        e.target.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#374151'
                  }}>
                    월 한도 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="monthlyLimit"
                    value={formData.monthlyLimit}
                    onChange={handleInputChange}
                    placeholder="예: 10,000,000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      backgroundColor: '#f9fafb',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.boxShadow = 'none';
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.target) {
                        e.target.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#374151'
                  }}>
                    1회 한도 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="singleLimit"
                    value={formData.singleLimit}
                    onChange={handleInputChange}
                    placeholder="예: 1,000,000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      backgroundColor: '#f9fafb',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.boxShadow = 'none';
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.target) {
                        e.target.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 신청 사유 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#374151'
            }}>
              신청 사유 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="한도 변경 신청 사유를 상세히 작성해주세요"
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.9rem',
                resize: 'vertical',
                backgroundColor: '#f9fafb',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.backgroundColor = '#f9fafb';
                e.target.style.boxShadow = 'none';
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                if (document.activeElement !== e.target) {
                  e.target.style.backgroundColor = '#f9fafb';
                }
              }}
              required
            />
          </div>

          {/* 첨부 파일 섹션 - 승인 후 재신청 아닐 때만 표시*/}
          {!isRerequest && (!currentLimit?.limitType || currentLimit?.limitType === 'DEFAULT_LIMIT') && (
            <>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: '#374151'
              }}>
                첨부 파일 {(isFirstRequest && !isEdit) && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              <div style={{
                fontSize: '0.8rem',
                color: '#6b7280',
                marginBottom: '1rem',
                padding: '0.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <strong>📋 지원 파일 형식:</strong> jpg, png, gif, pdf(최대 10MB)
              </div>
              
              {/* 소득 증빙 */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  💰 소득 증빙 {(isFirstRequest && !isEdit) && <span style={{ color: '#ef4444' }}>*</span>} 
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'normal' }}>
                    ({formData.files.income.length}/1)
                  </span>
                </h4>
                             <div style={{
                 border: dragStates.income ? '2px dashed #3b82f6' : (formData.files.income.length > 0 || existingFiles.income) ? '2px dashed #d1d5db' : '2px dashed #d1d5db',
                 borderRadius: '8px',
                 padding: '1rem',
                 textAlign: 'center',
                 backgroundColor: dragStates.income ? '#eff6ff' : (formData.files.income.length > 0 || existingFiles.income) ? '#f3f4f6' : '#f9fafb',
                 transition: 'all 0.2s ease',
                 cursor: (formData.files.income.length > 0 || existingFiles.income) ? 'not-allowed' : 'pointer',
                 position: 'relative',
                 opacity: (formData.files.income.length > 0 || existingFiles.income) ? '0.6' : '1'
               }}
               onClick={(e) => {
                 if (formData.files.income.length > 0 || existingFiles.income) {
                   e.preventDefault();
                   e.stopPropagation();
                   Swal.fire({
                     icon: 'warning',
                     title: '파일 업로드 제한',
                     text: '각 카테고리별로 1개 파일만 업로드할 수 있습니다.',
                     confirmButtonText: '확인'
                   });
                   return;
                 }
               }}
               onDragEnter={(e) => {
                 if (formData.files.income.length > 0 || existingFiles.income) return;
                 handleDragEnter(e, 'income');
               }}
               onDragLeave={(e) => {
                 if (formData.files.income.length > 0 || existingFiles.income) return;
                 handleDragLeave(e, 'income');
               }}
               onDragOver={(e) => {
                 if (formData.files.income.length > 0 || existingFiles.income) return;
                 handleDragOver(e);
               }}
               onDrop={(e) => {
                 if (formData.files.income.length > 0 || existingFiles.income) return;
                 handleDrop(e, 'income');
               }}
               onMouseEnter={(e) => {
                 if (formData.files.income.length > 0 || existingFiles.income) return;
                 if (!dragStates.income) {
                   (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                   (e.currentTarget as HTMLElement).style.borderColor = '#9ca3af';
                 }
               }}
               onMouseLeave={(e) => {
                 if (formData.files.income.length > 0 || existingFiles.income) return;
                 if (!dragStates.income) {
                   (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb';
                   (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db';
                 }
               }}
              >
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.pdf"
                  onChange={(e) => handleFileChange(e, 'income')}
                  style={{ display: 'none' }}
                  id="file-upload-income"
                />
                                 <label htmlFor="file-upload-income" style={{
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   gap: '0.5rem',
                   cursor: 'pointer'
                 }}>
                   <FaUpload size={20} style={{ color: dragStates.income ? '#3b82f6' : '#6b7280' }} />
                   <span style={{ color: dragStates.income ? '#3b82f6' : '#6b7280', fontSize: '0.8rem', fontWeight: dragStates.income ? '600' : 'normal' }}>
                     {dragStates.income ? '파일을 여기에 놓으세요' : '급여명세서, 사업자등록증 등'}
                   </span>
                   <span style={{ color: dragStates.income ? '#3b82f6' : '#9ca3af', fontSize: '0.7rem' }}>
                     1개 파일
                   </span>
                   <span style={{ color: dragStates.income ? '#3b82f6' : '#6b7280', fontSize: '0.7rem', marginTop: '0.3rem' }}>
                     {dragStates.income ? '' : (isEdit ? '클릭하여 파일 변경 또는 드래그 앤 드롭' : '클릭하여 파일 선택 또는 드래그 앤 드롭')}
                   </span>
                 </label>
              </div>
              {formData.files.income.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  {formData.files.income.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.4rem',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      marginBottom: '0.3rem'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: '#374151' }}>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB) {isEdit && <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>(새로 업로드)</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile('income', index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#ef4444';
                        }}
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 기존 파일 정보 표시 (수정 모드) */}
              {isEdit && existingFiles.income && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.4rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '4px',
                    marginBottom: '0.3rem',
                    border: '1px solid #f59e0b'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#92400e' }}>
                      {existingFiles.income.originalName} ({(existingFiles.income.fileSize / 1024 / 1024).toFixed(2)}MB) <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>(기존 파일)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExistingFile('income')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#ef4444';
                      }}
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 통장 사본 */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                🏦 통장 사본 {(isFirstRequest && !isEdit) && <span style={{ color: '#ef4444' }}>*</span>}
                <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'normal' }}>
                  ({formData.files.bankbook.length}/1)
                </span>
              </h4>
                             <div style={{
                 border: dragStates.bankbook ? '2px dashed #3b82f6' : (formData.files.bankbook.length > 0 || existingFiles.bankbook) ? '2px dashed #d1d5db' : '2px dashed #d1d5db',
                 borderRadius: '8px',
                 padding: '1rem',
                 textAlign: 'center',
                 backgroundColor: dragStates.bankbook ? '#eff6ff' : (formData.files.bankbook.length > 0 || existingFiles.bankbook) ? '#f3f4f6' : '#f9fafb',
                 transition: 'all 0.2s ease',
                 cursor: (formData.files.bankbook.length > 0 || existingFiles.bankbook) ? 'not-allowed' : 'pointer',
                 position: 'relative',
                 opacity: (formData.files.bankbook.length > 0 || existingFiles.bankbook) ? '0.6' : '1'
               }}
               onClick={(e) => {
                 if (formData.files.bankbook.length > 0 || existingFiles.bankbook) {
                   e.preventDefault();
                   e.stopPropagation();
                   Swal.fire({
                     icon: 'warning',
                     title: '파일 업로드 제한',
                     text: '각 카테고리별로 1개 파일만 업로드할 수 있습니다.',
                     confirmButtonText: '확인'
                   });
                   return;
                 }
               }}
               onDragEnter={(e) => {
                 if (formData.files.bankbook.length > 0 || existingFiles.bankbook) return;
                 handleDragEnter(e, 'bankbook');
               }}
               onDragLeave={(e) => {
                 if (formData.files.bankbook.length > 0 || existingFiles.bankbook) return;
                 handleDragLeave(e, 'bankbook');
               }}
               onDragOver={(e) => {
                 if (formData.files.bankbook.length > 0 || existingFiles.bankbook) return;
                 handleDragOver(e);
               }}
               onDrop={(e) => {
                 if (formData.files.bankbook.length > 0 || existingFiles.bankbook) return;
                 handleDrop(e, 'bankbook');
               }}
               onMouseEnter={(e) => {
                 if (formData.files.bankbook.length > 0 || existingFiles.bankbook) return;
                 if (!dragStates.bankbook) {
                   (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                   (e.currentTarget as HTMLElement).style.borderColor = '#9ca3af';
                 }
               }}
               onMouseLeave={(e) => {
                 if (formData.files.bankbook.length > 0 || existingFiles.bankbook) return;
                 if (!dragStates.bankbook) {
                   (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb';
                   (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db';
                 }
               }}
              >
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.pdf"
                  onChange={(e) => handleFileChange(e, 'bankbook')}
                  style={{ display: 'none' }}
                  id="file-upload-bankbook"
                />
                                 <label htmlFor="file-upload-bankbook" style={{
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   gap: '0.5rem',
                   cursor: 'pointer'
                 }}>
                   <FaUpload size={20} style={{ color: dragStates.bankbook ? '#3b82f6' : '#6b7280' }} />
                   <span style={{ color: dragStates.bankbook ? '#3b82f6' : '#6b7280', fontSize: '0.8rem', fontWeight: dragStates.bankbook ? '600' : 'normal' }}>
                     {dragStates.bankbook ? '파일을 여기에 놓으세요' : '통장 사본, 세금계산서 등'}
                   </span>
                   <span style={{ color: dragStates.bankbook ? '#3b82f6' : '#9ca3af', fontSize: '0.7rem' }}>
                     1개 파일
                   </span>
                   <span style={{ color: dragStates.bankbook ? '#3b82f6' : '#6b7280', fontSize: '0.7rem', marginTop: '0.3rem' }}>
                     {dragStates.bankbook ? '' : (isEdit ? '클릭하여 파일 변경 또는 드래그 앤 드롭' : '클릭하여 파일 선택 또는 드래그 앤 드롭')}
                   </span>
                 </label>
              </div>
              {formData.files.bankbook.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  {formData.files.bankbook.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.4rem',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      marginBottom: '0.3rem'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: '#374151' }}>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB) {isEdit && <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>(새로 업로드)</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile('bankbook', index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#ef4444';
                        }}
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 기존 파일 정보 표시 (수정 모드) */}
              {isEdit && existingFiles.bankbook && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.4rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '4px',
                    marginBottom: '0.3rem',
                    border: '1px solid #f59e0b'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#92400e' }}>
                      {existingFiles.bankbook.originalName} ({(existingFiles.bankbook.fileSize / 1024 / 1024).toFixed(2)}MB) <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>(기존 파일)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExistingFile('bankbook')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#ef4444';
                      }}
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 사업 관련 */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                📊 사업 관련 {(isFirstRequest && !isEdit) && <span style={{ color: '#ef4444' }}>*</span>}
                <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'normal' }}>
                  ({formData.files.business.length}/1)
                </span>
              </h4>
                             <div style={{
                 border: dragStates.business ? '2px dashed #3b82f6' : (formData.files.business.length > 0 || existingFiles.business) ? '2px dashed #d1d5db' : '2px dashed #d1d5db',
                 borderRadius: '8px',
                 padding: '1rem',
                 textAlign: 'center',
                 backgroundColor: dragStates.business ? '#eff6ff' : (formData.files.business.length > 0 || existingFiles.business) ? '#f3f4f6' : '#f9fafb',
                 transition: 'all 0.2s ease',
                 cursor: (formData.files.business.length > 0 || existingFiles.business) ? 'not-allowed' : 'pointer',
                 position: 'relative',
                 opacity: (formData.files.business.length > 0 || existingFiles.business) ? '0.6' : '1'
               }}
               onClick={(e) => {
                 if (formData.files.business.length > 0 || existingFiles.business) {
                   e.preventDefault();
                   e.stopPropagation();
                   Swal.fire({
                     icon: 'warning',
                     title: '파일 업로드 제한',
                     text: '각 카테고리별로 1개 파일만 업로드할 수 있습니다.',
                     confirmButtonText: '확인'
                   });
                   return;
                 }
               }}
               onDragEnter={(e) => {
                 if (formData.files.business.length > 0 || existingFiles.business) return;
                 handleDragEnter(e, 'business');
               }}
               onDragLeave={(e) => {
                 if (formData.files.business.length > 0 || existingFiles.business) return;
                 handleDragLeave(e, 'business');
               }}
               onDragOver={(e) => {
                 if (formData.files.business.length > 0 || existingFiles.business) return;
                 handleDragOver(e);
               }}
               onDrop={(e) => {
                 if (formData.files.business.length > 0 || existingFiles.business) return;
                 handleDrop(e, 'business');
               }}
               onMouseEnter={(e) => {
                 if (formData.files.business.length > 0 || existingFiles.business) return;
                 if (!dragStates.business) {
                   (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                   (e.currentTarget as HTMLElement).style.borderColor = '#9ca3af';
                 }
               }}
               onMouseLeave={(e) => {
                 if (formData.files.business.length > 0 || existingFiles.business) return;
                 if (!dragStates.business) {
                   (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb';
                   (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db';
                 }
               }}
              >
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.pdf"
                  onChange={(e) => handleFileChange(e, 'business')}
                  style={{ display: 'none' }}
                  id="file-upload-business"
                />
                                 <label htmlFor="file-upload-business" style={{
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   gap: '0.5rem',
                   cursor: 'pointer'
                 }}>
                   <FaUpload size={20} style={{ color: dragStates.business ? '#3b82f6' : '#6b7280' }} />
                   <span style={{ color: dragStates.business ? '#3b82f6' : '#6b7280', fontSize: '0.8rem', fontWeight: dragStates.business ? '600' : 'normal' }}>
                     {dragStates.business ? '파일을 여기에 놓으세요' : '사업계획서, 투자 계획서 등'}
                   </span>
                   <span style={{ color: dragStates.business ? '#3b82f6' : '#9ca3af', fontSize: '0.7rem' }}>
                     1개 파일
                   </span>
                   <span style={{ color: dragStates.business ? '#3b82f6' : '#6b7280', fontSize: '0.7rem', marginTop: '0.3rem' }}>
                     {dragStates.business ? '' : (isEdit ? '클릭하여 파일 변경 또는 드래그 앤 드롭' : '클릭하여 파일 선택 또는 드래그 앤 드롭')}
                   </span>
                 </label>
              </div>
              {formData.files.business.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  {formData.files.business.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.4rem',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      marginBottom: '0.3rem'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: '#374151' }}>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB) {isEdit && <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>(새로 업로드)</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile('business', index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#ef4444';
                        }}
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 기존 파일 정보 표시 (수정 모드) */}
              {isEdit && existingFiles.business && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.4rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '4px',
                    marginBottom: '0.3rem',
                    border: '1px solid #f59e0b'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#92400e' }}>
                      {existingFiles.business.originalName} ({(existingFiles.business.fileSize / 1024 / 1024).toFixed(2)}MB) <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>(기존 파일)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExistingFile('business')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#ef4444';
                      }}
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

          {/* 주의사항 - 재신청 모드가 아닐 때만 표시 */}
          {!isRerequest && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <FaExclamationTriangle style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#92400e' }}>
                  주의사항
                </span>
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: '1.2rem',
                fontSize: '0.8rem',
                color: '#92400e',
                lineHeight: 1.5
              }}>
                <li>소득 증빙, 통장 사본, 사업 관련 서류를 필수로 첨부해야 합니다.</li>
                <li>지원 파일 형식: jpg, png, gif, pdf(최대 10MB)</li>
                <li>신청 후 관리자 검토를 거쳐 승인/반려됩니다.</li>
                <li>처리 결과는 이메일로 안내드립니다.</li>
              </ul>
            </div>
          )}

          {/* 한도 변경 안내 문구 */}
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            marginTop: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px'
            }}>
              <FaExclamationTriangle style={{ color: '#d97706', fontSize: '14px' }} />
              <span style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#92400e'
              }}>
                한도 변경 안내
              </span>
            </div>
            <div style={{
              fontSize: '12px',
              color: '#78350f',
              lineHeight: '1.4'
            }}>
              한도가 변경되면 기존 송금 한도는 초기화되고, 승인 이후 새로운 송금 가능 한도가 적용됩니다.
            </div>
          </div>

          {/* 버튼 */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  처리 중...
                </>
              ) : (
                <>
                  <FaCheck size={14} />
                  {isEdit ? '수정하기' : '신청하기'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RemittanceLimitModal; 