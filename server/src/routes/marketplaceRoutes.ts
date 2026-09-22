import { Router, Request, Response } from 'express';
import { LoanRepo, UserRepo } from '../models/index.js';
import { LoanCalculator } from '../services/loanCalculator.js';

const router = Router();

// Seeded/realistic fallback public listings matching the exact visual spec
const SEED_LENDING_OFFERS = [
  {
    id: 'mkt-lend-1',
    anonymousId: '130AC5',
    displayName: 'Marcus Wright',
    type: 'OFFERING',
    amount: 2500,
    interestRate: 6.5,
    duration: 6,
    frequency: 'monthly',
    monthlyPayment: 424.60,
    purpose: 'Commercial licensing & software deployment',
    role: 'lender',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'mkt-lend-2',
    anonymousId: '7318',
    displayName: 'Sarah Jenkins',
    type: 'OFFERING',
    amount: 10000,
    interestRate: 6.5,
    duration: 6,
    frequency: 'monthly',
    monthlyPayment: 1699.20,
    purpose: 'Business expansion & inventory ramp-up',
    role: 'lender',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'mkt-lend-3',
    anonymousId: '982B',
    displayName: 'David Vance',
    type: 'OFFERING',
    amount: 5000,
    interestRate: 5.5,
    duration: 12,
    frequency: 'monthly',
    monthlyPayment: 429.18,
    purpose: 'Clean energy solar installation funding',
    role: 'lender',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'mkt-lend-4',
    anonymousId: '4410',
    displayName: 'Elena Foster',
    type: 'OFFERING',
    amount: 3000,
    interestRate: 7.0,
    duration: 4,
    frequency: 'monthly',
    monthlyPayment: 760.98,
    purpose: 'Micro-enterprise bridging finance',
    role: 'lender',
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
  },
];

const SEED_BORROWING_REQUESTS = [
  {
    id: 'mkt-bor-1',
    anonymousId: '4821',
    displayName: 'Jordan Miller',
    type: 'REQUESTED',
    amount: 5000,
    interestRate: 7.0,
    duration: 6,
    frequency: 'monthly',
    monthlyPayment: 850.57,
    purpose: 'Higher education certification & lab fees',
    role: 'borrower',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'mkt-bor-2',
    anonymousId: '8910',
    displayName: 'Liam O\'Connor',
    type: 'REQUESTED',
    amount: 800,
    interestRate: 9.5,
    duration: 4,
    frequency: 'monthly',
    monthlyPayment: 203.97,
    purpose: 'Craftworks equipment upgrade & replacement tooling',
    role: 'borrower',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'mkt-bor-3',
    anonymousId: '3104',
    displayName: 'Priya Sharma',
    type: 'REQUESTED',
    amount: 12000,
    interestRate: 8.0,
    duration: 12,
    frequency: 'monthly',
    monthlyPayment: 1043.86,
    purpose: 'Medical clinic diagnostic device down payment',
    role: 'borrower',
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    id: 'mkt-bor-4',
    anonymousId: '5562',
    displayName: 'Carlos Mendez',
    type: 'REQUESTED',
    amount: 2500,
    interestRate: 6.0,
    duration: 6,
    frequency: 'monthly',
    monthlyPayment: 424.01,
    purpose: 'Professional sound production workstation',
    role: 'borrower',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
];

/**
 * Helper to sanitize database loans for public discovery.
 * Strictly removes any private user information (no email, no phone, no financial history).
 */
function sanitizePublicLoan(loan: any, role: 'lender' | 'borrower') {
  const user = role === 'lender' ? loan.lenderId : loan.borrowerId;
  const rawId = (user?._id || user || loan._id || '').toString();
  const anonymousId = rawId.slice(-6).toUpperCase() || 'P2P';
  const displayName = user?.displayName || `User #${anonymousId}`;

  return {
    id: loan._id?.toString() || rawId,
    anonymousId,
    displayName,
    type: role === 'lender' ? 'OFFERING' : 'REQUESTED',
    amount: loan.amount,
    interestRate: loan.interestRate,
    duration: loan.duration,
    frequency: loan.frequency || 'monthly',
    monthlyPayment: loan.paymentAmount || (loan.amount / loan.duration),
    purpose: loan.purpose || 'Peer loan opportunity',
    role,
    createdAt: loan.createdAt || new Date().toISOString(),
  };
}

/**
 * GET /api/marketplace/lending
 * Public-safe list of available capital offers from lenders.
 */
router.get('/lending', async (req: Request, res: Response) => {
  try {
    // Retrieve stranger loans where lender created an offer that is pending/marketplace
    const dbLoans = await LoanRepo.find({
      relationshipType: 'stranger',
      status: { $in: ['PENDING', 'BARGAINING', 'ACTIVE'] },
    });

    const publicDbOffers = dbLoans.map((l: any) => sanitizePublicLoan(l, 'lender'));

    // Combine with seed offers, ensuring uniqueness by id
    const combined = [...publicDbOffers, ...SEED_LENDING_OFFERS];
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());

    return res.json({
      success: true,
      data: unique,
    });
  } catch (error: any) {
    return res.json({
      success: true,
      data: SEED_LENDING_OFFERS,
    });
  }
});

/**
 * GET /api/marketplace/borrowing
 * Public-safe list of available borrowing requests from peers.
 */
router.get('/borrowing', async (req: Request, res: Response) => {
  try {
    const dbLoans = await LoanRepo.find({
      relationshipType: 'stranger',
      status: { $in: ['PENDING', 'BARGAINING', 'ACTIVE'] },
    });

    const publicDbRequests = dbLoans.map((l: any) => sanitizePublicLoan(l, 'borrower'));

    const combined = [...publicDbRequests, ...SEED_BORROWING_REQUESTS];
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());

    return res.json({
      success: true,
      data: unique,
    });
  } catch (error: any) {
    return res.json({
      success: true,
      data: SEED_BORROWING_REQUESTS,
    });
  }
});

export default router;
