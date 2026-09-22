import { Response } from 'express';
import { FriendConnectionRepo, UserRepo, LoanRepo, NotificationRepo } from '../models/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

function generateInviteCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `FUNDLY-${digits}`;
}

export const friendController = {
  /**
   * Send a friend invite by email, targetUserId, or generate an open invite code
   */
  async invite(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUserId = req.user._id.toString();
      const { targetUserId, email, code } = req.body;

      // Case 1: Entering an existing invite code to connect
      if (code) {
        const cleanCode = code.toUpperCase().trim();
        const connection = await FriendConnectionRepo.findByInviteCode(cleanCode);
        if (!connection) {
          return res.status(404).json({
            success: false,
            message: 'Invalid invitation code. Please verify the code and try again.',
            errorCode: 'INVALID_INVITE_CODE',
          });
        }

        const inviterId = (connection.invitedBy?._id || connection.invitedBy).toString();
        if (inviterId === currentUserId) {
          return res.status(400).json({
            success: false,
            message: 'You cannot accept your own invitation code.',
            errorCode: 'SELF_INVITE',
          });
        }

        // Update recipient if open code
        const updated = await FriendConnectionRepo.updateStatus(connection._id, 'ACTIVE');

        await NotificationRepo.create({
          userId: inviterId,
          type: 'friend_accepted',
          title: 'Circle Connection Confirmed',
          message: `${req.user.displayName} accepted your invitation via code ${cleanCode}.`,
          relatedFriendConnectionId: connection._id.toString(),
        });

        return res.json({
          success: true,
          data: {
            connection: updated,
            message: 'Friend connected to your Circle successfully!',
          },
        });
      }

      // Case 2: Inviting a specific user by email or targetUserId
      let recipient: any = null;
      if (targetUserId) {
        recipient = await UserRepo.findById(targetUserId);
      } else if (email) {
        recipient = await UserRepo.findByEmail(email.toLowerCase().trim());
      }

      if (!recipient) {
        // Generate a new shareable invite code
        const newCode = generateInviteCode();
        // Placeholder receiver can be a new pending open invite
        return res.json({
          success: true,
          data: {
            inviteCode: newCode,
            inviteLink: `/circle?code=${newCode}`,
            message: 'Invite link and code generated. Share with your friend!',
          },
        });
      }

      const recipientId = recipient._id.toString();
      if (recipientId === currentUserId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot invite yourself.',
          errorCode: 'SELF_INVITE',
        });
      }

      // Check existing connection
      const existingConnections = await FriendConnectionRepo.findConnectionsForUser(currentUserId);
      const duplicate = existingConnections.find((c) => {
        const uA = (c.userA?._id || c.userA).toString();
        const uB = (c.userB?._id || c.userB).toString();
        return (uA === recipientId || uB === recipientId) && c.status !== 'REMOVED';
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: duplicate.status === 'ACTIVE'
            ? 'This user is already in your Circle.'
            : 'A friend invitation is already pending with this user.',
          errorCode: 'CONNECTION_EXISTS',
        });
      }

      const inviteCode = generateInviteCode();
      const connection = await FriendConnectionRepo.create({
        userA: currentUserId,
        userB: recipientId,
        invitedBy: currentUserId,
        inviteCode,
        status: 'PENDING',
      });

      await NotificationRepo.create({
        userId: recipientId,
        type: 'friend_invitation',
        title: 'New Circle Invitation',
        message: `${req.user.displayName} invited you to join their private Circle.`,
        relatedFriendConnectionId: connection._id.toString(),
      });

      return res.status(201).json({
        success: true,
        data: {
          connection,
          inviteCode,
          inviteLink: `/circle?code=${inviteCode}`,
          message: 'Friend invitation sent successfully.',
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to send invitation.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  async accept(req: AuthenticatedRequest, res: Response) {
    try {
      const { connectionId } = req.body;
      const currentUserId = req.user._id.toString();

      const connection = await FriendConnectionRepo.findById(connectionId);
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found.',
          errorCode: 'NOT_FOUND',
        });
      }

      const userAId = (connection.userA?._id || connection.userA).toString();
      const userBId = (connection.userB?._id || connection.userB).toString();

      if (userAId !== currentUserId && userBId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to accept this invitation.',
          errorCode: 'FORBIDDEN',
        });
      }

      const updated = await FriendConnectionRepo.updateStatus(connectionId, 'ACTIVE');

      const inviterId = (connection.invitedBy?._id || connection.invitedBy).toString();
      const otherId = inviterId === currentUserId ? (userAId === currentUserId ? userBId : userAId) : inviterId;

      await NotificationRepo.create({
        userId: otherId,
        type: 'friend_accepted',
        title: 'Circle Connection Active',
        message: `${req.user.displayName} accepted your invitation to connect in Circle.`,
        relatedFriendConnectionId: connectionId,
      });

      return res.json({
        success: true,
        data: {
          connection: updated,
          message: 'Friend invitation accepted! You can now create private loans.',
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to accept invitation.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  async decline(req: AuthenticatedRequest, res: Response) {
    try {
      const { connectionId } = req.body;
      const currentUserId = req.user._id.toString();

      const connection = await FriendConnectionRepo.findById(connectionId);
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found.',
          errorCode: 'NOT_FOUND',
        });
      }

      const updated = await FriendConnectionRepo.updateStatus(connectionId, 'REMOVED');
      return res.json({
        success: true,
        data: {
          connection: updated,
          message: 'Invitation declined.',
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to decline invitation.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  /**
   * Get all friends in Circle:
   * STRICT SEPARATION:
   * - Strangers NEVER appear here.
   * - Pending friends show name, status, invitation actions, NO loan amounts.
   * - Active friends show lend/recover/remaining & borrow/repaid/remaining.
   */
  async getFriends(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUserId = req.user._id.toString();
      const connections = await FriendConnectionRepo.findConnectionsForUser(currentUserId);
      const allUserLoans = await LoanRepo.findForUser(currentUserId);

      const activeFriends: any[] = [];
      const pendingFriends: any[] = [];

      for (const conn of connections) {
        const uA = conn.userA;
        const uB = conn.userB;
        const otherUser = (uA?._id || uA).toString() === currentUserId ? uB : uA;
        const otherUserId = (otherUser?._id || otherUser).toString();

        if (conn.status === 'PENDING') {
          // Rule: Pending friend shows name, status, invitation actions, NO loan amounts
          pendingFriends.push({
            connectionId: conn._id,
            user: otherUser,
            invitedByMe: (conn.invitedBy?._id || conn.invitedBy).toString() === currentUserId,
            inviteCode: conn.inviteCode,
            status: 'PENDING',
            createdAt: conn.createdAt,
          });
        } else if (conn.status === 'ACTIVE') {
          // Rule: Active friend shows lend/recover/remaining and borrow/repaid/remaining
          // Filter loans specifically between current user and this friend
          const sharedLoans = allUserLoans.filter((l) => {
            if (l.relationshipType !== 'friend') return false;
            const lId = (l.lenderId?._id || l.lenderId).toString();
            const bId = (l.borrowerId?._id || l.borrowerId).toString();
            return (lId === currentUserId && bId === otherUserId) || (lId === otherUserId && bId === currentUserId);
          });

          // Lending metrics (Current user is lender)
          const lendingLoans = sharedLoans.filter((l) => (l.lenderId?._id || l.lenderId).toString() === currentUserId && l.status === 'ACTIVE');
          const totalLent = lendingLoans.reduce((sum, l) => sum + l.amount, 0);
          const totalRecovered = lendingLoans.reduce((sum, l) => sum + (l.recoveredAmount || 0), 0);
          const lendRemaining = lendingLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

          // Borrowing metrics (Current user is borrower)
          const borrowingLoans = sharedLoans.filter((l) => (l.borrowerId?._id || l.borrowerId).toString() === currentUserId && l.status === 'ACTIVE');
          const totalBorrowed = borrowingLoans.reduce((sum, l) => sum + l.amount, 0);
          const totalRepaid = borrowingLoans.reduce((sum, l) => sum + (l.repaidAmount || 0), 0);
          const borrowRemaining = borrowingLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

          activeFriends.push({
            connectionId: conn._id,
            user: otherUser,
            status: 'ACTIVE',
            metrics: {
              lending: {
                totalLent: Math.round(totalLent * 100) / 100,
                totalRecovered: Math.round(totalRecovered * 100) / 100,
                remaining: Math.round(lendRemaining * 100) / 100,
              },
              borrowing: {
                totalBorrowed: Math.round(totalBorrowed * 100) / 100,
                totalRepaid: Math.round(totalRepaid * 100) / 100,
                remaining: Math.round(borrowRemaining * 100) / 100,
              },
            },
            loanCount: sharedLoans.length,
          });
        }
      }

      return res.json({
        success: true,
        data: {
          activeFriends,
          pendingFriends,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to load Circle friends.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  /**
   * Friend Details Page Data
   */
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const friendUserId = req.params.id;
      const currentUserId = req.user._id.toString();

      // Check active friendship
      const areFriends = await FriendConnectionRepo.areActiveFriends(currentUserId, friendUserId);
      if (!areFriends) {
        return res.status(403).json({
          success: false,
          message: 'This user is not an active friend in your Circle. Strangers cannot appear here.',
          errorCode: 'NOT_A_FRIEND',
        });
      }

      const friendUser = await UserRepo.findById(friendUserId);
      if (!friendUser) {
        return res.status(404).json({
          success: false,
          message: 'Friend not found.',
          errorCode: 'USER_NOT_FOUND',
        });
      }

      const allUserLoans = await LoanRepo.findForUser(currentUserId);
      const sharedLoans = allUserLoans.filter((l) => {
        if (l.relationshipType !== 'friend') return false;
        const lId = (l.lenderId?._id || l.lenderId).toString();
        const bId = (l.borrowerId?._id || l.borrowerId).toString();
        return (lId === currentUserId && bId === friendUserId) || (lId === friendUserId && bId === currentUserId);
      });

      // Calculate financial aggregates
      const lendingLoans = sharedLoans.filter((l) => (l.lenderId?._id || l.lenderId).toString() === currentUserId && l.status === 'ACTIVE');
      const borrowingLoans = sharedLoans.filter((l) => (l.borrowerId?._id || l.borrowerId).toString() === currentUserId && l.status === 'ACTIVE');

      const lendingMetrics = {
        totalLent: Math.round(lendingLoans.reduce((sum, l) => sum + l.amount, 0) * 100) / 100,
        totalRecovered: Math.round(lendingLoans.reduce((sum, l) => sum + (l.recoveredAmount || 0), 0) * 100) / 100,
        remaining: Math.round(lendingLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0) * 100) / 100,
      };

      const borrowingMetrics = {
        totalBorrowed: Math.round(borrowingLoans.reduce((sum, l) => sum + l.amount, 0) * 100) / 100,
        totalRepaid: Math.round(borrowingLoans.reduce((sum, l) => sum + (l.repaidAmount || 0), 0) * 100) / 100,
        remaining: Math.round(borrowingLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0) * 100) / 100,
      };

      return res.json({
        success: true,
        data: {
          friend: {
            _id: friendUser._id,
            displayName: friendUser.displayName,
            email: friendUser.email,
            photoURL: friendUser.photoURL,
          },
          metrics: {
            lending: lendingMetrics,
            borrowing: borrowingMetrics,
          },
          loans: sharedLoans,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to load friend details.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const friendId = req.params.id;
      const currentUserId = req.user._id.toString();

      const connections = await FriendConnectionRepo.findConnectionsForUser(currentUserId);
      const conn = connections.find((c) => {
        const uA = (c.userA?._id || c.userA).toString();
        const uB = (c.userB?._id || c.userB).toString();
        return (uA === friendId || uB === friendId) && c.status === 'ACTIVE';
      });

      if (!conn) {
        return res.status(404).json({
          success: false,
          message: 'Active friend connection not found.',
          errorCode: 'NOT_FOUND',
        });
      }

      await FriendConnectionRepo.updateStatus(conn._id, 'REMOVED');

      return res.json({
        success: true,
        data: {
          message: 'Friend removed from your Circle.',
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to remove friend.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },
};
