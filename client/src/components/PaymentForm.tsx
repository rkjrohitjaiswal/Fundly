import React, { useState } from 'react';
import { Loan } from '../types/index.js';
import { paymentService } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';
import { DollarSign, ShieldCheck, CreditCard, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface PaymentFormProps {
  loan: Loan;
  onPaymentSuccess: () => void;
  onCancel?: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  loan,
  onPaymentSuccess,
  onCancel,
}) => {
  const nextPayment = loan.paymentSchedule?.find((s) => s.status === 'pending');
  const suggestedAmount = nextPayment ? nextPayment.amount : Math.min(1000, loan.remainingAmount);

  const [paymentAmount, setPaymentAmount] = useState<number>(suggestedAmount);
  const [paymentMethod, setPaymentMethod] = useState<string>('Fundly Instant Settlement');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const remainingAfterPayment = Math.max(
    0,
    Math.round((loan.remainingAmount - (paymentAmount || 0)) * 100) / 100
  );

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }
    if (paymentAmount > loan.remainingAmount + 0.05) {
      setErrorMsg(
        `Payment amount cannot exceed remaining balance of ${formatCurrency(loan.remainingAmount)}.`
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await paymentService.makePayment(loan._id, {
        amount: paymentAmount,
        paymentMethod,
      });
      onPaymentSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id="repayment-form"
      onSubmit={handlePay}
      className="rounded-3xl bg-white border border-slate-200 p-4 space-y-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-sky-600" />
          <span>Make Repayment</span>
        </h4>
        <span className="text-xs font-mono font-bold text-slate-900">
          Remaining: {formatCurrency(loan.remainingAmount)}
        </span>
      </div>

      {/* Suggested amount buttons */}
      <div className="grid grid-cols-3 gap-2">
        {nextPayment && (
          <button
            type="button"
            onClick={() => setPaymentAmount(nextPayment.amount)}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
              paymentAmount === nextPayment.amount
                ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Due: {formatCurrency(nextPayment.amount)}
          </button>
        )}
        <button
          type="button"
          onClick={() => setPaymentAmount(Math.round(loan.remainingAmount / 2))}
          className="py-1.5 px-2 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all"
        >
          50%: {formatCurrency(Math.round(loan.remainingAmount / 2))}
        </button>
        <button
          type="button"
          onClick={() => setPaymentAmount(loan.remainingAmount)}
          className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
            paymentAmount === loan.remainingAmount
              ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          Full Payoff
        </button>
      </div>

      {/* Amount input */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
          Payment Amount (INR)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base font-bold">
            ₹
          </span>
          <input
            id="repayment-amount-input"
            type="number"
            min="1"
            max={loan.remainingAmount}
            step="1"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
            required
          />
        </div>
      </div>

      {/* Remaining after payment preview */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Remaining After Payment:</span>
        <span className="font-mono font-bold text-slate-900 text-sm">
          {formatCurrency(remainingAfterPayment)}
        </span>
      </div>

      {/* Payment Method selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
          Payment Method
        </label>
        <select
          id="payment-method-select"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 focus:bg-white"
        >
          <option value="Fundly Instant Settlement">Fundly Instant Wallet Settlement</option>
          <option value="UPI / Instant Bank Transfer">UPI / Instant Bank Transfer</option>
          <option value="Debit Card Instant Settlement">Debit Card Instant Settlement</option>
        </select>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          id="confirm-repayment-btn"
          type="submit"
          disabled={submitting || paymentAmount <= 0}
          className="flex-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-sky-500/10"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Settling Repayment...</span>
            </>
          ) : (
            <>
              <span>Confirm Repayment of {formatCurrency(paymentAmount)}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
