import React, { useState } from 'react';
import { PaymentScheduleItem } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';
import { Calendar, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface PaymentScheduleProps {
  schedule: PaymentScheduleItem[];
  compact?: boolean;
}

export const PaymentSchedule: React.FC<PaymentScheduleProps> = ({
  schedule,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (!schedule || schedule.length === 0) {
    return <p className="text-xs text-slate-400 italic py-2">No payment schedule available.</p>;
  }

  const itemsToShow = isExpanded ? schedule : schedule.slice(0, 3);

  return (
    <div id="payment-schedule-container" className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Payment Schedule ({schedule.length} installments)
        </h4>

        {compact && schedule.length > 3 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
          >
            <span>{isExpanded ? 'Show Less' : `View All (${schedule.length})`}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
        {itemsToShow.map((item) => {
          const isPaid = item.status === 'paid';
          const dueDateFormatted = new Date(item.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div
              key={item.paymentNumber}
              className={`p-3 flex items-center justify-between text-xs transition-colors ${
                isPaid ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  #{item.paymentNumber}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>{dueDateFormatted}</span>
                    {isPaid && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Paid</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Prin: {formatCurrency(item.principal)} • Int: {formatCurrency(item.interest)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold font-mono text-slate-900">
                  {formatCurrency(item.amount)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Bal: {formatCurrency(item.remainingBalance)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
