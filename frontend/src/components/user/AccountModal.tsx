import React, { useState, useEffect } from 'react';
import type { MyBankAccount } from '../../store/myBankAccountStore';

interface AccountModalProps {
  open: boolean;
  initialBank: string;
  initialAccount: string;
  onSave: (bank: string, account: string) => void;
  isEdit: boolean;
  onClose: () => void;
  myBankAccount: MyBankAccount | null;
  bankOptions: { value: string; label: string }[];
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 1rem',
  border: '1.5px solid #d1d5db',
  borderRadius: 8,
  fontSize: '1rem',
  marginBottom: 2,
  outline: 'none',
  transition: 'border 0.2s',
};

function AccountModal({ open, initialBank, initialAccount, onSave, isEdit, onClose, myBankAccount, bankOptions }: AccountModalProps) {
  const [bank, setBank] = useState(initialBank);
  const [account, setAccount] = useState(initialAccount);

  // Sync local state with initialBank when modal opens or initialBank changes
  useEffect(() => {
    if (open && myBankAccount) {
      setBank(myBankAccount.bankCode);
      setAccount(myBankAccount.accountNumber);
    } else if (open) {
      setBank(initialBank);
      setAccount(initialAccount);
    }
  }, [open, myBankAccount, initialBank, initialAccount]);

  // Patch bankOptions to show (등록된 은행) for the registered bank
  const patchedBankOptions = React.useMemo(() => {
    if (myBankAccount && myBankAccount.bankCode) {
      return bankOptions.map(opt =>
        opt.value === myBankAccount.bankCode
          ? { ...opt, label: `${opt.label} (등록된 은행)` }
          : opt
      );
    }
    return bankOptions;
  }, [bankOptions, myBankAccount]);

  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,41,59,0.48)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(30,41,59,0.13)', minWidth: 320, maxWidth: 400, width: '100%', padding: '2.2rem 2rem 1.5rem 2rem', position: 'relative' }}
        onMouseDown={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: '1.5rem', color: '#888', cursor: 'pointer' }} aria-label="닫기">×</button>
        <h3 style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '1.2rem', background: 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>내 은행/계좌 {isEdit ? '수정' : '등록'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <label style={{ fontWeight: 600, background: 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>은행</label>
          <select
            value={bank}
            onChange={e => {
              const newBank = e.target.value;
              setBank(newBank);
              setAccount(
                myBankAccount && myBankAccount.bankCode === newBank
                  ? myBankAccount.accountNumber
                  : ''
              );
            }}
            style={{ ...inputStyle, minHeight: 44 }}
          >
            <option value="">은행을 선택해 주세요</option>
            {patchedBankOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <label style={{ fontWeight: 600, background: 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>계좌번호</label>
          <input
            type="text"
            value={account}
            onChange={e => {
              const value = e.target.value;
              // 숫자만 허용
              if (/^\d*$/.test(value)) {
                setAccount(value);
              }
            }}
            onKeyDown={e => {
              // 숫자, 백스페이스, 삭제, 화살표 키만 허용
              if (!/[\d\b\Delete\ArrowLeft\ArrowRight\ArrowUp\ArrowDown]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
              }
            }}
            style={inputStyle}
            placeholder="예: 1234567890"
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: 18 }}>
            <button 
              type="button" 
              onClick={() => onSave(bank, account)} 
              style={{ 
                flex: 1,
                background: 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: '0.9rem 0', 
                fontWeight: 700, 
                fontSize: '1.08rem', 
                cursor: 'pointer', 
                boxShadow: '0 1px 4px rgba(30,41,59,0.07)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgb(88, 110, 214) 0%, rgb(102, 63, 142) 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,41,59,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(30,41,59,0.07)';
              }}
            >
            {isEdit ? '수정' : '등록'}
          </button>
            <button
              onClick={onClose}
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
                boxShadow: '0 1px 4px rgba(107, 114, 128, 0.07)'
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
        </div>
      </div>
    </div>
  );
}

export default AccountModal; 