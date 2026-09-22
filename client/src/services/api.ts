import axios from 'axios';
import {
  ApiResponse,
  User,
  Loan,
  LoanPayment,
  LoanNegotiation,
  NotificationItem,
  FinancialMetricsSummary,
  ActiveFriendItem,
  PendingFriendItem,
  MarketplaceListing,
} from '../types/index.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept to add token from localStorage if cookie is unavailable in cross-origin preview
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fundly_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (import.meta.env.DEV || true) {
    console.log(`[Fundly API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Intercept responses for helpful logging and debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.warn(
        `[Fundly API] Response Error ${error.response.status} from ${error.config?.url}:`,
        error.response.data?.message || error.response.statusText
      );
    } else if (error.request) {
      console.error(`[Fundly API] Network Timeout or No Response from ${error.config?.url}:`, error.message);
    } else {
      console.error('[Fundly API] Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(data: { displayName: string; email: string; password: string }) {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    if (res.data.data?.token) {
      localStorage.setItem('fundly_token', res.data.data.token);
    }
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data);
    if (res.data.data?.token) {
      localStorage.setItem('fundly_token', res.data.data.token);
    }
    return res.data;
  },

  async logout() {
    localStorage.removeItem('fundly_token');
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/logout');
    return res.data;
  },

  async getMe() {
    const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data;
  },
};

export const userService = {
  async search(query: string, context: 'stranger' | 'friend' | 'all' = 'all') {
    const res = await api.get<ApiResponse<User[]>>('/users/search', {
      params: { q: query, context },
    });
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data;
  },
};

export const friendService = {
  async getFriends() {
    const res = await api.get<
      ApiResponse<{
        activeFriends: ActiveFriendItem[];
        pendingFriends: PendingFriendItem[];
      }>
    >('/friends');
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get<
      ApiResponse<{
        friend: User;
        metrics: {
          lending: { totalLent: number; totalRecovered: number; remaining: number };
          borrowing: { totalBorrowed: number; totalRepaid: number; remaining: number };
        };
        loans: Loan[];
      }>
    >(`/friends/${id}`);
    return res.data;
  },

  async invite(data: { targetUserId?: string; email?: string; code?: string }) {
    const res = await api.post<ApiResponse<any>>('/friends/invite', data);
    return res.data;
  },

  async accept(connectionId: string) {
    const res = await api.post<ApiResponse<any>>('/friends/accept', { connectionId });
    return res.data;
  },

  async decline(connectionId: string) {
    const res = await api.post<ApiResponse<any>>('/friends/decline', { connectionId });
    return res.data;
  },

  async remove(friendId: string) {
    const res = await api.delete<ApiResponse<any>>(`/friends/${friendId}`);
    return res.data;
  },
};

export const loanService = {
  async calculatePreview(data: {
    amount: number;
    interestRate: number;
    duration: number;
    frequency: string;
    startDate?: string;
  }) {
    const res = await api.post<ApiResponse<any>>('/loans/calculate', data);
    return res.data;
  },

  async create(data: {
    role: 'lender' | 'borrower';
    counterpartyId: string;
    relationshipType: 'friend' | 'stranger';
    amount: number;
    interestRate: number;
    duration: number;
    frequency: string;
    purpose: string;
  }) {
    const res = await api.post<ApiResponse<Loan>>('/loans', data);
    return res.data;
  },

  async getLoans(params?: {
    status?: string;
    type?: string;
    relationship?: string;
    marketplace?: boolean;
  }) {
    const res = await api.get<
      ApiResponse<{
        loans: Loan[];
        allActiveLoans: Loan[];
        allPendingLoans: Loan[];
        summary: FinancialMetricsSummary;
      }>
    >('/loans', { params });
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get<
      ApiResponse<{
        loan: Loan;
        isLender: boolean;
        isBorrower: boolean;
        counterparty: User;
        negotiations: LoanNegotiation[];
        bargainingSecondsLeft: number;
        isBargainingAvailable: boolean;
      }>
    >(`/loans/${id}`);
    return res.data;
  },

  async accept(id: string) {
    const res = await api.post<ApiResponse<{ loan: Loan; message: string }>>(`/loans/${id}/accept`);
    return res.data;
  },

  async decline(id: string) {
    const res = await api.post<ApiResponse<{ loan: Loan; message: string }>>(`/loans/${id}/decline`);
    return res.data;
  },

  async cancel(id: string) {
    const res = await api.post<ApiResponse<{ loan: Loan; message: string }>>(`/loans/${id}/cancel`);
    return res.data;
  },
};

export const negotiationService = {
  async getNegotiations(loanId: string) {
    const res = await api.get<ApiResponse<LoanNegotiation[]>>(`/loans/${loanId}/negotiations`);
    return res.data;
  },

  async createCounterOffer(
    loanId: string,
    data: { interestRate: number; duration?: number; frequency?: string }
  ) {
    const res = await api.post<
      ApiResponse<{ loan: Loan; negotiation: LoanNegotiation; message: string }>
    >(`/loans/${loanId}/negotiations`, data);
    return res.data;
  },

  async finalize(loanId: string) {
    const res = await api.post<ApiResponse<{ loan: Loan; message: string }>>(
      `/loans/${loanId}/finalize`
    );
    return res.data;
  },
};

export const paymentService = {
  async getPayments(loanId: string) {
    const res = await api.get<ApiResponse<LoanPayment[]>>(`/loans/${loanId}/payments`);
    return res.data;
  },

  async makePayment(
    loanId: string,
    data: { amount: number; paymentMethod?: string }
  ) {
    const res = await api.post<
      ApiResponse<{
        payment: LoanPayment;
        loan: Loan;
        isCompleted: boolean;
        message: string;
      }>
    >(`/loans/${loanId}/payments`, data);
    return res.data;
  },
};

export const notificationService = {
  async getNotifications() {
    const res = await api.get<
      ApiResponse<{
        notifications: NotificationItem[];
        unreadCount: number;
      }>
    >('/notifications');
    return res.data;
  },

  async markAsRead(id: string) {
    const res = await api.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
    return res.data;
  },
};

export const marketplaceService = {
  async getLendingOffers() {
    const res = await api.get<ApiResponse<MarketplaceListing[]>>('/marketplace/lending');
    return res.data;
  },

  async getBorrowingRequests() {
    const res = await api.get<ApiResponse<MarketplaceListing[]>>('/marketplace/borrowing');
    return res.data;
  },
};

export default api;
