import React from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ className, label, error, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      )}
      <input
        className={cn(
          'w-full rounded-xl border bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors duration-200',
          'border-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
};