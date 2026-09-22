import { Response } from 'express';
import {
  LoanRepo,
  LoanPaymentRepo,
  NotificationRepo,
} from '../models/index.js';
import { LoanCalculator, roundToCents } from '../services/loanCalculator.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const paymentController = {
  /**
   * Get all payments made on a loan
   */
  async getPayments(req: AuthenticatedRequest, res: Response) {
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

      const payments = await LoanPaymentRepo.findByLoanId(loanId);
      return res.json({
        success: true,
        data: payments,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch payments.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  /**
   * Process a repayment on an active loan
   */
  async makePayment(req: AuthenticatedRequest, res: Response) {
    try {
      const loanId = req.params.id;
      const currentUserId = req.user._id.toString();
      const { amount, paymentMethod } = req.body;

      const loan = await LoanRepo.findById(loanId);
      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found.',
          errorCode: 'LOAN_NOT_FOUND',
        });
      }

      if (loan.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: `Cannot make repayments on a loan with status '${loan.status}'. Only active loans accept repayments.`,
          errorCode: 'LOAN_NOT_ACTIVE',
        });
      }

      const borrowerId = (loan.borrowerId?._id || loan.borrowerId).toString();
      const lenderId = (loan.lenderId?._id || loan.lenderId).toString();

      if (borrowerId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only the borrower can make repayments on this loan.',
          errorCode: 'UNAUTHORIZED_PAYER',
        });
      }

      const paymentAmt = roundToCents(Number(amount));
      if (isNaN(paymentAmt) || paymentAmt <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount must be greater than zero.',
          errorCode: 'INVALID_AMOUNT',
        });
      }

      if (paymentAmt > roundToCents(loan.remainingAmount + 0.05)) {
        return res.status(400).json({
          success: false,
          message: `Payment amount ($${paymentAmt.toFixed(2)}) cannot exceed remaining balance ($${loan.remainingAmount.toFixed(2)}).`,
          errorCode: 'EXCEEDS_REMAINING',
        });
      }

      // Record payment
      const payment = await LoanPaymentRepo.create({
        loanId,
        paidBy: currentUserId,
        amount: paymentAmt,
        paymentMethod: paymentMethod || 'Fundly Instant Settlement',
      });

      // Update financial values deterministically
      const { updatedSchedule, newRemaining, isFullyPaid } = LoanCalculator.applyRepayment(
        loan.paymentSchedule || [],
        paymentAmt,
        loan.remainingAmount
      );

      const newRecovered = roundToCents((loan.recoveredAmount || 0) + paymentAmt);
      const newRepaid = roundToCents((loan.repaidAmount || 0) + paymentAmt);

      const updateData: any = {
        recoveredAmount: newRecovered,
        repaidAmount: newRepaid,
        remainingAmount: newRemaining,
        paymentSchedule: updatedSchedule,
      };

      if (isFullyPaid) {
        updateData.status = 'COMPLETED';
      }

      const updatedLoan = await LoanRepo.update(loanId, updateData);

      // Create notification for lender
      await NotificationRepo.create({
        userId: lenderId,
        type: isFullyPaid ? 'loan_completed' : 'payment_received',
        title: isFullyPaid ? 'Loan Fully Settled & Completed!' : 'Repayment Received',
        message: isFullyPaid
          ? `${req.user.displayName} made the final repayment of $${paymentAmt.toFixed(2)}. The loan of $${loan.amount.toLocaleString()} is now completed!`
          : `${req.user.displayName} paid $${paymentAmt.toFixed(2)} on the $${loan.amount.toLocaleString()} loan. Remaining balance: $${newRemaining.toFixed(2)}.`,
        relatedLoanId: loanId,
      });

      return res.json({
        success: true,
        data: {
          payment,
          loan: updatedLoan,
          isCompleted: isFullyPaid,
          message: isFullyPaid
            ? 'Loan has been fully repaid and marked as COMPLETED!'
            : 'Payment recorded successfully.',
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Payment processing failed.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },
};

