import { Response } from 'express';
import {
  LoanRepo,
  FriendConnectionRepo,
  UserRepo,
  LoanNegotiationRepo,
  NotificationRepo,
  ILoan,
} from '../models/index.js';
import { LoanCalculator, PaymentFrequency } from '../services/loanCalculator.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const loanController = {
  /**
   * Deterministic Loan Calculation Endpoint
   * Authoritative calculation service for previews before sending
   */
  async calculatePreview(req: AuthenticatedRequest, res: Response) {
    try {
      const { amount, interestRate, duration, frequency, startDate } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Loan amount must be greater than zero.',
          errorCode: 'INVALID_AMOUNT',
        });
      }

      const parsedRate = Number(interestRate ?? 0);
      if (isNaN(parsedRate) || parsedRate < 0) {
        return res.status(400).json({
          success: false,
          message: 'Interest rate cannot be negative. 0% is accepted.',
          errorCode: 'INVALID_INTEREST',
        });
      }

      const parsedDuration = Math.round(Number(duration ?? 1));
      if (parsedDuration <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be at least 1 month.',
          errorCode: 'INVALID_DURATION',
        });
      }

      const validFrequency: PaymentFrequency = ['weekly', 'biweekly', 'monthly'].includes(frequency)
        ? frequency
        : 'monthly';

      const calculation = LoanCalculator.calculate({
        amount: Number(amount),
        interestRate: parsedRate,
        duration: parsedDuration,
        frequency: validFrequency,
        startDate,
      });

      return res.json({
        success: true,
        data: calculation,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Calculation error',
        errorCode: 'CALCULATION_ERROR',
      });
    }
  },

  /**
   * Create a new loan offer or borrow request
   */
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUserId = req.user._id.toString();
      const {
        role, // 'lender' | 'borrower'
        counterpartyId,
        relationshipType, // 'friend' | 'stranger'
        amount,
        interestRate,
        duration,
        frequency,
        purpose,
      } = req.body;

      // Validation
      if (!counterpartyId) {
        return res.status(400).json({
          success: false,
          message: 'A counterparty must be selected.',
          errorCode: 'MISSING_COUNTERPARTY',
        });
      }

      if (counterpartyId === currentUserId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot create a loan with yourself.',
          errorCode: 'SELF_LOAN',
        });
      }

      const counterparty = await UserRepo.findById(counterpartyId);
      if (!counterparty) {
        return res.status(404).json({
          success: false,
          message: 'Counterparty user not found.',
          errorCode: 'USER_NOT_FOUND',
        });
      }

      if (!['friend', 'stranger'].includes(relationshipType)) {
        return res.status(400).json({
          success: false,
          message: 'Relationship type must be either "friend" or "stranger".',
          errorCode: 'INVALID_RELATIONSHIP',
        });
      }

      // CRITICAL RULES VERIFICATION
      const areActiveFriends = await FriendConnectionRepo.areActiveFriends(currentUserId, counterpartyId);

      if (relationshipType === 'friend') {
        if (!areActiveFriends) {
          return res.status(403).json({
            success: false,
            message: 'Friend loans can only be created between ACTIVE Circle friends. Pending friends cannot create loans.',
            errorCode: 'FRIENDSHIP_NOT_ACTIVE',
          });
        }
      } else {
        // Stranger loan
        if (areActiveFriends) {
          return res.status(400).json({
            success: false,
            message: 'Friends must NEVER appear in the stranger Lending/Borrow marketplace. Please use Circle to lend with friends.',
            errorCode: 'CANNOT_LEND_STRANGER_TO_FRIEND',
          });
        }
      }

      if (!purpose || !purpose.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Loan purpose is required.',
          errorCode: 'MISSING_PURPOSE',
        });
      }

      // Deterministic authoritative calculation
      const numAmount = Number(amount);
      const numRate = Math.max(0, Number(interestRate || 0));
      const numDuration = Math.max(1, Math.round(Number(duration || 1)));
      const validFreq: PaymentFrequency = ['weekly', 'biweekly', 'monthly'].includes(frequency)
        ? frequency
        : 'monthly';

      const calc = LoanCalculator.calculate({
        amount: numAmount,
        interestRate: numRate,
        duration: numDuration,
        frequency: validFreq,
      });

      const lenderId = role === 'lender' ? currentUserId : counterpartyId;
      const borrowerId = role === 'lender' ? counterpartyId : currentUserId;

      // Exactly 24 hour bargaining duration
      const now = new Date();
      const bargainingExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const loan = await LoanRepo.create({
        lenderId,
        borrowerId,
        relationshipType, // IMMUTABLE
        amount: calc.principal,
        interestRate: calc.interestRate,
        duration: calc.duration,
        frequency: calc.frequency,
        purpose: purpose.trim(),
        totalInterest: calc.totalInterest,
        totalRepayment: calc.totalRepayment,
        paymentAmount: calc.paymentAmount,
        paymentSchedule: calc.paymentSchedule,
        recoveredAmount: 0,
        repaidAmount: 0,
        remainingAmount: calc.totalRepayment,
        status: 'PENDING',
        bargainingStartedAt: now,
        bargainingExpiresAt,
        finalOfferLocked: false,
      });

      // Record initial proposal in negotiation history
      await LoanNegotiationRepo.create({
        loanId: loan._id.toString(),
        proposedBy: currentUserId,
        amount: calc.principal,
        interestRate: calc.interestRate,
        duration: calc.duration,
        frequency: calc.frequency,
        totalInterest: calc.totalInterest,
        totalRepayment: calc.totalRepayment,
        paymentAmount: calc.paymentAmount,
      });

      // Notify counterparty
      const notificationTitle = role === 'lender' ? 'New Lending Offer' : 'New Borrowing Request';
      const notificationMsg = role === 'lender'
        ? `${req.user.displayName} offered to lend you $${calc.principal.toLocaleString()} at ${calc.interestRate}%.`
        : `${req.user.displayName} requested to borrow $${calc.principal.toLocaleString()} at ${calc.interestRate}%.`;

      await NotificationRepo.create({
        userId: counterpartyId,
        type: role === 'lender' ? 'new_loan_offer' : 'new_borrow_request',
        title: notificationTitle,
        message: notificationMsg,
        relatedLoanId: loan._id.toString(),
      });

      return res.status(201).json({
        success: true,
        data: loan,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to create loan.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  /**
   * Get user's loans with filtering & financial summaries
   */
  async getLoans(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUserId = req.user._id.toString();
      const { status, type, relationship, marketplace } = req.query;

      // Handle Marketplace request for stranger lending / borrowing discovery
      if (marketplace) {
        const marketType = (type as 'lending' | 'borrowing') || 'lending';
        const marketplaceOffers = await LoanRepo.findMarketplaceOffers(currentUserId, marketType);
        return res.json({
          success: true,
          data: {
            loans: marketplaceOffers,
          },
        });
      }

      let loans = await LoanRepo.findForUser(currentUserId);

      // Check for 24-hour bargaining expiry on any pending/bargaining loans
      const now = new Date();
      for (const l of loans) {
        if (
          (l.status === 'PENDING' || l.status === 'BARGAINING') &&
          l.bargainingExpiresAt &&
          new Date(l.bargainingExpiresAt).getTime() <= now.getTime()
        ) {
          // Permanently lock into FINAL OFFER
          await LoanRepo.update(l._id.toString(), {
            status: 'FINAL OFFER',
            finalOfferLocked: true,
            finalOfferAt: l.bargainingExpiresAt,
          });
          l.status = 'FINAL OFFER';
          l.finalOfferLocked = true;
          l.finalOfferAt = l.bargainingExpiresAt;
        }
      }

      // Filter by relationship: 'friend' | 'stranger'
      if (relationship && relationship !== 'all') {
        loans = loans.filter((l) => l.relationshipType === relationship);
      }

      // Filter by type: 'lending' (current user is lender) vs 'borrowing' (current user is borrower)
      if (type && type !== 'all') {
        if (type === 'lending') {
          loans = loans.filter((l) => (l.lenderId?._id || l.lenderId).toString() === currentUserId);
        } else if (type === 'borrowing') {
          loans = loans.filter((l) => (l.borrowerId?._id || l.borrowerId).toString() === currentUserId);
        }
      }

      // Calculate global financial summary
      const lendingLoans = loans.filter(
        (l) => (l.lenderId?._id || l.lenderId).toString() === currentUserId && l.status === 'ACTIVE'
      );
      const totalLent = lendingLoans.reduce((sum, l) => sum + l.amount, 0);
      const totalRecovered = lendingLoans.reduce((sum, l) => sum + (l.recoveredAmount || 0), 0);
      const lendingRemaining = lendingLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

      const borrowingLoans = loans.filter(
        (l) => (l.borrowerId?._id || l.borrowerId).toString() === currentUserId && l.status === 'ACTIVE'
      );
      const totalBorrowed = borrowingLoans.reduce((sum, l) => sum + l.amount, 0);
      const totalRepaid = borrowingLoans.reduce((sum, l) => sum + (l.repaidAmount || 0), 0);
      const borrowingRemaining = borrowingLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

      // Filter by status: 'active' | 'pending' | 'completed'
      let filteredLoans = loans;
      if (status && status !== 'all') {
        if (status === 'active') {
          filteredLoans = loans.filter((l) => l.status === 'ACTIVE');
        } else if (status === 'pending') {
          filteredLoans = loans.filter(
            (l) => l.status === 'PENDING' || l.status === 'BARGAINING' || l.status === 'FINAL OFFER'
          );
        } else if (status === 'completed') {
          filteredLoans = loans.filter((l) => l.status === 'COMPLETED');
        }
      }

      return res.json({
        success: true,
        data: {
          loans: filteredLoans,
          allActiveLoans: loans.filter((l) => l.status === 'ACTIVE'),
          allPendingLoans: loans.filter(
            (l) => l.status === 'PENDING' || l.status === 'BARGAINING' || l.status === 'FINAL OFFER'
          ),
          summary: {
            lending: {
              totalLent: Math.round(totalLent * 100) / 100,
              totalRecovered: Math.round(totalRecovered * 100) / 100,
              remaining: Math.round(lendingRemaining * 100) / 100,
            },
            borrowing: {
              totalBorrowed: Math.round(totalBorrowed * 100) / 100,
              totalRepaid: Math.round(totalRepaid * 100) / 100,
              remaining: Math.round(borrowingRemaining * 100) / 100,
            },
          },
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch loans.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  /**
   * Get single loan details with server-authoritative bargaining expiry check
   */
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const loanId = req.params.id;
      const currentUserId = req.user._id.toString();

      let loan = await LoanRepo.findById(loanId);
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

      // Authoritative 24-hour bargaining check
      const now = new Date();
      let bargainingSecondsLeft = 0;

      if (loan.bargainingExpiresAt) {
        const expiresAtTime = new Date(loan.bargainingExpiresAt).getTime();
        bargainingSecondsLeft = Math.max(0, Math.floor((expiresAtTime - now.getTime()) / 1000));

        if (
          bargainingSecondsLeft === 0 &&
          (loan.status === 'PENDING' || loan.status === 'BARGAINING')
        ) {
          // Expiry reached: Lock into FINAL OFFER permanently
          loan = await LoanRepo.update(loanId, {
            status: 'FINAL OFFER',
            finalOfferLocked: true,
            finalOfferAt: loan.bargainingExpiresAt,
          });
        }
      }

      // Fetch negotiation history
      const negotiations = await LoanNegotiationRepo.findByLoanId(loanId);

      const isLender = lenderId === currentUserId;
      const isBorrower = borrowerId === currentUserId;
      const counterparty = isLender ? loan.borrowerId : loan.lenderId;

      return res.json({
        success: true,
        data: {
          loan,
          isLender,
          isBorrower,
          counterparty,
          negotiations,
          bargainingSecondsLeft,
          isBargainingAvailable:
            (loan.status === 'PENDING' || loan.status === 'BARGAINING') &&
            bargainingSecondsLeft > 0 &&
            !loan.finalOfferLocked,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to load loan details.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  /**
   * Accept loan proposal or Final Offer -> Agreement Confirmation & Activation
   */
  async accept(req: AuthenticatedRequest, res: Response) {
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
          message: 'Unauthorized: You are not a party to this loan.',
          errorCode: 'FORBIDDEN',
        });
      }

      if (!['PENDING', 'BARGAINING', 'FINAL OFFER'].includes(loan.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot accept loan in '${loan.status}' status.`,
          errorCode: 'INVALID_STATUS',
        });
      }

      // Check who made the last proposal in negotiation history
      const negotiations = await LoanNegotiationRepo.findByLoanId(loanId);
      const lastProposal = negotiations[negotiations.length - 1];

      if (lastProposal) {
        const lastProposedBy = (lastProposal.proposedBy?._id || lastProposal.proposedBy).toString();
        if (lastProposedBy === currentUserId && loan.status !== 'FINAL OFFER') {
          return res.status(400).json({
            success: false,
            message: 'You cannot accept your own counter-offer. Awaiting counterparty acceptance.',
            errorCode: 'CANNOT_ACCEPT_OWN_OFFER',
          });
        }
      }

      // Activate Loan: Terms are permanently locked
      const updatedLoan = await LoanRepo.update(loanId, {
        status: 'ACTIVE',
        updatedAt: new Date(),
      });

      const otherUserId = currentUserId === lenderId ? borrowerId : lenderId;
      await NotificationRepo.create({
        userId: otherUserId,
        type: 'offer_accepted',
        title: 'Loan Agreement Activated',
        message: `${req.user.displayName} accepted the terms. The loan of $${loan.amount.toLocaleString()} is now active!`,
        relatedLoanId: loanId,
      });

      return res.json({
        success: true,
        data: {
          loan: updatedLoan,
          message: 'Loan successfully activated! Repayment schedule is now in effect.',
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to accept loan.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  /**
   * Decline loan proposal
   */
  async decline(req: AuthenticatedRequest, res: Response) {
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
          message: 'Unauthorized: You are not a party to this loan.',
          errorCode: 'FORBIDDEN',
        });
      }

      if (!['PENDING', 'BARGAINING', 'FINAL OFFER'].includes(loan.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot decline a loan in '${loan.status}' status.`,
          errorCode: 'INVALID_STATUS',
        });
      }

      // Declined loans: no active balance, no repayment schedule, no active financial impact
      const updatedLoan = await LoanRepo.update(loanId, {
        status: 'DECLINED',
        remainingAmount: 0,
      });

      const otherUserId = currentUserId === lenderId ? borrowerId : lenderId;
      await NotificationRepo.create({
        userId: otherUserId,
        type: 'declined',
        title: 'Loan Declined',
        message: `${req.user.displayName} declined the loan offer for $${loan.amount.toLocaleString()}.`,
        relatedLoanId: loanId,
      });

      return res.json({
        success: true,
        data: {
          loan: updatedLoan,
          message: 'Loan has been declined.',
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to decline loan.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  /**
   * Cancel loan (Creator can cancel pending loan)
   */
  async cancel(req: AuthenticatedRequest, res: Response) {
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

      if (!['PENDING', 'BARGAINING'].includes(loan.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel loan with status '${loan.status}'.`,
          errorCode: 'INVALID_STATUS',
        });
      }

      const updated = await LoanRepo.update(loanId, {
        status: 'CANCELLED',
        remainingAmount: 0,
      });

      const otherUserId = currentUserId === lenderId ? borrowerId : lenderId;
      await NotificationRepo.create({
        userId: otherUserId,
        type: 'cancelled',
        title: 'Loan Request Cancelled',
        message: `${req.user.displayName} cancelled the loan offer.`,
        relatedLoanId: loanId,
      });

      return res.json({
        success: true,
        data: {
          loan: updated,
          message: 'Loan cancelled successfully.',
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to cancel loan.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },
};
