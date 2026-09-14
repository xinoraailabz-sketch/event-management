import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Calendar,
  User,
  QrCode,
  Plus,
  BarChart,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    events,
    attendees,
    activeEvent,
    navigateTo,
    setActiveEventId,
  } = useApp();

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const q = (query || '').toLowerCase().trim();

  const filteredEvents = events.filter((e) =>
    (e.name || '').toLowerCase().includes(q) ||
    (e.city || '').toLowerCase().includes(q)
  ).slice(0, 4);

  const filteredAttendees = attendees.filter((a) =>
    (a.fullName || '').toLowerCase().includes(q) ||
    (a.registrationId || '').toLowerCase().includes(q) ||
    (a.company || '').toLowerCase().includes(q) ||
    (a.phone || '').includes(q)
  ).slice(0, 5);

  const quickActions = [
    {
      label: 'Create New Event',
      icon: <Plus className="w-4 h-4 text-[#1A1A1A]" />,
      action: () => navigateTo('/app/events/new'),
    },
    {
      label: 'Open Universal QR Scanner',
      icon: <QrCode className="w-4 h-4 text-[#C49A3C]" />,
      action: () => {
        const evId = activeEvent?.id || events[0]?.id;
        if (evId) navigateTo(`/app/events/${evId}/scanner`);
      },
    },
    {
      label: 'View Live Attendance Desk',
      icon: <BarChart className="w-4 h-4 text-emerald-600" />,
      action: () => {
        const evId = activeEvent?.id || events[0]?.id;
        if (evId) navigateTo(`/app/events/${evId}/check-in`);
      },
    },
    {
      label: 'Platform Administration Console',
      icon: <Shield className="w-4 h-4 text-[#1A1A1A]" />,
      action: () => navigateTo('/admin'),
    },
  ];

  return (
    <Modal
      isOpen={isCommandPaletteOpen}
      onClose={() => setIsCommandPaletteOpen(false)}
      maxWidth="xl"
      showCloseButton={false}
    >
      <div className="-m-6">
        {/* Search input header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F0EDE8]">
          <Search className="w-5 h-5 text-[#9A9A9A] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, attendees, registration IDs, actions..."
            className="w-full text-sm outline-none bg-transparent text-[#1A1A1A] placeholder:text-[#9A9A9A]"
            autoFocus
          />
          <kbd className="text-[10px] font-mono bg-[#FAFAF7] text-[#9A9A9A] px-2 py-0.5 rounded-md border border-[#E8E5DF]">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          {!query && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-wider">
                Quick Shortcuts
              </div>
              <div className="space-y-1 mt-1">
                {quickActions.map((qa, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      qa.action();
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-[#FAFAF7] text-[#3A3A3A] font-medium transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {qa.icon}
                      <span>{qa.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9A9A9A]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Events match */}
          {filteredEvents.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Events
              </div>
              <div className="space-y-1 mt-1">
                {filteredEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => {
                      setActiveEventId(evt.id);
                      navigateTo(`/app/events/${evt.id}`);
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-[#F5EDD8] hover:text-[#8B6914] text-[#3A3A3A] transition-colors text-left cursor-pointer"
                  >
                    <div className="truncate">
                      <p className="font-semibold truncate text-[#1A1A1A]">{evt.name}</p>
                      <p className="text-[10px] text-[#9A9A9A]">
                        {evt.city} • {evt.date} • {evt.stats?.totalRegistrations ?? 0} registered
                      </p>
                    </div>
                    <span className="text-[10px] text-[#C49A3C] font-medium shrink-0">Open</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attendees match */}
          {filteredAttendees.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3" /> Attendees & Registrations
              </div>
              <div className="space-y-1 mt-1">
                {filteredAttendees.map((att) => (
                  <button
                    key={att.id}
                    onClick={() => {
                      setActiveEventId(att.eventId);
                      navigateTo(`/app/events/${att.eventId}/registrations`);
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-[#FAFAF7] text-[#3A3A3A] transition-colors text-left cursor-pointer"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1A1A1A]">{att.fullName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F0EDE8] text-[#5A5A5A]">
                          {att.registrationId}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9A9A9A]">
                        {att.company || 'Individual'} • {att.phone}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        att.status === 'checked_in'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-[#F0EDE8] text-[#5A5A5A]'
                      }`}
                    >
                      {att.status === 'checked_in' ? 'Checked In' : 'Registered'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && filteredEvents.length === 0 && filteredAttendees.length === 0 && (
            <div className="py-8 text-center text-xs text-[#9A9A9A]">
              No matching events or attendees found for "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-[#FAFAF7] border-t border-[#F0EDE8] flex items-center justify-between text-[11px] text-[#9A9A9A]">
          <span>Navigate with arrows or click to select</span>
          <span>EventFlow Search</span>
        </div>
      </div>
    </Modal>
  );
};
