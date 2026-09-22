import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading Fundly data...' }) => {
  return (
    <div id="loading-state-container" className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-4 shadow-xs">
        <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-slate-600">{message}</p>
    </div>
  );
};
