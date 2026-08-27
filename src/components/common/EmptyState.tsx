import React from 'react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white rounded-xl border border-dashed border-slate-200',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 mb-4 shadow-2xs">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h4>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">{description}</p>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryAction && (
            <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={primaryAction.onClick}
              leftIcon={primaryAction.icon}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
