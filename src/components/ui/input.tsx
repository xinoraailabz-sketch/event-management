import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border border-[#E8E5DF] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#1A1A1A] placeholder:text-[#9A9A9A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A3C]/30 focus-visible:border-[#C49A3C]/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
