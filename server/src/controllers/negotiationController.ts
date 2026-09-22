import { Response } from 'express';
import {
  LoanRepo,
  LoanNegotiationRepo,
  NotificationRepo,
} from '../models/index.js';
import { LoanCalculator, PaymentFrequency } from '../services/loanCalculator.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const negotiationController = {
  /**
   * Get complete negotiation history for a loan
   */
  async getNegotiations(req: AuthenticatedRequest, res: Response) {
    try {
      const loanId = req.params.id;
      const currentUserId = req.user._id.toString();

      const loan = await LoanRepo.findById(loanId);
      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found.',
          errorCode: 'LOAN_NOT_FOUND',
        });
      }

      const lenderId = (loan.lenderId?._id || loan.lenderId).toString();
      const borrowerId = (loan.borrowerId?._id || loan.borrowerId).toString();

      if (lenderId !== currentUserId && borrowerId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized.',
          errorCode: 'FORBIDDEN',
        });
      }

      const history = await LoanNegotiationRepo.findByLoanId(loanId);

      return res.json({
        success: true,
        data: history,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to load negotiation history.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  /**
   * Submit a counter-offer
   * STRICT BARGAINING RULES:
   * 1. Available ONLY while loan is pending/bargaining.
   * 2. Exactly 24-hour window enforced by backend server clock.
   * 3. Max adjustment: 1–2 percentage points from previous rate.
   * 4. 0% interest is valid.
   * 5. Recalculates all financial values with LoanCalculator.
   */
  async createCounterOffer(req: AuthenticatedRequest, res: Response) {
    try {
      const loanId = req.params.id;
      const currentUserId = req.user._id.toString();
      const { interestRate, duration, frequency } = req.body;

      const loan = await LoanRepo.findById(loanId);
      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found.',
          errorCode: 'LOAN_NOT_FOUND',
        });
      }

      const lenderId = (loan.lenderId?._id || loan.lenderId).toString();
      const borrowerId = (loan.borrowerId?._id || loan.borrowerId).toString();

      if (lenderId !== currentUserId && borrowerId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You are not a party to this loan.',
          errorCode: 'FORBIDDEN',
        });
      }

      // Check loan status
      if (loan.status === 'ACTIVE' || loan.status === 'COMPLETED' || loan.status === 'DECLINED' || loan.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: `Cannot negotiate a loan in '${loan.status}' status. Terms are locked.`,
          errorCode: 'BARGAINING_LOCKED',
        });
      }

      // 24-hour server authoritative expiry check
      const now = new Date();
      if (loan.bargainingExpiresAt && new Date(loan.bargainingExpiresAt).getTime() <= now.getTime()) {
        // Automatically lock into final offer
        await LoanRepo.update(loanId, {
          status: 'FINAL OFFER',
          finalOfferLocked: true,
          finalOfferAt: loan.bargainingExpiresAt,
        });

        return res.status(400).json({
          success: false,
          message: 'Bargaining window has expired (24-hour limit reached). Bargaining is permanently locked.',
          errorCode: 'BARGAINING_EXPIRED',
        });
      }

      // Prevent user from counter-offering against themselves repeatedly
      const negotiations = await LoanNegotiationRepo.findByLoanId(loanId);
      const lastProposal = negotiations[negotiations.length - 1];
      if (lastProposal) {
        const lastProposedBy = (lastProposal.proposedBy?._id || lastProposal.proposedBy).toString();
        if (lastProposedBy === currentUserId) {
          return res.status(400).json({
            success: false,
            message: 'You have already submitted the latest proposal. Awaiting counterparty response.',
            errorCode: 'WAITING_FOR_COUNTERPARTY',
          });
        }
      }

      // Validate controlled interest rate negotiation (Max adjustment: 1–2 percentage points)
      const newRate = Math.max(0, Number(interestRate));
      const currentRate = Number(loan.interestRate);
      const diffPercentagePoints = Math.abs(newRate - currentRate);

      if (diffPercentagePoints > 2.01) {
        return res.status(400).json({
          success: false,
          message: `Negotiation limit exceeded: Interest rate can only be adjusted by up to 2.0 percentage points per counter-offer (Requested: ${newRate}%, Current: ${currentRate}%).`,
          errorCode: 'ADJUSTMENT_LIMIT_EXCEEDED',
        });
      }

      const newDuration = duration ? Math.max(1, Math.round(Number(duration))) : loan.duration;
      const newFreq: PaymentFrequency = (frequency && ['weekly', 'biweekly', 'monthly'].includes(frequency))
        ? frequency
        : loan.frequency;

      // Deterministic Authoritative Recalculation
      const calc = LoanCalculator.calculate({
        amount: loan.amount,
        interestRate: newRate,
        duration: newDuration,
        frequency: newFreq,
      });

      // Save proposal to negotiation history
      const negotiationRecord = await LoanNegotiationRepo.create({
        loanId,
        proposedBy: currentUserId,
        amount: loan.amount,
        interestRate: calc.interestRate,
        duration: calc.duration,
        frequency: calc.frequency,
        totalInterest: calc.totalInterest,
        totalRepayment: calc.totalRepayment,
        paymentAmount: calc.paymentAmount,
      });

      // Update loan with recalculated financial figures and status BARGAINING
      const updatedLoan = await LoanRepo.update(loanId, {
        interestRate: calc.interestRate,
        duration: calc.duration,
        frequency: calc.frequency,
        totalInterest: calc.totalInterest,
        totalRepayment: calc.totalRepayment,
        paymentAmount: calc.paymentAmount,
        paymentSchedule: calc.paymentSchedule,
        remainingAmount: calc.totalRepayment,
        status: 'BARGAINING',
      });

      // Notify counterparty
      const otherUserId = currentUserId === lenderId ? borrowerId : lenderId;
      await NotificationRepo.create({
        userId: otherUserId,
        type: 'counter_offer',
        title: 'New Counter-Offer Received',
        message: `${req.user.displayName} proposed a new interest rate of ${calc.interestRate}% on the $${loan.amount.toLocaleString()} loan.`,
        relatedLoanId: loanId,
        relatedNegotiationId: negotiationRecord._id.toString(),
      });

      return res.json({
        success: true,
        data: {
          loan: updatedLoan,
          negotiation: negotiationRecord,
          message: 'Counter-offer submitted and financial terms recalculated.',
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to submit counter-offer.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  /**
   * Finalize loan proposal into FINAL OFFER ("Take it or leave it")
   */
  async finalize(req: AuthenticatedRequest, res: Response) {
    try {
      const loanId = req.params.id;
      const currentUserId = req.user._id.toString();

      const loan = await LoanRepo.findById(loanId);
      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found.',
          errorCode: 'LOAN_NOT_FOUND',
        });
      }

      const lenderId = (loan.lenderId?._id || loan.lenderId).toString();
      const borrowerId = (loan.borrowerId?._id || loan.borrowerId).toString();

      if (lenderId !== currentUserId && borrowerId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized.',
          errorCode: 'FORBIDDEN',
        });
      }

      const updated = await LoanRepo.update(loanId, {
        status: 'FINAL OFFER',
        finalOfferLocked: true,
        finalOfferAt: new Date(),
      });

      const otherUserId = currentUserId === lenderId ? borrowerId : lenderId;
      await NotificationRepo.create({
        userId: otherUserId,
        type: 'bargaining_expiry',
        title: 'Final Offer Declared',
        message: `The loan terms have been locked as Final Offer: "Take it or leave it."`,
        relatedLoanId: loanId,
      });

      return res.json({
        success: true,
        data: {
          loan: updated,
          message: 'Loan locked into Final Offer.',
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to finalize offer.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },
};
