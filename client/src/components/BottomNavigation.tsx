import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ArrowUpRight, ArrowDownLeft, Users } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navItems = [
    { label: 'Home', path: '/', icon: Home, id: 'nav-home' },
    { label: 'Lending', path: '/lending', icon: ArrowUpRight, id: 'nav-lending' },
    { label: 'Borrow', path: '/borrow', icon: ArrowDownLeft, id: 'nav-borrow' },
    { label: 'Circle', path: '/circle', icon: Users, id: 'nav-circle' },
  ];

  return (
    <nav
      id="fundly-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-lg"
    >
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              id={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'text-sky-600 bg-sky-50 font-bold'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50 font-medium'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
