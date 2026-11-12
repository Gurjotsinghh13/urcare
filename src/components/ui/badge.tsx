import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'accent';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#FAF8F8] text-[#202124] border-[#EAE3E5]',
    success: 'bg-[#F0F7F4] text-[#27805B] border-[#D1E7DD]',
    warning: 'bg-[#FDF8F0] text-[#B7791F] border-[#F3E5D0]',
    danger: 'bg-[#FDF2F2] text-[#C04444] border-[#F8D7DA]',
    info: 'bg-[#FCEEF1] text-[#D97660] border-[#F4C7D3]',
    accent: 'bg-[#FCEEF1] text-[#202124] border-[#F4C7D3]',
    outline: 'bg-transparent text-[#6B7280] border-[#EAE3E5]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
