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
  ArrowDownLeft,
  Plus,
  Search,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const BorrowPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sections: Active, Pending, Completed, plus Marketplace (Find Lender)
  const [activeSection, setActiveSection] = useState<'active' | 'pending' | 'completed' | 'marketplace'>('active');
  const [loading, setLoading] = useState(true);

  // Stranger lenders offering capital in marketplace
  const [availableLenderOffers, setAvailableLenderOffers] = useState<Loan[]>([]);

  // User's own borrowing portfolio (STRANGERS ONLY)
  const [strangerBorrowLoans, setStrangerBorrowLoans] = useState<Loan[]>([]);
  const [borrowMetrics, setBorrowMetrics] = useState({
    totalBorrowed: 0,
    totalRepaid: 0,
    remaining: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch available stranger lending offers
      const marketRes = await loanService.getLoans({ marketplace: true, type: 'lending' });
      if (marketRes.success && marketRes.data) {
        setAvailableLenderOffers(marketRes.data.loans || []);
      }

      // 2. Fetch User's borrowing loans - strictly filter for STRANGERS ONLY
      const borrowRes = await loanService.getLoans({ type: 'borrowing' });
      if (borrowRes.success && borrowRes.data) {
        const allBorrowing = borrowRes.data.loans || [];
        const strangerOnly = allBorrowing.filter((l) => l.relationshipType === 'stranger');
        setStrangerBorrowLoans(strangerOnly);

        if (borrowRes.data.summary?.borrowing) {
          setBorrowMetrics(borrowRes.data.summary.borrowing);
        }
      }
    } catch (err) {
      console.error('Failed to load borrow data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Filtered stranger borrowing sections
  const activeLoans = strangerBorrowLoans.filter((l) => l.status === 'ACTIVE');
  const pendingLoans = strangerBorrowLoans.filter(
    (l) => l.status === 'PENDING' || l.status === 'BARGAINING' || l.status === 'FINAL OFFER'
  );
  const completedLoans = strangerBorrowLoans.filter(
    (l) => l.status === 'COMPLETED' || l.status === 'DECLINED' || l.status === 'CANCELLED'
  );

  const filteredOffers = availableLenderOffers.filter((item) => {
    const lender = item.lenderId as User;
    return (
      lender?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.purpose?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <AppShell>
      <div id="borrow-screen-content" className="space-y-5">
        {/* Header + Top Action: + Borrow Money */}
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
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Stranger Borrowing</h2>
          </div>

          <button
            id="top-borrow-money-btn"
            type="button"
            onClick={() => navigate('/create-loan?role=borrower&rel=stranger')}
            className="py-2 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-sky-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Borrow Money</span>
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
            Find Lender ({filteredOffers.length})
          </button>
        </div>

        {/* Section Contents */}
        {loading ? (
          <LoadingState message="Loading borrowing portfolio..." />
        ) : (
          <div>
            {/* 1. ACTIVE SECTION */}
            {activeSection === 'active' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Active stranger loans you are currently repaying</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(borrowMetrics.remaining)} remaining
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
                    title="No active stranger debt"
                    description="You currently have no active borrowing from strangers. Request capital or connect with verified lenders."
                    actionText="Find a Lender"
                    onAction={() => setActiveSection('marketplace')}
                  />
                )}
              </div>
            )}

            {/* 2. PENDING SECTION */}
            {activeSection === 'pending' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Requests in 24h bargaining or awaiting lender review</span>
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
                    title="No pending borrow requests"
                    description="When you request capital from a stranger or submit counter-offers, they appear here."
                    actionText="+ Borrow Money"
                    onAction={() => navigate('/create-loan?role=borrower&rel=stranger')}
                  />
                )}
              </div>
            )}

            {/* 3. COMPLETED SECTION */}
            {activeSection === 'completed' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Fully settled stranger loans</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatCurrency(borrowMetrics.totalRepaid)} total repaid
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
                    description="Loans that have been completely paid off will be archived here."
                  />
                )}
              </div>
            )}

            {/* 4. MARKETPLACE / FIND LENDER SECTION */}
            {activeSection === 'marketplace' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search lender name or purpose..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                  />
                </div>

                {filteredOffers.length > 0 ? (
                  <div className="space-y-3">
                    {filteredOffers.map((offer) => {
                      const lender = offer.lenderId as User;
                      return (
                        <div
                          key={offer._id}
                          className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 hover:border-sky-300 transition-colors shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 font-bold text-xs">
                                <UserIcon className="w-4 h-4 text-sky-600" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                  {lender?.displayName || 'Stranger Lender'}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <StatusBadge relationship="stranger" size="sm" />
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ID: {offer._id.slice(-6).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                                Offering
                              </span>
                              <span className="text-base font-black text-slate-900 font-mono">
                                {formatCurrency(offer.amount)}
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
                                {offer.interestRate}% APR
                              </span>
                            </div>
                            <div className="border-x border-slate-200/80">
                              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                                Duration
                              </span>
                              <span className="font-bold text-slate-800 font-mono">
                                {offer.duration} mos
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                                Monthly
                              </span>
                              <span className="font-bold text-sky-600 font-mono">
                                {formatCurrency(
                                  offer.paymentAmount || offer.amount / offer.duration
                                )}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 italic leading-relaxed">
                            &ldquo;{offer.purpose}&rdquo;
                          </p>

                          {/* Action: Request Capital */}
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/create-loan?role=borrower&target=${lender?._id}&relationship=stranger&amount=${offer.amount}&interest=${offer.interestRate}&duration=${offer.duration}&purpose=${encodeURIComponent(offer.purpose)}`
                              )
                            }
                            className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-sky-500/10 transition-all"
                          >
                            <ArrowDownLeft className="w-4 h-4" />
                            <span>Request Capital from Lender</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No lending offers found"
                    description="Try changing your search term or create a new borrowing request."
                    actionText="+ Borrow Money"
                    onAction={() => navigate('/create-loan?role=borrower&rel=stranger')}
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
