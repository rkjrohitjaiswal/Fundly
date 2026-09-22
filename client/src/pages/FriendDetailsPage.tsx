import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { friendService } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';
import { AppShell } from '../components/AppShell.js';
import { LoanCard } from '../components/LoanCard.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { LoadingState } from '../components/LoadingState.js';
import { EmptyState } from '../components/EmptyState.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { User, Loan } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';
import {
  User as UserIcon,
  ArrowUpRight,
  ArrowDownLeft,
  UserMinus,
  Plus,
  ShieldCheck,
  Clock,
  History,
} from 'lucide-react';

export const FriendDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [friend, setFriend] = useState<User | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [metrics, setMetrics] = useState({
    lending: { totalLent: 0, totalRecovered: 0, remaining: 0 },
    borrowing: { totalBorrowed: 0, totalRepaid: 0, remaining: 0 },
  });

  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const loadFriendData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await friendService.getById(id);
      if (res.success && res.data) {
        setFriend(res.data.friend);
        setLoans(res.data.loans || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to load friend details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriendData();
  }, [id]);

  const handleRemoveFriend = async () => {
    if (!id) return;
    try {
      await friendService.remove(id);
      navigate('/circle');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove friend.');
    }
  };

  if (loading) {
    return (
      <AppShell showBack={true} title="Circle Friend">
        <LoadingState message="Loading private friend ledger..." />
      </AppShell>
    );
  }

  if (!friend) {
    return (
      <AppShell showBack={true} title="Circle Friend">
        <EmptyState
          title="Friend not found"
          description="This user is not an active friend in your private Circle."
          actionText="Back to Circle"
          onAction={() => navigate('/circle')}
        />
      </AppShell>
    );
  }

  // Segment loans with this friend
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const pendingLoans = loans.filter(
    (l) => l.status === 'PENDING' || l.status === 'BARGAINING' || l.status === 'FINAL OFFER'
  );
  const historyLoans = loans.filter(
    (l) => l.status === 'COMPLETED' || l.status === 'DECLINED' || l.status === 'CANCELLED'
  );

  return (
    <AppShell showBack={true} title={friend.displayName}>
      <div id="friend-details-content" className="space-y-5">
        {/* Top: Friend Profile Card with Circle Badge */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 font-bold text-base shadow-3xs">
                {friend.photoURL ? (
                  <img
                    src={friend.photoURL}
                    alt={friend.displayName}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-sky-600" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {friend.displayName}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <StatusBadge relationship="friend" size="sm" />
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {friend._id.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRemoveDialog(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
              title="Remove friend from Circle"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Private Guarantee */}
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Private Friend Ledger: visible only to you and {friend.displayName.split(' ')[0]}.</span>
        </div>

        {/* Summary Cards: Lent / Recovered / Remaining and Borrowed / Repaid / Remaining */}
        <div className="grid grid-cols-2 gap-3">
          {/* You Lent to Friend */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-1 text-[11px] font-bold text-sky-700 uppercase tracking-wider">
              <ArrowUpRight className="w-3.5 h-3.5 text-sky-600" />
              <span>You Lent</span>
            </div>
            <div className="text-xl font-black font-mono text-slate-900">
              {formatCurrency(metrics.lending.totalLent)}
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] space-y-0.5">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Recovered:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatCurrency(metrics.lending.totalRecovered)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Remaining:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatCurrency(metrics.lending.remaining)}
                </span>
              </div>
            </div>
          </div>

          {/* You Borrowed from Friend */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>You Borrowed</span>
            </div>
            <div className="text-xl font-black font-mono text-slate-900">
              {formatCurrency(metrics.borrowing.totalBorrowed)}
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] space-y-0.5">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Repaid:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatCurrency(metrics.borrowing.totalRepaid)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Remaining:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatCurrency(metrics.borrowing.remaining)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. ACTIVE LOANS WITH THIS FRIEND */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Active Loans ({activeLoans.length})
            </h3>
          </div>

          {activeLoans.length > 0 ? (
            <div className="space-y-3">
              {activeLoans.map((loan) => (
                <LoanCard
                  key={loan._id}
                  loan={loan}
                  currentUserId={currentUser?._id}
                  onClick={() => navigate(`/loan/${loan._id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="py-4 px-3 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400">
              No active loans currently running with this friend.
            </div>
          )}
        </div>

        {/* 2. PENDING LOANS WITH THIS FRIEND */}
        {pendingLoans.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pending & Bargaining Loans ({pendingLoans.length})
              </h3>
            </div>

            <div className="space-y-3">
              {pendingLoans.map((loan) => (
                <LoanCard
                  key={loan._id}
                  loan={loan}
                  currentUserId={currentUser?._id}
                  onClick={() => navigate(`/loan/${loan._id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 3. LOAN HISTORY WITH THIS FRIEND */}
        {historyLoans.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Loan History ({historyLoans.length})
              </h3>
            </div>

            <div className="space-y-3">
              {historyLoans.map((loan) => (
                <LoanCard
                  key={loan._id}
                  loan={loan}
                  currentUserId={currentUser?._id}
                  onClick={() => navigate(`/loan/${loan._id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM ACTION: + Create Friend Loan */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/create-loan?target=${friend._id}&relationship=friend`
              )
            }
            className="w-full py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-sky-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Friend Loan with {friend.displayName.split(' ')[0]}</span>
          </button>
        </div>
      </div>

      {/* Remove Friend Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemoveDialog}
        title="Remove Friend from Circle?"
        message={`Are you sure you want to remove ${friend.displayName} from your Circle? Historical loan records will remain in your transaction ledger.`}
        confirmText="Remove Friend"
        isDestructive={true}
        onConfirm={handleRemoveFriend}
        onCancel={() => setShowRemoveDialog(false)}
      />
    </AppShell>
  );
};
