import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { loanService, negotiationService } from '../services/api.js';
import { AppShell } from '../components/AppShell.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { PaymentSchedule } from '../components/PaymentSchedule.js';
import { NegotiationPanel } from '../components/NegotiationPanel.js';
import { NegotiationHistory } from '../components/NegotiationHistory.js';
import { FinalOffer } from '../components/FinalOffer.js';
import { AgreementConfirmation } from '../components/AgreementConfirmation.js';
import { PaymentForm } from '../components/PaymentForm.js';
import { LoadingState } from '../components/LoadingState.js';
import { EmptyState } from '../components/EmptyState.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { Loan, User, LoanNegotiation } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';
import {
  ShieldCheck,
  User as UserIcon,
  Calendar,
  CreditCard,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const LoanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLender, setIsLender] = useState<boolean>(false);
  const [isBorrower, setIsBorrower] = useState<boolean>(false);
  const [counterparty, setCounterparty] = useState<User | null>(null);
  const [negotiations, setNegotiations] = useState<LoanNegotiation[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isBargainingAvailable, setIsBargainingAvailable] = useState<boolean>(false);

  // Modals & Panels
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const loadLoan = async () => {
    if (!id) return;
    try {
      const res = await loanService.getById(id);
      if (res.success && res.data) {
        setLoan(res.data.loan);
        setIsLender(res.data.isLender);
        setIsBorrower(res.data.isBorrower);
        setCounterparty(res.data.counterparty);
        setNegotiations(res.data.negotiations || []);
        setSecondsLeft(res.data.bargainingSecondsLeft || 0);
        setIsBargainingAvailable(res.data.isBargainingAvailable);
      }
    } catch (err) {
      console.error('Failed to load loan', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoan();
  }, [id]);

  const handleAcceptAgreement = async () => {
    if (!id) return;
    setProcessingAction(true);
    try {
      await loanService.accept(id);
      setShowAgreementModal(false);
      await loadLoan();
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeclineLoan = async () => {
    if (!id) return;
    try {
      await loanService.decline(id);
      setShowDeclineDialog(false);
      await loadLoan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decline loan.');
    }
  };

  const handleCancelLoan = async () => {
    if (!id) return;
    try {
      await loanService.cancel(id);
      setShowCancelDialog(false);
      await loadLoan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel loan.');
    }
  };

  const handleLockFinalOffer = async () => {
    if (!id) return;
    try {
      await negotiationService.finalize(id);
      await loadLoan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to lock final offer.');
    }
  };

  if (loading) {
    return (
      <AppShell showBack={true} title="Loan Agreement">
        <LoadingState message="Loading loan details and repayment schedule..." />
      </AppShell>
    );
  }

  if (!loan) {
    return (
      <AppShell showBack={true} title="Loan Agreement">
        <EmptyState
          title="Loan not found"
          description="This loan agreement does not exist or you do not have permission to view it."
          actionText="Back to Home"
          onAction={() => navigate('/')}
        />
      </AppShell>
    );
  }

  const latestProposal = negotiations[negotiations.length - 1];
  const lastProposedBy = latestProposal?.proposedBy;
  const lastProposedId =
    typeof lastProposedBy === 'object' && lastProposedBy !== null
      ? lastProposedBy._id
      : lastProposedBy;
  const isMyTurnToAccept = currentUser
    ? lastProposedId?.toString() !== currentUser._id
    : true;

  const total = loan.totalRepayment || loan.amount;
  const settled = isLender ? (loan.recoveredAmount || 0) : (loan.repaidAmount || 0);
  const progressPercent = total > 0 ? Math.min(100, Math.round((settled / total) * 100)) : 0;

  return (
    <AppShell showBack={true} title="Loan Agreement">
      <div id="loan-details-content" className="space-y-4">
        {/* Header Badges & Parties */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge status={loan.status} size="sm" />
              <StatusBadge relationship={loan.relationshipType} size="sm" />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              ID: {loan._id.slice(-8).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                {counterparty?.displayName ? counterparty.displayName.slice(0, 2) : 'U'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {counterparty?.displayName || 'Counterparty'}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {isLender ? 'Borrower' : 'Lender'} ({loan.relationshipType === 'friend' ? 'Circle Friend' : 'Stranger'})
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Role</span>
              <span className="text-xs font-bold text-sky-600">
                {isLender ? 'You are Lending' : 'You are Borrowing'}
              </span>
            </div>
          </div>

          {loan.purpose && (
            <p className="text-xs text-slate-600 italic pt-2 border-t border-slate-100">
              "{loan.purpose}"
            </p>
          )}
        </div>

        {/* FINANCIAL TERMS CARD */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Principal Amount
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                {formatCurrency(loan.amount)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Remaining Balance
              </span>
              <div className="text-xl font-bold text-sky-600 font-mono mt-0.5">
                {formatCurrency(loan.remainingAmount || 0)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Interest</span>
              <span className="font-bold text-slate-800 font-mono">{loan.interestRate}% APR</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Duration</span>
              <span className="font-bold text-slate-800 font-mono">{loan.duration} mos</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Installment</span>
              <span className="font-bold text-sky-600 font-mono">{formatCurrency(loan.paymentAmount)}</span>
            </div>
          </div>

          {/* Progress bar for active loans */}
          {loan.status === 'ACTIVE' && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Repayment Progress</span>
                <span className="font-mono text-slate-900 font-bold">
                  {formatCurrency(settled)} / {formatCurrency(loan.totalRepayment)} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 1. BARGAINING STATE: If PENDING or BARGAINING and within 24 hours */}
        {isBargainingAvailable && (
          <div className="space-y-3">
            <NegotiationPanel
              loan={loan}
              initialSecondsLeft={secondsLeft}
              latestNegotiation={latestProposal}
              currentUserId={currentUser?._id}
              onNegotiationSubmitted={loadLoan}
              onFinalize={handleLockFinalOffer}
            />

            {/* Accept / Decline initial or counter offer if it's user's turn */}
            {isMyTurnToAccept && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeclineDialog(true)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAgreementModal(true)}
                  className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-sky-500/10 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Offer</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. FINAL OFFER STATE: When 24h expires or locked */}
        {loan.status === 'FINAL OFFER' && (
          <FinalOffer
            loan={loan}
            onAccept={() => setShowAgreementModal(true)}
            onDecline={() => setShowDeclineDialog(true)}
            isProcessing={processingAction}
          />
        )}

        {/* 3. ACTIVE STATE: Repayments */}
        {loan.status === 'ACTIVE' && (
          <div className="space-y-3">
            {isBorrower && loan.remainingAmount > 0 && (
              !showPaymentForm ? (
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-sky-500/20 active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Make a Repayment</span>
                </button>
              ) : (
                <PaymentForm
                  loan={loan}
                  onPaymentSuccess={() => {
                    setShowPaymentForm(false);
                    loadLoan();
                  }}
                  onCancel={() => setShowPaymentForm(false)}
                />
              )
            )}
          </div>
        )}

        {/* 4. COMPLETED STATE BANNER */}
        {loan.status === 'COMPLETED' && (
          <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-emerald-900">Loan Fully Settled</h4>
            <p className="text-xs text-emerald-700 font-medium">
              All principal and interest obligations have been 100% repaid and settled.
            </p>
          </div>
        )}

        {/* 5. PAYMENT SCHEDULE */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <PaymentSchedule schedule={loan.paymentSchedule} compact={false} />
        </div>

        {/* 6. NEGOTIATION PROPOSAL THREAD */}
        {negotiations.length > 0 && (
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <NegotiationHistory
              negotiations={negotiations}
              currentUserId={currentUser?._id}
            />
          </div>
        )}

        {/* Creator cancel button if still pending */}
        {(loan.status === 'PENDING' || loan.status === 'BARGAINING') && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors"
            >
              Cancel this loan offer
            </button>
          </div>
        )}
      </div>

      {/* AGREEMENT CONFIRMATION MODAL */}
      {showAgreementModal && (
        <AgreementConfirmation
          loan={loan}
          onConfirm={handleAcceptAgreement}
          onClose={() => setShowAgreementModal(false)}
        />
      )}

      {/* DECLINE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={showDeclineDialog}
        title="Decline Loan Offer?"
        message="Are you sure you want to decline this loan proposal? This will terminate the offer with no financial impact."
        confirmText="Decline Offer"
        isDestructive={true}
        onConfirm={handleDeclineLoan}
        onCancel={() => setShowDeclineDialog(false)}
      />

      {/* CANCEL CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Loan Request?"
        message="Are you sure you want to cancel this pending loan offer?"
        confirmText="Cancel Loan"
        isDestructive={true}
        onConfirm={handleCancelLoan}
        onCancel={() => setShowCancelDialog(false)}
      />
    </AppShell>
  );
};
