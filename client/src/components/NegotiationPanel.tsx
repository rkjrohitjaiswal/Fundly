import React, { useState, useEffect } from 'react';
import { Loan, LoanNegotiation } from '../types/index.js';
import { loanService, negotiationService } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';
import { Clock, ShieldAlert, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface NegotiationPanelProps {
  loan: Loan;
  initialSecondsLeft: number;
  latestNegotiation?: LoanNegotiation;
  currentUserId?: string;
  onNegotiationSubmitted: () => void;
  onFinalize: () => void;
}

export const NegotiationPanel: React.FC<NegotiationPanelProps> = ({
  loan,
  initialSecondsLeft,
  latestNegotiation,
  currentUserId,
  onNegotiationSubmitted,
  onFinalize,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSecondsLeft);
  const [proposedRate, setProposedRate] = useState<number>(loan.interestRate);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [previewing, setPreviewing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [preview, setPreview] = useState<{
    paymentAmount: number;
    totalInterest: number;
    totalRepayment: number;
  } | null>(null);

  // Check if current user submitted the latest offer
  const lastProposedBy = latestNegotiation?.proposedBy;
  const lastProposedId =
    typeof lastProposedBy === 'object' && lastProposedBy !== null
      ? lastProposedBy._id
      : lastProposedBy;
  const isMyTurn = currentUserId ? lastProposedId?.toString() !== currentUserId : true;

  // Countdown timer synced with backend duration
  useEffect(() => {
    setSecondsLeft(initialSecondsLeft);
    if (initialSecondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinalize(); // Auto-finalize when timer hits 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialSecondsLeft]);

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Preview recalculated terms whenever proposed rate changes
  useEffect(() => {
    let active = true;
    async function calculatePreview() {
      const diff = Math.abs(proposedRate - loan.interestRate);
      if (diff > 2.01) {
        setErrorMsg('Interest rate adjustment cannot exceed 2.0 percentage points per turn.');
        return;
      }
      setErrorMsg(null);
      setPreviewing(true);
      try {
        const res = await loanService.calculatePreview({
          amount: loan.amount,
          interestRate: proposedRate,
          duration: loan.duration,
          frequency: loan.frequency,
        });
        if (active && res.success && res.data) {
          setPreview({
            paymentAmount: res.data.paymentAmount,
            totalInterest: res.data.totalInterest,
            totalRepayment: res.data.totalRepayment,
          });
        }
      } catch (err: any) {
        if (active) setErrorMsg(err.response?.data?.message || 'Preview error');
      } finally {
        if (active) setPreviewing(false);
      }
    }

    const t = setTimeout(calculatePreview, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [proposedRate, loan.interestRate]);

  const handleQuickAdjust = (delta: number) => {
    const newRate = Math.max(0, Math.round((proposedRate + delta) * 10) / 10);
    if (Math.abs(newRate - loan.interestRate) <= 2.0) {
      setProposedRate(newRate);
    }
  };

  const handleSubmitCounter = async () => {
    if (!isMyTurn) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await negotiationService.createCounterOffer(loan._id, {
        interestRate: proposedRate,
      });
      onNegotiationSubmitted();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit counter-offer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="bargaining-controller-panel"
      className="rounded-3xl bg-white border border-slate-200 p-4 space-y-4 shadow-sm"
    >
      {/* 24H AUTHORITATIVE COUNTDOWN BANNER */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-50 border border-sky-200">
        <div className="flex items-center gap-2 text-sky-800">
          <Clock className="w-4 h-4 text-sky-600 animate-spin-slow" />
          <span className="text-xs font-bold uppercase tracking-wider">
            24h Bargaining Window
          </span>
        </div>
        <div className="font-mono text-sm font-black text-sky-900 tracking-wider">
          {formatCountdown(secondsLeft)}
        </div>
      </div>

      {!isMyTurn ? (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
          <p className="text-xs font-bold text-slate-800">Counter-Offer Transmitted</p>
          <p className="text-[11px] text-slate-500 font-medium">
            Awaiting response or counter-offer from the counterparty.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Adjust Interest Rate
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Max ±2.0% per offer</span>
          </div>

          {/* Quick Adjustment Pills */}
          <div className="grid grid-cols-4 gap-2">
            {[-1.0, -0.5, +0.5, +1.0].map((delta) => {
              const target = Math.max(0, Math.round((proposedRate + delta) * 10) / 10);
              const allowed = Math.abs(target - loan.interestRate) <= 2.0;
              return (
                <button
                  key={delta}
                  type="button"
                  disabled={!allowed}
                  onClick={() => handleQuickAdjust(delta)}
                  className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-xs font-mono font-bold text-slate-700 transition-colors"
                >
                  {delta > 0 ? `+${delta}%` : `${delta}%`}
                </button>
              );
            })}
          </div>

          {/* Precise Input */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                max="40"
                step="0.1"
                value={proposedRate}
                onChange={(e) => setProposedRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                %
              </span>
            </div>

            <div className="text-right text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Current</span>
              <span className="font-bold text-slate-800 font-mono">{loan.interestRate}%</span>
            </div>
          </div>

          {/* Recalculated Preview Comparison */}
          {preview && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Proposed Installment:</span>
                <span className="font-bold font-mono text-slate-900">
                  {formatCurrency(preview.paymentAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Total Repayment:</span>
                <span className="font-bold font-mono text-sky-600">
                  {formatCurrency(preview.totalRepayment)}
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onFinalize}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Lock terms into Final Offer immediately"
            >
              Lock Final Offer
            </button>

            <button
              type="button"
              disabled={submitting || previewing || !!errorMsg}
              onClick={handleSubmitCounter}
              className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-sky-500/10"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Propose Counter-Offer</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
