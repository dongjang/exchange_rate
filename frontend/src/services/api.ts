import type { User } from '../store/userStore';
import axios from 'axios';
import type { Country } from '../store/countryStore';
import type { MyBankAccount } from '../store/myBankAccountStore';

const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  (window.location.hostname.includes('vercel.app') ? '' : 'http://localhost:8080/api');

// 전역 로딩 상태 관리
let loadingCount = 0;
let loadingCallbacks: ((isLoading: boolean) => void)[] = [];

export const setLoadingCallback = (callback: (isLoading: boolean) => void) => {
  loadingCallbacks.push(callback);
};

const updateLoadingState = (increment: boolean) => {
  if (increment) {
    loadingCount++;
  } else {
    loadingCount = Math.max(0, loadingCount - 1);
  }
  
  const isLoading = loadingCount > 0;
  
  // 커스텀 이벤트 발생
  window.dispatchEvent(new CustomEvent('loading-change', { 
    detail: { loading: increment } 
  }));
  
  loadingCallbacks.forEach(callback => callback(isLoading));
};

// Axios 인터셉터 설정
axios.interceptors.request.use(
  (config) => {
    // 로딩 상태 증가
    updateLoadingState(true);
    return config;
  },
  (error) => {
    // 에러 발생 시에도 로딩 상태 감소
    updateLoadingState(false);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    // 로딩 상태 감소
    updateLoadingState(false);
    return response;
  },
  (error) => {
    // 에러 발생 시에도 로딩 상태 감소
    updateLoadingState(false);
    
    // 400 에러 상세 정보 출력
    if (error.response?.status === 400) {
      console.error("=== 400 에러 상세 정보 ===");
      console.error("URL:", error.config?.url);
      console.error("Method:", error.config?.method?.toUpperCase());
      console.error("Headers:", error.config?.headers);
      console.error("Request Data:", error.config?.data);
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", error.response.data);
      console.error("Response Headers:", error.response.headers);
      console.error("==========================");
    }
    
    return Promise.reject(error);
  }
);

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  pictureUrl: string;
  picture?: string;
  status: string;
}

