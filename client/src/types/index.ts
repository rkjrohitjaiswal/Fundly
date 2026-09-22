export type LoanStatus =
  | 'PENDING'
  | 'BARGAINING'
  | 'FINAL OFFER'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED';

export type RelationshipType = 'friend' | 'stranger';

export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface User {
  _id: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  isFriend?: boolean;
  isSelf?: boolean;
  financialSummary?: {
    activeLoanCount: number;
    completedLoanCount: number;
  };
  createdAt?: string;
}

export interface PaymentScheduleItem {
  paymentNumber: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Loan {
  _id: string;
  lenderId: User | string;
  borrowerId: User | string;
  relationshipType: RelationshipType;
  amount: number;
  interestRate: number;
  duration: number;
  frequency: PaymentFrequency;
  purpose: string;
  totalInterest: number;
  totalRepayment: number;
  paymentAmount: number;
  paymentSchedule: PaymentScheduleItem[];
  recoveredAmount: number;
  repaidAmount: number;
  remainingAmount: number;
  status: LoanStatus;
  bargainingStartedAt?: string;
  bargainingExpiresAt?: string;
  finalOfferLocked?: boolean;
  finalOfferAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanPayment {
  _id: string;
  loanId: string;
  paidBy: User | string;
  amount: number;
  paidAt: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  paymentMethod?: string;
  createdAt?: string;
}

export interface LoanNegotiation {
  _id: string;
  loanId: string;
  proposedBy: User | string;
  amount: number;
  interestRate: number;
  duration: number;
  frequency: string;
  totalInterest: number;
  totalRepayment: number;
  paymentAmount: number;
  createdAt: string;
}

export interface FriendMetrics {
  totalLent: number;
  totalRecovered: number;
  remaining: number;
}

export interface FriendBorrowMetrics {
  totalBorrowed: number;
  totalRepaid: number;
  remaining: number;
}

export interface ActiveFriendItem {
  connectionId: string;
  user: User;
  status: 'ACTIVE';
  metrics: {
    lending: FriendMetrics;
    borrowing: FriendBorrowMetrics;
  };
  loanCount: number;
}

export interface PendingFriendItem {
  connectionId: string;
  user: User;
  invitedByMe: boolean;
  inviteCode: string;
  status: 'PENDING';
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedLoanId?: string;
  relatedFriendConnectionId?: string;
  relatedNegotiationId?: string;
  read: boolean;
  createdAt: string;
}

export interface FinancialMetricsSummary {
  lending: {
    totalLent: number;
    totalRecovered: number;
    remaining: number;
  };
  borrowing: {
    totalBorrowed: number;
    totalRepaid: number;
    remaining: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

export interface MarketplaceListing {
  id: string;
  anonymousId: string;
  displayName: string;
  type: 'OFFERING' | 'REQUESTED';
  amount: number;
  interestRate: number;
  duration: number;
  frequency: PaymentFrequency;
  monthlyPayment: number;
  purpose: string;
  role: 'lender' | 'borrower';
  createdAt?: string;
}

