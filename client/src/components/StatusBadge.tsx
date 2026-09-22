import React from 'react';
import { LoanStatus, RelationshipType } from '../types/index.js';

interface StatusBadgeProps {
  status?: LoanStatus | 'ACTIVE_FRIEND' | 'PENDING_FRIEND';
  relationship?: RelationshipType;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, relationship, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  if (relationship) {
    if (relationship === 'friend') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Friend
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold tracking-wider rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Stranger
      </span>
    );
  }

  switch (status) {
    case 'ACTIVE':
    case 'ACTIVE_FRIEND':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Active
        </span>
      );
    case 'PENDING':
    case 'PENDING_FRIEND':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Pending
        </span>
      );
    case 'BARGAINING':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          Bargaining
        </span>
      );
    case 'FINAL OFFER':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Final Offer
        </span>
      );
    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Completed
        </span>
      );
    case 'DECLINED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Declined
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-slate-100 text-slate-500 border border-slate-200 ${sizeClasses}`}
        >
          Cancelled
        </span>
      );
    default:
      return null;
  }
};