export const api = {
  // 현재 로그인한 사용자 정보 조회
  async getCurrentUserInfo(): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/users/users/loginUserInfo`, { withCredentials: true });
    return response.data;
  },

  // 관리자 페이지에서 특정 사용자 조회
  async getUserById(id: number): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/users/users/${id}`, { withCredentials: true });
    return response.data;
  },

  // 사용자 정보 수정
  async updateUser(userData: any): Promise<any> {
    const response = await axios.put(`${API_BASE_URL}/users/users/update`, userData, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    return response.data;
  },


  // 인증 관련 API
  async authSuccess(): Promise<{ success: boolean; message: string; user?: AuthUser }> {
    const response = await axios.get(`${API_BASE_URL}/users/auth/success`, { withCredentials: true });
    return response.data;
  },

  async getCurrentUser(): Promise<{ success: boolean; user?: AuthUser }> {
    const response = await axios.get(`${API_BASE_URL}/users/auth/user`, { withCredentials: true });
    return response.data;
  },

  async logout(): Promise<void> {
    await axios.post(`${API_BASE_URL}/users/auth/logout`, {}, { withCredentials: true });
  },

  async oauth2Logout(): Promise<void> {
    await axios.post(`${API_BASE_URL}/users/auth/oauth2/logout`, {}, { withCredentials: true });
  },

  // 관심 환율 등록
  async saveFavoriteCurrency(params: { type: string; currency_code: string }): Promise<void> {
    await axios.post(`${API_BASE_URL}/users/exchange/saveFavoriteRates`, params, { withCredentials: true });
  },

    // 관심 환율 목록 조회
    async getFavoriteCurrencyList(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/users/exchange/favoriteRatesList`, { withCredentials: true });
      return response.data;
    },

  // 사용자 페이지 국가/통화 리스트 조회
  async getAllCountries(): Promise<Country[]> {
    const response = await axios.get(`${API_BASE_URL}/users/countries/all`, { withCredentials: true });
    return response.data;
  },

  // 송금 가능 국가 리스트 조회
  async getRemittanceCountries(): Promise<Country[]> {
    const response = await axios.get(`${API_BASE_URL}/users/countries/remittance`, { withCredentials: true });
    return response.data;
  },

    // 은행 리스트 조회 (currencyCode 파라미터)
    async getBanks(currencyCode: string): Promise<{ bankCode: string; name: string }[]> {
      const response = await axios.get(`${API_BASE_URL}/users/banks/currency_bank_info`, {
        params: { currencyCode },
        withCredentials: true,
      });
      return response.data;
    },

  // 내 은행/계좌 정보 조회
  async getMyBankAccount(): Promise<MyBankAccount | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/banks`, { withCredentials: true });
      return response.data;
    } catch (e) {
      return null;
    }
  },

  // 내 은행/계좌 정보 저장/수정
  async saveMyBankAccount(params: { bankCode:string, accountNumber:string }): Promise<void> {
    await axios.post(`${API_BASE_URL}/users/banks`, params, { withCredentials: true });
  },

  // 송금 생성
  async createRemittance(remittanceData: any): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/users/remittances`, remittanceData, {
      withCredentials: true,
    });
    return response.data;
  },

  // 송금 상세 조회
  async getRemittanceDetail(remittanceId: number): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/users/remittances/detail/${remittanceId}`, {
      withCredentials: true
    });
    return response.data;
  },

  // 송금 내역 검색 (페이징 포함)
  async searchRemittanceHistory(params: {
    recipient?: string;
    currency?: string;
    status?: string;
    minAmount?: string;
    maxAmount?: string;
    startDate?: string;
    endDate?: string;
    sortOrder?: string;
    page?: number;
    size?: number;
  }): Promise<{
    content: any[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const response = await axios.post(`${API_BASE_URL}/users/remittances/history`, params, {
      withCredentials: true,
    });
    return response.data;
  },

  async getUserRemittanceLimit(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/remittances/user-limit`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('사용자 송금 한도 조회 실패:', error);
      throw error;
    }
  },

  // 한도 변경 신청 API
  async createRemittanceLimitRequest(data: FormData): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/users/remittances/limit-requests`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    return response.data;
  },

  async updateRemittanceLimitRequest(requestId: number, data: FormData, isRerequest: boolean = false): Promise<any> {
    // isRerequest 파라미터를 FormData에 추가
    data.append('isRerequest', isRerequest.toString());
    
    const response = await axios.put(`${API_BASE_URL}/users/remittances/${requestId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    return response.data;
  },

  async getUserRemittanceLimitRequests(): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/users/remittances/limit-requests-info`, { withCredentials: true });
    return response.data;
  },

  // 신청 취소
  async cancelRemittanceLimitRequest(requestId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/users/remittances/${requestId}`, {
        withCredentials: true
      });
    } catch (error) {
      console.error('한도 변경 신청 취소 실패:', error);
      throw error;
    }
  },

  // 송금 한도 체크
  async checkRemittanceLimit( amount: number): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/remittances/check-limit`, {
        amount
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('송금 한도 체크 실패:', error);
      throw error;
    }
  },

  // 공지사항 관련 API
  async searchNotices(searchRequest: any): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/notices/search`, searchRequest, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('공지사항 검색 실패:', error);
      throw error;
    }
  },
  
  async incrementNoticeViewCount(noticeId: number): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/notices/${noticeId}/increment-view`, {}, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('공지사항 조회수 증가 실패:', error);
      throw error;
    }
  },

  // 환율 조회
  async getExchangeRates(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/exchange/exchangeRates`, { 
        withCredentials: true 
      });
      return response.data;
    } catch (error) {
      console.error('환율 조회 실패:', error);
      throw error;
    }
  },

  // 파일 다운로드
  async downloadFile(fileId: number): Promise<void> {
    try {
      // 먼저 파일 정보를 가져와서 파일명을 확보
      let filename = 'download';
      try {
        const fileInfoResponse = await axios.get(`${API_BASE_URL}/files/${fileId}/info`, {
          withCredentials: true
        });
        if (fileInfoResponse.data && fileInfoResponse.data.originalName) {
          filename = fileInfoResponse.data.originalName;
          console.log('Filename from file info:', filename);
        }
      } catch (error) {
        console.log('Could not get file info, will try from headers');
      }
      
      const response = await axios.get(`${API_BASE_URL}/files/${fileId}/download`, {
        responseType: 'blob',
        withCredentials: true
      });
      
      // 디버깅: 실제 헤더 확인
      console.log('Response headers:', response.headers);
      console.log('Content-Disposition:', response.headers['content-disposition']);
      
      // 파일 다운로드 처리
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Content-Disposition 헤더에서 파일명 추출 (이미 파일명이 있으면 덮어쓰지 않음)
      const contentDisposition = response.headers['content-disposition'];
      
      if (contentDisposition && filename === 'download') {
        console.log('Raw Content-Disposition:', contentDisposition);
        
        // 여러 패턴으로 파일명 추출 시도
        const patterns = [
          /filename\*="UTF-8''([^"]+)"/,  // UTF-8 인코딩된 파일명
          /filename="([^"]+)"/,            // 일반 파일명
          /filename=([^;]+)/               // 따옴표 없는 파일명
        ];
        
        for (const pattern of patterns) {
          const match = contentDisposition.match(pattern);
          if (match && match[1]) {
            console.log('Pattern matched:', pattern, 'Value:', match[1]);
            try {
              // URL 디코딩 시도
              filename = decodeURIComponent(match[1]);
              console.log('Decoded filename:', filename);
              break;
            } catch (e) {
              // 디코딩 실패 시 원본 사용
              filename = match[1];
              console.log('Using original filename:', filename);
              break;
            }
          }
        }
      }
      
      // 파일명이 여전히 'download'인 경우, 파일 확장자 추정
      if (filename === 'download') {
        console.log('Filename still "download", trying to extract from Content-Type');
        const contentType = response.headers['content-type'];
        if (contentType) {
          if (contentType.includes('image/')) {
            filename = 'image.' + contentType.split('/')[1];
          } else if (contentType.includes('application/pdf')) {
            filename = 'document.pdf';
          } else if (contentType.includes('text/')) {
            filename = 'document.txt';
          } else {
            filename = 'file.' + contentType.split('/')[1];
          }
        }
      }
      
      console.log('Final filename:', filename);
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      throw error;
    }
  },

  // Qna API
  searchQna: async (request: any) => {
    const response = await axios.post(`${API_BASE_URL}/users/qna/search`, request, {
      withCredentials: true
    });
    return response.data;
  },

  createQna: async (formData: FormData) => {
    const response = await axios.post(`${API_BASE_URL}/users/qna`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true
    });
    return response.data;
  },

  updateQna: async (qnaId: number, formData: FormData) => {
    const response = await axios.put(`${API_BASE_URL}/users/qna/${qnaId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true
    });
    return response.data;
  },

  cancelQna: async (qnaId: number) => {
    const response = await axios.post(`${API_BASE_URL}/users/qna/${qnaId}/cancel`, {}, {
      withCredentials: true
    });
    return response.data;
  },

  // Notice API
  getNoticeById: async (id: number) => {
    const response = await axios.get(`${API_BASE_URL}/users/notices/${id}`, {
      withCredentials: true
    });
    return response.data;
  },

  // Qna API
  getQnaById: async (qnaId: number) => {
    const response = await axios.get(`${API_BASE_URL}/users/qna/${qnaId}`, {
      withCredentials: true
    });
    return response.data;
  },

}; 