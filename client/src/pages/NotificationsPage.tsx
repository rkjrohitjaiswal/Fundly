import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api.js';
import { AppShell } from '../components/AppShell.js';
import { NotificationCard } from '../components/NotificationCard.js';
import { LoadingState } from '../components/LoadingState.js';
import { EmptyState } from '../components/EmptyState.js';
import { NotificationItem } from '../types/index.js';
import { Bell, CheckCheck } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter((item) => !item.read)) {
      await handleMarkRead(n._id);
    }
  };

  return (
    <AppShell showBack={true} title="Notifications">
      <div id="notifications-screen-content" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Activity & Transaction Alerts
            </h2>
          </div>

          {notifications.some((n) => !n.read) && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {loading ? (
          <LoadingState message="Fetching notifications..." />
        ) : notifications.length > 0 ? (
          <div className="space-y-2.5">
            {notifications.map((notif) => (
              <NotificationCard
                key={notif._id}
                notification={notif}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="All caught up"
            description="You have no notifications at this time. New loan proposals, repayments, and Circle invites will show up here."
          />
        )}
      </div>
    </AppShell>
  );
};
