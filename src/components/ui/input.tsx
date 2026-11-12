import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-[#202124]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-9 w-full rounded-md border border-[#EAE3E5] bg-white px-3 py-1.5 text-sm text-[#202124] placeholder:text-[#6B7280]/60 focus:outline-none focus:border-[#E88770] focus:ring-2 focus:ring-[#F4C7D3]/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
            error && 'border-[#C04444] focus:border-[#C04444] focus:ring-[#C04444]/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#C04444] font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#6B7280]">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
