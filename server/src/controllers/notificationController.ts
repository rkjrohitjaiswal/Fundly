import { Response } from 'express';
import { NotificationRepo } from '../models/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const notificationController = {
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUserId = req.user._id.toString();
      const notifications = await NotificationRepo.findForUser(currentUserId);
      const unreadCount = notifications.filter((n) => !n.read).length;

      return res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch notifications.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const notifId = req.params.id;
      const updated = await NotificationRepo.markAsRead(notifId);

      return res.json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to update notification.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },
};
