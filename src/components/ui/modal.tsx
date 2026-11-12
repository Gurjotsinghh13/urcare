import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'md' }: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Subtle Backdrop */}
      <div 
        className="fixed inset-0 bg-[#202124]/30 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className={cn(
        'relative bg-white rounded-xl shadow-[0_10px_25px_-5px_rgba(32,33,36,0.1)] border border-[#EAE3E5] w-full overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150',
        maxWidths[maxWidth]
      )}>
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EAE3E5]/60 bg-[#FAF8F8]/50">
          <div>
            <h3 className="text-base font-semibold text-[#202124] tracking-tight">{title}</h3>
            {description && <p className="text-xs text-[#6B7280] mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#6B7280] hover:text-[#202124] hover:bg-[#F7F0F1] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
