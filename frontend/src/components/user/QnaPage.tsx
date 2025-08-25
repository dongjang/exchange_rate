import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import Swal from 'sweetalert2';
import { api } from '../../services/api';
import { userInfoAtom } from '../../store/userStore';
import QnaModal from './QnaModal';
import CommonPageLayout from './CommonPageLayout';
import QnaSearchForm from './QnaSearchForm';

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

interface QnaSearchRequest {
  title?: string;
  content?: string;
  status?: string;
  page: number;
  size: number;
}

const QnaPage: React.FC = () => {
  const [userInfo] = useAtom(userInfoAtom);
  const [qnaList, setQnaList] = useState<Qna[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchRequest, setSearchRequest] = useState<QnaSearchRequest>({
    page: 0,
    size: 5
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQna, setEditingQna] = useState<Qna | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    file: null as File | null,
    removeExistingFile: false
  });

  const statusOptions = [
    { value: 'PENDING', label: '대기중' },
    { value: 'ANSWERED', label: '답변완료' }
  ];

  const fetchQnaList = async () => {
    try {
      const response = await api.searchQna(searchRequest);
      if (response && response.content) {
        setQnaList(response.content);
        setTotalCount(response.totalElements);
      } else {
        setQnaList([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Q&A 조회 실패:', error);
      Swal.fire('오류', 'Q&A를 불러오는데 실패했습니다.', 'error');
    }
  };

  useEffect(() => {
    fetchQnaList();
  }, [searchRequest]);

  // 검색 조건이 변경될 때만 검색 실행 (페이지 변경 제외)
  useEffect(() => {
    setSearchRequest(prev => ({ ...prev, page: 0 }));
    setCurrentPage(1);
  }, [searchRequest.title, searchRequest.content, searchRequest.status]);

  const handleSearch = () => {
    setSearchRequest(prev => ({ ...prev, page: 0 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    console.log('페이지 변경:', page, '->', page - 1);
    setCurrentPage(page);
    setSearchRequest(prev => ({ ...prev, page: (page - 1) * prev.size }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setSearchRequest(prev => ({ ...prev, size: newPageSize, page: 0 }));
    setCurrentPage(1);
  };

  const handleAdd = () => {
    setEditingQna(null);
    setFormData({
      title: '',
      content: '',
      file: null,
      removeExistingFile: false
    });
    setIsModalOpen(true);
  };

  const handleEdit = (qna: Qna) => {
    setEditingQna(qna);
    setFormData({
      title: qna.title,
      content: qna.content,
      file: null,
      removeExistingFile: false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Swal.fire('오류', '제목을 입력해주세요.', 'error');
      return;
    }

    if (!formData.content.trim()) {
      Swal.fire('오류', '내용을 입력해주세요.', 'error');
      return;
    }

    // 컨펌 창 표시
    const confirmText = editingQna ? 'Q&A를 수정하시겠습니까?' : 'Q&A를 등록하시겠습니까?';
    const result = await Swal.fire({
      title: '확인',
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: editingQna ? '수정' : '등록',
      cancelButtonText: '취소'
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }
      formDataToSend.append('removeExistingFile', formData.removeExistingFile.toString());

      if (editingQna) {
        await api.updateQna(editingQna.id, formDataToSend);
        Swal.fire('성공', 'Q&A가 수정되었습니다.', 'success');
      } else {
        await api.createQna(formDataToSend);
        Swal.fire('성공', 'Q&A가 등록되었습니다.', 'success');
      }

      setIsModalOpen(false);
      setEditingQna(null);
      setFormData({
        title: '',
        content: '',
        file: null,
        removeExistingFile: false
      });
      fetchQnaList();
    } catch (error) {
      console.error('Q&A 저장 실패:', error);
      Swal.fire('오류', 'Q&A 저장에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!editingQna) return;

    const result = await Swal.fire({
      title: '확인',
      text: '정말로 이 Q&A를 취소하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '취소',
      cancelButtonText: '돌아가기'
    });

    if (result.isConfirmed) {
      try {
        await api.cancelQna(editingQna.id);
        Swal.fire('성공', 'Q&A가 취소되었습니다.', 'success');
        setIsModalOpen(false);
        setEditingQna(null);
        fetchQnaList();
      } catch (error) {
        console.error('Q&A 취소 실패:', error);
        Swal.fire('오류', 'Q&A 취소에 실패했습니다.', 'error');
      }
    }
  };

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b';
      case 'ANSWERED':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  // 테이블 컬럼 정의
  const columns = [
    {
      key: 'title',
      label: '제목',
      width: '3fr',
      render: (qna: Qna) => (
        <div style={{
          fontWeight: '500',
          color: '#1e293b',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {qna.title}
        </div>
      )
    },
    {
      key: 'status',
      label: '상태',
      width: '1fr',
      align: 'center' as const,
      render: (qna: Qna) => (
        <span style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: getStatusColor(qna.status) + '20',
          color: getStatusColor(qna.status)
        }}>
          {getStatusLabel(qna.status)}
        </span>
      )
    },
    {
      key: 'fileName',
      label: '첨부파일',
      width: '1fr',
      align: 'center' as const,
      render: (qna: Qna) => (
        qna.fileName ? (
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: '#10b981',
            color: 'white',
            display: 'inline-block'
          }}>
            첨부파일
          </span>
        ) : (
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: '#e5e7eb',
            color: '#6b7280',
            display: 'inline-block'
          }}>
            없음
          </span>
        )
      )
    },
    {
      key: 'createdAt',
      label: '등록일',
      width: '1fr',
      align: 'center' as const,
      render: (qna: Qna) => (
        <div style={{ fontSize: '14px', color: '#64748b' }}>
          {new Date(qna.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })}
        </div>
      )
    }
  ];

  return (
    <CommonPageLayout
      title="💬 Q&A"
      subtitle="궁금한 점을 문의하고 답변을 받아보세요"
      gradientColors={{ from: '#667eea', to: '#764ba2' }}
      columns={columns}
      data={qnaList}
      emptyMessage="등록된 Q&A가 없습니다."
      totalCount={totalCount}
      currentPage={currentPage}
      pageSize={searchRequest.size}
      onRowClick={handleEdit}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    >
      {/* 검색 폼 */}
      <QnaSearchForm
        searchRequest={searchRequest}
        setSearchRequest={setSearchRequest}
        onSearch={handleSearch}
        onAdd={handleAdd}
        statusOptions={statusOptions}
      />

      {/* 모달 */}
      <QnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        editingQna={editingQna}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
      />
    </CommonPageLayout>
  );
};

export default QnaPage;
