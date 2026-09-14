import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Menu,
  Search,
  Bell,
  Plus,
  ChevronDown,
  Check,
  KeyRound,
  LogOut,
  Shield,
  UserCheck,
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    setIsCommandPaletteOpen,
    notifications,
    currentUser,
    currentOrg,
    signOut,
    isChangePasswordOpen,
    setIsChangePasswordOpen,
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const isOrganizerRole = currentRole === 'admin' || currentRole === 'organizer';

  // Page title based on current path
  const getPageTitle = () => {
    if (currentPath === '/app' || currentPath === '/app/') return 'Dashboard Overview';
    if (currentPath.startsWith('/admin')) return 'Admin Console';
    if (currentPath === '/app/events' || currentPath === '/app/events/') return 'Events';
    if (currentPath === '/app/events/new') return 'Create Event';
    if (currentPath === '/app/attendees' || currentPath.includes('/registrations')) return 'Attendees';
    if (currentPath === '/app/scanner' || currentPath.includes('/scanner')) return 'QR Scanner';
    if (currentPath === '/app/check-in' || currentPath.includes('/check-in')) return 'Live Check-in';
    if (currentPath === '/app/staff' || currentPath.includes('/staff')) return 'Staff Management';
    if (currentPath === '/app/broadcasts' || currentPath.includes('/messages')) return 'Broadcasts';
    if (currentPath === '/app/analytics' || currentPath.includes('/reports')) return 'Analytics';
    if (currentPath.includes('/settings')) return 'Settings';
    if (activeEvent && currentPath.includes(activeEvent.id)) return activeEvent.name;
    return 'EventFlow';
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-[#E8E5DF]/60 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Collapse Toggle + Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F0EDE8] transition-colors cursor-pointer"
            aria-label="Toggle Sidebar"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page Title — Desktop */}
          <h1 className="text-base sm:text-lg font-bold text-[#1A1A1A] tracking-tight">
            {getPageTitle()}
          </h1>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#F5F3EE] hover:bg-[#EBE8E1] border border-[#E8E5DF] text-[#9A9A9A] text-xs cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#9A9A9A]" />
              <span>Quick search events, attendees, passes...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white text-[#6B6B6B] rounded-md border border-[#E8E5DF]">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Active Event Selector */}
          {events.length > 0 && activeEvent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E8E5DF] bg-white hover:bg-[#F5F3EE] text-xs font-semibold text-[#1A1A1A] transition-colors cursor-pointer max-w-[200px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate text-left">{activeEvent.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#9A9A9A] shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <DropdownMenuLabel className="p-0">Switch Event</DropdownMenuLabel>
                  {isOrganizerRole && (
                    <button
                      onClick={() => navigateTo('/app/events/new')}
                      className="text-[#C49A3C] hover:underline flex items-center gap-1 text-xs font-medium cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-60 overflow-y-auto">
                  {events.map((evt) => (
                    <DropdownMenuItem
                      key={evt.id}
                      onClick={() => setActiveEventId(evt.id)}
                      className={cn(
                        'cursor-pointer flex items-center justify-between py-2.5',
                        evt.id === activeEvent?.id && 'bg-[#F5EDD8] text-[#8B6914] font-medium'
                      )}
                    >
                      <div className="truncate mr-2">
                        <p className="truncate font-medium">{evt.name}</p>
                        <p className="text-[11px] text-[#9A9A9A] font-mono">
                          {evt.date || 'Active'}
                        </p>
                      </div>
                      {evt.id === activeEvent?.id && (
                        <Check className="w-4 h-4 text-[#C49A3C] shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F0EDE8] transition-colors cursor-pointer"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C49A3C]" />
              )}
            </button>
            {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
          </div>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none cursor-pointer">
                <Avatar className="h-9 w-9 border-2 border-[#E8E5DF] hover:border-[#C49A3C] transition-colors">
                  {currentUser?.avatarUrl && (
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.fullName} />
                  )}
                  <AvatarFallback className="text-xs font-bold bg-[#F0EDE8] text-[#6B6B6B]">
                    {currentUser
                      ? currentUser.fullName.charAt(0).toUpperCase()
                      : isOrganizerRole
                      ? 'A'
                      : 'S'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-[#E8E5DF] shadow-lg">
              <div className="px-2 py-2">
                <p className="text-xs font-bold text-[#1A1A1A] truncate">
                  {currentUser?.fullName || (isOrganizerRole ? 'Administrator' : 'Staff Member')}
                </p>
                <p className="text-[11px] text-[#9A9A9A] truncate">
                  {currentUser?.email || currentOrg.ownerEmail}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5EDD8] text-[#8B6914]">
                  {isOrganizerRole ? (
                    <>
                      <Shield className="w-3 h-3 text-[#C49A3C]" /> Workspace Admin
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3 text-[#C49A3C]" /> Staff Operator
                    </>
                  )}
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Staff-Only Option: Change Password */}
              {currentRole === 'staff' && (
                <DropdownMenuItem
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="cursor-pointer py-2 px-2.5 rounded-xl text-xs font-medium text-[#1A1A1A] hover:bg-[#FAFAF7] flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-[#C49A3C]" />
                  <span>Change Password</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer py-2 px-2.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Staff Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};
