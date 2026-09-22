import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { isDbConnected } from '../config/db.js';
import {
  UserModel,
  FriendConnectionModel,
  LoanModel,
  LoanPaymentModel,
  LoanNegotiationModel,
  NotificationModel,
  IUser,
  IFriendConnection,
  ILoan,
  ILoanPayment,
  ILoanNegotiation,
  INotification,
} from './schemas.js';
import { LoanCalculator } from '../services/loanCalculator.js';

// Re-export schemas & types
export * from './schemas.js';

// In-Memory Fallback Collections with complete MongoDB simulation
interface DBStore {
  users: any[];
  friendConnections: any[];
  loans: any[];
  loanPayments: any[];
  loanNegotiations: any[];
  notifications: any[];
}

export const inMemoryStore: DBStore = {
  users: [],
  friendConnections: [],
  loans: [],
  loanPayments: [],
  loanNegotiations: [],
  notifications: [],
};

function generateId(): string {
  return new mongoose.Types.ObjectId().toString();
}

/**
 * Helper to populate user fields in objects
 */
export function populateLoan(loan: any, users: any[]) {
  if (!loan) return null;
  const clone = { ...loan };
  const lender = users.find((u) => u._id.toString() === (clone.lenderId?._id || clone.lenderId)?.toString());
  const borrower = users.find((u) => u._id.toString() === (clone.borrowerId?._id || clone.borrowerId)?.toString());

  clone.lenderId = lender ? { _id: lender._id, displayName: lender.displayName, email: lender.email, photoURL: lender.photoURL } : clone.lenderId;
  clone.borrowerId = borrower ? { _id: borrower._id, displayName: borrower.displayName, email: borrower.email, photoURL: borrower.photoURL } : clone.borrowerId;
  return clone;
}

export function populateFriendConnection(fc: any, users: any[]) {
  if (!fc) return null;
  const clone = { ...fc };
  const userA = users.find((u) => u._id.toString() === (clone.userA?._id || clone.userA)?.toString());
  const userB = users.find((u) => u._id.toString() === (clone.userB?._id || clone.userB)?.toString());
  const invitedBy = users.find((u) => u._id.toString() === (clone.invitedBy?._id || clone.invitedBy)?.toString());

  clone.userA = userA ? { _id: userA._id, displayName: userA.displayName, email: userA.email } : clone.userA;
  clone.userB = userB ? { _id: userB._id, displayName: userB.displayName, email: userB.email } : clone.userB;
  clone.invitedBy = invitedBy ? { _id: invitedBy._id, displayName: invitedBy.displayName, email: invitedBy.email } : clone.invitedBy;
  return clone;
}

/**
 * User Repository
 */
