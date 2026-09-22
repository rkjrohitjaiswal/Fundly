import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { loanService, friendService } from '../services/api.js';
import { AppShell } from '../components/AppShell.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { formatCurrency } from '../utils/format.js';
import {
  User as UserIcon,
  LogOut,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Copy,
  CheckCheck,
  UserCheck,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, login } = useAuth();

  const [summary, setSummary] = useState({
    lendingTotal: 0,
    borrowingTotal: 0,
    activeLoanCount: 0,
    completedLoanCount: 0,
  });
  const [friendCount, setFriendCount] = useState<number>(0);
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const inviteCode = user ? `FND-${user._id.slice(-6).toUpperCase()}` : 'FND-DEMO12';

  useEffect(() => {
    async function loadStats() {
      try {
        const [loansRes, friendsRes] = await Promise.all([
          loanService.getLoans(),
          friendService.getFriends(),
        ]);

        if (loansRes.success && loansRes.data) {
          const l = loansRes.data.loans || [];
          setSummary({
            lendingTotal: loansRes.data.summary?.lending?.totalLent || 0,
            borrowingTotal: loansRes.data.summary?.borrowing?.totalBorrowed || 0,
            activeLoanCount: l.filter((x) => x.status === 'ACTIVE').length,
            completedLoanCount: l.filter((x) => x.status === 'COMPLETED').length,
          });
        }

        if (friendsRes.success && friendsRes.data) {
          setFriendCount(friendsRes.data.activeFriends?.length || 0);
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadStats();
  }, [user]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const handleSwitchAccount = async (email: string) => {
    await login(email, 'password123');
    navigate('/');
  };

  return (
    <AppShell showBack={true} title="Account Profile">
      <div id="profile-screen-content" className="space-y-4">
        {/* Profile Card */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-black text-lg shadow-2xs">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span>{user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'U'}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-900 leading-tight truncate">
                {user?.displayName || 'Fundly Member'}
              </h2>
              <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Identity
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Code Box */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Circle Member Code
            </span>
            <span className="text-sm font-black font-mono text-slate-900 tracking-wider">
              {inviteCode}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {copiedCode ? (
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* High-Level Financial Ledger Stats */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Peer Financial Portfolio
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Capital Lent</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                {formatCurrency(summary.lendingTotal)}
              </div>
            </div>

            <div className="p-3.5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Capital Borrowed</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                {formatCurrency(summary.borrowingTotal)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3.5 rounded-3xl bg-white border border-slate-200 shadow-sm text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Active Loans</span>
              <span className="font-black text-slate-900 font-mono text-base">
                {summary.activeLoanCount}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Completed</span>
              <span className="font-black text-emerald-600 font-mono text-base">
                {summary.completedLoanCount}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Circle Friends</span>
              <span className="font-black text-sky-600 font-mono text-base">{friendCount}</span>
            </div>
          </div>
        </div>

        {/* Quick Demo Switcher helper */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <UserCheck className="w-4 h-4 text-sky-600" />
            <span>Switch Seed Demo Account</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSwitchAccount('sarah@fundly.demo')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                user?.email === 'sarah@fundly.demo'
                  ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Sarah (Lender)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchAccount('alex@fundly.demo')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                user?.email === 'alex@fundly.demo'
                  ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Alex (Borrower)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchAccount('michael@fundly.demo')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                user?.email === 'michael@fundly.demo'
                  ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Michael (Friend)
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          id="logout-btn"
          type="button"
          onClick={() => setShowLogoutDialog(true)}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-2xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Fundly</span>
        </button>
      </div>

      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="Sign Out?"
        message="Are you sure you want to sign out of Fundly?"
        confirmText="Sign Out"
        isDestructive={true}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </AppShell>
  );
};
