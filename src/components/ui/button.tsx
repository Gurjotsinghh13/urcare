import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#E88770]/30 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-md select-none';

    const variants = {
      primary: 'bg-[#E88770] text-white hover:bg-[#D97660] active:bg-[#C86550] shadow-xs',
      secondary: 'bg-[#FAF8F8] text-[#202124] hover:bg-[#F7F0F1] border border-[#EAE3E5]',
      outline: 'border border-[#EAE3E5] bg-white text-[#202124] hover:bg-[#FAF8F8] shadow-xs',
      ghost: 'text-[#6B7280] hover:text-[#202124] hover:bg-[#FAF8F8]',
      danger: 'bg-[#C04444] text-white hover:bg-[#A83838] shadow-xs',
      success: 'bg-[#27805B] text-white hover:bg-[#1E6B4B] shadow-xs',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-3.5 py-2 h-9 gap-2',
      lg: 'text-base px-4 py-2.5 h-10 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
