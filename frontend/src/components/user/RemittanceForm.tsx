import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { api } from '../../services/api';
import { remittanceCountriesAtom, getRemittanceCountries, exchangeRatesAtom, updateExchangeRatesAtom } from '../../store/countryStore';
import { myBankAccountAtom, banksAtom, fetchBanksAtom } from '../../store/myBankAccountStore';
import type { SenderBank } from '../../store/myBankAccountStore';
import { userInfoAtom } from '../../store/userStore';
import AccountModal from './AccountModal';
import RemittanceLimitDisplay from './RemittanceLimitDisplay';

export interface RemittanceFormData {
  senderBank?: string;
  senderAccount?: string;
  receiverBank?: string;
  receiverAccount: string;
  receiverName: string;
  receiverCountry: string;
  amount: number;
  currency: string;
}

interface RemittanceFormProps {
  onSubmit?: (data: RemittanceFormData) => void;
  refreshKey?: number;
}

function RemittanceForm({ onSubmit, refreshKey = 0 }: RemittanceFormProps) {
  const [remittanceCountries] = useAtom(remittanceCountriesAtom);
  const getRemitCountries = useSetAtom(getRemittanceCountries);
  const [exchangeRates] = useAtom(exchangeRatesAtom);
  const updateExchangeRates = useSetAtom(updateExchangeRatesAtom);
  
  useEffect(() => {
    if (!remittanceCountries) {
      getRemitCountries();
    }
  }, [remittanceCountries, getRemitCountries]);
  
  // 환율 데이터가 비어있을 때만 조회
  useEffect(() => {
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
      updateExchangeRates();
    }
  }, [exchangeRates, updateExchangeRates]);
  const [myBankAccount, setMyBankAccount] = useAtom(myBankAccountAtom);
  const [userInfo] = useAtom(userInfoAtom);
  const [amountInput, setAmountInput] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null);
  const [selectedReceiverBank, setSelectedReceiverBank] = useState('');
  const [form, setForm] = useState<RemittanceFormData>({
    senderBank: '',
    senderAccount: '',
    receiverBank: '',
    receiverAccount: '',
    receiverName: '',
    receiverCountry: '',
    amount: 0,
    currency: '',
  });
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Add state for hover effects
  const [isAccountBtnHover, setIsAccountBtnHover] = useState(false);
  const [isSimBtnHover, setIsSimBtnHover] = useState(false);
  const [isSubmitBtnHover, setIsSubmitBtnHover] = useState(false);

  // 동적 은행 상태 관리
  const senderBanks = useAtomValue(banksAtom('KRW')) || [];
  const fetchSenderBanks = useSetAtom(fetchBanksAtom('KRW'));
  useEffect(() => {
    if (userInfo?.id && (!senderBanks || senderBanks.length === 0)) {
      fetchSenderBanks();
    }
  }, [senderBanks, fetchSenderBanks]);

  const receiverBanks = useAtomValue(banksAtom(selectedCurrency?.value || '')) || [];
  const fetchReceiverBanks = useSetAtom(fetchBanksAtom(selectedCurrency?.value || ''));
  useEffect(() => {
    if (selectedCurrency?.value) {
      fetchReceiverBanks();
    }
  }, [selectedCurrency, fetchReceiverBanks]);

  const senderBankOptions = senderBanks.map((b: SenderBank) => ({ value: b.bankCode, label: b.name }));
  const receiverBankOptions = receiverBanks.map((b: SenderBank) => ({ value: b.bankCode, label: b.name }));
  const currencyOptions = (remittanceCountries ?? []).map(c => ({ value: c.code, label: `${c.countryName} – ${c.codeName} (${c.code})` }));


  // 통화 표시 이름 생성
  const getCurrencyDisplayName = (currencyCode: string) => {
    if (!remittanceCountries) return currencyCode;
    
    const country = remittanceCountries.find(c => c.code === currencyCode);
    if (country) {
      return `${country.codeName} (${country.code})`;
    }
    
    // fallback for KRW
    if (currencyCode === 'KRW') {
      return '원 (KRW)';
    }
    
    return currencyCode;
  };

  // 선택된 통화로 변환된 금액 계산
  const getConvertedAmount = (amount: number, currency: string) => {
    if (!amount || !currency || !exchangeRates[currency]) return 0;
    return amount / exchangeRates[currency];
  };

  // useEffect to auto-select first senderBank if needed
  React.useEffect(() => {
    if (
      myBankAccount &&
      myBankAccount.bankCode &&
      senderBankOptions.length > 0 &&
      form.senderBank && // 빈 값이 아닐 때만
      !senderBankOptions.some(opt => opt.value === form.senderBank)
    ) {
      setForm(prev => ({ ...prev, senderBank: myBankAccount.bankCode, senderAccount: myBankAccount.accountNumber }));
    }
    // 빈 값('')일 때는 아무것도 하지 않음
  }, [senderBankOptions, myBankAccount, form.senderBank]);

  useEffect(() => {
    if(userInfo?.id){
      api.getMyBankAccount().then(data => {
        if (data && data.bankCode && data.accountNumber) {
          setForm(prev => ({ ...prev, senderBank: data.bankCode, senderAccount: data.accountNumber }));
          setMyBankAccount(data);
        } else {
          setMyBankAccount(null);
          setForm(prev => ({ ...prev, senderBank: '', senderAccount: '' }));
        }
      });
    }

  }, [userInfo, setMyBankAccount]);

  const handleAccountSave = async (bank: string, account: string) => {
    if (!bank || !account) {
      Swal.fire({ 
        icon: 'warning', 
        title: '정보를 모두 입력해 주세요.', 
        customClass: { 
          popup: 'swal2-z-top', 
          container: 'swal2-z-top',
          backdrop: 'swal2-z-top'
        },
        zIndex: 99999
      });
      return;
    }

    if (account.length < 5) {
      Swal.fire({ 
        icon: 'warning', 
        title: '계좌번호를 5자리 이상 입력해 주세요', 
        customClass: { 
          popup: 'swal2-z-top', 
          container: 'swal2-z-top',
          backdrop: 'swal2-z-top'
        },
        zIndex: 99999
      });
      return;
    }

    const isEdit = !!myBankAccount && myBankAccount.bankCode && myBankAccount.accountNumber;
    const result = await Swal.fire({
      icon: 'question',
      title: isEdit ? '내 은행/계좌 정보 수정' : '내 은행/계좌 정보 등록',
      text: isEdit ? '내 은행/계좌 정보를 수정하시겠습니까?' : '내 은행/계좌 정보를 등록하시겠습니까?',
      showCancelButton: true,
      customClass: { 
        popup: 'swal2-z-top', 
        container: 'swal2-z-top',
        backdrop: 'swal2-z-top'
      },
      zIndex: 99999,
      confirmButtonText: isEdit ? '수정' : '등록',
      cancelButtonText: '취소',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d1d5db',
    });
    if (!result.isConfirmed) return;
    await api.saveMyBankAccount({ bankCode: bank, accountNumber: account });
    setForm(prev => ({ ...prev, senderBank: bank, senderAccount: account }));
    setMyBankAccount({ bankCode: bank, accountNumber: account });
    setShowAccountModal(false);
    Swal.fire({
      icon: 'success',
      title: isEdit ? '내 은행/계좌 수정 완료' : '내 은행/계좌 등록 완료',
      text: isEdit ? '내 은행/계좌 정보가 수정되었습니다.' : '내 은행/계좌 정보가 등록되었습니다.',
      width: 420,
      timer: 1300,
      showConfirmButton: false,
      customClass: { 
        popup: 'swal2-z-top', 
        container: 'swal2-z-top',
        backdrop: 'swal2-z-top'
      },
      zIndex: 99999
    });
  };

  const formatNumberWithCommas = (value: string | number) => {
    const num = typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value.toString();
    if (!num) return '';
    return parseInt(num, 10).toLocaleString();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      const raw = value.replace(/[^0-9]/g, '');
      setAmountInput(formatNumberWithCommas(raw));
      setForm((prev) => ({ ...prev, amount: Number(raw) }));
    } else if (name === 'senderAccount' || name === 'receiverAccount') {
      // Only allow numbers for account fields
      const numericValue = value.replace(/[^0-9]/g, '');
      setForm((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCurrencyChange = (option: any) => {
    setSelectedCurrency(option);
    const name = remittanceCountries?.find(c => c.code === option.value)?.countryName || option.value;
    const match = name.match(/(.+?) \(/);
    const country = match ? match[1] : name;
    setForm((prev) => ({
      ...prev,
      currency: option.value,
      receiverCountry: country,
      receiverAccount: '', // 수취 통화 변경 시 받는 계좌번호 초기화
    }));
    setSelectedReceiverBank(''); // 수취 통화 바뀌면 받는 은행 초기화
  };

  const cleanAmount = Number(amountInput.replace(/[^0-9]/g, ''));
  const feeRate = 0.01;
  const fee = cleanAmount > 0 ? Math.floor(cleanAmount * feeRate) : 0;
  const total = cleanAmount > 0 ? cleanAmount + fee : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.senderBank) {
      await Swal.fire({ icon: 'warning', title: '보내는 은행을 선택해 주세요' });
      return;
    }
    if (!form.senderAccount) {
      await Swal.fire({ icon: 'warning', title: '내 계좌번호를 입력해 주세요' });
      return;
    }
    if (form.senderAccount.length < 5) {
      await Swal.fire({ icon: 'warning', title: '내 계좌번호를 5자리 이상 입력해 주세요' });
      return;
    }

    if (!form.currency) {
      await Swal.fire({ icon: 'warning', title: '수취 통화를 선택해 주세요' });
      return;
    }
    if (!form.receiverBank) {
      await Swal.fire({ icon: 'warning', title: '받는 은행을 선택해 주세요' });
      return;
    }
    if (!form.receiverAccount) {
      await Swal.fire({ icon: 'warning', title: '받는 계좌번호를 입력해 주세요' });
      return;
    }

    if (form.receiverAccount.length < 5) {
      await Swal.fire({ icon: 'warning', title: '받는 계좌번호를 5자리 이상 입력해 주세요' });
      return;
    }

    if (!form.receiverName) {
      await Swal.fire({ icon: 'warning', title: '받는 사람을을 입력해 주세요' });
      return;
    }
    if (!cleanAmount || cleanAmount < 1000) {
      await Swal.fire({ icon: 'warning', title: '금액을 1,000원 이상 입력해 주세요' });
      return;
    }

    const convertedAmount = getConvertedAmount(cleanAmount, form.currency);
    
    const result = await Swal.fire({
      icon: 'question',
      title: '송금하기',
      html: `
        <div style="text-align: center; margin: 20px 0;">
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 1.1rem;">
                <span style="font-size: 1.2rem;">💸</span>
                <span>이체 금액</span>
              </span>
              <span style="font-weight: 600; font-size: 1.2rem; color: #222;">${cleanAmount ? cleanAmount.toLocaleString() : 0}원</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 1.1rem;">
                <span style="font-size: 1.2rem;">🪙</span>
                <span>수수료 (1%)</span>
              </span>
              <span style="font-weight: 600; font-size: 1.2rem; color: #222;">${fee ? fee.toLocaleString() : 0}원</span>
            </div>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-bottom: 12px;"></div>
            ${convertedAmount > 0 && form.currency ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="display: flex; align-items: center; gap: 6px; color: #059669; font-size: 1.1rem;">
                <span style="font-size: 1.2rem;">💱</span>
                <span>변환 금액</span>
              </span>
              <span style="font-weight: 600; font-size: 1.2rem; color: #059669;">${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getCurrencyDisplayName(form.currency)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 1.1rem;">
                <span style="font-size: 1.3rem;">💰</span>
                <span>총 출금액</span>
              </span>
              <span style="font-weight: 700; font-size: 1.4rem; color: #3b82f6;">${total ? total.toLocaleString() : 0}원</span>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '송금',
      cancelButtonText: '취소',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d1d5db',
    });
    if (!result.isConfirmed) return;

    try {
      // 한도 체크
      const limitCheck = await api.checkRemittanceLimit(cleanAmount);
      
      if (!limitCheck.success) {
        // 한도 초과 시 상세 메시지 표시
        let limitMessage = '';
        
        if (limitCheck.exceededType === 'BOTH') {
          limitMessage = `
            <div style="text-align: left; margin: 20px 0;">
              <div style="color: #dc2626; font-weight: 600; margin-bottom: 16px;">⚠️ 한도 초과</div>
              <div style="margin-bottom: 12px;">
                <strong>요청 금액:</strong> ${limitCheck.requestedAmount?.toLocaleString()}원<br><br>
                <strong>일일 한도:</strong> ${limitCheck.dailyLimit?.toLocaleString()}원<br>
                <strong>월 한도:</strong> ${limitCheck.monthlyLimit?.toLocaleString()}원
              </div>
              <div style="color: #dc2626; font-weight: 600;">
                일일 한도를 ${limitCheck.dailyExceededAmount?.toLocaleString()}원 초과<br>
                월 한도를 ${limitCheck.monthlyExceededAmount?.toLocaleString()}원 초과
              </div>
            </div>
          `;
        } else if (limitCheck.exceededType === 'DAILY') {
          limitMessage = `
            <div style="text-align: left; margin: 20px 0;">
              <div style="color: #dc2626; font-weight: 600; margin-bottom: 16px;">⚠️ 일일 한도 초과</div>
              <div style="margin-bottom: 12px;">
                <strong>요청 금액:</strong> ${limitCheck.requestedAmount?.toLocaleString()}원<br>
                <strong>일일 한도:</strong> ${limitCheck.dailyLimit?.toLocaleString()}원<br>
              </div>
              <div style="color: #dc2626; font-weight: 600;">
                일일 한도를 ${limitCheck.dailyExceededAmount?.toLocaleString()}원 초과
              </div>
            </div>
          `;
        } else if (limitCheck.exceededType === 'MONTHLY') {
          limitMessage = `
            <div style="text-align: left; margin: 20px 0;">
              <div style="color: #dc2626; font-weight: 600; margin-bottom: 16px;">⚠️ 월 한도 초과</div>
              <div style="margin-bottom: 12px;">
                <strong>요청 금액:</strong> ${limitCheck.requestedAmount?.toLocaleString()}원<br>
                <strong>월 한도:</strong> ${limitCheck.monthlyLimit?.toLocaleString()}원<br>
              </div>
              <div style="color: #dc2626; font-weight: 600;">
                월 한도를 ${limitCheck.monthlyExceededAmount?.toLocaleString()}원 초과
              </div>
            </div>
          `;
        }

        await Swal.fire({
          icon: 'error',
          title: '한도 초과',
          html: limitMessage,
          confirmButtonText: '확인',
          confirmButtonColor: '#dc2626',
        });
        return;
      }

      // 환율과 변환된 금액 계산
      const exchangeRate = exchangeRates[form.currency] || 0;
      const convertedAmount = exchangeRate > 0 ? cleanAmount / exchangeRate : 0;

      // 송금 API 호출
      const remittanceData = {
        senderBank: form.senderBank,
        senderAccount: form.senderAccount,
        receiverBank: form.receiverBank,
        receiverAccount: form.receiverAccount,
        receiverName: form.receiverName,
        receiverCountry: form.receiverCountry,
        amount: cleanAmount,
        currency: form.currency,
        exchangeRate: exchangeRate,
        convertedAmount: convertedAmount,
        status: 'COMPLETED'
      };

      const result = await api.createRemittance(remittanceData);
      
      await Swal.fire({
        icon: result.success ? 'success' : 'error',
        title: result.success ?  '송금 신청 완료' : '송금 신청 실패',
        text: result.message,
        confirmButtonColor: result.success ? '#2563eb' : '#dc2626',
      });

      // 송금 완료 후 한도 정보 새로고침
      if (onSubmit) {
        onSubmit(form);
      }

      // 폼 초기화 (등록된 은행/계좌 정보는 유지)
      setForm({
        senderBank: myBankAccount?.bankCode || '',
        senderAccount: myBankAccount?.accountNumber || '',
        receiverBank: '',
        receiverAccount: '',
        receiverName: '',
        receiverCountry: '',
        amount: 0,
        currency: '',
      });
      setAmountInput('');
      setSelectedCurrency(null);
      setSelectedReceiverBank('');

    } catch (error) {
      console.error('송금 신청 실패:', error);
      
      // 한도 초과 에러 처리
      if (error instanceof Error && error.message.startsWith('LIMIT_EXCEEDED:')) {
        const parts = error.message.split(':');
        const exceededType = parts[1];
        const message = parts[2];
        
        let limitMessage = '';
        
        if (exceededType === 'BOTH') {
          limitMessage = `
            <div style="text-align: left; margin: 20px 0;">
              <div style="color: #dc2626; font-weight: 600; margin-bottom: 16px;">⚠️ 한도 초과</div>
              <div style="margin-bottom: 12px;">
                <strong>요청 금액:</strong> ${cleanAmount.toLocaleString()}원
              </div>
              <div style="color: #dc2626; font-weight: 600;">
                일일 한도와 월 한도를 모두 초과했습니다.
              </div>
            </div>
          `;
        } else if (exceededType === 'DAILY') {
          limitMessage = `
            <div style="text-align: left; margin: 20px 0;">
              <div style="color: #dc2626; font-weight: 600; margin-bottom: 16px;">⚠️ 일일 한도 초과</div>
              <div style="margin-bottom: 12px;">
                <strong>요청 금액:</strong> ${cleanAmount.toLocaleString()}원
              </div>
              <div style="color: #dc2626; font-weight: 600;">
                일일 한도를 초과했습니다.
              </div>
            </div>
          `;
        } else if (exceededType === 'MONTHLY') {
          limitMessage = `
            <div style="text-align: left; margin: 20px 0;">
              <div style="color: #dc2626; font-weight: 600; margin-bottom: 16px;">⚠️ 월 한도 초과</div>
              <div style="margin-bottom: 12px;">
                <strong>요청 금액:</strong> ${cleanAmount.toLocaleString()}원
              </div>
              <div style="color: #dc2626; font-weight: 600;">
                월 한도를 초과했습니다.
              </div>
            </div>
          `;
        }

        await Swal.fire({
          icon: 'error',
          title: '한도 초과',
          html: limitMessage,
          confirmButtonText: '확인',
          confirmButtonColor: '#dc2626',
        });
        return;
      }
      
      await Swal.fire({
        icon: 'error',
        title: '송금 신청 실패',
        text: '송금 신청 중 오류가 발생했습니다. 다시 시도해 주세요.',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: 420,
    margin: '1.2rem auto',
    padding: '1.5rem 1.2rem 1.2rem 1.2rem',
    borderRadius: 18,
    boxShadow: '0 4px 24px 0 rgba(60, 80, 180, 0.10)',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.7rem',
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 600,
    marginBottom: 6,
    color: '#2563eb',
    fontSize: '1rem',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.8rem',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: '1rem',
    marginBottom: 1,
    outline: 'none',
    transition: 'border 0.2s',
  };

  const modernBtnStyle = (isHover: boolean, compact = false): React.CSSProperties => ({
    background: isHover
      ? 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)'
      : 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: compact ? 10 : 18,
    padding: compact ? '0.48rem 1.1rem' : '0.95rem 2.1rem',
    fontWeight: 800,
    fontSize: compact ? '1.01rem' : '1.15rem',
    cursor: 'pointer',
    boxShadow: isHover
      ? '0 6px 24px 0 rgba(60, 130, 246, 0.22)'
      : '0 3px 12px 0 rgba(60, 130, 246, 0.13)',
    letterSpacing: '0.03em',
    transition: 'background 0.22s, box-shadow 0.22s, transform 0.13s',
    transform: isHover ? 'scale(1.045)' : 'scale(1)',
    outline: 'none',
  });

  // Patch senderBankOptions to include myBankAccount.bankCode if not present
  const patchedSenderBankOptions = React.useMemo(() => {
    if (myBankAccount && myBankAccount.bankCode) {
      return senderBankOptions.map(opt =>
        opt.value === myBankAccount.bankCode
          ? { ...opt, label: `${opt.label} (등록된 은행)` }
          : opt
      );
    }
    return senderBankOptions;
  }, [senderBankOptions, myBankAccount]);

  return (
    <>
      {/* 송금 한도 표시 */}
      <RemittanceLimitDisplay refreshKey={refreshKey} />
      
      {/* 내 은행/계좌 등록/수정 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setShowAccountModal(true)}
          style={modernBtnStyle(isAccountBtnHover, true)}
          onMouseEnter={() => setIsAccountBtnHover(true)}
          onMouseLeave={() => setIsAccountBtnHover(false)}
        >
          내 은행/계좌 {myBankAccount ? '수정' : '등록'}
        </button>
      </div>
      {/* 은행/계좌 등록 모달 */}
      <AccountModal
        open={showAccountModal}
        initialBank={form.senderBank}
        initialAccount={form.senderAccount || ''}
        isEdit={myBankAccount ? true : false}
        myBankAccount={myBankAccount}
        bankOptions={senderBankOptions}
        onSave={async (bank, account) => {
          if (!bank || !account) {
            await Swal.fire({
              icon: 'warning',
              title: '정보를 모두 입력해 주세요.',
              customClass: { 
                popup: 'swal2-z-top', 
                container: 'swal2-z-top',
                backdrop: 'swal2-z-top'
              },
              zIndex: 99999
            });
            return;
          }
          await handleAccountSave(bank, account);
        }}
        onClose={() => setShowAccountModal(false)}
      />
      <form onSubmit={handleSubmit} style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>보내는 은행</label>
          <select
            name="senderBank"
            value={form.senderBank}
            onChange={e => {
              const newBank = e.target.value;
              setForm(prev => ({
                ...prev,
                senderBank: newBank,
                senderAccount:
                  myBankAccount && myBankAccount.bankCode === newBank
                    ? myBankAccount.accountNumber
                    : ''
              }));
            }}
            style={{ ...inputStyle, minHeight: 44 }}
          >
            <option value="">보내는 은행을 선택해 주세요</option>
            {patchedSenderBankOptions.map((opt: { value: string; label: string }) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>내 계좌번호</label>
          <input name="senderAccount" value={form.senderAccount} onChange={handleChange} style={inputStyle} placeholder="예: 1234567890" inputMode="numeric" pattern="[0-9]*" autoComplete="off" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>수취 통화</label>
          <div style={{ marginTop: 2 }}>
            <Select
              options={currencyOptions}
              value={selectedCurrency}
              onChange={handleCurrencyChange}
              placeholder="국가/통화명/통화로 검색"
              styles={{
                control: (base) => ({ ...base, ...inputStyle, padding: 0, minHeight: 44 }),
                menu: (base) => ({ ...base, zIndex: 10 }),
                option: (base, state) => ({ ...base, color: state.isSelected ? '#2563eb' : '#222', background: state.isSelected ? '#e0e7ef' : '#fff', fontWeight: state.isSelected ? 700 : 500 }),
              }}
              isSearchable
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>받는 은행</label>
          <select
            name="receiverBank"
            value={selectedReceiverBank}
            onChange={e => {
              setSelectedReceiverBank(e.target.value);
              setForm(prev => ({ ...prev, receiverBank: e.target.value, receiverAccount: '' }));
            }}
            style={{ ...inputStyle, minHeight: 44 }}
          >
            {!selectedCurrency && (
              <option value="">수취 통화를 선택해 주세요.</option>
            )}
            {selectedCurrency && <option value="">받는 은행 선택</option>}
            {selectedCurrency && receiverBankOptions.map((opt: { value: string; label: string }) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>받는 계좌번호</label>
          <input name="receiverAccount" value={form.receiverAccount} onChange={handleChange} style={inputStyle} placeholder="예: 9876543210" inputMode="numeric" pattern="[0-9]*" autoComplete="off" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>받는 사람</label>
          <input name="receiverName" value={form.receiverName} onChange={handleChange} style={inputStyle} placeholder="예: 홍길동" autoComplete="off" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>금액 (원)</label>
              <input name="amount" type="text" value={amountInput} onChange={handleChange} min={1} style={inputStyle} placeholder="예: 1,000" autoComplete="off" />
            </div>
          </div>
        </div>
        {/* 금액/수수료/총액 요약 */}
        <div style={{
          background: 'linear-gradient(135deg, #f6fbff 0%, #eaf3fa 100%)',
          borderRadius: 16,
          padding: '1.1rem 1.2rem 1.2rem 1.2rem',
          margin: '0.7rem 0 0.3rem 0',
          border: '1.5px solid #e0e7ef',
          fontSize: '1.08rem',
          color: '#222',
          lineHeight: 1.7,
          boxShadow: '0 4px 16px 0 rgba(59,130,246,0.09)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '1.1rem' }}>💸</span>
              <span>이체 금액</span>
            </span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cleanAmount ? cleanAmount.toLocaleString() : 0}원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '1.1rem' }}>🏷️</span>
              <span>수수료 (1%)</span>
            </span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{fee.toLocaleString()}원</span>
          </div>
          <div style={{ borderTop: '1.5px solid #dbeafe', margin: '0.7rem 0', paddingTop: '0.7rem' }}></div>
          {cleanAmount > 0 && selectedCurrency?.value && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '1.1rem' }}>💱</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>변환 금액</span>
              </span>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#059669' }}>
                {getConvertedAmount(cleanAmount, selectedCurrency.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencyDisplayName(selectedCurrency.value)}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '1.2rem' }}>💰</span>
              <span style={{ color: '#64748b', fontWeight: 600, fontSize: '1.08rem', letterSpacing: '0.01em' }}>총 출금액</span>
            </span>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#3b82f6' }}>{total ? total.toLocaleString() : 0}원</span>
          </div>
        </div>
        <button type="submit" style={modernBtnStyle(isSubmitBtnHover)} onMouseEnter={() => setIsSubmitBtnHover(true)} onMouseLeave={() => setIsSubmitBtnHover(false)}>송금하기</button>
      </form>
    </>
  );
}

export default RemittanceForm; 