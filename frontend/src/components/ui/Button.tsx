import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children, className, variant = 'primary', size = 'md',
  isLoading = false, disabled, ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    primary:   'bg-violet-600 text-white hover:bg-violet-500 focus:ring-violet-500 shadow-lg shadow-violet-500/20',
    secondary: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 focus:ring-cyan-400 shadow-lg shadow-cyan-500/20',
    outline:   'border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 focus:ring-slate-500',
    ghost:     'text-slate-400 hover:text-white hover:bg-slate-800 focus:ring-slate-500',
    danger:    'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 shadow-lg shadow-red-500/20',
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};