/**
 * Deterministic Financial Loan Calculation Engine
 * Location: server/src/services/loanCalculator.ts
 *
 * CRITICAL RULE: Authoritative backend calculator for all loan calculations.
 * Supports weekly, bi-weekly, and monthly payments, including 0% interest loans.
 * All calculations are 100% deterministic with zero floating point drift and exact 0.00 final balance.
 */

export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface PaymentScheduleItem {
  paymentNumber: number;
  dueDate: string; // ISO date string
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface LoanCalculationInput {
  amount: number;
  interestRate: number; // Annual rate in percentage (e.g. 5 for 5%, 0 for 0%)
  duration: number; // in months
  frequency: PaymentFrequency;
  startDate?: string;
}

export interface LoanCalculationResult {
  principal: number;
  interestRate: number;
  duration: number;
  frequency: PaymentFrequency;
  numberOfPayments: number;
  periodicRate: number;
  paymentAmount: number;
  totalInterest: number;
  totalRepayment: number;
  paymentSchedule: PaymentScheduleItem[];
}

/**
 * Rounds a number to exactly 2 decimal places using Number.EPSILON to eliminate IEEE-754 precision drift.
 */
export function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class LoanCalculator {
  /**
   * Computes the periodic interest rate from the annual rate:
   * - weekly: rate / 52 / 100
   * - biweekly: rate / 26 / 100
   * - monthly: rate / 12 / 100
   */
  public static getPeriodicRate(annualRate: number, frequency: PaymentFrequency): number {
    const rate = Math.max(0, annualRate);
    if (rate === 0) return 0;

    switch (frequency) {
      case 'weekly':
        return (rate / 52) / 100;
      case 'biweekly':
        return (rate / 26) / 100;
      case 'monthly':
      default:
        return (rate / 12) / 100;
    }
  }

  /**
   * Computes the total number of payments:
   * - weekly: durationInMonths * (52 / 12) -> rounded to nearest whole payment
   * - biweekly: durationInMonths * (26 / 12) -> rounded to nearest whole payment
   * - monthly: durationInMonths
   */
  public static getNumberOfPayments(durationMonths: number, frequency: PaymentFrequency): number {
    const duration = Math.max(1, Math.round(durationMonths));
    switch (frequency) {
      case 'weekly':
        return Math.max(1, Math.round(duration * (52 / 12)));
      case 'biweekly':
        return Math.max(1, Math.round(duration * (26 / 12)));
      case 'monthly':
      default:
        return duration;
    }
  }

  /**
   * Computes standard periodic amortization payment:
   * If r == 0: payment = P / n
   * If r > 0: payment = P * [ r * (1 + r)^n ] / [ (1 + r)^n - 1 ]
   */
  public static calculatePeriodicPayment(principal: number, periodicRate: number, numberOfPayments: number): number {
    if (numberOfPayments <= 0) return principal;
    if (periodicRate === 0) {
      return roundToCents(principal / numberOfPayments);
    }
    const factor = Math.pow(1 + periodicRate, numberOfPayments);
    const rawPayment = principal * ((periodicRate * factor) / (factor - 1));
    return roundToCents(rawPayment);
  }

  /**
   * Calculates all loan financial metrics deterministically and generates the amortization schedule.
   */
  public static calculate(input: LoanCalculationInput): LoanCalculationResult {
    const principal = roundToCents(Number(input.amount));
    const annualRate = Math.max(0, Number(input.interestRate || 0));
    const durationMonths = Math.max(1, Math.round(Number(input.duration || 1)));
    const frequency: PaymentFrequency = input.frequency || 'monthly';
    const startDate = input.startDate ? new Date(input.startDate) : new Date();

    if (principal <= 0) {
      throw new Error('Loan amount must be greater than zero.');
    }

    const numberOfPayments = LoanCalculator.getNumberOfPayments(durationMonths, frequency);
    const periodicRate = LoanCalculator.getPeriodicRate(annualRate, frequency);
    const regularPayment = LoanCalculator.calculatePeriodicPayment(principal, periodicRate, numberOfPayments);

    // Generate accurate amortization schedule with exact 0.00 final balance
    const schedule: PaymentScheduleItem[] = [];
    let currentBalance = principal;

    for (let i = 1; i <= numberOfPayments; i++) {
      const dueDate = new Date(startDate.getTime());
      if (frequency === 'weekly') {
        dueDate.setDate(dueDate.getDate() + (i * 7));
      } else if (frequency === 'biweekly') {
        dueDate.setDate(dueDate.getDate() + (i * 14));
      } else {
        dueDate.setMonth(dueDate.getMonth() + i);
      }

      let interestPortion = 0;
      let principalPortion = 0;
      let itemAmount = 0;

      if (i < numberOfPayments) {
        // Standard payment period
        if (periodicRate === 0) {
          interestPortion = 0;
          principalPortion = Math.min(currentBalance, regularPayment);
          itemAmount = principalPortion;
        } else {
          interestPortion = roundToCents(currentBalance * periodicRate);
          principalPortion = roundToCents(regularPayment - interestPortion);
          if (principalPortion > currentBalance) {
            principalPortion = currentBalance;
          }
          itemAmount = roundToCents(principalPortion + interestPortion);
        }
        currentBalance = roundToCents(Math.max(0, currentBalance - principalPortion));
      } else {
        // FINAL PAYMENT: Adjust for any fractional-cent rounding discrepancy
        // Remaining principal is paid off entirely down to the cent
        principalPortion = currentBalance;
        if (periodicRate === 0) {
          interestPortion = 0;
        } else {
          interestPortion = roundToCents(currentBalance * periodicRate);
        }
        itemAmount = roundToCents(principalPortion + interestPortion);
        currentBalance = 0; // Guaranteed EXACTLY 0.00
      }

      schedule.push({
        paymentNumber: i,
        dueDate: dueDate.toISOString(),
        amount: itemAmount,
        principal: principalPortion,
        interest: interestPortion,
        remainingBalance: currentBalance,
        status: 'pending',
      });
    }

    // Sum totals directly from the generated schedule
    const totalRepayment = roundToCents(schedule.reduce((sum, item) => sum + item.amount, 0));
    const totalInterest = roundToCents(schedule.reduce((sum, item) => sum + item.interest, 0));

    return {
      principal,
      interestRate: annualRate,
      duration: durationMonths,
      frequency,
      numberOfPayments,
      periodicRate,
      paymentAmount: schedule[0]?.amount || regularPayment,
      totalInterest,
      totalRepayment,
      paymentSchedule: schedule,
    };
  }

  /**
   * Applies a repayment to the loan schedule and computes the updated remaining balance.
   */
  public static applyRepayment(
    paymentSchedule: PaymentScheduleItem[],
    paymentAmount: number,
    currentRemaining: number
  ): {
    updatedSchedule: PaymentScheduleItem[];
    newRemaining: number;
    isFullyPaid: boolean;
  } {
    const payment = roundToCents(Number(paymentAmount));
    let remainingToDistribute = payment;
    const updatedSchedule = paymentSchedule.map((item) => ({ ...item }));

    for (const item of updatedSchedule) {
      if (item.status === 'pending' || item.status === 'overdue') {
        if (remainingToDistribute >= item.amount) {
          item.status = 'paid';
          remainingToDistribute = roundToCents(remainingToDistribute - item.amount);
        } else {
          break;
        }
      }
    }

    const newRemaining = Math.max(0, roundToCents(currentRemaining - payment));
    const isFullyPaid = newRemaining <= 0.001;

    if (isFullyPaid) {
      for (const item of updatedSchedule) {
        item.status = 'paid';
        item.remainingBalance = 0;
      }
    }

    return {
      updatedSchedule,
      newRemaining: isFullyPaid ? 0 : newRemaining,
      isFullyPaid,
    };
  }
}

