import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  id?: string;
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id = 'empty-state-card',
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div
      id={id}
      className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 my-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 text-slate-400 shadow-2xs">
        <Icon className="w-6 h-6 text-sky-500" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold tracking-wide transition-colors active:scale-95 shadow-sm shadow-sky-500/10"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
