import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle2,
  Search,
  Users,
  QrCode,
  MapPin,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Attendee } from '../../types';

export const CheckInOperationsPage: React.FC = () => {
  const {
    activeEvent,
    attendees,
    checkInLogs,
    checkInAttendee,
    undoCheckIn,
    navigateTo,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  if (!activeEvent) {
    return <div className="p-8 text-center text-slate-500">Please select an event.</div>;
  }

  const eventAttendees = attendees.filter((a) => a.eventId === activeEvent.id);
  const eventLogs = checkInLogs.filter((l) => l.eventId === activeEvent.id);

  const filteredAttendees = eventAttendees.filter((a) => {
    const q = (searchQuery || '').toLowerCase().trim();
    return (
      (a.fullName || '').toLowerCase().includes(q) ||
      (a.registrationId || '').toLowerCase().includes(q) ||
      (a.phone || '').includes(q) ||
      ((a.company || '').toLowerCase().includes(q))
    );
  });

  const handle1ClickCheckIn = (attendee: Attendee) => {
    checkInAttendee(attendee.id, 'Universal Desk', 'Desk Operator');
    addToast({
      type: 'success',
      title: 'Delegate Checked In',
      description: `${attendee.fullName} verified successfully.`,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Live Check-In Station & Desk"
        subtitle={`Real-time desk operations & attendee verification for ${activeEvent.name}`}
        breadcrumbs={[
          { label: 'Events', onClick: () => navigateTo('/app/events') },
          { label: activeEvent.name, onClick: () => navigateTo(`/app/events/${activeEvent.id}`) },
          { label: 'Check-In Station' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigateTo(`/app/events/${activeEvent.id}/scanner`)}
            leftIcon={<QrCode className="w-4 h-4" />}
          >
            Open Camera Scanner
          </Button>
        }
      />

      {/* Top Station Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Checked In</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-extrabold text-emerald-600">
              {(activeEvent.stats?.totalCheckedIn ?? 0).toLocaleString()}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              / {(activeEvent.stats?.totalRegistrations ?? 0).toLocaleString()} registered
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full"
              style={{ width: `${activeEvent.stats?.attendancePercentage ?? 0}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Turnout Rate</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-extrabold text-indigo-600">
              {activeEvent.stats?.attendancePercentage ?? 0}%
            </h3>
            <span className="text-xs text-emerald-600 font-semibold">+4.2% in last 30m</span>
          </div>
          <p className="text-xs text-slate-500 mt-3">Peak arrival velocity: 140 checks / hour</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Remaining Delegates</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-extrabold text-slate-800">
              {Math.max(0, (activeEvent.stats?.totalRegistrations ?? 0) - (activeEvent.stats?.totalCheckedIn ?? 0)).toLocaleString()}
            </h3>
            <span className="text-xs text-amber-600 font-medium">Expected soon</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-3 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Universal Mobile Scanning Active
          </p>
        </div>
      </div>

      {/* Two Column Layout: Fast Desk Search & Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Rapid Lookup Desk */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rapid Attendee Lookup Desk</h3>
              <p className="text-xs text-slate-500">1-click manual check-in for delegates without pass</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
              Instant Verify
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Registration ID (e.g. EVT26-000102), Phone, or Company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              autoFocus
            />
          </div>

          {/* Attendee Quick Results */}
          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
            {filteredAttendees.slice(0, 8).map((att) => (
              <div key={att.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{att.fullName}</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                      {att.registrationId}
                    </span>
                    <Badge status={att.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {att.ticketType} • {att.company || 'Individual'} • {att.phone}
                  </p>
                </div>

                <div className="shrink-0">
                  {att.status === 'checked_in' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => undoCheckIn(att.id)}
                      className="text-rose-600 hover:bg-rose-50 text-xs py-1"
                    >
                      Undo Check-in
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handle1ClickCheckIn(att)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1"
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Check-In
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (5 cols): Live Scan Stream */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Live Activity Stream</h3>
              <p className="text-xs text-slate-500">Real-time scan logs across all staff devices</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          {/* Stream */}
          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
            {eventLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                <div>
                  <p className="font-bold text-slate-900">{log.attendeeName}</p>
                  <p className="text-[10px] text-slate-500">Verified by {log.staffName || 'Staff'}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      log.result === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {log.result === 'success' ? 'Admitted' : 'Duplicate'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {log.timestamp.split('T')[1]?.substring(0, 5) || 'Just now'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
