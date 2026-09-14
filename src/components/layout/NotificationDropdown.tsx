import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Users, Zap, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export const NotificationDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications, navigateTo } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'capacity':
        return <Zap className="w-4 h-4 text-[#C49A3C]" />;
      case 'checkin':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'staff':
        return <Sparkles className="w-4 h-4 text-[#1A1A1A]" />;
      default:
        return <Bell className="w-4 h-4 text-[#6B6B6B]" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-[#E8E5DF]/70 shadow-[0_12px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
      <div className="px-5 py-4 border-b border-[#F0EDE8] flex items-center justify-between bg-[#FAFAF7]">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">Notifications</h4>
          <p className="text-[11px] text-[#6B6B6B]">Live alerts & event milestones</p>
        </div>
        <button
          onClick={clearAllNotifications}
          className="text-[11px] font-semibold text-[#C49A3C] hover:underline transition-colors cursor-pointer"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-[#F0EDE8]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#9A9A9A]">No notifications right now</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                markNotificationRead(notif.id);
                if (notif.eventId) navigateTo(`/app/events/${notif.eventId}/check-in`);
                onClose();
              }}
              className={cn(
                'p-4 flex items-start gap-3 hover:bg-[#FAFAF7] cursor-pointer transition-colors text-left',
                !notif.read ? 'bg-[#F5EDD8]/40' : ''
              )}
            >
              <div className="p-2 rounded-xl bg-[#FAFAF7] border border-[#E8E5DF] shrink-0 mt-0.5">{getIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={cn('text-xs truncate', !notif.read ? 'font-bold text-[#1A1A1A]' : 'font-medium text-[#6B6B6B]')}>
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-[#9A9A9A] shrink-0">{notif.timestamp}</span>
                </div>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5 leading-relaxed line-clamp-2">
                  {notif.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 border-t border-[#F0EDE8] bg-[#FAFAF7] text-center">
        <span className="text-[10px] text-[#9A9A9A] font-medium">EventFlow Real-time Engine</span>
      </div>
    </div>
  );
};
