import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface PublicHeaderProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  onSignInClick,
  onSignUpClick,
}) => {
  return (
    <header
      id="fundly-public-header"
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* LEFT: Fundly Logo, FUNDLY, "Peer-to-peer lending, made simple." */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-xl bg-sky-500 text-white font-black text-lg flex items-center justify-center shadow-sm shadow-sky-500/20">
            F
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
                FUNDLY
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-200 uppercase tracking-wide">
                Live P2P
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-normal leading-tight mt-0.5">
              Peer-to-peer lending, made simple.
            </p>
          </div>
        </div>

        {/* RIGHT: Sign In and Sign Up in the upper-right corner */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="public-signin-btn"
            type="button"
            onClick={onSignInClick}
            className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 hover:bg-sky-50/60 border border-slate-200 transition-all active:scale-95"
          >
            Sign In
          </button>
          <button
            id="public-signup-btn"
            type="button"
            onClick={onSignUpClick}
            className="px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>Sign Up</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
          </button>
        </div>
      </div>
    </header>
  );
};
