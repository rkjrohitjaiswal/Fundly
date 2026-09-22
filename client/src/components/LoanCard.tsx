import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loan, User } from '../types/index.js';
import { StatusBadge } from './StatusBadge.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import { Calendar, ChevronRight, User as UserIcon, Clock } from 'lucide-react';

interface LoanCardProps {
  loan: Loan;
  currentUserId?: string;
  onClick?: () => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({ loan, currentUserId, onClick }) => {
  const navigate = useNavigate();

  const lender = loan.lenderId as User;
  const borrower = loan.borrowerId as User;

  const isLender = currentUserId ? (lender?._id || lender)?.toString() === currentUserId : true;
  const counterparty = isLender ? borrower : lender;
  const counterpartyName = counterparty?.displayName || 'Peer User';

  // Calculate progress %
  const total = loan.totalRepayment || loan.amount;
  const settled = isLender ? (loan.recoveredAmount || 0) : (loan.repaidAmount || 0);
  const progressPercent = total > 0 ? Math.min(100, Math.round((settled / total) * 100)) : 0;

  // Next payment info
  const nextPayment = loan.paymentSchedule?.find((s) => s.status === 'pending');
  const nextDueDate = nextPayment?.dueDate ? formatDate(nextPayment.dueDate) : 'None';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/loan/${loan._id}`);
    }
  };

  return (
    <div
      id={`loan-card-${loan._id}`}
      onClick={handleClick}
      className="group cursor-pointer rounded-2xl bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-sky-300 p-4 transition-all duration-150 active:scale-[0.99] space-y-3 shadow-xs hover:shadow-sm"
    >
      {/* Header: Badges & Counterparty */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={loan.status} size="sm" />
          <StatusBadge relationship={loan.relationshipType} size="sm" />
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500">
          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800 truncate max-w-[120px]">
            {counterpartyName}
          </span>
          <span className="text-[10px] text-slate-400">
            ({isLender ? 'Borrower' : 'Lender'})
          </span>
        </div>
      </div>

      {/* Main Figures: Amount & Remaining */}
      <div className="flex items-baseline justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {isLender ? 'Principal Lent' : 'Principal Borrowed'}
          </span>
          <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
            {formatCurrency(loan.amount)}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Remaining
          </span>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            {formatCurrency(loan.remainingAmount || 0)}
          </div>
        </div>
      </div>

      {/* Progress Bar (for active/completed) */}
      {loan.status === 'ACTIVE' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Progress: {progressPercent}%</span>
            <span>
              {isLender ? 'Recovered' : 'Repaid'}: {formatCurrency(settled)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Footer Info: Next payment date or Bargaining indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        {loan.status === 'ACTIVE' ? (
          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Next: {nextPayment ? `${formatCurrency(nextPayment.amount)} due ${nextDueDate}` : 'Fully settled'}
            </span>
          </div>
        ) : loan.status === 'BARGAINING' || loan.status === 'PENDING' ? (
          <div className="flex items-center gap-1.5 text-sky-700 text-[11px] font-medium">
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            <span>24h Bargaining window open</span>
          </div>
        ) : loan.status === 'FINAL OFFER' ? (
          <div className="flex items-center gap-1.5 text-purple-700 text-[11px] font-semibold">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>Final Offer: Take it or leave it</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 truncate max-w-[180px]">{loan.purpose}</span>
        )}

        <div className="flex items-center gap-0.5 text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform">
          <span>View</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
