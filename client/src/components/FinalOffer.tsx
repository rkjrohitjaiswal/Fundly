import React from 'react';
import { Loan } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';
import { ShieldCheck, XCircle, Lock, Loader2 } from 'lucide-react';

interface FinalOfferProps {
  loan: Loan;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing?: boolean;
}

export const FinalOffer: React.FC<FinalOfferProps> = ({
  loan,
  onAccept,
  onDecline,
  isProcessing = false,
}) => {
  return (
    <div
      id="final-offer-card"
      className="rounded-3xl bg-white border border-slate-200 p-4 space-y-4 shadow-sm"
    >
      {/* Banner */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">Final Offer Reached</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
              Take it or leave it
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Bargaining is permanently locked. No further counter-offers can be made.
          </p>
        </div>
      </div>

      {/* Locked Terms Card */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-600 font-medium">
          <span>Principal:</span>
          <span className="font-bold text-slate-900 font-mono">
            {formatCurrency(loan.amount)}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-600 font-medium">
          <span>Final Rate:</span>
          <span className="font-bold text-sky-600 font-mono">{loan.interestRate}%</span>
        </div>
        <div className="flex justify-between items-center text-slate-600 font-medium">
          <span>Duration:</span>
          <span className="font-bold text-slate-900">
            {loan.duration} months ({loan.frequency})
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-200">
          <span className="font-semibold text-slate-700">Total Repayment:</span>
          <span className="font-bold text-slate-900 font-mono text-sm">
            {formatCurrency(loan.totalRepayment)}
          </span>
        </div>
      </div>

      {/* Accept / Decline actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          disabled={isProcessing}
          onClick={onDecline}
          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          <span>Decline Offer</span>
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={onAccept}
          className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-sky-500/10 active:scale-[0.98] disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Accept Offer</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
