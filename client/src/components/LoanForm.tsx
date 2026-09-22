import React, { useState, useEffect } from 'react';
import { loanService } from '../services/api.js';
import { PaymentSchedule } from './PaymentSchedule.js';
import { PaymentScheduleItem } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';
import { Calculator, AlertCircle, ArrowRight, Loader2, Check } from 'lucide-react';

interface LoanFormProps {
  role: 'lender' | 'borrower';
  counterpartyId: string;
  counterpartyName: string;
  relationshipType: 'friend' | 'stranger';
  initialAmount?: number;
  initialInterest?: number;
  initialDuration?: number;
  initialFrequency?: 'weekly' | 'biweekly' | 'monthly';
  initialPurpose?: string;
  onSubmit: (formData: {
    amount: number;
    interestRate: number;
    duration: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    purpose: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export const LoanForm: React.FC<LoanFormProps> = ({
  role,
  counterpartyId,
  counterpartyName,
  relationshipType,
  initialAmount = 10000,
  initialInterest = 5.0,
  initialDuration = 6,
  initialFrequency = 'monthly',
  initialPurpose = '',
  onSubmit,
  onCancel,
}) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [interestRate, setInterestRate] = useState<number>(initialInterest);
  const [duration, setDuration] = useState<number>(initialDuration);
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>(initialFrequency);
  const [purpose, setPurpose] = useState<string>(initialPurpose);

  // Calculation state from authoritative backend
  const [calculating, setCalculating] = useState<boolean>(false);
  const [calcResult, setCalcResult] = useState<{
    principal: number;
    interestRate: number;
    duration: number;
    frequency: string;
    numberOfPayments: number;
    paymentAmount: number;
    totalInterest: number;
    totalRepayment: number;
    paymentSchedule: PaymentScheduleItem[];
  } | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Calculate deterministically whenever inputs change
  useEffect(() => {
    let isCurrent = true;

    async function fetchCalculation() {
      if (amount <= 0 || duration <= 0) {
        setCalcResult(null);
        return;
      }
      setCalculating(true);
      setCalcError(null);
      try {
        const res = await loanService.calculatePreview({
          amount,
          interestRate: Math.max(0, interestRate),
          duration,
          frequency,
        });
        if (isCurrent && res.success && res.data) {
          setCalcResult(res.data);
        }
      } catch (err: any) {
        if (isCurrent) {
          setCalcError(err.response?.data?.message || 'Calculation error');
        }
      } finally {
        if (isCurrent) setCalculating(false);
      }
    }

    const timer = setTimeout(fetchCalculation, 250);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [amount, interestRate, duration, frequency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      alert('Please specify a purpose for this loan.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        amount,
        interestRate,
        duration,
        frequency,
        purpose: purpose.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id="loan-creator-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Target Party Banner */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {role === 'lender' ? 'Offering to Lend To' : 'Requesting to Borrow From'}
          </span>
          <span className="font-bold text-slate-900 text-sm">{counterpartyName}</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            relationshipType === 'friend'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-sky-50 text-sky-700 border border-sky-200'
          }`}
        >
          {relationshipType === 'friend' ? 'Circle Friend' : 'Stranger'}
        </span>
      </div>

      {/* Amount Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Loan Amount (INR)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-lg font-bold">
            ₹
          </span>
          <input
            id="loan-amount-input"
            type="number"
            min="100"
            max="10000000"
            step="100"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xl font-black font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white shadow-xs transition-colors"
            required
          />
        </div>
      </div>

      {/* Interest Rate & Duration Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Interest Rate
            </label>
            <span className="text-[10px] text-slate-400 font-mono">(0% allowed)</span>
          </div>
          <div className="relative">
            <input
              id="loan-interest-input"
              type="number"
              min="0"
              max="40"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white shadow-xs transition-colors"
              required
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
              %
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Duration (Months)
          </label>
          <input
            id="loan-duration-input"
            type="number"
            min="1"
            max="60"
            step="1"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white shadow-xs transition-colors"
            required
          />
        </div>
      </div>

      {/* Payment Frequency */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Payment Frequency
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['weekly', 'biweekly', 'monthly'] as const).map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setFrequency(freq)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize border transition-all ${
                frequency === freq
                  ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      {/* Purpose */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Purpose of Loan
        </label>
        <textarea
          id="loan-purpose-input"
          rows={2}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="e.g. Working capital, project gear, urgent expense..."
          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white shadow-xs transition-colors resize-none"
          required
        />
      </div>

      {/* EXACT FINANCIAL RESULTS CARD (MANDATORY BEFORE SENDING) */}
      <div className="rounded-3xl bg-sky-50/60 border border-sky-200/80 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-sky-800 uppercase tracking-wider">
            <Calculator className="w-4 h-4 text-sky-600" />
            <span>Authoritative Calculation Review</span>
          </div>
          {calculating && <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />}
        </div>

        {calcResult && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-white border border-sky-100 shadow-3xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Installment
                </span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {formatCurrency(calcResult.paymentAmount)}
                </span>
                <span className="text-[10px] text-slate-500 block">/ {calcResult.frequency}</span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-sky-100 shadow-3xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Total Repayment
                </span>
                <span className="text-base font-black text-sky-700 font-mono">
                  {formatCurrency(calcResult.totalRepayment)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  (incl. {formatCurrency(calcResult.totalInterest)} interest)
                </span>
              </div>
            </div>

            {/* Repayment schedule breakdown */}
            <div className="pt-2 border-t border-sky-200/50">
              <PaymentSchedule schedule={calcResult.paymentSchedule} compact={true} />
            </div>
          </div>
        )}

        {calcError && (
          <div className="flex items-center gap-2 text-xs text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{calcError}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          id="send-loan-proposal-btn"
          type="submit"
          disabled={submitting || !calcResult || calculating}
          className="flex-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-sky-500/20"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transmitting Terms...</span>
            </>
          ) : (
            <>
              <span>{role === 'lender' ? 'Send Lending Offer' : 'Send Borrow Request'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
