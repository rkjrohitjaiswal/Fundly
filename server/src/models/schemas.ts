import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// 1. User Interface & Schema
export interface IUser extends Document {
  displayName: string;
  email: string;
  passwordHash: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export const UserSchema = new Schema<IUser>(
  {
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    photoURL: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// User Methods & Indexes
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ displayName: 1 });

// 2. FriendConnection Interface & Schema
export interface IFriendConnection extends Document {
  userA: mongoose.Types.ObjectId | string;
  userB: mongoose.Types.ObjectId | string;
  invitedBy: mongoose.Types.ObjectId | string;
  inviteCode: string;
  status: 'PENDING' | 'ACTIVE' | 'REMOVED';
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const FriendConnectionSchema = new Schema<IFriendConnection>(
  {
    userA: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userB: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inviteCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'REMOVED'], default: 'PENDING', index: true },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

FriendConnectionSchema.index({ userA: 1, userB: 1 });
FriendConnectionSchema.index({ inviteCode: 1 });
FriendConnectionSchema.index({ status: 1 });

// 3. Payment Schedule Item Interface
export interface IPaymentScheduleItem {
  paymentNumber: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  status: 'pending' | 'paid' | 'overdue';
}

// 4. Loan Interface & Schema
export interface ILoan extends Document {
  lenderId: mongoose.Types.ObjectId | string;
  borrowerId: mongoose.Types.ObjectId | string;
  relationshipType: 'friend' | 'stranger'; // CRITICAL: NEVER changes
  amount: number;
  interestRate: number;
  duration: number; // months
  frequency: 'weekly' | 'biweekly' | 'monthly';
  purpose: string;
  totalInterest: number;
  totalRepayment: number;
  paymentAmount: number;
  paymentSchedule: IPaymentScheduleItem[];
  recoveredAmount: number;
  repaidAmount: number;
  remainingAmount: number;
  status: 'PENDING' | 'BARGAINING' | 'FINAL OFFER' | 'ACTIVE' | 'COMPLETED' | 'DECLINED' | 'CANCELLED';
  bargainingStartedAt?: Date;
  bargainingExpiresAt?: Date;
  finalOfferLocked?: boolean;
  finalOfferAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const LoanSchema = new Schema<ILoan>(
  {
    lenderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    relationshipType: { type: String, enum: ['friend', 'stranger'], required: true, immutable: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    interestRate: { type: Number, required: true, default: 0, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    frequency: { type: String, enum: ['weekly', 'biweekly', 'monthly'], default: 'monthly' },
    purpose: { type: String, required: true, trim: true },
    totalInterest: { type: Number, required: true, default: 0, min: 0 },
    totalRepayment: { type: Number, required: true, min: 1 },
    paymentAmount: { type: Number, required: true, min: 0 },
    paymentSchedule: { type: [Object], default: [] },
    recoveredAmount: { type: Number, default: 0, min: 0 },
    repaidAmount: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'BARGAINING', 'FINAL OFFER', 'ACTIVE', 'COMPLETED', 'DECLINED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    bargainingStartedAt: { type: Date },
    bargainingExpiresAt: { type: Date },
    finalOfferLocked: { type: Boolean, default: false },
    finalOfferAt: { type: Date },
  },
  { timestamps: true }
);

LoanSchema.index({ lenderId: 1, status: 1 });
LoanSchema.index({ borrowerId: 1, status: 1 });
LoanSchema.index({ relationshipType: 1, status: 1 });
LoanSchema.index({ createdAt: -1 });

// 5. LoanPayment Interface & Schema
export interface ILoanPayment extends Document {
  loanId: mongoose.Types.ObjectId | string;
  paidBy: mongoose.Types.ObjectId | string;
  amount: number;
  paidAt: Date;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  paymentMethod?: string;
  createdAt: Date;
}

export const LoanPaymentSchema = new Schema<ILoanPayment>(
  {
    loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true, index: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    paidAt: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ['COMPLETED', 'PENDING', 'FAILED'], default: 'COMPLETED' },
    paymentMethod: { type: String, default: 'Fundly Wallet' },
  },
  { timestamps: true }
);

LoanPaymentSchema.index({ loanId: 1, paidAt: -1 });
LoanPaymentSchema.index({ paidBy: 1 });

// 6. LoanNegotiation Interface & Schema
export interface ILoanNegotiation extends Document {
  loanId: mongoose.Types.ObjectId | string;
  proposedBy: mongoose.Types.ObjectId | string;
  amount: number;
  interestRate: number;
  duration: number;
  frequency: string;
  totalInterest: number;
  totalRepayment: number;
  paymentAmount: number;
  createdAt: Date;
}

export const LoanNegotiationSchema = new Schema<ILoanNegotiation>(
  {
    loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true, index: true },
    proposedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    duration: { type: Number, required: true },
    frequency: { type: String, required: true },
    totalInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    paymentAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

LoanNegotiationSchema.index({ loanId: 1, createdAt: 1 });

// 7. Notification Interface & Schema
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId | string;
  type: string;
  title: string;
  message: string;
  relatedLoanId?: mongoose.Types.ObjectId | string;
  relatedFriendConnectionId?: mongoose.Types.ObjectId | string;
  relatedNegotiationId?: mongoose.Types.ObjectId | string;
  read: boolean;
  createdAt: Date;
}

export const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedLoanId: { type: Schema.Types.ObjectId, ref: 'Loan' },
    relatedFriendConnectionId: { type: Schema.Types.ObjectId, ref: 'FriendConnection' },
    relatedNegotiationId: { type: Schema.Types.ObjectId, ref: 'LoanNegotiation' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Mongoose Models
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const FriendConnectionModel = mongoose.models.FriendConnection || mongoose.model<IFriendConnection>('FriendConnection', FriendConnectionSchema);
export const LoanModel = mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);
export const LoanPaymentModel = mongoose.models.LoanPayment || mongoose.model<ILoanPayment>('LoanPayment', LoanPaymentSchema);
export const LoanNegotiationModel = mongoose.models.LoanNegotiation || mongoose.model<ILoanNegotiation>('LoanNegotiation', LoanNegotiationSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
