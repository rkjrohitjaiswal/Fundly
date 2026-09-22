import React, { useState } from 'react';
import { FinancialMetricsSummary } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface FinancialSummaryProps {
  summary: FinancialMetricsSummary;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ summary }) => {
  const [activeTab, setActiveTab] = useState<'lending' | 'borrowing'>('lending');

  const { lending, borrowing } = summary;

  return (
    <div
      id="financial-summary-card"
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Financial Summary
        </h3>
        <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
          Deterministic Ledger
        </span>
      </div>

      {/* Switcher tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('lending')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'lending'
              ? 'bg-white text-sky-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Lending</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('borrowing')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'borrowing'
              ? 'bg-white text-sky-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Borrowing</span>
        </button>
      </div>

      {activeTab === 'lending' ? (
        <div id="lending-metrics-block" className="space-y-4 animate-in fade-in duration-150">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Lent
            </span>
            <div className="text-3xl font-black tracking-tight text-slate-900 font-mono mt-0.5">
              {formatCurrency(lending.totalLent)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Total Recovered
              </span>
              <div className="text-base font-bold text-emerald-600 font-mono mt-0.5">
                {formatCurrency(lending.totalRecovered)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Remaining
              </span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {formatCurrency(lending.remaining)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div id="borrowing-metrics-block" className="space-y-4 animate-in fade-in duration-150">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Borrowed
            </span>
            <div className="text-3xl font-black tracking-tight text-slate-900 font-mono mt-0.5">
              {formatCurrency(borrowing.totalBorrowed)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Total Repaid
              </span>
              <div className="text-base font-bold text-emerald-600 font-mono mt-0.5">
                {formatCurrency(borrowing.totalRepaid)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Remaining
              </span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {formatCurrency(borrowing.remaining)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
