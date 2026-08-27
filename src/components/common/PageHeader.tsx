import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <div className={cn('mb-6 pb-4 border-b border-slate-200/70', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
              {crumb.onClick ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={idx === breadcrumbs.length - 1 ? 'text-slate-800' : ''}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
