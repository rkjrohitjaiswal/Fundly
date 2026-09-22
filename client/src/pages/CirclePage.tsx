import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { friendService } from '../services/api.js';
import { AppShell } from '../components/AppShell.js';
import { FriendCard } from '../components/FriendCard.js';
import { LoadingState } from '../components/LoadingState.js';
import { EmptyState } from '../components/EmptyState.js';
import { ActiveFriendItem, PendingFriendItem } from '../types/index.js';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Check,
  X,
  Copy,
  CheckCheck,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const CirclePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeFriends, setActiveFriends] = useState<ActiveFriendItem[]>([]);
  const [pendingFriends, setPendingFriends] = useState<PendingFriendItem[]>([]);

  // Modal / form to invite friend
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [inviteErrorMsg, setInviteErrorMsg] = useState<string | null>(null);

  // My invite code
  const myInviteCode = user ? `FND-${user._id.slice(-6).toUpperCase()}` : 'FND-DEMO12';
  const [copiedCode, setCopiedCode] = useState(false);

  const loadFriends = async () => {
    try {
      const res = await friendService.getFriends();
      if (res.success && res.data) {
        setActiveFriends(res.data.activeFriends || []);
        setPendingFriends(res.data.pendingFriends || []);
      }
    } catch (err) {
      console.error('Failed to load friends', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, [user]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myInviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await friendService.accept(connectionId);
      await loadFriends();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept invitation.');
    }
  };

  const handleDecline = async (connectionId: string) => {
    try {
      await friendService.decline(connectionId);
      await loadFriends();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decline invitation.');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) return;

    setInviting(true);
    setInviteErrorMsg(null);
    setInviteSuccessMsg(null);

    try {
      const isEmail = inviteIdentifier.includes('@');
      const isCode = inviteIdentifier.toUpperCase().startsWith('FND-');

      const payload: any = {};
      if (isEmail) {
        payload.email = inviteIdentifier.trim();
      } else if (isCode) {
        payload.code = inviteIdentifier.trim().toUpperCase();
      } else {
        payload.email = inviteIdentifier.trim();
      }

      const res = await friendService.invite(payload);
      if (res.success) {
        setInviteSuccessMsg(`Invitation sent to ${inviteIdentifier}!`);
        setInviteIdentifier('');
        await loadFriends();
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteSuccessMsg(null);
        }, 1500);
      }
    } catch (err: any) {
      setInviteErrorMsg(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <AppShell>
      <div id="circle-screen-content" className="space-y-5">
        {/* Header + Top Action: + Add / Invite Friend */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                Friends Only
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Private Circle
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Circle</h2>
          </div>

          <button
            id="top-add-friend-btn"
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="py-2 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-sky-500/20 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add / Invite Friend</span>
          </button>
        </div>

        {/* Private Guarantee Banner */}
        <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-slate-900 leading-tight">Private & Ring-Fenced</h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Circle friends never appear in the stranger marketplace. Personal loans remain strictly confidential between both parties.
            </p>
          </div>
        </div>

        {/* Share Invite Code Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Your Circle Invite Code
            </span>
            <span className="text-sm font-black font-mono text-slate-900 tracking-wider">
              {myInviteCode}
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
            <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* 1. PENDING FRIENDS (Invitation status, NO loan amounts) */}
        {pendingFriends.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pending Friends ({pendingFriends.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">Awaiting mutual confirmation</span>
            </div>

            <div className="space-y-2.5">
              {pendingFriends.map((pFriend) => (
                <FriendCard
                  key={pFriend.connectionId}
                  pendingFriend={pFriend}
                  onAccept={() => handleAccept(pFriend.connectionId)}
                  onDecline={() => handleDecline(pFriend.connectionId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 2. ACTIVE FRIENDS (Lend/Recover/Remaining & Borrow/Repaid/Remaining) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Active Friends ({activeFriends.length})
            </h3>
            {activeFriends.length > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified Circle
              </span>
            )}
          </div>

          {loading ? (
            <LoadingState message="Connecting to your private Circle..." />
          ) : activeFriends.length > 0 ? (
            <div className="space-y-3">
              {activeFriends.map((item) => (
                <FriendCard
                  key={item.connectionId}
                  friend={item}
                  onClick={() => navigate(`/friend/${item.user._id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your Circle is empty"
              description="Invite trusted friends using their email address or your Circle code to start private, transparent lending."
              actionText="+ Add / Invite Friend"
              onAction={() => setShowInviteModal(true)}
            />
          )}
        </div>

        {/* Modal: Invite Friend */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-150 relative">
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteErrorMsg(null);
                  setInviteSuccessMsg(null);
                }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mx-auto">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Invite Friend to Circle</h3>
                <p className="text-xs text-slate-500">
                  Enter their registered email address or unique 6-character Circle code.
                </p>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Email or Circle Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. michael@fundly.demo or FND-MIC123"
                    value={inviteIdentifier}
                    onChange={(e) => setInviteIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                    required
                  />
                </div>

                {inviteErrorMsg && (
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{inviteErrorMsg}</span>
                  </div>
                )}

                {inviteSuccessMsg && (
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{inviteSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-sky-500/10"
                >
                  {inviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
