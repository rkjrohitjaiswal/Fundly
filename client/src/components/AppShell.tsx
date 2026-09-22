import React from 'react';
import { TopBar } from './TopBar.js';
import { BottomNavigation } from './BottomNavigation.js';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  hideNav?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  title,
  showBack = false,
  hideNav = false,
}) => {
  return (
    <div
      id="fundly-app-root"
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white"
    >
      {/* Mobile-first centered frame with crisp white background and subtle borders */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col bg-white border-x border-slate-200/80 min-h-screen relative shadow-sm">
        <TopBar title={title} showBack={showBack} />

        <main className={`flex-1 p-4 ${hideNav ? 'pb-8' : 'pb-24'} bg-white`}>
          {children}
        </main>

        {!hideNav && <BottomNavigation />}
      </div>
    </div>
  );
};
