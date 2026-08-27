import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Calendar,
  User,
  QrCode,
  Plus,
  BarChart,
  Settings,
  Shield,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    events,
    attendees,
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
      icon: <Plus className="w-4 h-4 text-indigo-600" />,
      action: () => navigateTo('/app/events/new'),
    },
    {
      label: 'Open Fast QR Scanner',
      icon: <QrCode className="w-4 h-4 text-emerald-600" />,
      action: () => navigateTo('/app/events/evt-business-summit-2026/scanner'),
    },
    {
      label: 'View Live Attendance & Check-ins',
      icon: <BarChart className="w-4 h-4 text-sky-600" />,
      action: () => navigateTo('/app/events/evt-business-summit-2026/check-in'),
    },
    {
      label: 'Platform Administration Console',
      icon: <Shield className="w-4 h-4 text-purple-600" />,
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
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, attendees, registration IDs, actions..."
            className="w-full text-sm outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
            autoFocus
          />
          <kbd className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          {!query && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      {qa.icon}
                      <span>{qa.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Events match */}
          {filteredEvents.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
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
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-indigo-50/70 hover:text-indigo-900 text-slate-700 transition-colors text-left"
                  >
                    <div className="truncate">
                      <p className="font-semibold truncate">{evt.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {evt.city} • {evt.date} • {evt.stats?.totalRegistrations ?? 0} registered
                      </p>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-medium shrink-0">Open</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attendees match */}
          {filteredAttendees.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
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
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-slate-50 text-slate-700 transition-colors text-left"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{att.fullName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {att.registrationId}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {att.company || 'Individual'} • {att.phone}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        att.status === 'checked_in'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
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
            <div className="py-8 text-center text-xs text-slate-400">
              No matching events or attendees found for "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with arrows or click to select</span>
          <span>EventFlow Search</span>
        </div>
      </div>
    </Modal>
  );
};
