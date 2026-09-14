import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  CheckCircle2,
  Search,
  Users,
  QrCode,
  ShieldCheck,
  Activity,
  Plus,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Attendee } from '@/types';

export const CheckInOperationsPage: React.FC = () => {
  const {
    activeEvent,
    events,
    setActiveEventId,
    attendees,
    checkInLogs,
    checkInAttendee,
    undoCheckIn,
    currentRole,
    refreshData,
    navigateTo,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  // Sync active event from URL if accessed directly, or auto-activate first event
  useEffect(() => {
    const parts = window.location.pathname.split('/');
    if (parts[2] === 'events' && parts[3]) {
      const urlEventId = parts[3];
      if (urlEventId && urlEventId !== activeEvent?.id) {
        const found = events.find((e) => e.id === urlEventId);
        if (found) {
          setActiveEventId(urlEventId);
          return;
        }
      }
    }
    if (!activeEvent && events.length > 0) {
      setActiveEventId(events[0].id);
      navigateTo(`/app/events/${events[0].id}/check-in`);
    }
  }, [activeEvent, events, setActiveEventId, navigateTo]);

  if (!activeEvent) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8 text-[#9A9A9A]" />}
          title={currentRole === 'staff' ? 'No Event Assigned' : 'No Active Event Selected'}
          description={
            currentRole === 'staff'
              ? 'Your staff account is active, but you are not assigned to any events yet. Please ask your organizer to assign you an event.'
              : 'Please create or select an event to open check-in desk operations and verify delegates.'
          }
          primaryAction={
            currentRole === 'staff'
              ? {
                  label: 'Refresh Access',
                  onClick: () => refreshData(),
                  icon: <RefreshCw className="w-4 h-4" />,
                }
              : {
                  label: 'Create an Event',
                  onClick: () => navigateTo('/app/events/new'),
                  icon: <Plus className="w-4 h-4" />,
                }
          }
        />
      </div>
    );
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

  const handle1ClickCheckIn = async (attendee: Attendee) => {
    await checkInAttendee(attendee.id, 'Universal Desk', 'Desk Operator');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Live Check-In Desk"
        subtitle={`Real-time desk operations & attendee verification for ${activeEvent.name}`}
        breadcrumbs={[
          { label: 'Events', onClick: () => navigateTo('/app/events') },
          { label: activeEvent.name, onClick: () => navigateTo(`/app/events/${activeEvent.id}`) },
          { label: 'Check-In Station' },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {events.length > 0 && (
              <div className="w-56 sm:w-64">
                <Select
                  value={activeEvent.id}
                  onValueChange={(val) => {
                    setActiveEventId(val);
                    navigateTo(`/app/events/${val}/check-in`);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-white border-[#E8E5DF] shadow-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Calendar className="w-3.5 h-3.5 text-[#C49A3C] shrink-0" />
                      <SelectValue placeholder="Select Event" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/scanner`)}
              leftIcon={<QrCode className="w-4 h-4" />}
              className="rounded-xl"
            >
              Open Camera Scanner
            </Button>
          </div>
        }
      />

      {/* Top Station Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">Total Checked In</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-extrabold text-emerald-600">
              {(activeEvent.stats?.totalCheckedIn ?? 0).toLocaleString()}
            </h3>
            <span className="text-xs text-[#6B6B6B] font-medium">
              / {(activeEvent.stats?.totalRegistrations ?? 0).toLocaleString()} registered
            </span>
          </div>
          <div className="mt-3">
            <Progress
              value={activeEvent.stats?.attendancePercentage ?? 0}
              indicatorColor="bg-emerald-600"
            />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">Turnout Rate</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-extrabold text-[#1A1A1A]">
              {activeEvent.stats?.attendancePercentage ?? 0}%
            </h3>
            <span className="text-xs text-emerald-600 font-semibold">+4.2% in last 30m</span>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-3 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-[#C49A3C]" />
            Peak arrival velocity: 140 checks / hour
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">Remaining Delegates</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-extrabold text-[#1A1A1A]">
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
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0EDE8] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Rapid Attendee Lookup Desk</h3>
              <p className="text-xs text-[#6B6B6B]">1-click manual check-in for delegates without pass</p>
            </div>
            <span className="text-xs font-mono bg-[#FAFAF7] border border-[#E8E5DF] px-2.5 py-1 rounded-full text-[#1A1A1A] font-bold">
              Instant Verify
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
            <Input
              type="text"
              placeholder="Search by Name, Registration ID, Phone, or Company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-xs rounded-xl"
              autoFocus
            />
          </div>

          {/* Attendee Quick Results */}
          <div className="divide-y divide-[#F0EDE8] max-h-[420px] overflow-y-auto pr-1">
            {filteredAttendees.slice(0, 8).map((att) => (
              <div key={att.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A]">{att.fullName}</span>
                    <span className="font-mono text-[10px] bg-[#F0EDE8] px-1.5 py-0.2 rounded text-[#5A5A5A]">
                      {att.registrationId}
                    </span>
                    <Badge status={att.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5 truncate">
                    {att.ticketType} • {att.company || 'Individual'} • {att.phone}
                  </p>
                </div>

                <div className="shrink-0">
                  {att.status === 'checked_in' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => undoCheckIn(att.id)}
                      className="text-red-600 hover:bg-red-50 text-xs py-1 rounded-xl"
                    >
                      Undo Check-in
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handle1ClickCheckIn(att)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1 rounded-xl"
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
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0EDE8] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Live Activity Stream</h3>
              <p className="text-xs text-[#6B6B6B]">Real-time scan logs across all staff devices</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          {/* Stream */}
          <div className="divide-y divide-[#F0EDE8] max-h-[380px] overflow-y-auto pr-1">
            {eventLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                <div>
                  <p className="font-bold text-[#1A1A1A]">{log.attendeeName}</p>
                  <p className="text-[10px] text-[#6B6B6B]">Verified by {log.staffName || 'Staff'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    {log.type === 'walk_in' ? 'Walk-in' : 'Admitted'}
                  </span>
                  <p className="text-[10px] text-[#9A9A9A] mt-0.5">
                    {log.timestamp || 'Just now'}
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
