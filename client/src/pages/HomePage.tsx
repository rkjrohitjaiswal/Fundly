import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { loanService } from '../services/api.js';
import { AppShell } from '../components/AppShell.js';
import { FinancialSummary } from '../components/FinancialSummary.js';
import { LoanCard } from '../components/LoanCard.js';
import { LoadingState } from '../components/LoadingState.js';
import { EmptyState } from '../components/EmptyState.js';
import { Loan, FinancialMetricsSummary } from '../types/index.js';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Calculator,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<FinancialMetricsSummary>({
    lending: { totalLent: 0, totalRecovered: 0, remaining: 0 },
    borrowing: { totalBorrowed: 0, totalRepaid: 0, remaining: 0 },
  });

  const loadData = async () => {
    try {
      const res = await loanService.getLoans();
      if (res.success && res.data) {
        setLoans(res.data.loans || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard loans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const pendingLoans = loans.filter(
    (l) => l.status === 'PENDING' || l.status === 'BARGAINING' || l.status === 'FINAL OFFER'
  );

  return (
    <AppShell>
      <div id="home-screen-content" className="space-y-6">
        {/* User Greeting & Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block">
              Peer-to-Peer Fintech
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Welcome back, {user?.displayName?.split(' ')[0] || 'Friend'}
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400 font-mono">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* 1. FINANCIAL SUMMARY (Lending & Borrowing metrics) */}
        <FinancialSummary summary={summary} />

        {/* 2. FAST ACTION SHORTCUTS (White background with subtle tinted icon containers) */}
        <div id="quick-actions-bar" className="grid grid-cols-4 gap-2">
          <button
            id="action-lend-btn"
            type="button"
            onClick={() => navigate('/lending')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 shadow-2xs transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-3xs">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Lend</span>
          </button>

          <button
            id="action-borrow-btn"
            type="button"
            onClick={() => navigate('/borrow')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 shadow-2xs transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-3xs">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Borrow</span>
          </button>

          <button
            id="action-invite-btn"
            type="button"
            onClick={() => navigate('/circle')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 shadow-2xs transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-3xs">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Circle</span>
          </button>

          <button
            id="action-calc-btn"
            type="button"
            onClick={() => navigate('/calculator')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 shadow-2xs transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-3xs">
              <Calculator className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Calculator</span>
          </button>
        </div>

        {/* 3. ALL ACTIVE LOANS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              ALL ACTIVE LOANS ({activeLoans.length})
            </h3>
            {activeLoans.length > 0 && (
              <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                Active Contracts
              </span>
            )}
          </div>

          {loading ? (
            <LoadingState message="Fetching active loans..." />
          ) : activeLoans.length > 0 ? (
            <div className="space-y-3">
              {activeLoans.map((loan) => (
                <LoanCard
                  key={loan._id}
                  loan={loan}
                  currentUserId={user?._id}
                  onClick={() => navigate(`/loan/${loan._id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active loans yet"
              description="Explore stranger offers or lend with Circle friends to start building your portfolio."
              actionText="Explore Opportunities"
              onAction={() => navigate('/lending')}
            />
          )}
        </div>

        {/* 4. ALL PENDING LOANS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ALL PENDING LOANS ({pendingLoans.length})
              </h3>
            </div>
            <span className="text-[10px] text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              24h Window
            </span>
          </div>

          {loading ? (
            <LoadingState message="Fetching pending proposals..." />
          ) : pendingLoans.length > 0 ? (
            <div className="space-y-3">
              {pendingLoans.map((loan) => (
                <LoanCard
                  key={loan._id}
                  loan={loan}
                  currentUserId={user?._id}
                  onClick={() => navigate(`/loan/${loan._id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="py-6 px-4 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
              No pending or bargaining loans at this moment.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
