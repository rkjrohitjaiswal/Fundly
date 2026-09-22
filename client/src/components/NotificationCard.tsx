import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationItem } from '../types/index.js';
import {
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  CreditCard,
  ChevronRight,
} from 'lucide-react';

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkRead?: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
}) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case 'new_loan_offer':
      case 'new_borrow_request':
        return <ArrowUpRight className="w-4 h-4 text-sky-600" />;
      case 'offer_accepted':
      case 'friend_accepted':
      case 'loan_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'counter_offer':
      case 'bargaining_expiry':
        return <Clock className="w-4 h-4 text-sky-600" />;
      case 'payment_received':
      case 'payment_due':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'declined':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'friend_invitation':
        return <UserPlus className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleClick = () => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification._id);
    }

    if (notification.relatedLoanId) {
      navigate(`/loan/${notification.relatedLoanId}`);
    } else if (notification.relatedFriendConnectionId) {
      navigate('/circle');
    }
  };

  return (
    <div
      id={`notification-card-${notification._id}`}
      onClick={handleClick}
      className={`cursor-pointer rounded-2xl p-4 border transition-all duration-150 flex items-start gap-3.5 shadow-2xs ${
        notification.read
          ? 'bg-slate-50/70 border-slate-200'
          : 'bg-white border-sky-200 shadow-xs'
      }`}
    >
      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`text-xs font-bold truncate ${
              notification.read ? 'text-slate-700' : 'text-slate-900'
            }`}
          >
            {notification.title}
          </h4>
          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
            {new Date(notification.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 font-medium">
          {notification.message}
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
    </div>
  );
};
