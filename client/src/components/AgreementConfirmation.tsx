import React, { useState } from 'react';
import { Loan, User } from '../types/index.js';
import { PaymentSchedule } from './PaymentSchedule.js';
import { formatCurrency } from '../utils/format.js';
import { ShieldCheck, Check, AlertCircle, Loader2, X } from 'lucide-react';

interface AgreementConfirmationProps {
  loan: Loan;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const AgreementConfirmation: React.FC<AgreementConfirmationProps> = ({
  loan,
  onConfirm,
  onClose,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lender = loan.lenderId as User;
  const borrower = loan.borrowerId as User;

  const handleActivate = async () => {
    if (!agreed) {
      setErrorMsg('You must check the agreement confirmation checkbox before proceeding.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to activate loan agreement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="agreement-confirmation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-3xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Loan Agreement Confirmation</h3>
              <span className="text-[10px] text-slate-500 font-medium">
                Formal Peer-to-Peer Binding Terms
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Agreement summary banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Lender:</span>
            <span className="font-bold text-slate-900">{lender?.displayName || 'Lender'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Borrower:</span>
            <span className="font-bold text-slate-900">{borrower?.displayName || 'Borrower'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Principal Amount:</span>
            <span className="font-bold text-slate-900 font-mono">
              {formatCurrency(loan.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Fixed Interest Rate:</span>
            <span className="font-bold text-sky-600 font-mono">{loan.interestRate}% APR</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Term:</span>
            <span className="font-bold text-slate-900">
              {loan.duration} months ({loan.frequency})
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200 font-medium">
            <span className="text-slate-700 font-bold">Total Repayment:</span>
            <span className="font-black text-slate-900 font-mono">
              {formatCurrency(loan.totalRepayment)}
            </span>
          </div>
        </div>

        {/* Repayment Schedule */}
        <div className="max-h-48 overflow-y-auto pr-1">
          <PaymentSchedule schedule={loan.paymentSchedule} compact={false} />
        </div>

        {/* Legal notice */}
        <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 text-[11px] text-slate-600 space-y-1 leading-relaxed">
          <p className="font-bold text-sky-800">Immutable Financial Commitment:</p>
          <p>
            By accepting, all bargaining is concluded and loan parameters are permanently locked.
            Repayments will track automatically until the balance reaches zero.
          </p>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
          <input
            id="agreement-checkbox"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-sky-500/20"
          />
          <span className="text-xs text-slate-700 font-medium leading-snug">
            I have reviewed the payment schedule and legally agree to these peer-to-peer loan terms.
          </span>
        </label>

        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Review Later
          </button>

          <button
            id="activate-loan-btn"
            type="button"
            disabled={!agreed || submitting}
            onClick={handleActivate}
            className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-sky-500/20"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Activating...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Activate Loan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
