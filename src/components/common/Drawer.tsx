import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
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

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1A1A1A]/30 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          className={cn(
            'w-screen pointer-events-auto bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] border-l border-[#E8E5DF] flex flex-col transform transition-transform ease-in-out duration-200',
            widthStyles[width]
          )}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#F0EDE8] flex items-center justify-between bg-[#FAFAF7]/50">
            <div>
              {typeof title === 'string' ? (
                <h3 className="text-base font-bold text-[#1A1A1A]">{title}</h3>
              ) : (
                title
              )}
              {description && <p className="text-sm text-[#6B6B6B] mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-[#F0EDE8] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
