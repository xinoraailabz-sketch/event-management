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
    <Card className={cn('overflow-hidden hover:border-slate-300 transition-colors', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          {change && (
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-md',
                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              )}
            >
              {change}
            </span>
          )}
        </div>

        {subtext && <p className="mt-1 text-xs text-slate-500 font-normal">{subtext}</p>}

        {progress !== undefined && (
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
