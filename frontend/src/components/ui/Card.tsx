import React from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
}

export const Card: React.FC<CardProps> = ({ className, children, variant = 'default', ...props }) => {
  const variants = {
    default:  'bg-slate-900 border border-slate-800',
    glass:    'bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl',
    elevated: 'bg-slate-900 border border-slate-800 shadow-2xl shadow-black/40',
  };

  return (
    <div
      className={cn('rounded-xl', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};