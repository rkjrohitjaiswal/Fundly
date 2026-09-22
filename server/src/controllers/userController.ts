import { Response } from 'express';
import { UserRepo, FriendConnectionRepo, LoanRepo } from '../models/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const userController = {
  async search(req: AuthenticatedRequest, res: Response) {
    try {
      const query = (req.query.q as string) || '';
      const context = (req.query.context as string) || 'all'; // 'stranger' | 'friend' | 'all'
      const currentUserId = req.user._id.toString();

      let users = await UserRepo.search(query, currentUserId);
      const activeFriendIds = await FriendConnectionRepo.findActiveFriendIds(currentUserId);

      if (context === 'stranger') {
        // STRICT RULE: Friends must NEVER appear in stranger marketplace
        users = users.filter((u) => !activeFriendIds.includes(u._id.toString()));
      } else if (context === 'friend') {
        // Only active friends
        users = users.filter((u) => activeFriendIds.includes(u._id.toString()));
      }

      // Format safe public stranger / friend payload
      const sanitized = users.map((u) => ({
        _id: u._id,
        displayName: u.displayName,
        email: activeFriendIds.includes(u._id.toString()) ? u.email : undefined, // hide email from strangers
        photoURL: u.photoURL,
        isFriend: activeFriendIds.includes(u._id.toString()),
        createdAt: u.createdAt,
      }));

      return res.json({
        success: true,
        data: sanitized,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'User search failed.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const targetId = req.params.id;
      const currentUserId = req.user._id.toString();

      const user = await UserRepo.findById(targetId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found.',
          errorCode: 'USER_NOT_FOUND',
        });
      }

      const isFriend = await FriendConnectionRepo.areActiveFriends(currentUserId, targetId);
      const isSelf = currentUserId === targetId;

      // Calculate shared financial summary if friend or self
      let financialSummary = null;
      if (isFriend || isSelf) {
        const loans = await LoanRepo.findForUser(targetId);
        const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
        financialSummary = {
          activeLoanCount: activeLoans.length,
          completedLoanCount: loans.filter((l) => l.status === 'COMPLETED').length,
        };
      }

      const safeProfile = {
        _id: user._id,
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: isFriend || isSelf ? user.email : undefined, // Hidden from strangers
        isFriend,
        isSelf,
        financialSummary,
        joinedAt: user.createdAt,
      };

      return res.json({
        success: true,
        data: safeProfile,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to load user profile.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },
};
