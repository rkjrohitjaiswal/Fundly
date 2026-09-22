import React, { useState, useEffect } from 'react';
import { PublicHeader } from '../components/PublicHeader.js';
import { PublicMarketplaceCard } from '../components/PublicMarketplaceCard.js';
import { AuthModal } from '../components/AuthModal.js';
import { marketplaceService } from '../services/api.js';
import { MarketplaceListing } from '../types/index.js';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Lock,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Loader2,
  Users,
} from 'lucide-react';

export const PublicLandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lending' | 'borrowing'>('lending');
  const [lendingOffers, setLendingOffers] = useState<MarketplaceListing[]>([]);
  const [borrowingRequests, setBorrowingRequests] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const openSignIn = () => {
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
  };

  const openSignUp = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      const [lendingRes, borrowingRes] = await Promise.all([
        marketplaceService.getLendingOffers(),
        marketplaceService.getBorrowingRequests(),
      ]);

      if (lendingRes.success && lendingRes.data) {
        setLendingOffers(lendingRes.data);
      }
      if (borrowingRes.success && borrowingRes.data) {
        setBorrowingRequests(borrowingRes.data);
      }
    } catch (err) {
      console.error('Failed to load public marketplace data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  // Filter listings
  const currentListings = activeTab === 'lending' ? lendingOffers : borrowingRequests;
  const filteredListings = currentListings.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.displayName.toLowerCase().includes(q) ||
      item.purpose.toLowerCase().includes(q) ||
      item.anonymousId.toLowerCase().includes(q)
    );
  });

  const handleCardAction = (listing: MarketplaceListing) => {
    // Unauthenticated user taking action on a marketplace listing triggers sign in / sign up
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  return (
    <div id="fundly-public-landing" className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* 1. PUBLIC HEADER */}
      <PublicHeader onSignInClick={openSignIn} onSignUpClick={openSignUp} />

      <main className="flex-1">
        {/* 2. HERO SECTION */}
        <section className="bg-gradient-to-b from-sky-50/60 via-white to-white border-b border-slate-100 py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/70 text-sky-700 text-xs font-semibold border border-sky-200">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Transparent 24h Bargaining &middot; Authoritative Schedules</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              FUNDLY
            </h1>

            <p className="text-xl sm:text-2xl font-bold text-sky-600 tracking-tight">
              Peer-to-peer lending, made simple.
            </p>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
              Connect with people looking to lend or borrow money through transparent loan terms.
              Explore live stranger lending offers or borrow capital with predictable, locked amortization schedules.
            </p>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={openSignUp}
                className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all"
              >
                Sign Up
              </button>

              <button
                type="button"
                onClick={openSignIn}
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-bold text-sm border border-slate-200 shadow-xs transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* 3. LIVE MARKETPLACE SECTION */}
        <section id="live-marketplace" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Live P2P Activity
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Explore Available Loan Opportunities
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Safe public listings without exposing private financial details.
              </p>
            </div>

            {/* Marketplace Tab Controls */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('lending')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'lending'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-sky-600" />
                <span>AVAILABLE TO BORROW</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-700 font-semibold">
                  {lendingOffers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('borrowing')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'borrowing'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>AVAILABLE TO LEND</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  {borrowingRequests.length}
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'lending' ? 'lending offers' : 'borrowing requests'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Marketplace Cards Grid */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Loading live marketplace listings...
              </p>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredListings.map((listing) => (
                <PublicMarketplaceCard
                  key={listing.id}
                  listing={listing}
                  onAction={handleCardAction}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-sm font-semibold text-slate-700">No listings found</p>
              <p className="text-xs text-slate-500">
                Try searching with a different term or switch between borrowing and lending tabs.
              </p>
            </div>
          )}
        </section>

        {/* 4. HOW IT WORKS FINTECH SECTION */}
        <section className="bg-slate-50/70 border-t border-slate-200/80 py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block">
                Fintech Transparency
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                How Fundly Works
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                Deterministic mathematical calculation of every cent, protected by 24h bargaining and locked contracts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="text-sm font-bold text-slate-900">Explore or Propose</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Browse public stranger offers or invite personal friends into your verified Circle.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="text-sm font-bold text-slate-900">24h Bargaining Window</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Propose rate or duration adjustments. Server timestamp strictly enforces the 24-hour expiration.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h4 className="text-sm font-bold text-slate-900">Final Offer Locked</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When bargaining ends or is accepted, terms lock into an immutable repayment schedule.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h4 className="text-sm font-bold text-slate-900">Deterministic Repayment</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Track principal, interest, and remaining balance down to the exact cent until completion.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-500 text-white font-black text-xs flex items-center justify-center">
              F
            </div>
            <span className="font-bold text-slate-800">FUNDLY</span>
            <span className="text-slate-400">&copy; 2026 Peer-to-Peer Financial Systems.</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <button type="button" onClick={openSignIn} className="hover:text-sky-600">
              Sign In
            </button>
            <button type="button" onClick={openSignUp} className="hover:text-sky-600">
              Sign Up
            </button>
            <span>Clean White Fintech Architecture</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
