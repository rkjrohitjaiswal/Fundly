import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { notificationService } from '../services/api.js';
import { Bell, ArrowLeft, UserCheck } from 'lucide-react';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ title, showBack = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showSwitchMenu, setShowSwitchMenu] = useState<boolean>(false);

  // Poll for unread notification count
  useEffect(() => {
    let isMounted = true;
    async function checkNotifications() {
      if (!user) return;
      try {
        const res = await notificationService.getNotifications();
        if (isMounted && res.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (e) {
        // quiet error
      }
    }

    checkNotifications();
    const interval = setInterval(checkNotifications, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, location.pathname]);

  const handleQuickSwitch = async (email: string) => {
    setShowSwitchMenu(false);
    await login(email, 'password123');
    navigate('/');
  };

  return (
    <header
      id="fundly-top-bar"
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left Section: Back button or Logo */}
        <div className="flex items-center gap-2.5">
          {showBack ? (
            <button
              id="topbar-back-btn"
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : null}

          {title ? (
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h1>
          ) : (
            <div
              id="fundly-brand-logo"
              onClick={() => navigate('/')}
              className="cursor-pointer flex items-center gap-2 select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm shadow-sky-500/20">
                F
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-slate-900 block leading-none">
                  FUNDLY
                </span>
                <span className="text-[9px] text-slate-500 font-medium tracking-wide">
                  Peer-to-peer lending
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Notifications Bell & Profile Avatar */}
        <div className="flex items-center gap-2">
          {/* Quick Demo Switcher helper */}
          <div className="relative">
            <button
              id="demo-switcher-toggle"
              type="button"
              onClick={() => setShowSwitchMenu(!showSwitchMenu)}
              title="Switch demo user account"
              className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 hover:border-sky-300 flex items-center justify-center text-slate-600 hover:text-sky-600 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
            </button>

            {showSwitchMenu && (
              <div className="absolute right-0 top-10 w-52 rounded-2xl bg-white border border-slate-200 p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                  Switch Demo Persona
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('sarah@fundly.demo')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between"
                >
                  <span>Sarah (Lender)</span>
                  {user?.email === 'sarah@fundly.demo' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('alex@fundly.demo')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between"
                >
                  <span>Alex (Borrower)</span>
                  {user?.email === 'alex@fundly.demo' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('michael@fundly.demo')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between"
                >
                  <span>Michael (Friend)</span>
                  {user?.email === 'michael@fundly.demo' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            id="notifications-bell-btn"
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors active:scale-95"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                id="notification-badge"
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Avatar Button */}
          <button
            id="profile-avatar-btn"
            type="button"
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 font-bold text-xs hover:border-sky-400 transition-colors overflow-hidden"
            title="Your Profile"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'U'}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
