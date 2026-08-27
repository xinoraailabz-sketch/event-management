import React from 'react';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, Calendar, QrCode, CheckCircle2, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

export const MobileNav: React.FC = () => {
  const { currentPath, navigateTo, activeEvent, currentRole } = useApp();

  const items = [
    {
      label: 'Overview',
      path: '/app',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ['organizer', 'platform_admin'],
    },
    {
      label: 'Events',
      path: '/app/events',
      icon: <Calendar className="w-4 h-4" />,
      allowedRoles: ['organizer', 'platform_admin'],
    },
    {
      label: 'Scanner',
      path: activeEvent ? `/app/events/${activeEvent.id}/scanner` : '/app/events',
      icon: <QrCode className="w-4 h-4" />,
      allowedRoles: ['organizer', 'staff', 'platform_admin'],
    },
    {
      label: 'Check-in',
      path: activeEvent ? `/app/events/${activeEvent.id}/check-in` : '/app/events',
      icon: <CheckCircle2 className="w-4 h-4" />,
      allowedRoles: ['organizer', 'staff', 'platform_admin'],
    },
    {
      label: 'Attendees',
      path: activeEvent ? `/app/events/${activeEvent.id}/registrations` : '/app/events',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['organizer', 'platform_admin'],
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 lg:hidden px-2 py-1 flex items-center justify-around">
      {items
        .filter((item) => item.allowedRoles.includes(currentRole))
        .map((item) => {
          const active =
            item.path === '/app' ? currentPath === '/app' : currentPath.startsWith(item.path);

          return (
            <button
              key={item.label}
              onClick={() => navigateTo(item.path)}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors cursor-pointer',
                active
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <div className="p-1">{item.icon}</div>
              <span>{item.label}</span>
            </button>
          );
        })}
    </nav>
  );
};
