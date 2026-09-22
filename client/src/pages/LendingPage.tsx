import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { loanService } from '../services/api.js';
import { AppShell } from '../components/AppShell.js';
import { LoanCard } from '../components/LoanCard.js';
import { LoadingState } from '../components/LoadingState.js';
import { EmptyState } from '../components/EmptyState.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Loan, User } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';
import {
  ArrowUpRight,
  Plus,
  Search,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

export const LendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sections: Active, Pending, Completed, plus Marketplace (Find Borrower)
  const [activeSection, setActiveSection] = useState<'active' | 'pending' | 'completed' | 'marketplace'>('active');
  const [loading, setLoading] = useState(true);

  // Stranger marketplace requests (people seeking funding)
  const [marketplaceRequests, setMarketplaceRequests] = useState<Loan[]>([]);

  // User's own lending portfolio (STRANGERS ONLY)
  const [strangerLendingLoans, setStrangerLendingLoans] = useState<Loan[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    totalLent: 0,
    totalRecovered: 0,
    remaining: 0,
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDuration, setMaxDuration] = useState<number>(36);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stranger Marketplace requests
      const marketRes = await loanService.getLoans({ marketplace: true, type: 'borrowing' });
      if (marketRes.success && marketRes.data) {
        setMarketplaceRequests(marketRes.data.loans || []);
      }

      // 2. Fetch User's lending loans - strictly filter for STRANGERS ONLY (friends must never appear here)
      const portRes = await loanService.getLoans({ type: 'lending' });
      if (portRes.success && portRes.data) {
        const allLending = portRes.data.loans || [];
        const strangerOnly = allLending.filter((l) => l.relationshipType === 'stranger');
        setStrangerLendingLoans(strangerOnly);

        if (portRes.data.summary?.lending) {
          setPortfolioMetrics(portRes.data.summary.lending);
        }
      }
    } catch (err) {
      console.error('Failed to load lending data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Filtered stranger portfolio sections
  const activeLoans = strangerLendingLoans.filter((l) => l.status === 'ACTIVE');
  const pendingLoans = strangerLendingLoans.filter(
    (l) => l.status === 'PENDING' || l.status === 'BARGAINING' || l.status === 'FINAL OFFER'
  );
  const completedLoans = strangerLendingLoans.filter(
    (l) => l.status === 'COMPLETED' || l.status === 'DECLINED' || l.status === 'CANCELLED'
  );

  // Filtered marketplace requests
  const filteredRequests = marketplaceRequests.filter((item) => {
    const borrower = item.borrowerId as User;
    const matchesSearch =
      borrower?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.purpose?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDuration = item.duration <= maxDuration;
    return matchesSearch && matchesDuration;
  });

  return (
    <AppShell>
      <div id="lending-screen-content" className="space-y-5">
        {/* Header + Top Action: + Lend Money */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                Strangers Only
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                P2P Market
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Stranger Lending</h2>
          </div>

          <button
            id="top-lend-money-btn"
            type="button"
            onClick={() => navigate('/create-loan?role=lender&rel=stranger')}
            className="py-2 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-sky-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Lend Money</span>
          </button>
        </div>

        {/* Section Navigation Tabs: Active, Pending, Completed, Marketplace */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSection('active')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-center whitespace-nowrap transition-all ${
              activeSection === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Active ({activeLoans.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('pending')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-center whitespace-nowrap transition-all ${
              activeSection === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Pending ({pendingLoans.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('completed')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-center whitespace-nowrap transition-all ${
              activeSection === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Completed ({completedLoans.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('marketplace')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-center whitespace-nowrap transition-all ${
              activeSection === 'marketplace'
                ? 'bg-white text-sky-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Find Borrower ({filteredRequests.length})
          </button>
        </div>

        {/* Section Contents */}
        {loading ? (
          <LoadingState message="Loading lending portfolio..." />
        ) : (
          <div>
            {/* 1. ACTIVE SECTION */}
            {activeSection === 'active' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Active stranger loans currently being repaid</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(portfolioMetrics.remaining)} remaining
                  </span>
                </div>

                {activeLoans.length > 0 ? (
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
                    title="No active stranger loans"
                    description="You are not currently lending to any strangers. Browse open borrow requests to deploy capital."
                    actionText="Find a Borrower"
                    onAction={() => setActiveSection('marketplace')}
                  />
                )}
              </div>
            )}

            {/* 2. PENDING SECTION */}
            {activeSection === 'pending' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Offers in 24h bargaining or awaiting acceptance</span>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    24h Window
                  </span>
                </div>

                {pendingLoans.length > 0 ? (
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
                  <EmptyState
                    title="No pending stranger offers"
                    description="When you propose a stranger loan or enter bargaining, it will appear here."
                    actionText="+ Lend Money"
                    onAction={() => navigate('/create-loan?role=lender&rel=stranger')}
                  />
                )}
              </div>
            )}

            {/* 3. COMPLETED SECTION */}
            {activeSection === 'completed' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Fully settled or concluded stranger loans</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatCurrency(portfolioMetrics.totalRecovered)} total recovered
                  </span>
                </div>

                {completedLoans.length > 0 ? (
                  <div className="space-y-3">
                    {completedLoans.map((loan) => (
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
                    title="No completed loans yet"
                    description="Fully repaid stranger loans will be archived in this section with full transaction audits."
                  />
                )}
              </div>
            )}

            {/* 4. MARKETPLACE / FIND BORROWER SECTION */}
            {activeSection === 'marketplace' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search borrower name or purpose..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
                    Max Duration:
                  </span>
                  {[6, 12, 24, 36].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setMaxDuration(dur)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border shrink-0 transition-colors ${
                        maxDuration === dur
                          ? 'bg-sky-50 border-sky-200 text-sky-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      ≤ {dur} mos
                    </button>
                  ))}
                </div>

                {filteredRequests.length > 0 ? (
                  <div className="space-y-3">
                    {filteredRequests.map((reqItem) => {
                      const borrower = reqItem.borrowerId as User;
                      return (
                        <div
                          key={reqItem._id}
                          className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 hover:border-sky-300 transition-colors shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 font-bold text-xs">
                                <UserIcon className="w-4 h-4 text-sky-600" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                  {borrower?.displayName || 'Stranger Borrower'}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <StatusBadge relationship="stranger" size="sm" />
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ID: {reqItem._id.slice(-6).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                                Requested
                              </span>
                              <span className="text-base font-black text-slate-900 font-mono">
                                {formatCurrency(reqItem.amount)}
                              </span>
                            </div>
                          </div>

                          {/* Terms row */}
                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                                Rate
                              </span>
                              <span className="font-bold text-slate-800 font-mono">
                                {reqItem.interestRate}% APR
                              </span>
                            </div>
                            <div className="border-x border-slate-200/80">
                              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                                Duration
                              </span>
                              <span className="font-bold text-slate-800 font-mono">
                                {reqItem.duration} mos
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                                Monthly
                              </span>
                              <span className="font-bold text-sky-600 font-mono">
                                {formatCurrency(
                                  reqItem.paymentAmount || reqItem.amount / reqItem.duration
                                )}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 italic leading-relaxed">
                            &ldquo;{reqItem.purpose}&rdquo;
                          </p>

                          {/* Action: Fund / Propose Terms */}
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/create-loan?role=lender&target=${borrower?._id}&relationship=stranger&amount=${reqItem.amount}&interest=${reqItem.interestRate}&duration=${reqItem.duration}&purpose=${encodeURIComponent(reqItem.purpose)}`
                              )
                            }
                            className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-sky-500/10 transition-all"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                            <span>Fund This Request</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No borrow requests found"
                    description="Try resetting search filters or check back shortly for new stranger borrow requests."
                    actionText="Reset Filters"
                    onAction={() => {
                      setSearchQuery('');
                      setMaxDuration(36);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};
