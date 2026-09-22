import React from 'react';
import { LoanNegotiation, User } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';
import { Clock, User as UserIcon } from 'lucide-react';

interface NegotiationHistoryProps {
  negotiations: LoanNegotiation[];
  currentUserId?: string;
}

export const NegotiationHistory: React.FC<NegotiationHistoryProps> = ({
  negotiations,
  currentUserId,
}) => {
  if (!negotiations || negotiations.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
        No bargaining history recorded yet.
      </div>
    );
  }

  return (
    <div id="negotiation-history-thread" className="space-y-3">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>Bargaining Proposal History</span>
      </h4>

      <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {negotiations.map((item, index) => {
          const proposedBy = item.proposedBy as User;
          const isMe = currentUserId
            ? (proposedBy?._id || proposedBy)?.toString() === currentUserId
            : false;
          const isLatest = index === negotiations.length - 1;

          return (
            <div key={item._id || index} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-2 w-3 h-3 rounded-full border-2 ${
                  isLatest
                    ? 'bg-sky-500 border-white ring-2 ring-sky-300'
                    : 'bg-slate-300 border-white'
                }`}
              />

              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  isLatest
                    ? 'bg-sky-50/50 border-sky-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isMe ? 'You' : proposedBy?.displayName || 'Counterparty'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {index === 0 ? '(Initial Offer)' : `(Proposal #${index + 1})`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Rate
                    </span>
                    <span className="font-bold text-sky-600 font-mono text-sm">
                      {item.interestRate}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Installment
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {formatCurrency(item.paymentAmount)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Total
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(item.totalRepayment)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
