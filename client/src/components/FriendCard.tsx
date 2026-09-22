import React from 'react';
import { ActiveFriendItem, PendingFriendItem } from '../types/index.js';
import { StatusBadge } from './StatusBadge.js';
import { formatCurrency } from '../utils/format.js';
import { User, Check, X, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface FriendCardProps {
  friend?: ActiveFriendItem;
  pendingFriend?: PendingFriendItem;
  onAccept?: () => void;
  onDecline?: () => void;
  onClick?: () => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  pendingFriend,
  onAccept,
  onDecline,
  onClick,
}) => {
  if (pendingFriend) {
    const { user, invitedByMe, inviteCode } = pendingFriend;
    return (
      <div
        id={`pending-friend-${pendingFriend.connectionId}`}
        className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{user?.displayName || 'Circle Member'}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusBadge status="PENDING" size="sm" />
                <span className="text-[10px] text-slate-400 font-mono">Code: {inviteCode}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {invitedByMe ? 'Awaiting friend confirmation' : 'Invited you to Circle'}
          </span>

          {!invitedByMe && onAccept && onDecline && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDecline}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="Decline"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (friend) {
    const { user, metrics } = friend;
    return (
      <div
        id={`active-friend-${friend.connectionId}`}
        onClick={onClick}
        className="cursor-pointer rounded-2xl bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-sky-300 p-4 transition-all duration-150 space-y-3 shadow-xs hover:shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <User className="w-5 h-5 text-sky-500" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{user?.displayName}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusBadge relationship="friend" size="sm" />
                <span className="text-[10px] text-slate-400 font-mono">
                  {friend.loanCount} loan{friend.loanCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Financial metrics: Lend/Recover/Remaining & Borrow/Repaid/Remaining */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Lending block */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-sky-700 uppercase tracking-wider">
              <ArrowUpRight className="w-3 h-3" />
              <span>You Lent</span>
            </div>
            <div className="text-xs font-mono font-bold text-slate-900">
              {formatCurrency(metrics.lending.totalLent)}
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Rec: {formatCurrency(metrics.lending.totalRecovered)}</span>
              <span className="font-semibold text-slate-700">Rem: {formatCurrency(metrics.lending.remaining)}</span>
            </div>
          </div>

          {/* Borrowing block */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              <ArrowDownLeft className="w-3 h-3" />
              <span>You Borrowed</span>
            </div>
            <div className="text-xs font-mono font-bold text-slate-900">
              {formatCurrency(metrics.borrowing.totalBorrowed)}
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Rep: {formatCurrency(metrics.borrowing.totalRepaid)}</span>
              <span className="font-semibold text-slate-700">Rem: {formatCurrency(metrics.borrowing.remaining)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
