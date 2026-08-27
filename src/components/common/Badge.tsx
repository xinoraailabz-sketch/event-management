import React from 'react';
import { cn } from '@/lib/utils';
import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { EventStatus, AttendeeStatus, UserRole } from '@/types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'neutral';
  status?: EventStatus | AttendeeStatus | UserRole | string;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  size = 'sm',
  dot = false,
  className,
}) => {
  let resolvedVariant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' = 'secondary';
  let label = children;

  if (status) {
    switch (status) {
      // Event statuses
      case 'draft':
        resolvedVariant = 'secondary';
        label = label || 'Draft';
        break;
      case 'published':
        resolvedVariant = 'default';
        label = label || 'Published';
        break;
      case 'registration_open':
        resolvedVariant = 'success';
        label = label || 'Registration Open';
        break;
      case 'registration_closed':
        resolvedVariant = 'warning';
        label = label || 'Registration Closed';
        break;
      case 'live':
        resolvedVariant = 'default';
        label = label || 'Live';
        break;
      case 'completed':
        resolvedVariant = 'secondary';
        label = label || 'Completed';
        break;
      case 'archived':
        resolvedVariant = 'secondary';
        label = label || 'Archived';
        break;

      // Attendee statuses
      case 'registered':
        resolvedVariant = 'default';
        label = label || 'Registered';
        break;
      case 'checked_in':
        resolvedVariant = 'success';
        label = label || 'Checked In';
        break;
      case 'cancelled':
        resolvedVariant = 'destructive';
        label = label || 'Cancelled';
        break;
      case 'walk_in':
        resolvedVariant = 'default';
        label = label || 'Walk-in';
        break;
      case 'waitlisted':
        resolvedVariant = 'warning';
        label = label || 'Waitlisted';
        break;

      // User roles
      case 'platform_admin':
        resolvedVariant = 'default';
        label = label || 'Platform Admin';
        break;
      case 'organizer':
        resolvedVariant = 'default';
        label = label || 'Organizer';
        break;
      case 'staff':
      case 'check_in_staff':
        resolvedVariant = 'secondary';
        label = label || 'Check-in Staff';
        break;
      case 'event_manager':
        resolvedVariant = 'default';
        label = label || 'Event Manager';
        break;
      case 'active':
        resolvedVariant = 'success';
        label = label || 'Active';
        break;
      case 'inactive':
      case 'suspended':
        resolvedVariant = 'secondary';
        label = label || 'Inactive';
        break;
      default:
        label = label || status;
    }
  } else if (variant) {
    if (variant === 'success') resolvedVariant = 'success';
    else if (variant === 'warning') resolvedVariant = 'warning';
    else if (variant === 'error') resolvedVariant = 'destructive';
    else if (variant === 'info' || variant === 'purple') resolvedVariant = 'default';
    else if (variant === 'neutral') resolvedVariant = 'secondary';
  }

  const dotColors: Record<string, string> = {
    default: 'bg-blue-600',
    secondary: 'bg-slate-400',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    destructive: 'bg-rose-600',
    outline: 'bg-slate-400',
  };

  return (
    <ShadcnBadge
      variant={resolvedVariant}
      className={cn(
        'gap-1.5 font-medium select-none',
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[resolvedVariant] || 'bg-blue-600'
          )}
        />
      )}
      {label}
    </ShadcnBadge>
  );
};
