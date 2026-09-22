import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  inMemoryStore,
  UserRepo,
  FriendConnectionRepo,
  LoanRepo,
  LoanPaymentRepo,
  LoanNegotiationRepo,
  NotificationRepo,
  UserModel,
  FriendConnectionModel,
  LoanModel,
  LoanPaymentModel,
  LoanNegotiationModel,
  NotificationModel,
} from '../models/index.js';
import { isDbConnected } from '../config/db.js';
import { LoanCalculator } from '../services/loanCalculator.js';

export async function seedDatabase() {
  console.log('[Fundly Seed] Seeding development data...');
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  // If DB is connected, check if already seeded
  if (isDbConnected()) {
    const userCount = await UserModel.countDocuments();
    if (userCount > 0) {
      console.log('[Fundly Seed] Database already contains data, skipping seed.');
      return;
    }
  } else {
    if (inMemoryStore.users.length > 0) {
      return;
    }
  }

  // 1. Create Core Users
  const user1 = await UserRepo.create({
    displayName: 'Alex Rivera',
    email: 'alex@fundly.demo',
    passwordHash: defaultPasswordHash,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  // Also support alex@fundly.app
  await UserRepo.create({
    displayName: 'Alex Rivera (App)',
    email: 'alex@fundly.app',
    passwordHash: defaultPasswordHash,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  const friendElena = await UserRepo.create({
    displayName: 'Elena Vance',
    email: 'elena@fundly.app',
    passwordHash: defaultPasswordHash,
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  });

  const friendMichael = await UserRepo.create({
    displayName: 'Michael Chang',
    email: 'michael@fundly.demo',
    passwordHash: defaultPasswordHash,
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  });

  const friendDavid = await UserRepo.create({
    displayName: 'David Chen',
    email: 'david@fundly.app',
    passwordHash: defaultPasswordHash,
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  });

  const strangerMarcus = await UserRepo.create({
    displayName: 'Marcus Wright',
    email: 'marcus@peerlink.io',
    passwordHash: defaultPasswordHash,
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  });

  const strangerSarah = await UserRepo.create({
    displayName: 'Sarah Jenkins',
    email: 'sarah@fundly.demo',
    passwordHash: defaultPasswordHash,
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  });

  // Also support sarah@globalventures.com
  await UserRepo.create({
    displayName: 'Sarah Jenkins (GV)',
    email: 'sarah@globalventures.com',
    passwordHash: defaultPasswordHash,
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  });

  const strangerLiam = await UserRepo.create({
    displayName: 'Liam O\'Connor',
    email: 'liam@craftworks.co',
    passwordHash: defaultPasswordHash,
    photoURL: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  });

  const strangerMaya = await UserRepo.create({
    displayName: 'Maya Patel',
    email: 'maya@solaris.net',
    passwordHash: defaultPasswordHash,
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  });

  const strangerKevin = await UserRepo.create({
    displayName: 'Kevin Zhao',
    email: 'kevin@nexusgrowth.com',
    passwordHash: defaultPasswordHash,
    photoURL: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
  });

  const alexId = user1._id.toString();
  const elenaId = friendElena._id.toString();
  const michaelId = friendMichael._id.toString();
  const davidId = friendDavid._id.toString();
  const marcusId = strangerMarcus._id.toString();
  const sarahId = strangerSarah._id.toString();
  const liamId = strangerLiam._id.toString();
  const mayaId = strangerMaya._id.toString();
  const kevinId = strangerKevin._id.toString();

  // 2. Friend Connections
  // Active friend: Elena Vance
  await FriendConnectionRepo.create({
    userA: alexId,
    userB: elenaId,
    invitedBy: alexId,
    inviteCode: 'FUNDLY-4821',
    status: 'ACTIVE',
  });

  // Active friend: Michael Chang
  await FriendConnectionRepo.create({
    userA: alexId,
    userB: michaelId,
    invitedBy: michaelId,
    inviteCode: 'FUNDLY-7712',
    status: 'ACTIVE',
  });

  // Pending friend invitation: David Chen
  await FriendConnectionRepo.create({
    userA: alexId,
    userB: davidId,
    invitedBy: alexId,
    inviteCode: 'FUNDLY-9014',
    status: 'PENDING',
  });

  // 3. Loans & Scenarios
  // Scenario A: Active Friend Loan (Alex lent to Elena Vance: $1,200 @ 0% interest, 4 months, bi-weekly)
  const calcFriendActive = LoanCalculator.calculate({
    amount: 1200,
    interestRate: 0,
    duration: 4,
    frequency: 'biweekly',
  });
  // Elena has made 2 payments ($300 total)
  const friendActiveLoan = await LoanRepo.create({
    lenderId: alexId,
    borrowerId: elenaId,
    relationshipType: 'friend',
    amount: calcFriendActive.principal,
    interestRate: calcFriendActive.interestRate,
    duration: calcFriendActive.duration,
    frequency: calcFriendActive.frequency,
    purpose: 'Equipment upgrade for photography studio',
    totalInterest: calcFriendActive.totalInterest,
    totalRepayment: calcFriendActive.totalRepayment,
    paymentAmount: calcFriendActive.paymentAmount,
    paymentSchedule: calcFriendActive.paymentSchedule,
    recoveredAmount: 300,
    repaidAmount: 300,
    remainingAmount: 900,
    status: 'ACTIVE',
  });
  await LoanPaymentRepo.create({
    loanId: friendActiveLoan._id.toString(),
    paidBy: elenaId,
    amount: 150,
    paymentMethod: 'Bank Transfer (Verified)',
  });
  await LoanPaymentRepo.create({
    loanId: friendActiveLoan._id.toString(),
    paidBy: elenaId,
    amount: 150,
    paymentMethod: 'Bank Transfer (Verified)',
  });

  // Scenario B: Active Stranger Loan (Marcus Wright lent to Alex: $2,500 @ 6.5%, 6 months, monthly)
  const calcStrangerActive = LoanCalculator.calculate({
    amount: 2500,
    interestRate: 6.5,
    duration: 6,
    frequency: 'monthly',
  });
  const strangerActiveLoan = await LoanRepo.create({
    lenderId: marcusId,
    borrowerId: alexId,
    relationshipType: 'stranger',
    amount: calcStrangerActive.principal,
    interestRate: calcStrangerActive.interestRate,
    duration: calcStrangerActive.duration,
    frequency: calcStrangerActive.frequency,
    purpose: 'Commercial licensing & software deployment',
    totalInterest: calcStrangerActive.totalInterest,
    totalRepayment: calcStrangerActive.totalRepayment,
    paymentAmount: calcStrangerActive.paymentAmount,
    paymentSchedule: calcStrangerActive.paymentSchedule,
    recoveredAmount: 424.63,
    repaidAmount: 424.63,
    remainingAmount: Math.round((calcStrangerActive.totalRepayment - 424.63) * 100) / 100,
    status: 'ACTIVE',
  });
  await LoanPaymentRepo.create({
    loanId: strangerActiveLoan._id.toString(),
    paidBy: alexId,
    amount: 424.63,
    paymentMethod: 'Fundly Instant Settlement',
  });

  // Scenario C: Bargaining Loan (Pending Stranger Loan with Sarah Jenkins: $3,000 @ 8% initial -> counter offered to 7%)
  const now = new Date();
  const bargainingStartedAt = new Date(now.getTime() - (4 * 60 * 60 * 1000)); // 4 hours ago
  const bargainingExpiresAt = new Date(bargainingStartedAt.getTime() + (24 * 60 * 60 * 1000)); // 20 hours remaining!

  const calcBargainCurrent = LoanCalculator.calculate({
    amount: 3000,
    interestRate: 7.0, // Counter offer reduced by 1 percentage point
    duration: 6,
    frequency: 'monthly',
  });

  const bargainingLoan = await LoanRepo.create({
    lenderId: alexId,
    borrowerId: sarahId,
    relationshipType: 'stranger',
    amount: calcBargainCurrent.principal,
    interestRate: calcBargainCurrent.interestRate,
    duration: calcBargainCurrent.duration,
    frequency: calcBargainCurrent.frequency,
    purpose: 'Bridge capital for export inventory shipment',
    totalInterest: calcBargainCurrent.totalInterest,
    totalRepayment: calcBargainCurrent.totalRepayment,
    paymentAmount: calcBargainCurrent.paymentAmount,
    paymentSchedule: calcBargainCurrent.paymentSchedule,
    recoveredAmount: 0,
    repaidAmount: 0,
    remainingAmount: calcBargainCurrent.totalRepayment,
    status: 'BARGAINING',
    bargainingStartedAt,
    bargainingExpiresAt,
  });

  // Initial offer was 8%
  const calcBargainInit = LoanCalculator.calculate({
    amount: 3000,
    interestRate: 8.0,
    duration: 6,
    frequency: 'monthly',
  });
  await LoanNegotiationRepo.create({
    loanId: bargainingLoan._id.toString(),
    proposedBy: alexId,
    amount: 3000,
    interestRate: 8.0,
    duration: 6,
    frequency: 'monthly',
    totalInterest: calcBargainInit.totalInterest,
    totalRepayment: calcBargainInit.totalRepayment,
    paymentAmount: calcBargainInit.paymentAmount,
  });

  // Sarah countered to 7.0%
  await LoanNegotiationRepo.create({
    loanId: bargainingLoan._id.toString(),
    proposedBy: sarahId,
    amount: 3000,
    interestRate: 7.0,
    duration: 6,
    frequency: 'monthly',
    totalInterest: calcBargainCurrent.totalInterest,
    totalRepayment: calcBargainCurrent.totalRepayment,
    paymentAmount: calcBargainCurrent.paymentAmount,
  });

  // Scenario D: Final Offer Loan (24-hour window EXPIRED with Liam O'Connor: $1,500 @ 5.5%)
  const expiredBargainingStarted = new Date(now.getTime() - (26 * 60 * 60 * 1000)); // 26 hours ago
  const expiredBargainingEnded = new Date(expiredBargainingStarted.getTime() + (24 * 60 * 60 * 1000)); // 2 hours ago

  const calcFinalOffer = LoanCalculator.calculate({
    amount: 1500,
    interestRate: 5.5,
    duration: 3,
    frequency: 'monthly',
  });

  const finalOfferLoan = await LoanRepo.create({
    lenderId: liamId,
    borrowerId: alexId,
    relationshipType: 'stranger',
    amount: calcFinalOffer.principal,
    interestRate: calcFinalOffer.interestRate,
    duration: calcFinalOffer.duration,
    frequency: calcFinalOffer.frequency,
    purpose: 'Refurbish mobile workshop machinery',
    totalInterest: calcFinalOffer.totalInterest,
    totalRepayment: calcFinalOffer.totalRepayment,
    paymentAmount: calcFinalOffer.paymentAmount,
    paymentSchedule: calcFinalOffer.paymentSchedule,
    recoveredAmount: 0,
    repaidAmount: 0,
    remainingAmount: calcFinalOffer.totalRepayment,
    status: 'FINAL OFFER',
    bargainingStartedAt: expiredBargainingStarted,
    bargainingExpiresAt: expiredBargainingEnded,
    finalOfferLocked: true,
    finalOfferAt: expiredBargainingEnded,
  });

  await LoanNegotiationRepo.create({
    loanId: finalOfferLoan._id.toString(),
    proposedBy: liamId,
    amount: 1500,
    interestRate: 5.5,
    duration: 3,
    frequency: 'monthly',
    totalInterest: calcFinalOffer.totalInterest,
    totalRepayment: calcFinalOffer.totalRepayment,
    paymentAmount: calcFinalOffer.paymentAmount,
  });

  // Scenario E: Completed Stranger Loan with Kevin Zhao ($800 @ 4.0%, fully settled)
  const calcCompleted = LoanCalculator.calculate({
    amount: 800,
    interestRate: 4.0,
    duration: 2,
    frequency: 'monthly',
  });
  const completedLoan = await LoanRepo.create({
    lenderId: alexId,
    borrowerId: kevinId,
    relationshipType: 'stranger',
    amount: calcCompleted.principal,
    interestRate: calcCompleted.interestRate,
    duration: calcCompleted.duration,
    frequency: calcCompleted.frequency,
    purpose: 'Emergency server redundancy setup',
    totalInterest: calcCompleted.totalInterest,
    totalRepayment: calcCompleted.totalRepayment,
    paymentAmount: calcCompleted.paymentAmount,
    paymentSchedule: calcCompleted.paymentSchedule.map((s) => ({ ...s, status: 'paid' })),
    recoveredAmount: calcCompleted.totalRepayment,
    repaidAmount: calcCompleted.totalRepayment,
    remainingAmount: 0,
    status: 'COMPLETED',
  });
  await LoanPaymentRepo.create({
    loanId: completedLoan._id.toString(),
    paidBy: kevinId,
    amount: calcCompleted.totalRepayment,
    paymentMethod: 'Direct Wire',
  });

  // Scenario F: Stranger Marketplace Opportunities
  // Maya Patel seeks borrower or lender:
  const calcMarketplace = LoanCalculator.calculate({
    amount: 4500,
    interestRate: 6.0,
    duration: 12,
    frequency: 'monthly',
  });
  await LoanRepo.create({
    lenderId: mayaId,
    borrowerId: kevinId,
    relationshipType: 'stranger',
    amount: calcMarketplace.principal,
    interestRate: calcMarketplace.interestRate,
    duration: calcMarketplace.duration,
    frequency: calcMarketplace.frequency,
    purpose: 'Logistics expansion & cold-chain storage lease',
    totalInterest: calcMarketplace.totalInterest,
    totalRepayment: calcMarketplace.totalRepayment,
    paymentAmount: calcMarketplace.paymentAmount,
    paymentSchedule: calcMarketplace.paymentSchedule,
    recoveredAmount: 0,
    repaidAmount: 0,
    remainingAmount: calcMarketplace.totalRepayment,
    status: 'PENDING',
  });

  // 4. Create Notifications for Alex
  await NotificationRepo.create({
    userId: alexId,
    type: 'counter_offer',
    title: 'Counter-Offer Received',
    message: 'Sarah Jenkins proposed 7.00% on the $3,000 Bridge capital loan.',
    relatedLoanId: bargainingLoan._id.toString(),
    relatedNegotiationId: bargainingLoan._id.toString(),
  });

  await NotificationRepo.create({
    userId: alexId,
    type: 'bargaining_expiry',
    title: 'Final Offer Locked',
    message: '24-hour negotiation window ended for Liam O\'Connor\'s $1,500 loan. Final offer is ready.',
    relatedLoanId: finalOfferLoan._id.toString(),
  });

  await NotificationRepo.create({
    userId: alexId,
    type: 'payment_received',
    title: 'Repayment Received',
    message: 'Elena Vance paid $150.00 towards Studio equipment upgrade loan.',
    relatedLoanId: friendActiveLoan._id.toString(),
  });

  await NotificationRepo.create({
    userId: alexId,
    type: 'friend_invitation',
    title: 'Friend Request Pending',
    message: 'David Chen is awaiting your circle confirmation (Code: FUNDLY-9014).',
  });

  console.log('[Fundly Seed] Seeding complete successfully with rich demo data!');
}
