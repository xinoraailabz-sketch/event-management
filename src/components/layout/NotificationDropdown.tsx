import React from 'react';
import { useApp } from '../../context/AppContext';
import { Check, Bell, Users, Zap, ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export const NotificationDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications, navigateTo } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'capacity':
        return <Zap className="w-4 h-4 text-amber-600" />;
      case 'checkin':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'staff':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Notifications</h4>
          <p className="text-[11px] text-slate-500">Live alerts & event milestones</p>
        </div>
        <button
          onClick={clearAllNotifications}
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No notifications right now</div>
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
                'p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors text-left',
                !notif.read ? 'bg-indigo-50/30' : ''
              )}
            >
              <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">{getIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={cn('text-xs truncate', !notif.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700')}>
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0">{notif.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                  {notif.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
        <span className="text-[10px] text-slate-400 font-medium">EventFlow Real-time Engine</span>
      </div>
    </div>
  );
};
