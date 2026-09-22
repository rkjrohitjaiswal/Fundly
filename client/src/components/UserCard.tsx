import React from 'react';
import { User, Loan } from '../types/index.js';
import { StatusBadge } from './StatusBadge.js';
import { ShieldCheck, ChevronRight, User as UserIcon } from 'lucide-react';

interface UserCardProps {
  user: User;
  loanOpportunity?: Loan;
  isFriend?: boolean;
  onSelect?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, loanOpportunity, isFriend = false, onSelect }) => {
  return (
    <div
      id={`user-card-${user._id}`}
      onClick={onSelect}
      className="cursor-pointer rounded-2xl bg-[#13171d] hover:bg-[#171c24] border border-white/5 hover:border-white/10 p-4 transition-all duration-150 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden text-slate-300 font-semibold text-sm">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white leading-tight">{user.displayName}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusBadge relationship={isFriend ? 'friend' : 'stranger'} size="sm" />
              <span className="text-[10px] text-slate-500 font-mono">ID: {user._id.slice(-6).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {onSelect && (
          <div className="w-8 h-8 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-[#0c0f12] text-slate-400 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>

      {loanOpportunity && (
        <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Seeking</span>
            <span className="font-bold text-white font-mono text-sm">${loanOpportunity.amount.toLocaleString()}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Terms</span>
            <span className="font-semibold text-emerald-400">{loanOpportunity.interestRate}% • {loanOpportunity.duration}m</span>
          </div>
        </div>
      )}

      {loanOpportunity?.purpose && (
        <p className="text-[11px] text-slate-400 truncate italic">"{loanOpportunity.purpose}"</p>
      )}
    </div>
  );
};
