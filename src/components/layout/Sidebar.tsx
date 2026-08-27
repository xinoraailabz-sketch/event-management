import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  QrCode,
  CheckCircle2,
  BarChart3,
  MessageSquare,
  Settings,
  ShieldCheck,
  ChevronDown,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/common/Badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    currentPath,
    navigateTo,
    currentRole,
    currentOrg,
    organizations,
    switchOrg,
    activeEvent,
    events,
  } = useApp();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  const isCurrent = (path: string) => {
    if (path === '/app' && currentPath === '/app') return true;
    if (path !== '/app' && currentPath.startsWith(path)) return true;
    return false;
  };

  const navItems = [
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
      count: events.filter((e) => e.organizationId === currentOrg.id).length,
    },
    {
      label: 'Attendees',
      path: activeEvent ? `/app/events/${activeEvent.id}/registrations` : '/app/events',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['organizer', 'platform_admin'],
    },
    {
      label: 'Live Check-in',
      path: activeEvent ? `/app/events/${activeEvent.id}/check-in` : '/app/events',
      icon: <CheckCircle2 className="w-4 h-4" />,
      allowedRoles: ['organizer', 'staff', 'platform_admin'],
    },
    {
      label: 'QR Scanner',
      path: activeEvent ? `/app/events/${activeEvent.id}/scanner` : '/app/events',
      icon: <QrCode className="w-4 h-4" />,
      allowedRoles: ['organizer', 'staff', 'platform_admin'],
    },
    {
      label: 'Staff & Gates',
      path: activeEvent ? `/app/events/${activeEvent.id}/staff` : '/app/events',
      icon: <UserCheck className="w-4 h-4" />,
      allowedRoles: ['organizer', 'platform_admin'],
    },
    {
      label: 'Broadcasts',
      path: activeEvent ? `/app/events/${activeEvent.id}/messages` : '/app/events',
      icon: <MessageSquare className="w-4 h-4" />,
      allowedRoles: ['organizer', 'platform_admin'],
    },
    {
      label: 'Analytics',
      path: activeEvent ? `/app/events/${activeEvent.id}/reports` : '/app/events',
      icon: <BarChart3 className="w-4 h-4" />,
      allowedRoles: ['organizer', 'platform_admin'],
    },
    {
      label: 'Settings',
      path: '/app/settings/profile',
      icon: <Settings className="w-4 h-4" />,
      allowedRoles: ['organizer', 'platform_admin'],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 bottom-0 left-0 z-40 lg:z-30 w-60 h-screen shrink-0 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out select-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand & Organization Switcher */}
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2.5 px-2">
            <button
              onClick={() => navigateTo('/app')}
              className="flex items-center gap-2 text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <QrCode className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-sm font-semibold tracking-tight text-slate-900">
                  EventFlow
                </span>
              </div>
            </button>
          </div>

          {/* Tenant Org Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-5 h-5 rounded-md bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-semibold text-[11px] shrink-0">
                  {currentOrg.name.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium text-slate-900 truncate leading-tight">
                    {currentOrg.name}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {orgDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-md py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Workspaces
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      switchOrg(org.id);
                      setOrgDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer',
                      org.id === currentOrg.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <span className="truncate">{org.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{org.plan}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current Active Event Scope */}
        {activeEvent && currentRole !== 'staff' && (
          <div className="px-3 pt-2 pb-1">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-0.5">
                <span>Active Event</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="font-medium text-slate-900 truncate text-[11px]">{activeEvent.name}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                <span>{activeEvent.city}</span>
                <span className="font-medium text-blue-600">
                  {activeEvent.stats?.totalCheckedIn ?? 0} / {activeEvent.stats?.totalRegistrations ?? 0} in
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {navItems
            .filter((item) => item.allowedRoles.includes(currentRole))
            .map((item) => {
              const active = isCurrent(item.path);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    navigateTo(item.path);
                    onClose();
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'transition-colors',
                        active ? 'text-blue-600' : 'text-slate-400'
                      )}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && (
                    <span className="text-[11px] text-slate-400">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

          {/* Platform Admin Gateway */}
          <div className="pt-2 mt-2 border-t border-slate-100">
            <button
              onClick={() => {
                navigateTo('/admin');
                onClose();
              }}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                currentPath.startsWith('/admin')
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Admin Console</span>
            </button>
          </div>
        </div>

        {/* Bottom User Profile */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200/70 shadow-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-7 w-7">
                <AvatarFallback>
                  {currentRole === 'platform_admin' ? 'PA' : currentRole === 'staff' ? 'RS' : 'AK'}
                </AvatarFallback>
              </Avatar>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-900 truncate">
                  {currentRole === 'platform_admin'
                    ? 'Platform Admin'
                    : currentRole === 'staff'
                    ? 'Rahul Sundar'
                    : currentOrg.ownerName}
                </p>
                <Badge status={currentRole} size="sm" className="mt-0.5 text-[9px] py-0 px-1" />
              </div>
            </div>

            <button
              onClick={() => navigateTo('/login')}
              title="Logout"
              className="w-6 h-6 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
