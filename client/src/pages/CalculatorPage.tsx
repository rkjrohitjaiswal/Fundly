import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../services/api.js';
import { AppShell } from '../components/AppShell.js';
import { PaymentSchedule } from '../components/PaymentSchedule.js';
import { PaymentScheduleItem } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';
import { Calculator, ArrowRight, Loader2, DollarSign, Calendar, Percent } from 'lucide-react';

export const CalculatorPage: React.FC = () => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState<number>(50000);
  const [interestRate, setInterestRate] = useState<number>(6.5);
  const [duration, setDuration] = useState<number>(12);
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');

  const [calculating, setCalculating] = useState(false);
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

  useEffect(() => {
    let isCurrent = true;
    async function calculate() {
      if (amount <= 0 || duration <= 0) return;
      setCalculating(true);
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
      } catch (err) {
        console.error(err);
      } finally {
        if (isCurrent) setCalculating(false);
      }
    }

    const timer = setTimeout(calculate, 200);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [amount, interestRate, duration, frequency]);

  return (
    <AppShell showBack={true} title="Loan Calculator">
      <div id="calculator-screen-content" className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Loan Calculator</h2>
            <p className="text-xs text-slate-500 font-medium">Exact amortization math calculated in real time</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

        {/* Inputs */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Loan Amount</span>
              <span className="font-mono font-black text-slate-900">{formatCurrency(amount)}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Interest Rate</span>
              <span className="font-mono font-bold text-sky-600">{interestRate}% APR (0% allowed)</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="0.25"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Duration</span>
              <span className="font-mono font-black text-slate-900">{duration} Months</span>
            </div>
            <input
              type="range"
              min="1"
              max="48"
              step="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Payment Frequency
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['weekly', 'biweekly', 'monthly'] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFrequency(freq)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                    frequency === freq
                      ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculation Result Dashboard */}
        {calcResult && (
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Amortization Summary
              </span>
              {calculating && <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Installment</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {formatCurrency(calcResult.paymentAmount)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">/ {calcResult.frequency}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Repayment</span>
                <span className="text-2xl font-black text-sky-600 font-mono">
                  {formatCurrency(calcResult.totalRepayment)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Total Int: {formatCurrency(calcResult.totalInterest)}
                </span>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/create-loan?role=lender&amount=${amount}&interest=${interestRate}&duration=${duration}`
                  )
                }
                className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold text-center transition-colors shadow-sm shadow-sky-500/10"
              >
                Offer this Loan
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/create-loan?role=borrower&amount=${amount}&interest=${interestRate}&duration=${duration}`
                  )
                }
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-colors"
              >
                Request this Loan
              </button>
            </div>

            {/* Repayment Schedule */}
            <div className="pt-2">
              <PaymentSchedule schedule={calcResult.paymentSchedule} compact={true} />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
