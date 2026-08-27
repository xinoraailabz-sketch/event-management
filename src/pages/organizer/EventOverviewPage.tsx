import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Users,
  CheckCircle2,
  QrCode,
  Share2,
  ExternalLink,
  MapPin,
  Clock,
  Plus,
  Download,
  Settings,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { formatDate, formatDateTime, exportToCSV } from '../../lib/utils';

export const EventOverviewPage: React.FC = () => {
  const {
    activeEvent,
    attendees,
    checkInLogs,
    navigateTo,
    addToast,
  } = useApp();

  if (!activeEvent) {
    return (
      <div className="p-12 text-center text-slate-500">
        No event selected. Please choose an event from the list.
      </div>
    );
  }

  const eventAttendees = attendees.filter((a) => a.eventId === activeEvent.id);
  const eventLogs = checkInLogs.filter((l) => l.eventId === activeEvent.id);

  const totalRegs = activeEvent.stats?.totalRegistrations ?? eventAttendees.length;
  const totalChecked = activeEvent.stats?.totalCheckedIn ?? eventAttendees.filter(a => a.status === 'checked_in').length;
  const attendanceRate = activeEvent.stats?.attendancePercentage ?? (totalRegs > 0 ? Math.round((totalChecked / totalRegs) * 100) : 0);
  const remaining = Math.max(0, totalRegs - totalChecked);
  const capacity = activeEvent.settings?.capacity || 1;
  const capacityPct = Math.round((totalRegs / capacity) * 100);

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
        'Entrance Gate': a.checkedInGate || 'N/A',
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Event Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge status={activeEvent.status} size="md" className="font-bold" />
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                {activeEvent.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">{activeEvent.slug}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {activeEvent.name}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">{formatDate(activeEvent.date)}</span>
                <span>({activeEvent.startTime} - {activeEvent.endTime})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">{activeEvent.venueName}, {activeEvent.city}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 lg:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo(`/e/${activeEvent.slug}`)}
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              Public Form
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/scanner`)}
              leftIcon={<QrCode className="w-4 h-4" />}
              className="shadow-md"
            >
              Launch QR Scanner
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registrations"
          value={totalRegs.toLocaleString()}
          subtext={`${Math.max(0, (activeEvent.settings?.capacity || 0) - totalRegs)} seats available`}
          icon={<Users className="w-4 h-4 text-indigo-600" />}
          change={`${capacityPct}% of capacity`}
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
          icon={<Clock className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          title="Scanner Staff Active"
          value={staffList.filter(s => s.assignedEventId === activeEvent.id || s.assignedEventId === 'all').length || 4}
          subtext="Universal mobile scanning"
          icon={<ShieldCheck className="w-4 h-4 text-sky-600" />}
        />
      </div>

      {/* Main Content Layout: Performance & Live Scan Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Distribution & Quick Navigation */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Check-In Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Check-In Progress & Ticket Breakdown</h3>
                <p className="text-xs text-slate-500">Live breakdown of delegate admissions by ticket category</p>
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

            <div className="space-y-4 my-4">
              {[
                { name: 'VIP Pass Holders', count: Math.round(totalChecked * 0.25) || 48, total: 50, color: '#4f46e5' },
                { name: 'Standard Delegate Badges', count: Math.round(totalChecked * 0.55) || 180, total: 200, color: '#0284c7' },
                { name: 'Speaker & Media Passes', count: Math.round(totalChecked * 0.20) || 120, total: 150, color: '#059669' },
              ].map((tier) => {
                const share = tier.total > 0 ? Math.round((tier.count / tier.total) * 100) : 0;
                return (
                  <div key={tier.name} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                        <span className="font-bold text-slate-800">{tier.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {tier.count}/{tier.total} ({share}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
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
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900">Attendees</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{totalRegs} registered</p>
            </button>

            <button
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/scanner`)}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <QrCode className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900">QR Scanner</p>
              <p className="text-[10px] text-slate-500 mt-0.5">High-speed verification</p>
            </button>

            <button
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/messages`)}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 transition-all text-left shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900">Campaigns</p>
              <p className="text-[10px] text-slate-500 mt-0.5">WhatsApp / Email passes</p>
            </button>

            <button
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/settings`)}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all text-left shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Settings className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900">Settings</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Forms & branding</p>
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Live Check-in Stream Feed */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">Live Activity Feed</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Real-time</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
              {eventLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No check-ins logged yet today.
                </div>
              ) : (
                eventLogs.slice(0, 7).map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          log.result === 'success'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {log.result === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Zap className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 truncate">{log.attendeeName}</p>
                        <p className="text-[11px] text-slate-500">
                          {log.entranceName} • by {log.staffName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {log.timestamp.split('T')[1]?.substring(0, 5) || 'Just now'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          log.result === 'success' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {log.result === 'success' ? 'Admitted' : 'Duplicate'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
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
