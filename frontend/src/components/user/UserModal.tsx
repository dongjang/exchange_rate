import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { selectedUserAtom, userInfoAtom } from '../../store/userStore';
import { api } from '../../services/api';
import './UserModal.css';
import Swal from 'sweetalert2';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function UserModal({ isOpen, onClose }: UserModalProps) {
  const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);
  const [, setUserInfo] = useAtom(userInfoAtom);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    pictureUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backdropClicked, setBackdropClicked] = useState(false);

  const isEditMode = Boolean(selectedUser && selectedUser.id);

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        email: selectedUser.email || '',
        name: selectedUser.name || '',
        pictureUrl: selectedUser.pictureUrl || '',
      });
    }
  }, [selectedUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await Swal.fire({
      icon: 'question',
      title: '저장하시겠습니까?',
      text: '사용자 정보를 저장하시겠습니까?',
      showCancelButton: true,
      confirmButtonText: '저장',
      cancelButtonText: '취소',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d1d5db',
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      if (selectedUser?.id) {
        // 수정 모드만 허용
        await api.updateUser(formData);
        // API 호출이 성공하면 formData로 users 상태 업데이트
        const updatedUser = { ...selectedUser, ...formData };
        // Header의 사용자 정보도 함께 업데이트
        (setUserInfo as any)(updatedUser);
        handleClose();
        await Swal.fire({
          icon: 'success',
          title: '저장 완료',
          text: '사용자 정보가 성공적으로 저장되었습니다.',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
      Swal.fire({
        icon: 'error',
        title: '저장 실패',
        text: '사용자 정보를 저장하지 못했습니다.',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    (setSelectedUser as any)(null);
    setFormData({ email: '', name: '', pictureUrl: '' });
    setError(null);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="user-modal-backdrop"
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,41,59,0.48)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) setBackdropClicked(true);
        else setBackdropClicked(false);
      }}
      onMouseUp={e => {
        if (e.target === e.currentTarget && backdropClicked) {
          setBackdropClicked(false);
          onClose();
        }
      }}
    >
      <div
        className="user-modal-card"
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(30,41,59,0.13)', minWidth: 350, maxWidth: 400, width: '100%', padding: '2.2rem 2rem 1.5rem 2rem', position: 'relative' }}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      >
        <button className="close-button user-modal-close-fancy user-modal-close-float" onClick={handleClose} aria-label="닫기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="user-modal-avatar-section">
          {formData.pictureUrl && (
            <img
              src={formData.pictureUrl}
              alt={formData.name || formData.email}
              className="user-modal-avatar-preview"
            />
          )}
        </div>
        <div className="user-modal-header-fancy" style={{ justifyContent: 'center', borderBottom: 'none', background: 'none', padding: '0 0 10px 0' }}>
          <h2 className="user-modal-title" style={{ color: '#222', fontWeight: 700 }}>사용자 상세</h2>
        </div>
        <div className="user-modal-divider"></div>
        <form onSubmit={handleSubmit} className="user-form user-modal-form-fancy">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled
              className="user-modal-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="user-modal-input"
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="pictureUrl">프로필 이미지 URL</label>
            <input
              type="url"
              id="pictureUrl"
              name="pictureUrl"
              value={formData.pictureUrl}
              onChange={handleChange}
              className="user-modal-input"
              autoComplete="off"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                flex: 1,
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.9rem 0',
                fontWeight: 700,
                fontSize: '1.08rem',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(30,41,59,0.07)',
                transition: 'all 0.2s ease',
                height: 'auto',
                lineHeight: '1.2',
                minHeight: 'unset',
                maxHeight: 'unset'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#1d4ed8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,41,59,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(30,41,59,0.07)';
              }}
            >
            {loading ? '저장 중...' : '저장'}
          </button>
            <button
              onClick={handleClose}
              style={{
                flex: 1,
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '0.9rem 0',
                fontSize: '1.08rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 4px rgba(107, 114, 128, 0.07)',
                height: 'auto',
                lineHeight: '1.2',
                minHeight: 'unset',
                maxHeight: 'unset'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4b5563';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6b7280';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(107, 114, 128, 0.07)';
              }}
            >
              닫기
            </button>
          </div>
          {error && <div className="error-message user-modal-error-fancy" style={{ marginTop: '1rem' }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}

export { UserModal }; 