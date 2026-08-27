import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-blue-50 text-blue-700 font-semibold',
        secondary:
          'border-slate-200 bg-slate-100 text-slate-700',
        destructive:
          'border-transparent bg-rose-50 text-rose-700 font-semibold',
        success:
          'border-transparent bg-emerald-50 text-emerald-700 font-semibold',
        warning:
          'border-transparent bg-amber-50 text-amber-800 font-semibold',
        outline: 'text-slate-700 border-slate-200 bg-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  className?: string;
  children?: React.ReactNode;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
