import React from 'react';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, Calendar, QrCode, CheckCircle2, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

export const MobileNav: React.FC = () => {
  const { currentPath, navigateTo, activeEvent, currentRole } = useApp();

  const isOrganizerRole = currentRole === 'admin' || currentRole === 'organizer';

  const isCurrent = (key: string) => {
    if (key === 'overview') {
      return currentPath === '/app' || currentPath === '/app/';
    }
    if (key === 'events') {
      return (
        currentPath === '/app/events' ||
        currentPath === '/app/events/' ||
        currentPath === '/app/events/new' ||
        (currentPath.startsWith('/app/events/') && currentPath.split('/').length === 4)
      );
    }
    if (key === 'scanner') {
      return currentPath === '/app/scanner' || currentPath.includes('/scanner');
    }
    if (key === 'check-in') {
      return currentPath === '/app/check-in' || currentPath.includes('/check-in');
    }
    if (key === 'attendees') {
      return currentPath === '/app/attendees' || currentPath.includes('/registrations');
    }
    return false;
  };

  const items = [
    {
      key: 'overview',
      label: 'Overview',
      path: '/app',
      icon: <LayoutDashboard className="w-5 h-5" />,
      allowedRoles: ['admin', 'organizer'],
    },
    {
      key: 'events',
      label: 'Events',
      path: '/app/events',
      icon: <Calendar className="w-5 h-5" />,
      allowedRoles: ['admin', 'organizer'],
    },
    {
      key: 'scanner',
      label: 'Scanner',
      path: activeEvent ? `/app/events/${activeEvent.id}/scanner` : '/app/scanner',
      icon: <QrCode className="w-5 h-5" />,
      allowedRoles: ['admin', 'organizer', 'staff'],
    },
    {
      key: 'check-in',
      label: 'Check-in',
      path: activeEvent ? `/app/events/${activeEvent.id}/check-in` : '/app/check-in',
      icon: <CheckCircle2 className="w-5 h-5" />,
      allowedRoles: ['admin', 'organizer', 'staff'],
    },
    {
      key: 'attendees',
      label: 'Attendees',
      path: activeEvent ? `/app/events/${activeEvent.id}/registrations` : '/app/attendees',
      icon: <Users className="w-5 h-5" />,
      allowedRoles: ['admin', 'organizer'],
    },
  ];

  const visibleItems = items.filter(
    (item) => item.allowedRoles.includes(currentRole) || (isOrganizerRole && item.allowedRoles.includes('admin'))
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8E5DF]/60 lg:hidden px-2 py-1.5 flex items-center justify-around safe-area-bottom shadow-lg">
      {visibleItems.map((item) => {
        const active = isCurrent(item.key);

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => navigateTo(item.path)}
            className={cn(
              'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-semibold transition-all duration-200 cursor-pointer min-w-[56px]',
              active
                ? 'text-[#1A1A1A]'
                : 'text-[#9A9A9A] hover:text-[#6B6B6B]'
            )}
          >
            <div
              className={cn(
                'p-1.5 rounded-xl transition-all duration-200 mb-0.5',
                active ? 'bg-[#1A1A1A] text-white shadow-sm' : ''
              )}
            >
              {item.icon}
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
