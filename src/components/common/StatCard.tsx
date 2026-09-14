import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  progress?: number;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  change,
  isPositive = true,
  icon,
  progress,
  className,
}) => {
  return (
    <Card className={cn('overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">{title}</p>
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-[#FAFAF7] border border-[#E8E5DF]/60 flex items-center justify-center text-[#6B6B6B]">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <h3 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">{value}</h3>
          {change && (
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              )}
            >
              {change}
            </span>
          )}
        </div>

        {subtext && <p className="mt-1 text-xs text-[#9A9A9A] font-normal">{subtext}</p>}

        {progress !== undefined && (
          <div className="mt-3">
            <div className="w-full bg-[#F0EDE8] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#C49A3C] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
