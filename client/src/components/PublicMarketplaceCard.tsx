import React from 'react';
import { MarketplaceListing } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';
import { User, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface PublicMarketplaceCardProps {
  listing: MarketplaceListing;
  onAction: (listing: MarketplaceListing) => void;
}

export const PublicMarketplaceCard: React.FC<PublicMarketplaceCardProps> = ({
  listing,
  onAction,
}) => {
  const isOffering = listing.type === 'OFFERING';

  return (
    <div
      id={`public-card-${listing.id}`}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between space-y-4"
    >
      {/* Top Section */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-900 tracking-tight">
              {listing.displayName}
            </h4>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Stranger
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
            <span className="text-[11px] text-slate-400">ID: {listing.anonymousId}</span>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
              isOffering
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {isOffering ? 'OFFERING' : 'REQUESTED'}
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatCurrency(listing.amount)}
          </div>
        </div>
      </div>

      {/* Middle Section: Financial Metrics */}
      <div className="grid grid-cols-3 gap-2 py-3 px-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Rate
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono mt-0.5 block">
            {listing.interestRate}% APR
          </span>
        </div>

        <div className="border-x border-slate-200/80">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Duration
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono mt-0.5 block">
            {listing.duration} mos
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Monthly
          </span>
          <span className="text-xs sm:text-sm font-bold text-sky-600 font-mono mt-0.5 block">
            {formatCurrency(listing.monthlyPayment)}
          </span>
        </div>
      </div>

      {/* Bottom Section: Purpose and Primary Sky-Blue Button */}
      <div className="space-y-3">
        <p className="text-xs text-slate-600 italic line-clamp-2 min-h-[32px] leading-relaxed">
          &ldquo;{listing.purpose}&rdquo;
        </p>

        <button
          type="button"
          onClick={() => onAction(listing)}
          className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-sm shadow-sky-500/10 flex items-center justify-center gap-1.5"
        >
          {isOffering ? (
            <>
              <ArrowDownLeft className="w-4 h-4" />
              <span>Request Capital from Lender</span>
            </>
          ) : (
            <>
              <ArrowUpRight className="w-4 h-4" />
              <span>Fund This Loan Request</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
