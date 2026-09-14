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
  LogOut,
  UserCheck,
  ChevronDown,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isExpanded = true,
  onToggleExpand,
}) => {
  const {
    currentPath,
    navigateTo,
    currentUser,
    signOut,
    currentRole,
    currentOrg,
    activeEvent,
    events,
    setActiveEventId,
    currentStaff,
  } = useApp();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  // Check if role has organizer/admin privileges
  const isOrganizerRole = currentRole === 'admin' || currentRole === 'organizer';

  // Robust active route detection
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
    if (key === 'attendees') {
      return currentPath === '/app/attendees' || currentPath.includes('/registrations');
    }
    if (key === 'check-in') {
      return currentPath === '/app/check-in' || currentPath.includes('/check-in');
    }
    if (key === 'scanner') {
      return currentPath === '/app/scanner' || currentPath.includes('/scanner');
    }
    if (key === 'staff') {
      return currentPath === '/app/staff' || currentPath.includes('/staff');
    }
    if (key === 'broadcasts') {
      return (
        currentPath === '/app/broadcasts' ||
        currentPath === '/app/messages' ||
        currentPath.includes('/messages')
      );
    }
    if (key === 'analytics') {
      return (
        currentPath === '/app/analytics' ||
        currentPath === '/app/reports' ||
        currentPath.includes('/reports')
      );
    }
    if (key === 'settings') {
      return currentPath.startsWith('/app/settings') || currentPath.includes('/settings');
    }
    return false;
  };

  const navItems = [
    {
      key: 'overview',
      label: 'Overview',
      path: '/app',
      icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
      allowedRoles: ['admin', 'organizer'],
    },
    {
      key: 'events',
      label: 'Events',
      path: '/app/events',
      icon: <Calendar className="w-[18px] h-[18px]" />,
      allowedRoles: ['admin', 'organizer'],
    },
    {
      key: 'attendees',
      label: 'Attendees',
      path: activeEvent ? `/app/events/${activeEvent.id}/registrations` : '/app/attendees',
      icon: <Users className="w-[18px] h-[18px]" />,
      allowedRoles: ['admin', 'organizer'],
    },
    {
      key: 'check-in',
      label: 'Live Check-in',
      path: activeEvent ? `/app/events/${activeEvent.id}/check-in` : '/app/check-in',
      icon: <CheckCircle2 className="w-[18px] h-[18px]" />,
      allowedRoles: ['admin', 'organizer', 'staff'],
    },
    {
      key: 'scanner',
      label: 'QR Scanner',
      path: activeEvent ? `/app/events/${activeEvent.id}/scanner` : '/app/scanner',
      icon: <QrCode className="w-[18px] h-[18px]" />,
      allowedRoles: ['admin', 'organizer', 'staff'],
    },
    {
      key: 'staff',
      label: 'Staff Members',
      path: activeEvent ? `/app/events/${activeEvent.id}/staff` : '/app/staff',
      icon: <UserCheck className="w-[18px] h-[18px]" />,
      allowedRoles: ['admin', 'organizer'],
    },
    {
      key: 'broadcasts',
      label: 'Broadcasts',
      path: activeEvent ? `/app/events/${activeEvent.id}/messages` : '/app/broadcasts',
      icon: <MessageSquare className="w-[18px] h-[18px]" />,
      allowedRoles: ['admin', 'organizer'],
    },
    {
      key: 'analytics',
      label: 'Analytics',
      path: activeEvent ? `/app/events/${activeEvent.id}/reports` : '/app/analytics',
      icon: <BarChart3 className="w-[18px] h-[18px]" />,
      allowedRoles: ['admin', 'organizer'],
    },
    {
      key: 'settings',
      label: 'Settings',
      path: '/app/settings',
      icon: <Settings className="w-[18px] h-[18px]" />,
      allowedRoles: ['admin', 'organizer'],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(currentRole) || (isOrganizerRole && item.allowedRoles.includes('admin'))
  );

  return (
    <>
      {/* ============================================================ */}
      {/* DESKTOP COLLAPSIBLE SIDEBAR                                  */}
      {/* ============================================================ */}
      <aside
        className={cn(
          'hidden lg:flex fixed top-0 left-0 bottom-0 z-30 h-screen bg-white border-r border-[#E8E5DF]/70 flex-col select-none transition-all duration-300 ease-in-out',
          isExpanded ? 'w-60 px-4 py-4' : 'w-[68px] items-center py-4 px-2'
        )}
      >
        {/* Top Header Row with Logo & Collapse Toggle */}
        <div
          className={cn(
            'flex items-center mb-4 w-full',
            isExpanded ? 'justify-between px-1' : 'justify-center'
          )}
        >
          <button
            type="button"
            onClick={() => navigateTo('/app')}
            className="flex items-center gap-2.5 cursor-pointer focus:outline-none text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white shrink-0 shadow-sm hover:bg-[#2A2A2A] transition-colors">
              <QrCode className="w-5 h-5" />
            </div>
            {isExpanded && (
              <div className="overflow-hidden">
                <span className="text-base font-extrabold text-[#1A1A1A] tracking-tight block leading-tight">
                  EventFlow
                </span>
                <span className="text-[10px] font-medium text-[#9A9A9A] uppercase tracking-wider block">
                  Management
                </span>
              </div>
            )}
          </button>

          {isExpanded && onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              title="Collapse Sidebar"
              className="p-1.5 rounded-lg text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-[#F0EDE8] transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick "+ Create Event" button for organizers */}
        {isOrganizerRole && (
          <div className="w-full mb-3">
            {isExpanded ? (
              <button
                type="button"
                onClick={() => navigateTo('/app/events/new')}
                className="w-full py-2 px-3 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateTo('/app/events/new')}
                title="Create New Event"
                className="w-10 h-10 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white flex items-center justify-center shadow-sm transition-colors cursor-pointer mx-auto group relative"
              >
                <Plus className="w-4 h-4" />
                <span className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium bg-[#1A1A1A] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  Create Event
                </span>
              </button>
            )}
          </div>
        )}

        {/* When Expanded & Staff Persona: Show Assigned Event Switcher */}
        {isExpanded && currentRole === 'staff' && (
          <div className="mb-4 relative w-full">
            <div className="px-1 mb-1 text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-wider flex items-center justify-between">
              <span>Assigned Event</span>
              <span className="text-[10px] font-bold text-[#8B6914] bg-[#F5EDD8] px-1.5 py-0.5 rounded">
                {currentStaff?.assignedEventId && currentStaff.assignedEventId !== 'all' ? 'Scoped' : 'All Events'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => events.length > 1 && setOrgDropdownOpen(!orgDropdownOpen)}
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-xl bg-[#FAFAF7] hover:bg-[#F0EDE8] border border-[#E8E5DF] text-left transition-colors',
                events.length > 1 ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-xs shrink-0">
                  📅
                </div>
                <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                  {activeEvent?.name || events[0]?.name || 'Assigned Event'}
                </p>
              </div>
              {events.length > 1 && <ChevronDown className="w-3.5 h-3.5 text-[#9A9A9A] shrink-0" />}
            </button>

            {orgDropdownOpen && events.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#E8E5DF] shadow-lg py-1 z-50 max-h-52 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-wider">
                  Select Event
                </div>
                {(!currentStaff?.assignedEventId || currentStaff.assignedEventId === 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveEventId('all');
                      navigateTo('/app/scanner');
                      setOrgDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer',
                      !activeEvent || activeEvent?.id === 'all'
                        ? 'bg-[#F5EDD8] text-[#8B6914] font-semibold'
                        : 'text-[#3A3A3A] hover:bg-[#F0EDE8]'
                    )}
                  >
                    <span className="truncate">Universal (All Events)</span>
                  </button>
                )}
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      setActiveEventId(ev.id);
                      navigateTo(`/app/events/${ev.id}/scanner`);
                      setOrgDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer',
                      activeEvent?.id === ev.id
                        ? 'bg-[#F5EDD8] text-[#8B6914] font-semibold'
                        : 'text-[#3A3A3A] hover:bg-[#F0EDE8]'
                    )}
                  >
                    <span className="truncate">{ev.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav Items List */}
        <div className="flex-1 flex flex-col gap-1 w-full overflow-y-auto pr-0.5">
          {visibleNavItems.map((item) => {
            const active = isCurrent(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigateTo(item.path)}
                className={cn(
                  'group relative rounded-xl flex items-center transition-all duration-200 cursor-pointer font-medium text-xs',
                  isExpanded ? 'w-full gap-3 px-3 py-2.5' : 'w-10 h-10 justify-center mx-auto',
                  active
                    ? 'bg-[#1A1A1A] text-white shadow-sm font-semibold'
                    : 'text-[#6B6B6B] hover:bg-[#F0EDE8] hover:text-[#1A1A1A]'
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <span className={cn(active ? 'text-white' : 'text-[#9A9A9A] group-hover:text-[#1A1A1A]')}>
                  {item.icon}
                </span>

                {isExpanded && <span className="truncate">{item.label}</span>}

                {/* Tooltip on collapsed */}
                {!isExpanded && (
                  <span className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium bg-[#1A1A1A] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Console link */}
          {isOrganizerRole && (
            <>
              <div className={cn('bg-[#E8E5DF] my-2', isExpanded ? 'w-full h-px' : 'w-6 h-px mx-auto')} />
              <button
                type="button"
                onClick={() => navigateTo('/admin')}
                className={cn(
                  'group relative rounded-xl flex items-center transition-all duration-200 cursor-pointer font-medium text-xs',
                  isExpanded ? 'w-full gap-3 px-3 py-2.5' : 'w-10 h-10 justify-center mx-auto',
                  currentPath.startsWith('/admin')
                    ? 'bg-[#C49A3C] text-white shadow-sm font-semibold'
                    : 'text-[#6B6B6B] hover:bg-[#F5EDD8] hover:text-[#C49A3C]'
                )}
                title={!isExpanded ? 'Admin Console' : undefined}
              >
                <ShieldCheck className="w-[18px] h-[18px] shrink-0" />
                {isExpanded && <span>Admin Console</span>}
                {!isExpanded && (
                  <span className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium bg-[#1A1A1A] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    Admin Console
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Expand/Collapse Toggle Button (when collapsed) */}
        {!isExpanded && onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            title="Expand Sidebar"
            className="w-10 h-8 rounded-xl text-[#9A9A9A] hover:bg-[#F0EDE8] hover:text-[#1A1A1A] flex items-center justify-center transition-colors cursor-pointer mb-2"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Bottom: User Avatar & Sign Out */}
        <div
          className={cn(
            'pt-3 border-t border-[#F0EDE8] w-full flex items-center mt-2',
            isExpanded ? 'justify-between px-1' : 'flex-col gap-2'
          )}
        >
          <div className={cn('flex items-center gap-2.5 overflow-hidden', isExpanded ? '' : 'justify-center')}>
            <Avatar className="h-8 w-8 border border-[#E8E5DF] shrink-0">
              {currentUser?.avatarUrl && (
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.fullName} />
              )}
              <AvatarFallback className="text-xs font-bold bg-[#F5EDD8] text-[#8B6914]">
                {currentUser
                  ? currentUser.fullName.charAt(0).toUpperCase()
                  : isOrganizerRole
                  ? 'A'
                  : 'S'}
              </AvatarFallback>
            </Avatar>
            {isExpanded && (
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                  {currentUser?.fullName || (isOrganizerRole ? 'Administrator' : 'Staff')}
                </p>
                <p className="text-[10px] text-[#9A9A9A] truncate">
                  {currentUser?.email || currentOrg?.ownerEmail}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            title="Sign Out"
            className="w-8 h-8 rounded-lg text-[#9A9A9A] hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MOBILE SLIDE-OUT DRAWER                                      */}
      {/* ============================================================ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#1A1A1A]/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 lg:hidden w-72 h-screen bg-white border-r border-[#E8E5DF]/70 flex flex-col transition-transform duration-200 ease-in-out select-none shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none invisible'
        )}
      >
        {/* Brand + Close */}
        <div className="p-4 border-b border-[#F0EDE8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white shadow-sm">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <span className="text-base font-bold text-[#1A1A1A] tracking-tight">
              EventFlow
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-[#F0EDE8] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Quick "+ Create Event" button in Mobile Drawer */}
        {isOrganizerRole && (
          <div className="px-3 pt-3">
            <button
              type="button"
              onClick={() => {
                navigateTo('/app/events/new');
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        )}

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {visibleNavItems.map((item) => {
            const active = isCurrent(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  navigateTo(item.path);
                  onClose();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-left',
                  active
                    ? 'bg-[#1A1A1A] text-white font-semibold shadow-sm'
                    : 'text-[#6B6B6B] hover:bg-[#F0EDE8] hover:text-[#1A1A1A]'
                )}
              >
                <span className={cn(active ? 'text-white' : 'text-[#9A9A9A]')}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}

          {isOrganizerRole && (
            <div className="pt-2 mt-2 border-t border-[#F0EDE8]">
              <button
                type="button"
                onClick={() => {
                  navigateTo('/admin');
                  onClose();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-left',
                  currentPath.startsWith('/admin')
                    ? 'bg-[#C49A3C] text-white font-semibold shadow-sm'
                    : 'text-[#6B6B6B] hover:bg-[#F5EDD8] hover:text-[#C49A3C]'
                )}
              >
                <ShieldCheck className="w-[18px] h-[18px]" />
                <span>Admin Console</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Profile */}
        <div className="p-3 border-t border-[#F0EDE8]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF7] border border-[#E8E5DF]/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar className="h-8 w-8">
                {currentUser?.avatarUrl && (
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.fullName} />
                )}
                <AvatarFallback className="text-xs font-bold bg-[#F5EDD8] text-[#8B6914]">
                  {currentUser
                    ? currentUser.fullName.charAt(0).toUpperCase()
                    : isOrganizerRole
                    ? 'A'
                    : 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="truncate">
                <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                  {currentUser?.fullName || (isOrganizerRole ? 'Administrator' : 'Staff')}
                </p>
                <p className="text-[11px] text-[#9A9A9A] truncate">
                  {currentUser?.email || currentOrg?.ownerEmail}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              title="Sign Out"
              className="w-8 h-8 rounded-lg text-[#9A9A9A] hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
