import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Menu,
  Search,
  Bell,
  Plus,
  ExternalLink,
  ChevronDown,
  QrCode,
  Shield,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/lib/utils';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const {
    currentPath,
    navigateTo,
    activeEvent,
    events,
    setActiveEventId,
    currentRole,
    setCurrentRole,
    setIsCommandPaletteOpen,
    notifications,
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [eventSwitchOpen, setEventSwitchOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Hamburger & Event Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Active Event Switcher */}
        {activeEvent && !currentPath.startsWith('/admin') && (
          <div className="relative">
            <button
              onClick={() => {
                setEventSwitchOpen(!eventSwitchOpen);
                setRoleMenuOpen(false);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span className="max-w-[140px] sm:max-w-[220px] truncate">{activeEvent.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {eventSwitchOpen && (
              <div className="absolute left-0 mt-1 w-72 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Event</span>
                  <button
                    onClick={() => {
                      navigateTo('/app/events/new');
                      setEventSwitchOpen(false);
                    }}
                    className="text-blue-600 hover:underline flex items-center gap-1 normal-case font-medium cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {events.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => {
                        setActiveEventId(evt.id);
                        setEventSwitchOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer',
                        evt.id === activeEvent.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      <div className="truncate">
                        <p className="truncate font-medium">{evt.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {evt.city} • {evt.date}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {evt.stats?.totalRegistrations ?? 0} reg
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center / Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Command Palette Trigger (Cmd + K) */}
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors w-48 lg:w-64 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Search attendees, events...</span>
          <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
            ⌘K
          </kbd>
        </button>

        {/* Role Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setRoleMenuOpen(!roleMenuOpen);
              setNotifOpen(false);
              setEventSwitchOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            title="Switch Persona"
          >
            <span className="text-slate-500">Role:</span>
            <span className="capitalize font-medium text-slate-900">
              {currentRole === 'platform_admin'
                ? 'Admin'
                : currentRole === 'staff'
                ? 'Staff'
                : 'Organizer'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-100 text-xs">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Persona
              </div>
              <button
                onClick={() => {
                  setCurrentRole('organizer');
                  setRoleMenuOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer',
                  currentRole === 'organizer' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-700'
                )}
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-medium">Event Organizer</p>
                  <p className="text-[10px] text-slate-400">Full workspace controls</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentRole('staff');
                  if (activeEvent) navigateTo(`/app/events/${activeEvent.id}/scanner`);
                  setRoleMenuOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer',
                  currentRole === 'staff' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-700'
                )}
              >
                <QrCode className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-medium">Check-in Staff</p>
                  <p className="text-[10px] text-slate-400">Fast gate scanning</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentRole('platform_admin');
                  navigateTo('/admin');
                  setRoleMenuOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer',
                  currentRole === 'platform_admin' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-700'
                )}
              >
                <Shield className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-medium">Platform Admin</p>
                  <p className="text-[10px] text-slate-400">Tenants & system stats</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Public Registration Page Preview Link */}
        {activeEvent && (
          <button
            onClick={() => navigateTo(`/e/${activeEvent.slug}`)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            title="Open Public Registration Landing Page"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Public Page</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setRoleMenuOpen(false);
              setEventSwitchOpen(false);
            }}
            className="relative p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>

          {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Create Event Quick Button */}
        {currentRole === 'organizer' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigateTo('/app/events/new')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            Create Event
          </Button>
        )}
      </div>
    </header>
  );
};
