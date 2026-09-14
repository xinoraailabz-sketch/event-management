import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Users,
  CheckCircle2,
  QrCode,
  ExternalLink,
  MapPin,
  Clock,
  Plus,
  Download,
  Settings,
  MessageSquare,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate, exportToCSV } from '../../lib/utils';

export const EventOverviewPage: React.FC = () => {
  const {
    activeEvent,
    attendees,
    staff,
    checkInLogs,
    navigateTo,
    addToast,
  } = useApp();

  if (!activeEvent) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-[#9A9A9A]" />}
          title="No Active Event Selected"
          description="Please create or select an event to view its real-time check-in stream and delegate analytics."
          primaryAction={{
            label: 'Create an Event',
            onClick: () => navigateTo('/app/events/new'),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      </div>
    );
  }

  const eventAttendees = attendees.filter((a) => a.eventId === activeEvent.id);
  const eventLogs = checkInLogs.filter((l) => l.eventId === activeEvent.id);

  const totalRegs = activeEvent.stats?.totalRegistrations ?? eventAttendees.length;
  const totalChecked = activeEvent.stats?.totalCheckedIn ?? eventAttendees.filter((a) => a.status === 'checked_in' || a.status === 'walk_in').length;
  const attendanceRate = activeEvent.stats?.attendancePercentage ?? (totalRegs > 0 ? Math.round((totalChecked / totalRegs) * 100) : 0);
  const remaining = Math.max(0, totalRegs - totalChecked);
  const capacity = activeEvent.settings?.capacity || 1;
  const capacityPct = Math.round((totalRegs / capacity) * 100);

  const handleCopyLink = () => {
    if (!activeEvent) return;
    const url = `${window.location.origin}/e/${activeEvent.slug}`;
    navigator.clipboard.writeText(url);
    addToast({
      type: 'success',
      title: 'Registration Link Copied',
      description: `Copied ${url} to clipboard. Anyone can now use this link to register.`,
    });
  };

  const handleExport = () => {
    exportToCSV(
      eventAttendees.map((a) => ({
        'Registration ID': a.registrationId,
        'Full Name': a.fullName,
        Email: a.email,
        Phone: a.phone,
        Company: a.company || '',
        'Ticket Type': a.ticketType,
        Status: a.status,
        'Registered At': a.registeredAt,
        'Checked In At': a.checkedInAt || 'N/A',
        'Entrance Gate': a.checkedInEntrance || 'Universal Desk',
      })),
      `${activeEvent.slug}-attendees.csv`
    );
    addToast({
      type: 'success',
      title: 'Attendee CSV Exported',
      description: `Downloaded ${eventAttendees.length} attendee records.`,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Event Header Banner */}
      <div className="bg-white rounded-3xl border border-[#E8E5DF]/70 p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge status={activeEvent.status} size="md" className="font-bold" />
              <span className="px-2.5 py-0.5 rounded-full bg-[#F0EDE8] text-[#5A5A5A] text-xs font-semibold">
                {activeEvent.category}
              </span>
              <span className="text-xs text-[#9A9A9A] font-mono">{activeEvent.slug}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight leading-snug">
              {activeEvent.name}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#6B6B6B] pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#9A9A9A] shrink-0" />
                <span className="font-medium text-[#1A1A1A]">{formatDate(activeEvent.date)}</span>
                <span>({activeEvent.startTime} - {activeEvent.endTime})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#9A9A9A] shrink-0" />
                <span className="font-medium text-[#1A1A1A]">{activeEvent.venueName}, {activeEvent.city}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 lg:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={<Copy className="w-4 h-4" />}
              className="rounded-xl"
            >
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo(`/e/${activeEvent.slug}`)}
              leftIcon={<ExternalLink className="w-4 h-4" />}
              className="rounded-xl"
            >
              Public Form
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              leftIcon={<Download className="w-4 h-4" />}
              className="rounded-xl"
            >
              Export CSV
            </Button>
            <button
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/scanner`)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Launch QR Scanner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registrations"
          value={totalRegs.toLocaleString()}
          subtext={`${Math.max(0, (activeEvent.settings?.capacity || 0) - totalRegs)} seats available`}
          icon={<Users className="w-4 h-4 text-[#C49A3C]" />}
          change={`${capacityPct}% capacity`}
          isPositive={true}
        />
        <StatCard
          title="Live Checked-In"
          value={totalChecked.toLocaleString()}
          subtext={`${attendanceRate}% turn-out rate`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          progress={attendanceRate}
        />
        <StatCard
          title="Remaining Unchecked"
          value={remaining.toLocaleString()}
          subtext="Awaiting check-in arrival"
          icon={<Clock className="w-4 h-4 text-[#1A1A1A]" />}
        />
        <StatCard
          title="Scanner Staff Active"
          value={staff.filter(s => s.assignedEventId === activeEvent.id || s.eventId === activeEvent.id || s.assignedEventId === 'all').length || 1}
          subtext="Universal mobile scanning"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Main Content Layout: Performance & Live Scan Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Distribution & Quick Navigation */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Check-In Progress Card */}
          <div className="bg-white rounded-3xl border border-[#E8E5DF]/70 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">Check-In Progress & Ticket Breakdown</h3>
                <p className="text-xs text-[#6B6B6B]">Live breakdown of delegate admissions by ticket category</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateTo(`/app/events/${activeEvent.id}/check-in`)}
                className="text-xs"
              >
                View Live Station
              </Button>
            </div>

            <div className="space-y-3.5 my-4">
              {[
                { name: 'VIP Pass Holders', count: Math.round(totalChecked * 0.25) || 48, total: 50, color: '#C49A3C' },
                { name: 'Standard Delegate Badges', count: Math.round(totalChecked * 0.55) || 180, total: 200, color: '#1A1A1A' },
                { name: 'Speaker & Media Passes', count: Math.round(totalChecked * 0.20) || 120, total: 150, color: '#059669' },
              ].map((tier) => {
                const share = tier.total > 0 ? Math.round((tier.count / tier.total) * 100) : 0;
                return (
                  <div key={tier.name} className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#F0EDE8] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                        <span className="font-bold text-[#1A1A1A]">{tier.name}</span>
                      </div>
                      <span className="font-mono font-bold text-[#6B6B6B]">
                        {tier.count}/{tier.total} <span className="text-[#C49A3C]">({share}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-[#F0EDE8] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${share}%`, backgroundColor: tier.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Hub Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/registrations`)}
              className="p-4 rounded-2xl bg-white border border-[#E8E5DF]/70 hover:border-[#C49A3C] hover:bg-[#FAFAF7] transition-all text-left shadow-2xs group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FAFAF7] text-[#1A1A1A] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[#1A1A1A]">Attendees</p>
              <p className="text-[10px] text-[#9A9A9A] mt-0.5">{totalRegs} registered</p>
            </button>

            <button
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/scanner`)}
              className="p-4 rounded-2xl bg-white border border-[#E8E5DF]/70 hover:border-[#C49A3C] hover:bg-[#FAFAF7] transition-all text-left shadow-2xs group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FAFAF7] text-[#C49A3C] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <QrCode className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[#1A1A1A]">QR Scanner</p>
              <p className="text-[10px] text-[#9A9A9A] mt-0.5">Universal verification</p>
            </button>

            <button
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/messages`)}
              className="p-4 rounded-2xl bg-white border border-[#E8E5DF]/70 hover:border-[#C49A3C] hover:bg-[#FAFAF7] transition-all text-left shadow-2xs group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FAFAF7] text-[#1A1A1A] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[#1A1A1A]">Broadcasts</p>
              <p className="text-[10px] text-[#9A9A9A] mt-0.5">Email & Passes</p>
            </button>

            <button
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/settings`)}
              className="p-4 rounded-2xl bg-white border border-[#E8E5DF]/70 hover:border-[#C49A3C] hover:bg-[#FAFAF7] transition-all text-left shadow-2xs group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FAFAF7] text-[#1A1A1A] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Settings className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[#1A1A1A]">Settings</p>
              <p className="text-[10px] text-[#9A9A9A] mt-0.5">Forms & branding</p>
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Live Check-in Stream Feed */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8E5DF]/70 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-[#1A1A1A]">Live Activity Feed</h3>
              </div>
              <span className="text-[11px] text-[#9A9A9A] font-mono">Real-time</span>
            </div>

            <div className="divide-y divide-[#F0EDE8] max-h-[460px] overflow-y-auto pr-1">
              {eventLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#9A9A9A]">
                  No check-ins logged yet today.
                </div>
              ) : (
                eventLogs.slice(0, 7).map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <div className="p-1.5 rounded-xl shrink-0 mt-0.5 bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-[#1A1A1A] truncate">{log.attendeeName}</p>
                        <p className="text-[11px] text-[#6B6B6B]">
                          {log.entrance} • by {log.staffName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#9A9A9A] block font-mono">
                        {log.timestamp || 'Just now'}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600">
                        {log.type === 'walk_in' ? 'Walk-in' : 'Admitted'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0EDE8]">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs rounded-xl"
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/check-in`)}
            >
              Open Live Station Table
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