export const UserRepo = {
  async findById(id: string): Promise<any> {
    if (isDbConnected()) {
      return await UserModel.findById(id).lean();
    }
    return inMemoryStore.users.find((u) => u._id.toString() === id.toString()) || null;
  },

  async findByEmail(email: string): Promise<any> {
    if (isDbConnected()) {
      return await UserModel.findOne({ email: email.toLowerCase() }).lean();
    }
    return inMemoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async create(data: { displayName: string; email: string; passwordHash: string; photoURL?: string }): Promise<any> {
    if (isDbConnected()) {
      const user = new UserModel({
        ...data,
        email: data.email.toLowerCase(),
      });
      return await user.save();
    }
    const newUser = {
      _id: generateId(),
      displayName: data.displayName,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      photoURL: data.photoURL || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.users.push(newUser);
    return newUser;
  },

  async search(query: string, excludeUserId?: string): Promise<any[]> {
    const q = query.toLowerCase().trim();
    if (isDbConnected()) {
      const filter: any = {
        $or: [
          { displayName: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      };
      if (excludeUserId) {
        filter._id = { $ne: excludeUserId };
      }
      return await UserModel.find(filter).select('-passwordHash').lean();
    }
    return inMemoryStore.users
      .filter((u) => {
        if (excludeUserId && u._id.toString() === excludeUserId.toString()) return false;
        if (!q) return true;
        return u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      })
      .map(({ passwordHash, ...rest }) => rest);
  },

  async getAll(): Promise<any[]> {
    if (isDbConnected()) {
      return await UserModel.find().select('-passwordHash').lean();
    }
    return inMemoryStore.users.map(({ passwordHash, ...rest }) => rest);
  }
};

/**
 * FriendConnection Repository
 */
export const FriendConnectionRepo = {
  async findConnectionsForUser(userId: string): Promise<any[]> {
    const uId = userId.toString();
    if (isDbConnected()) {
      return await FriendConnectionModel.find({
        $or: [{ userA: uId }, { userB: uId }],
        status: { $ne: 'REMOVED' },
      })
        .populate('userA', 'displayName email photoURL')
        .populate('userB', 'displayName email photoURL')
        .populate('invitedBy', 'displayName email')
        .lean();
    }
    const connections = inMemoryStore.friendConnections.filter(
      (c) =>
        (c.userA.toString() === uId || c.userB.toString() === uId) &&
        c.status !== 'REMOVED'
    );
    return connections.map((c) => populateFriendConnection(c, inMemoryStore.users));
  },

  async findActiveFriendIds(userId: string): Promise<string[]> {
    const uId = userId.toString();
    const connections = await this.findConnectionsForUser(uId);
    const friendIds: string[] = [];
    for (const c of connections) {
      if (c.status === 'ACTIVE') {
        const otherId = (c.userA?._id || c.userA).toString() === uId ? (c.userB?._id || c.userB).toString() : (c.userA?._id || c.userA).toString();
        friendIds.push(otherId);
      }
    }
    return friendIds;
  },

  async areActiveFriends(user1: string, user2: string): Promise<boolean> {
    const u1 = user1.toString();
    const u2 = user2.toString();
    if (u1 === u2) return false;
    const activeFriends = await this.findActiveFriendIds(u1);
    return activeFriends.includes(u2);
  },

  async findById(id: string): Promise<any> {
    if (isDbConnected()) {
      return await FriendConnectionModel.findById(id)
        .populate('userA', 'displayName email photoURL')
        .populate('userB', 'displayName email photoURL')
        .populate('invitedBy', 'displayName email')
        .lean();
    }
    const conn = inMemoryStore.friendConnections.find((c) => c._id.toString() === id.toString());
    return populateFriendConnection(conn, inMemoryStore.users);
  },

  async findByInviteCode(code: string): Promise<any> {
    const cleanCode = code.toUpperCase().trim();
    if (isDbConnected()) {
      return await FriendConnectionModel.findOne({ inviteCode: cleanCode })
        .populate('userA', 'displayName email')
        .populate('userB', 'displayName email')
        .populate('invitedBy', 'displayName email')
        .lean();
    }
    const conn = inMemoryStore.friendConnections.find((c) => c.inviteCode === cleanCode);
    return populateFriendConnection(conn, inMemoryStore.users);
  },

  async create(data: {
    userA: string;
    userB: string;
    invitedBy: string;
    inviteCode: string;
    status?: 'PENDING' | 'ACTIVE';
  }): Promise<any> {
    if (isDbConnected()) {
      const conn = new FriendConnectionModel({
        ...data,
        status: data.status || 'PENDING',
      });
      return await conn.save();
    }
    const newConn = {
      _id: generateId(),
      userA: data.userA,
      userB: data.userB,
      invitedBy: data.invitedBy,
      inviteCode: data.inviteCode,
      status: data.status || 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      acceptedAt: data.status === 'ACTIVE' ? new Date() : undefined,
    };
    inMemoryStore.friendConnections.push(newConn);
    return populateFriendConnection(newConn, inMemoryStore.users);
  },

  async updateStatus(id: string, status: 'PENDING' | 'ACTIVE' | 'REMOVED'): Promise<any> {
    if (isDbConnected()) {
      const updateData: any = { status };
      if (status === 'ACTIVE') updateData.acceptedAt = new Date();
      return await FriendConnectionModel.findByIdAndUpdate(id, updateData, { new: true })
        .populate('userA', 'displayName email')
        .populate('userB', 'displayName email')
        .lean();
    }
    const conn = inMemoryStore.friendConnections.find((c) => c._id.toString() === id.toString());
    if (conn) {
      conn.status = status;
      conn.updatedAt = new Date();
      if (status === 'ACTIVE') conn.acceptedAt = new Date();
    }
    return populateFriendConnection(conn, inMemoryStore.users);
  },
};

/**
 * Loan Repository
 */
export const LoanRepo = {
  async findById(id: string): Promise<any> {
    if (isDbConnected()) {
      return await LoanModel.findById(id)
        .populate('lenderId', 'displayName email photoURL')
        .populate('borrowerId', 'displayName email photoURL')
        .lean();
    }
    const loan = inMemoryStore.loans.find((l) => l._id.toString() === id.toString());
    return populateLoan(loan, inMemoryStore.users);
  },

  async create(data: any): Promise<any> {
    if (isDbConnected()) {
      const loan = new LoanModel(data);
      const saved = await loan.save();
      return await LoanModel.findById(saved._id)
        .populate('lenderId', 'displayName email photoURL')
        .populate('borrowerId', 'displayName email photoURL')
        .lean();
    }
    const newLoan = {
      _id: generateId(),
      ...data,
      recoveredAmount: data.recoveredAmount || 0,
      repaidAmount: data.repaidAmount || 0,
      status: data.status || 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.loans.push(newLoan);
    return populateLoan(newLoan, inMemoryStore.users);
  },

  async update(id: string, updates: Partial<ILoan> | any): Promise<any> {
    // IMMUTABILITY CHECK: relationshipType must NEVER change
    delete updates.relationshipType;

    if (isDbConnected()) {
      return await LoanModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true })
        .populate('lenderId', 'displayName email photoURL')
        .populate('borrowerId', 'displayName email photoURL')
        .lean();
    }
    const index = inMemoryStore.loans.findIndex((l) => l._id.toString() === id.toString());
    if (index !== -1) {
      inMemoryStore.loans[index] = {
        ...inMemoryStore.loans[index],
        ...updates,
        updatedAt: new Date(),
      };
      return populateLoan(inMemoryStore.loans[index], inMemoryStore.users);
    }
    return null;
  },

  async findForUser(userId: string): Promise<any[]> {
    const uId = userId.toString();
    if (isDbConnected()) {
      return await LoanModel.find({
        $or: [{ lenderId: uId }, { borrowerId: uId }],
      })
        .populate('lenderId', 'displayName email photoURL')
        .populate('borrowerId', 'displayName email photoURL')
        .sort({ updatedAt: -1 })
        .lean();
    }
    const userLoans = inMemoryStore.loans.filter(
      (l) =>
        (l.lenderId?._id || l.lenderId)?.toString() === uId ||
        (l.borrowerId?._id || l.borrowerId)?.toString() === uId
    );
    return userLoans
      .map((l) => populateLoan(l, inMemoryStore.users))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async findActiveLoans(userId: string): Promise<any[]> {
    const loans = await this.findForUser(userId);
    return loans.filter((l) => l.status === 'ACTIVE');
  },

  async findPendingLoans(userId: string): Promise<any[]> {
    const loans = await this.findForUser(userId);
    return loans.filter(
      (l) => l.status === 'PENDING' || l.status === 'BARGAINING' || l.status === 'FINAL OFFER'
    );
  },

  async findCompletedLoans(userId: string): Promise<any[]> {
    const loans = await this.findForUser(userId);
    return loans.filter((l) => l.status === 'COMPLETED');
  },

  /**
   * Stranger Marketplace Finder:
   * CRITICAL RULE: Friends must NEVER appear in stranger marketplace.
   */
  async findMarketplaceOffers(currentUserId: string, type: 'lending' | 'borrowing'): Promise<any[]> {
    const friendIds = await FriendConnectionRepo.findActiveFriendIds(currentUserId);
    const excludeIds = [currentUserId, ...friendIds];

    let allLoans: any[] = [];
    if (isDbConnected()) {
      allLoans = await LoanModel.find({
        relationshipType: 'stranger',
        status: { $in: ['PENDING', 'ACTIVE'] },
      })
        .populate('lenderId', 'displayName email photoURL')
        .populate('borrowerId', 'displayName email photoURL')
        .lean();
    } else {
      allLoans = inMemoryStore.loans
        .filter((l) => l.relationshipType === 'stranger' && (l.status === 'PENDING' || l.status === 'ACTIVE'))
        .map((l) => populateLoan(l, inMemoryStore.users));
    }

    // Filter out user and user's friends
    return allLoans.filter((l) => {
      const lenderId = (l.lenderId?._id || l.lenderId)?.toString();
      const borrowerId = (l.borrowerId?._id || l.borrowerId)?.toString();

      if (type === 'lending') {
        // Users looking to lend money want to find borrowers
        return !excludeIds.includes(borrowerId);
      } else {
        // Users looking to borrow want to find lenders
        return !excludeIds.includes(lenderId);
      }
    });
  },

  async find(filter: any = {}): Promise<any[]> {
    if (isDbConnected()) {
      return await LoanModel.find(filter)
        .populate('lenderId', 'displayName email photoURL')
        .populate('borrowerId', 'displayName email photoURL')
        .lean();
    }
    return inMemoryStore.loans
      .filter((l) => {
        if (filter.relationshipType && l.relationshipType !== filter.relationshipType) return false;
        if (filter.status?.$in && !filter.status.$in.includes(l.status)) return false;
        return true;
      })
      .map((l) => populateLoan(l, inMemoryStore.users));
  },
};

/**
 * Loan Payment Repository
 */
export const LoanPaymentRepo = {
  async create(data: {
    loanId: string;
    paidBy: string;
    amount: number;
    paymentMethod?: string;
  }): Promise<any> {
    if (isDbConnected()) {
      const payment = new LoanPaymentModel(data);
      return await payment.save();
    }
    const newPayment = {
      _id: generateId(),
      ...data,
      paidAt: new Date(),
      status: 'COMPLETED',
      createdAt: new Date(),
    };
    inMemoryStore.loanPayments.push(newPayment);
    return newPayment;
  },

  async findByLoanId(loanId: string): Promise<any[]> {
    if (isDbConnected()) {
      return await LoanPaymentModel.find({ loanId: loanId.toString() })
        .populate('paidBy', 'displayName email')
        .sort({ paidAt: -1 })
        .lean();
    }
    return inMemoryStore.loanPayments
      .filter((p) => p.loanId.toString() === loanId.toString())
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  },
};

/**
 * Loan Negotiation Repository
 */
export const LoanNegotiationRepo = {
  async create(data: {
    loanId: string;
    proposedBy: string;
    amount: number;
    interestRate: number;
    duration: number;
    frequency: string;
    totalInterest: number;
    totalRepayment: number;
    paymentAmount: number;
  }): Promise<any> {
    if (isDbConnected()) {
      const neg = new LoanNegotiationModel(data);
      return await neg.save();
    }
    const newNeg = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
    };
    inMemoryStore.loanNegotiations.push(newNeg);
    return newNeg;
  },

  async findByLoanId(loanId: string): Promise<any[]> {
    if (isDbConnected()) {
      return await LoanNegotiationModel.find({ loanId: loanId.toString() })
        .populate('proposedBy', 'displayName email')
        .sort({ createdAt: 1 })
        .lean();
    }
    return inMemoryStore.loanNegotiations
      .filter((n) => n.loanId.toString() === loanId.toString())
      .map((n) => {
        const user = inMemoryStore.users.find((u) => u._id.toString() === n.proposedBy.toString());
        return {
          ...n,
          proposedBy: user ? { _id: user._id, displayName: user.displayName, email: user.email } : n.proposedBy,
        };
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },
};

/**
 * Notification Repository
 */
export const NotificationRepo = {
  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedLoanId?: string;
    relatedFriendConnectionId?: string;
    relatedNegotiationId?: string;
  }): Promise<any> {
    if (isDbConnected()) {
      const notif = new NotificationModel(data);
      return await notif.save();
    }
    const newNotif = {
      _id: generateId(),
      ...data,
      read: false,
      createdAt: new Date(),
    };
    inMemoryStore.notifications.unshift(newNotif);
    return newNotif;
  },

  async findForUser(userId: string): Promise<any[]> {
    if (isDbConnected()) {
      return await NotificationModel.find({ userId: userId.toString() })
        .sort({ createdAt: -1 })
        .lean();
    }
    return inMemoryStore.notifications
      .filter((n) => n.userId.toString() === userId.toString())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markAsRead(id: string): Promise<any> {
    if (isDbConnected()) {
      return await NotificationModel.findByIdAndUpdate(id, { read: true }, { new: true }).lean();
    }
    const notif = inMemoryStore.notifications.find((n) => n._id.toString() === id.toString());
    if (notif) notif.read = true;
    return notif;
  },
};
