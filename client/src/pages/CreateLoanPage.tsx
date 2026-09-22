import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loanService, friendService, userService } from '../services/api.js';
import { AppShell } from '../components/AppShell.js';
import { LoanForm } from '../components/LoanForm.js';
import { LoadingState } from '../components/LoadingState.js';
import { User, ActiveFriendItem } from '../types/index.js';
import { ArrowLeft, User as UserIcon, Users, UserCheck } from 'lucide-react';

export const CreateLoanPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialRole = (searchParams.get('role') as 'lender' | 'borrower') || 'lender';
  const initialRel = (searchParams.get('relationship') as 'friend' | 'stranger') || 'friend';
  const targetId = searchParams.get('target');

  const [role, setRole] = useState<'lender' | 'borrower'>(initialRole);
  const [relationshipType, setRelationshipType] = useState<'friend' | 'stranger'>(initialRel);

  const [counterparty, setCounterparty] = useState<User | null>(null);
  const [loadingCounterparty, setLoadingCounterparty] = useState(false);

  // Candidate selection if no target specified
  const [activeFriends, setActiveFriends] = useState<ActiveFriendItem[]>([]);
  const [strangerCandidates, setStrangerCandidates] = useState<User[]>([]);

  useEffect(() => {
    async function initCounterparty() {
      if (targetId) {
        setLoadingCounterparty(true);
        try {
          const res = await userService.getById(targetId);
          if (res.success && res.data) {
            setCounterparty(res.data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingCounterparty(false);
        }
      } else {
        // Fetch candidates for selection
        try {
          const friendsRes = await friendService.getFriends();
          if (friendsRes.success && friendsRes.data?.activeFriends) {
            setActiveFriends(friendsRes.data.activeFriends);
          }
          const usersRes = await userService.search('', 'stranger');
          if (usersRes.success && usersRes.data) {
            setStrangerCandidates(usersRes.data);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    initCounterparty();
  }, [targetId]);

  const handleSubmit = async (formData: {
    amount: number;
    interestRate: number;
    duration: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    purpose: string;
  }) => {
    if (!counterparty) {
      alert('Please select a counterparty.');
      return;
    }

    const res = await loanService.create({
      role,
      counterpartyId: counterparty._id,
      relationshipType,
      amount: formData.amount,
      interestRate: formData.interestRate,
      duration: formData.duration,
      frequency: formData.frequency,
      purpose: formData.purpose,
    });

    if (res.success && res.data) {
      navigate(`/loan/${res.data._id}`);
    }
  };

  return (
    <AppShell
      showBack={true}
      title={role === 'lender' ? 'Create Lending Offer' : 'Create Borrow Request'}
    >
      <div id="create-loan-page-content" className="space-y-5">
        {/* Role & Relationship Selectors */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setRole('lender')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                role === 'lender'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              I am Lending
            </button>
            <button
              type="button"
              onClick={() => setRole('borrower')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                role === 'borrower'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              I am Borrowing
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setRelationshipType('friend');
                setCounterparty(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                relationshipType === 'friend'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Circle Friend
            </button>
            <button
              type="button"
              onClick={() => {
                setRelationshipType('stranger');
                setCounterparty(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                relationshipType === 'stranger'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Stranger Marketplace
            </button>
          </div>
        </div>

        {/* Counterparty Selection if not preselected */}
        {!counterparty ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select {relationshipType === 'friend' ? 'Circle Friend' : 'Stranger'}
            </h3>

            {relationshipType === 'friend' ? (
              activeFriends.length > 0 ? (
                <div className="space-y-2">
                  {activeFriends.map((f) => (
                    <button
                      key={f.user._id}
                      type="button"
                      onClick={() => setCounterparty(f.user)}
                      className="w-full p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between transition-colors text-left shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                          {f.user.displayName.slice(0, 2)}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{f.user.displayName}</span>
                      </div>
                      <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                  No active friends in Circle yet. Invite a friend in Circle first.
                </div>
              )
            ) : (
              <div className="space-y-2">
                {strangerCandidates.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => setCounterparty(s)}
                    className="w-full p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between transition-colors text-left shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-xs font-bold text-sky-700">
                        {s.displayName.slice(0, 2)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{s.displayName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {s._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : loadingCounterparty ? (
          <LoadingState message="Loading recipient details..." />
        ) : (
          <LoanForm
            role={role}
            counterpartyId={counterparty._id}
            counterpartyName={counterparty.displayName}
            relationshipType={relationshipType}
            initialAmount={Number(searchParams.get('amount')) || 10000}
            initialInterest={searchParams.has('interest') ? Number(searchParams.get('interest')) : 5.0}
            initialDuration={Number(searchParams.get('duration')) || 6}
            initialPurpose={searchParams.get('purpose') || ''}
            onSubmit={handleSubmit}
            onCancel={() => navigate(-1)}
          />
        )}
      </div>
    </AppShell>
  );
};
