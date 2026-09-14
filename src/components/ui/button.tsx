import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A3C]/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] active:bg-[#0A0A0A] shadow-sm',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
        outline:
          'border border-[#E8E5DF] bg-white text-[#1A1A1A] hover:bg-[#F9F8F5] hover:border-[#D5D0C8] active:bg-[#F0EDE8] shadow-sm',
        secondary:
          'bg-[#F0EDE8] text-[#3A3A3A] hover:bg-[#E8E5DF] active:bg-[#DDD9D2]',
        ghost: 'text-[#6B6B6B] hover:bg-[#F0EDE8] hover:text-[#1A1A1A]',
        link: 'text-[#C49A3C] underline-offset-4 hover:underline',
        accent: 'bg-[#C49A3C] text-white hover:bg-[#B08830] active:bg-[#9A7828] shadow-sm',
      },
      size: {
        default: 'h-10 px-5 py-2.5 text-sm',
        sm: 'h-8 rounded-lg px-3.5 text-xs',
        lg: 'h-11 rounded-xl px-7 text-base',
        icon: 'h-10 w-10 p-0 rounded-xl',
        'icon-sm': 'h-8 w-8 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
